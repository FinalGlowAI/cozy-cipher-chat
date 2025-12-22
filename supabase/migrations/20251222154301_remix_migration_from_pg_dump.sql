CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: cleanup_expired_encrypted_images(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_encrypted_images() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'storage'
    AS $$
DECLARE
  deleted_count INTEGER := 0;
  expired_image RECORD;
BEGIN
  -- Delete expired records and their storage files
  FOR expired_image IN 
    SELECT code, storage_path 
    FROM public.encrypted_images 
    WHERE expires_at IS NOT NULL AND expires_at < NOW()
  LOOP
    -- Delete from storage
    DELETE FROM storage.objects 
    WHERE bucket_id = 'encrypted_images' 
    AND name = expired_image.storage_path;
    
    -- Delete from table
    DELETE FROM public.encrypted_images WHERE code = expired_image.code;
    deleted_count := deleted_count + 1;
  END LOOP;
  
  RETURN deleted_count;
END;
$$;


--
-- Name: delete_encrypted_image(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_encrypted_image(_code text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'storage'
    AS $$
DECLARE
  _storage_path TEXT;
BEGIN
  -- Get storage path and delete from database in one operation
  DELETE FROM public.encrypted_images
  WHERE code = UPPER(_code)
  RETURNING storage_path INTO _storage_path;
  
  IF _storage_path IS NULL THEN
    RAISE EXCEPTION 'Code not found';
  END IF;
  
  -- Delete from storage bucket
  DELETE FROM storage.objects
  WHERE bucket_id = 'encrypted_images'
    AND name = _storage_path;
  
  RETURN _storage_path;
END;
$$;


--
-- Name: generate_room_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_room_code() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_free_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_free_user() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.free_users
    WHERE email = auth.email()
  );
$$;


--
-- Name: is_premium_user(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_premium_user(user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE subscriptions.user_id = $1
      AND status = 'active'
      AND (current_period_end IS NULL OR current_period_end > now())
  );
$_$;


--
-- Name: retrieve_encrypted_image(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.retrieve_encrypted_image(_code text) RETURNS TABLE(code text, storage_path text, expires_at timestamp with time zone, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Check if code exists and not expired
  RETURN QUERY
  SELECT 
    ei.code,
    ei.storage_path,
    ei.expires_at,
    ei.created_at
  FROM public.encrypted_images ei
  WHERE ei.code = UPPER(_code)
    AND (ei.expires_at IS NULL OR ei.expires_at > NOW());
  
  -- If no rows found, the code doesn't exist or is expired
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Code not found or expired';
  END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: active_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.active_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    session_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_active timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: encrypted_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encrypted_images (
    code text NOT NULL,
    storage_path text NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ephemeral_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ephemeral_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_id uuid NOT NULL,
    user_id uuid,
    user_color text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ephemeral_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ephemeral_rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_code text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval) NOT NULL
);


--
-- Name: free_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.free_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    features text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    status text DEFAULT 'free'::text NOT NULL,
    current_period_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.testimonials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_name text NOT NULL,
    user_title text,
    comment text NOT NULL,
    rating integer DEFAULT 5 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_approved boolean DEFAULT false NOT NULL,
    CONSTRAINT testimonials_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: active_sessions active_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_sessions
    ADD CONSTRAINT active_sessions_pkey PRIMARY KEY (id);


--
-- Name: active_sessions active_sessions_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_sessions
    ADD CONSTRAINT active_sessions_session_id_key UNIQUE (session_id);


--
-- Name: encrypted_images encrypted_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encrypted_images
    ADD CONSTRAINT encrypted_images_pkey PRIMARY KEY (code);


--
-- Name: ephemeral_messages ephemeral_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ephemeral_messages
    ADD CONSTRAINT ephemeral_messages_pkey PRIMARY KEY (id);


--
-- Name: ephemeral_rooms ephemeral_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ephemeral_rooms
    ADD CONSTRAINT ephemeral_rooms_pkey PRIMARY KEY (id);


--
-- Name: ephemeral_rooms ephemeral_rooms_room_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ephemeral_rooms
    ADD CONSTRAINT ephemeral_rooms_room_code_key UNIQUE (room_code);


--
-- Name: free_users free_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.free_users
    ADD CONSTRAINT free_users_email_key UNIQUE (email);


--
-- Name: free_users free_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.free_users
    ADD CONSTRAINT free_users_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);


--
-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_active_sessions_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_active_sessions_session_id ON public.active_sessions USING btree (session_id);


--
-- Name: idx_active_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_active_sessions_user_id ON public.active_sessions USING btree (user_id);


--
-- Name: idx_encrypted_images_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_encrypted_images_expires_at ON public.encrypted_images USING btree (expires_at);


--
-- Name: idx_ephemeral_messages_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ephemeral_messages_room_id ON public.ephemeral_messages USING btree (room_id);


--
-- Name: idx_ephemeral_rooms_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ephemeral_rooms_code ON public.ephemeral_rooms USING btree (room_code);


--
-- Name: free_users update_free_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_free_users_updated_at BEFORE UPDATE ON public.free_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscriptions update_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ephemeral_messages ephemeral_messages_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ephemeral_messages
    ADD CONSTRAINT ephemeral_messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.ephemeral_rooms(id) ON DELETE CASCADE;


--
-- Name: ephemeral_messages ephemeral_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ephemeral_messages
    ADD CONSTRAINT ephemeral_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: ephemeral_rooms ephemeral_rooms_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ephemeral_rooms
    ADD CONSTRAINT ephemeral_rooms_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: free_users Admins can delete free users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete free users" ON public.free_users FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: testimonials Admins can delete testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete testimonials" ON public.testimonials FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: free_users Admins can insert free users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert free users" ON public.free_users FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: free_users Admins can update free users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update free users" ON public.free_users FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: testimonials Admins can update testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update testimonials" ON public.testimonials FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: free_users Admins can view all free users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all free users" ON public.free_users FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: testimonials Admins can view all testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all testimonials" ON public.testimonials FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: encrypted_images Anyone can insert encrypted images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert encrypted images" ON public.encrypted_images FOR INSERT WITH CHECK (true);


--
-- Name: testimonials Anyone can insert testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert testimonials" ON public.testimonials FOR INSERT WITH CHECK (true);


--
-- Name: testimonials Anyone can view approved testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view approved testimonials" ON public.testimonials FOR SELECT USING ((is_approved = true));


--
-- Name: ephemeral_rooms Authenticated users can create rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create rooms" ON public.ephemeral_rooms FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));


--
-- Name: ephemeral_messages Authenticated users can delete messages from rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete messages from rooms" ON public.ephemeral_messages FOR DELETE TO authenticated USING (true);


--
-- Name: ephemeral_messages Authenticated users can view messages in rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view messages in rooms" ON public.ephemeral_messages FOR SELECT TO authenticated USING (true);


--
-- Name: ephemeral_rooms Authenticated users can view rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view rooms" ON public.ephemeral_rooms FOR SELECT TO authenticated USING (true);


--
-- Name: user_roles Only admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Only admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: encrypted_images Only service role can delete encrypted images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only service role can delete encrypted images" ON public.encrypted_images FOR DELETE USING (false);


--
-- Name: encrypted_images Only service role can read encrypted images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only service role can read encrypted images" ON public.encrypted_images FOR SELECT USING (false);


--
-- Name: active_sessions Users can delete their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own sessions" ON public.active_sessions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: active_sessions Users can insert their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own sessions" ON public.active_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: subscriptions Users can insert their own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own subscription" ON public.subscriptions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ephemeral_messages Users can only create messages as themselves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can only create messages as themselves" ON public.ephemeral_messages FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: subscriptions Users can update their own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own subscription" ON public.subscriptions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: active_sessions Users can view their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own sessions" ON public.active_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: subscriptions Users can view their own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own subscription" ON public.subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: active_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: encrypted_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.encrypted_images ENABLE ROW LEVEL SECURITY;

--
-- Name: ephemeral_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ephemeral_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: ephemeral_rooms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ephemeral_rooms ENABLE ROW LEVEL SECURITY;

--
-- Name: free_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.free_users ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: testimonials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;