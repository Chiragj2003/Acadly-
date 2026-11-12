-- ==============================================================================
-- CANONICAL MIGRATION: 0004_fees.sql
-- Modules: Fee Plans, Student Fees (pending_amount, paid_amount, total_amount,
--          status in ('paid','partial','pending','overdue')),
--          Payments (gst_amount, razorpay_signature, notes),
--          Receipts, Notifications, Push Tokens & Foreign Key Indexes.
-- ==============================================================================

-- 1. FEE & PAYMENT TABLES

-- 1. Fee Plans (Academic Course / Term Packages)
CREATE TABLE IF NOT EXISTS public.fee_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    total_amount NUMERIC(10, 2),
    frequency VARCHAR(50) DEFAULT 'term' CHECK (frequency IN ('annual', 'term', 'monthly', 'one_time')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Student Fees (Student Ledger with pending_amount, paid_amount, total_amount)
CREATE TABLE IF NOT EXISTS public.student_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    fee_plan_id UUID REFERENCES public.fee_plans(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount > 0),
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    pending_amount NUMERIC(10, 2) NOT NULL CHECK (pending_amount >= 0),
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    net_payable NUMERIC(10, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'partial', 'pending', 'overdue')),
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Payments (with gst_amount, razorpay_signature, notes)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    student_fee_id UUID NOT NULL REFERENCES public.student_fees(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_mode VARCHAR(50) DEFAULT 'razorpay' CHECK (payment_mode IN ('razorpay', 'upi', 'cash', 'bank_transfer', 'cheque', 'bank')),
    payment_method VARCHAR(50) DEFAULT 'razorpay',
    gst_amount NUMERIC(10, 2) DEFAULT 0.00 CHECK (gst_amount >= 0),
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature TEXT,
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'paid' CHECK (status IN ('paid', 'success', 'pending', 'failed', 'refunded')),
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Receipts Ledger (GST Compliance & Audit Trail)
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL UNIQUE REFERENCES public.payments(id) ON DELETE CASCADE,
    receipt_number VARCHAR(100) NOT NULL UNIQUE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    taxable_amount NUMERIC(10, 2) NOT NULL CHECK (taxable_amount >= 0),
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00 CHECK (gst_rate >= 0),
    gst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (gst_amount >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount > 0),
    signed_hash TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. NOTIFICATIONS & PUSH TOKENS

-- 5. In-App Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_role VARCHAR(20) CHECK (recipient_role IN ('admin', 'teacher', 'student', 'parent', 'all')),
    title VARCHAR(255) NOT NULL,
    body TEXT,
    message TEXT,
    type VARCHAR(50) DEFAULT 'general',
    data JSONB DEFAULT '{}'::jsonb,
    deep_link_data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Push Tokens (Expo Push Device Registration)
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    platform VARCHAR(20) DEFAULT 'expo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FOREIGN KEY & COMPOSITE QUERY INDEXES

-- Fee Plans
CREATE INDEX IF NOT EXISTS idx_fk_fee_plans_institute ON public.fee_plans(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_fee_plans_batch ON public.fee_plans(batch_id);

-- Student Fees
CREATE INDEX IF NOT EXISTS idx_fk_student_fees_institute ON public.student_fees(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_student_fees_student ON public.student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fk_student_fees_plan ON public.student_fees(fee_plan_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_status ON public.student_fees(status);
CREATE INDEX IF NOT EXISTS idx_composite_student_fees_overdue ON public.student_fees(institute_id, status, due_date);

-- Payments
CREATE INDEX IF NOT EXISTS idx_fk_payments_institute ON public.payments(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_payments_fee ON public.payments(student_fee_id);
CREATE INDEX IF NOT EXISTS idx_fk_payments_student ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fk_payments_recorded_by ON public.payments(recorded_by);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON public.payments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_payments_student_paid ON public.payments(student_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay ON public.payments(razorpay_payment_id);

-- Receipts
CREATE INDEX IF NOT EXISTS idx_fk_receipts_institute ON public.receipts(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_receipts_payment ON public.receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_fk_receipts_student ON public.receipts(student_id);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON public.receipts(receipt_number);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_fk_notifications_institute ON public.notifications(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_fk_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON public.notifications(recipient_id, is_read, created_at DESC);

-- Push Tokens
CREATE INDEX IF NOT EXISTS idx_fk_push_tokens_user ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON public.push_tokens(token);

-- 4. ATTACH UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS trigger_student_fees_updated_at ON public.student_fees;
CREATE TRIGGER trigger_student_fees_updated_at
BEFORE UPDATE ON public.student_fees
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_push_tokens_updated_at ON public.push_tokens;
CREATE TRIGGER trigger_push_tokens_updated_at
BEFORE UPDATE ON public.push_tokens
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
