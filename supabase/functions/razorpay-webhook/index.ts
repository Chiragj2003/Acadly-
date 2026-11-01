import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      return new Response("Missing signature or webhook secret configuration", { status: 400 });
    }

    const rawBody = await req.text();

    // Verify HMAC-SHA256 signature
    const expectedSignature = hmac("sha256", webhookSecret, rawBody, "utf8", "hex");

    if (signature !== expectedSignature) {
      console.error("Invalid Razorpay webhook signature");
      return new Response("Invalid signature", { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // Use Service Role client for administrative database updates
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity;
      if (!paymentEntity) {
        return new Response("Payment entity not found in payload", { status: 400 });
      }

      const notes = paymentEntity.notes || {};
      const { instituteId, studentFeeRecordId, studentId } = notes;
      const paymentId = paymentEntity.id;
      const orderId = paymentEntity.order_id;
      const amountInRupees = Number(paymentEntity.amount) / 100;
      const gstAmount = Number(paymentEntity.tax || 0) / 100;

      if (!studentFeeRecordId || !instituteId) {
        console.warn("Payment captured without valid metadata notes", paymentId);
        return new Response("Missing metadata notes in payment", { status: 200 });
      }

      // Check if this payment was already recorded
      const { data: existingPayment } = await supabaseAdmin
        .from("payments")
        .select("id")
        .eq("razorpay_payment_id", paymentId)
        .maybeSingle();

      if (existingPayment) {
        return new Response("Payment already processed", { status: 200 });
      }

      // Fetch current fee record
      const { data: feeRecord, error: feeError } = await supabaseAdmin
        .from("student_fee_records")
        .select("id, total_amount, discount_amount, paid_amount, remaining_balance")
        .eq("id", studentFeeRecordId)
        .single();

      if (feeError || !feeRecord) {
        console.error("Fee record not found for webhook reconciliation", studentFeeRecordId);
        return new Response("Fee record not found", { status: 404 });
      }

      const newPaidAmount = Number(feeRecord.paid_amount) + amountInRupees;
      const netPayable = Number(feeRecord.total_amount) - Number(feeRecord.discount_amount);
      const newRemainingBalance = Math.max(0, netPayable - newPaidAmount);
      const newStatus = newRemainingBalance <= 0 ? "paid" : "partially_paid";

      // 1. Insert payment record
      const receiptNumber = `RCPT-${Date.now().toString().slice(-8)}`;
      const { error: insertPayError } = await supabaseAdmin.from("payments").insert({
        institute_id: instituteId,
        student_fee_record_id: studentFeeRecordId,
        student_id: studentId,
        receipt_number: receiptNumber,
        amount: amountInRupees,
        gst_amount: gstAmount,
        payment_method: "razorpay",
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        status: "paid",
        notes: `Online payment via Razorpay. Order: ${orderId}`,
      });

      if (insertPayError) {
        console.error("Failed to insert payment record:", insertPayError);
        return new Response("Failed to record payment", { status: 500 });
      }

      // 2. Update student fee record
      const { error: updateFeeError } = await supabaseAdmin
        .from("student_fee_records")
        .update({
          paid_amount: newPaidAmount,
          remaining_balance: newRemainingBalance,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", studentFeeRecordId);

      if (updateFeeError) {
        console.error("Failed to update fee record balance:", updateFeeError);
      }

      // 3. Send notification to student user
      if (studentId) {
        const { data: studentUser } = await supabaseAdmin
          .from("students")
          .select("user_id")
          .eq("id", studentId)
          .single();

        if (studentUser?.user_id) {
          await supabaseAdmin.from("notifications").insert({
            institute_id: instituteId,
            user_id: studentUser.user_id,
            title: "Payment Received",
            body: `Your payment of ₹${amountInRupees.toFixed(2)} (Receipt #${receiptNumber}) has been confirmed successfully.`,
            type: "fee_reminder",
            data: { receiptNumber, paymentId, amount: amountInRupees },
          });
        }
      }
    }

    return new Response(JSON.stringify({ status: "success" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
