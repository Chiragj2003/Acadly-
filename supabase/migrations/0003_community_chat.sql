-- ==============================================================================
-- CANONICAL MIGRATION: 0003_community_chat.sql
-- Modules: Chat Rooms, Chat Messages, Community Posts, Community Comments,
--          Community Upvotes, Foreign Key Indexes & Realtime Setup.
-- ==============================================================================

-- 1. CHAT TABLES

-- 1. Chat Rooms (Batch Group Chat and 1-on-1 Direct Doubt Messaging)
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('batch_group', 'direct_doubt')),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    last_message_text TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('teacher', 'student', 'admin', 'parent')),
    message_text TEXT,
    attachment_url TEXT,
    attachment_type VARCHAR(20) CHECK (attachment_type IN ('pdf', 'image', 'file')),
    attachment_name VARCHAR(255),
    is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. COMMUNITY TABLES

-- 3. Community Posts (Peer Q&A, Doubt Discussions)
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    pdf_or_file_url TEXT,
    image_url TEXT,
    upvotes_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Community Comments (Answers, Clarifications)
CREATE TABLE IF NOT EXISTS public.community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    attachment_url TEXT,
    is_teacher_verified_answer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Community Upvotes
CREATE TABLE IF NOT EXISTS public.community_upvotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 3. FOREIGN KEY & QUERY INDEXES

-- Chat Rooms
CREATE INDEX IF NOT EXISTS idx_fk_chat_rooms_institute ON public.chat_rooms(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_chat_rooms_batch ON public.chat_rooms(batch_id);
CREATE INDEX IF NOT EXISTS idx_fk_chat_rooms_teacher ON public.chat_rooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_fk_chat_rooms_student ON public.chat_rooms(student_id);

-- Chat Messages
CREATE INDEX IF NOT EXISTS idx_fk_chat_messages_room ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_fk_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON public.chat_messages(room_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_pinned ON public.chat_messages(room_id) WHERE is_pinned = TRUE;

-- Community Posts
CREATE INDEX IF NOT EXISTS idx_fk_community_posts_institute ON public.community_posts(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_community_posts_batch ON public.community_posts(batch_id);
CREATE INDEX IF NOT EXISTS idx_fk_community_posts_subject ON public.community_posts(subject_id);
CREATE INDEX IF NOT EXISTS idx_fk_community_posts_author ON public.community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON public.community_posts(institute_id, created_at DESC);

-- Community Comments
CREATE INDEX IF NOT EXISTS idx_fk_community_comments_institute ON public.community_comments(institute_id);
CREATE INDEX IF NOT EXISTS idx_fk_community_comments_post ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_fk_community_comments_author ON public.community_comments(author_id);

-- Community Upvotes
CREATE INDEX IF NOT EXISTS idx_fk_community_upvotes_post ON public.community_upvotes(post_id);
CREATE INDEX IF NOT EXISTS idx_fk_community_upvotes_user ON public.community_upvotes(user_id);

-- 4. REALTIME PUBLICATION SETUP
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

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'community_posts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'community_comments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
    END IF;
END $$;
