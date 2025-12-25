-- Add composite indexes for frequent query patterns

-- Index for ephemeral_rooms lookup by room_code (already exists as unique, but ensure it's indexed)
CREATE INDEX IF NOT EXISTS idx_ephemeral_rooms_expires_at ON public.ephemeral_rooms(expires_at);

-- Index for ephemeral_messages - room_id + created_at for pagination queries
CREATE INDEX IF NOT EXISTS idx_ephemeral_messages_room_created ON public.ephemeral_messages(room_id, created_at DESC);

-- Index for room_participants lookup
CREATE INDEX IF NOT EXISTS idx_room_participants_room_user ON public.room_participants(room_id, user_id);

-- Index for subscriptions by user_id and status
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);

-- Index for encrypted_images expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_encrypted_images_expires_at ON public.encrypted_images(expires_at) WHERE expires_at IS NOT NULL;

-- Index for free_users email lookup
CREATE INDEX IF NOT EXISTS idx_free_users_email ON public.free_users(email);

-- Index for user_roles lookup
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);