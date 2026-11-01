-- ==============================================================================
-- ACADLY - PHASE 4 DATABASE SCHEMA: FEES, PAYMENTS, NOTIFICATIONS & ANALYTICS
-- ==============================================================================

-- 1. Fee Plans Table
CREATE TABLE IF NOT EXISTS public.fee_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    frequency VARCHAR(50) DEFAULT 'term' CHECK (frequency IN ('annual', 'term', 'monthly', 'one_time')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_plans_institute ON public.fee_plans(institute_id);

-- 2. Student Fees Ledger Table
CREATE TABLE IF NOT EXISTS public.student_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    fee_plan_id UUID REFERENCES public.fee_plans(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) DEFAULT 0.00,
    pending_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('paid', 'partial', 'pending', 'overdue')),
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_fees_student ON public.student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_status ON public.student_fees(status);

-- 3. Payments & Razorpay Transactions Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    student_fee_id UUID NOT NULL REFERENCES public.student_fees(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'razorpay' CHECK (payment_mode IN ('razorpay', 'upi', 'cash', 'bank_transfer', 'cheque')),
    razorpay_payment_id VARCHAR(100),
    razorpay_order_id VARCHAR(100),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'pending', 'failed', 'refunded')),
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON public.payments(receipt_number);

-- 4. In-App Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_role VARCHAR(20) CHECK (recipient_role IN ('admin', 'teacher', 'student', 'parent', 'all')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'broadcast' CHECK (type IN ('attendance', 'fee', 'lecture', 'assignment', 'broadcast')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);

-- ==============================================================================
-- RLS POLICIES FOR PHASE 4
-- ==============================================================================

ALTER TABLE public.fee_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Fee Plans: Viewable by institute members, manageable by Admins
CREATE POLICY "Members view fee plans"
    ON public.fee_plans FOR SELECT
    USING (
        institute_id IN (
            SELECT institute_id FROM public.institute_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Admins manage fee plans"
    ON public.fee_plans FOR ALL
    USING (
        institute_id IN (
            SELECT institute_id FROM public.institute_members
            WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
        )
    );

-- Student Fees: Students and linked parents can view their own fees; Admins manage
CREATE POLICY "Users view relevant student fees"
    ON public.student_fees FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
        OR student_id IN (
            SELECT ps.student_id FROM public.parent_students ps
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE p.user_id = auth.uid()
        )
        OR institute_id IN (
            SELECT institute_id FROM public.institute_members
            WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
        )
    );

-- Payments: Viewable by payer student, parent, or admin
CREATE POLICY "Users view payments"
    ON public.payments FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
        OR student_id IN (
            SELECT ps.student_id FROM public.parent_students ps
            JOIN public.parents p ON p.id = ps.parent_id
            WHERE p.user_id = auth.uid()
        )
        OR institute_id IN (
            SELECT institute_id FROM public.institute_members
            WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
        )
    );

-- Notifications: Users view notifications meant for them or broadcasted to their role
CREATE POLICY "Users view notifications"
    ON public.notifications FOR SELECT
    USING (
        recipient_id = auth.uid()
        OR recipient_role = 'all'
        OR recipient_role IN (
            SELECT role FROM public.institute_members WHERE user_id = auth.uid()
        )
    );
