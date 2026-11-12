-- ==============================================================================
-- ACADLY REALTIME CHAT MIGRATION (100% SUPABASE FREE TIER)
-- Migration: 002_chat_schema.sql
-- Description: Real-time Batch Group Chat and 1-on-1 Direct Doubt Messaging
-- ==============================================================================

-- 1. Create chat_rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('batch_group', 'direct_doubt')),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    last_message_text TEXT,
    last_message_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('teacher', 'student')),
    message_text TEXT,
    attachment_url TEXT,
    attachment_type TEXT CHECK (attachment_type IN ('pdf', 'image')),
    is_pinned BOOLEAN DEFAULT false NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Indexes for Real-time query performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_institute ON public.chat_rooms(institute_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_batch ON public.chat_rooms(batch_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_teacher ON public.chat_rooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_student ON public.chat_rooms(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_pinned ON public.chat_messages(room_id) WHERE is_pinned = true;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for chat_rooms
CREATE POLICY "Users can view rooms in their institute"
ON public.chat_rooms FOR SELECT
USING (
    institute_id IN (
        SELECT institute_id FROM public.institute_members
        WHERE profile_id = auth.uid()
    )
);

CREATE POLICY "Teachers can create chat rooms"
ON public.chat_rooms FOR INSERT
WITH CHECK (
    teacher_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.institute_members
        WHERE profile_id = auth.uid()
        AND institute_id = chat_rooms.institute_id
        AND role IN ('admin', 'teacher')
    )
);

-- 6. RLS Policies for chat_messages
CREATE POLICY "Users can read messages in their rooms"
ON public.chat_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.chat_rooms r
        WHERE r.id = chat_messages.room_id
        AND (
            r.teacher_id = auth.uid() OR
            r.student_id = auth.uid() OR
            r.type = 'batch_group'
        )
    )
);

CREATE POLICY "Users can post messages in their rooms"
ON public.chat_messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.chat_rooms r
        WHERE r.id = chat_messages.room_id
        AND (
            r.teacher_id = auth.uid() OR
            r.student_id = auth.uid() OR
            r.type = 'batch_group'
        )
    )
);

CREATE POLICY "Teachers can update messages to pin them"
ON public.chat_messages FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.chat_rooms r
        WHERE r.id = chat_messages.room_id
        AND r.teacher_id = auth.uid()
    )
);

-- 7. Add Tables to Supabase Realtime Publication
-- Enables postgres_changes listener for real-time delivery
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'chat_rooms'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
    END IF;
END $$;
