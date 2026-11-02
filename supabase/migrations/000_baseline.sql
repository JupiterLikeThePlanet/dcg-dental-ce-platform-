-- 000_baseline
--
-- Schema snapshot of the `public` schema, dumped from STAGING (duqgdsrvaxucbckqkygo)
-- on 2026-11-02 with:
--   pg_dump --schema-only --schema=public --no-owner --no-privileges
-- Staging and prod were verified structurally identical at that point
-- (already includes the effects of migrations 001 and 002).
--
-- This is a reference record, not something to replay on an existing project
-- (e.g. CREATE SCHEMA public fails where the schema exists).
-- Not included: grants (see 001), and the auth.users signup trigger
-- (see 000_baseline_auth_trigger.sql).

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.2

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

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: submission_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.submission_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'pending_payment'
);


--
-- Name: admin_delete_user(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_delete_user(target_email text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  target_user_id UUID;
  classes_deleted INT;
  submissions_deleted INT;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RETURN 'User not found: ' || target_email;
  END IF;

  DELETE FROM classes WHERE submission_id IN (
    SELECT id FROM submissions WHERE submitted_by = target_user_id
  );
  DELETE FROM classes WHERE posted_by = target_user_id;
  GET DIAGNOSTICS classes_deleted = ROW_COUNT;

  DELETE FROM submissions WHERE submitted_by = target_user_id;
  GET DIAGNOSTICS submissions_deleted = ROW_COUNT;

  DELETE FROM users WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN 'Deleted user ' || target_email || ' with ' ||
    submissions_deleted || ' submissions and ' || classes_deleted || ' classes';
END;
$$;


--
-- Name: approve_submission(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.approve_submission(submission_id uuid, admin_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  new_class_id UUID;
  submission_record RECORD;
BEGIN
  SELECT * INTO submission_record
  FROM public.submissions
  WHERE id = submission_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  INSERT INTO public.classes (
    title, description,
    start_date, end_date, start_time, end_time,
    address_line1, address_line2, city, state, zip_code,
    latitude, longitude,
    instructor_name, provider_name, contact_email, contact_phone,
    price, ce_credits, category,
    registration_url, image_url,
    posted_by, status
  ) VALUES (
    submission_record.title, submission_record.description,
    submission_record.start_date, submission_record.end_date,
    submission_record.start_time, submission_record.end_time,
    submission_record.address_line1, submission_record.address_line2,
    submission_record.city, submission_record.state, submission_record.zip_code,
    submission_record.latitude, submission_record.longitude,
    submission_record.instructor_name, submission_record.provider_name,
    submission_record.contact_email, submission_record.contact_phone,
    submission_record.price, submission_record.ce_credits, submission_record.category,
    submission_record.registration_url, submission_record.image_url,
    submission_record.submitted_by, 'approved'
  )
  RETURNING id INTO new_class_id;

  UPDATE public.submissions
  SET
    status = 'approved',
    reviewed_by = admin_id,
    reviewed_at = NOW()
  WHERE id = submission_id;

  RETURN new_class_id;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$;


--
-- Name: reject_submission(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reject_submission(submission_id uuid, admin_id uuid, reason text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.submissions
  SET
    status = 'rejected',
    reviewed_by = admin_id,
    reviewed_at = NOW(),
    rejection_reason = reason
  WHERE id = submission_id;
END;
$$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: validate_coupon(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_coupon(coupon_code text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  coupon_record RECORD;
BEGIN
  SELECT * INTO coupon_record
  FROM public.coupon_codes
  WHERE
    code = coupon_code
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses);

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE public.coupon_codes
  SET current_uses = current_uses + 1
  WHERE code = coupon_code;

  RETURN TRUE;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    start_date date NOT NULL,
    end_date date,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    city text NOT NULL,
    state text NOT NULL,
    zip_code text NOT NULL,
    latitude numeric,
    longitude numeric,
    instructor_name text NOT NULL,
    provider_name text NOT NULL,
    contact_email text,
    contact_phone text,
    price numeric DEFAULT 0 NOT NULL,
    ce_credits integer,
    category text,
    registration_url text NOT NULL,
    image_url text NOT NULL,
    posted_by uuid,
    is_admin_post boolean DEFAULT false,
    status public.submission_status DEFAULT 'approved'::public.submission_status,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    submission_id uuid,
    attendance_type text,
    CONSTRAINT classes_attendance_type_check CHECK ((attendance_type = ANY (ARRAY['on-site'::text, 'hybrid'::text, 'remote'::text, 'pre-recorded'::text]))),
    CONSTRAINT classes_description_check CHECK ((char_length(description) <= 1000)),
    CONSTRAINT classes_title_check CHECK ((char_length(title) <= 100))
);


--
-- Name: coupon_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupon_codes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    max_uses integer,
    current_uses integer DEFAULT 0,
    expires_at timestamp with time zone,
    created_by uuid,
    is_active boolean DEFAULT true,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.submissions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    start_date date NOT NULL,
    end_date date,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    city text NOT NULL,
    state text NOT NULL,
    zip_code text NOT NULL,
    latitude numeric,
    longitude numeric,
    instructor_name text NOT NULL,
    provider_name text NOT NULL,
    contact_email text,
    contact_phone text,
    price numeric DEFAULT 0 NOT NULL,
    ce_credits integer,
    category text,
    registration_url text NOT NULL,
    image_url text NOT NULL,
    submitted_by uuid NOT NULL,
    status public.submission_status DEFAULT 'pending'::public.submission_status,
    stripe_payment_id text,
    payment_amount numeric DEFAULT 5.00,
    used_coupon_code text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    coupon_code text,
    attendance_type text,
    CONSTRAINT submissions_attendance_type_check CHECK ((attendance_type = ANY (ARRAY['on-site'::text, 'hybrid'::text, 'remote'::text, 'pre-recorded'::text]))),
    CONSTRAINT submissions_description_check CHECK ((char_length(description) <= 1000)),
    CONSTRAINT submissions_title_check CHECK ((char_length(title) <= 100))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    organization text,
    phone text,
    is_admin boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: coupon_codes coupon_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_codes
    ADD CONSTRAINT coupon_codes_code_key UNIQUE (code);


--
-- Name: coupon_codes coupon_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_codes
    ADD CONSTRAINT coupon_codes_pkey PRIMARY KEY (id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_classes_city_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_city_state ON public.classes USING btree (city, state);


--
-- Name: idx_classes_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_deleted_at ON public.classes USING btree (deleted_at);


--
-- Name: idx_classes_posted_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_posted_by ON public.classes USING btree (posted_by);


--
-- Name: idx_classes_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_search ON public.classes USING gin (to_tsvector('english'::regconfig, ((title || ' '::text) || description)));


--
-- Name: idx_classes_start_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_start_date ON public.classes USING btree (start_date);


--
-- Name: idx_classes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_status ON public.classes USING btree (status);


--
-- Name: idx_classes_submission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_submission_id ON public.classes USING btree (submission_id);


--
-- Name: idx_coupon_codes_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupon_codes_code ON public.coupon_codes USING btree (code);


--
-- Name: idx_coupon_codes_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coupon_codes_is_active ON public.coupon_codes USING btree (is_active);


--
-- Name: idx_submissions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_created_at ON public.submissions USING btree (created_at DESC);


--
-- Name: idx_submissions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_status ON public.submissions USING btree (status);


--
-- Name: idx_submissions_submitted_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_submitted_by ON public.submissions USING btree (submitted_by);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_is_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_is_admin ON public.users USING btree (is_admin);


--
-- Name: classes update_classes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: submissions update_submissions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: classes classes_posted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_posted_by_fkey FOREIGN KEY (posted_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: classes classes_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id) ON DELETE CASCADE;


--
-- Name: coupon_codes coupon_codes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_codes
    ADD CONSTRAINT coupon_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: submissions submissions_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: submissions submissions_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: classes Admins can delete classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete classes" ON public.classes FOR DELETE USING (public.is_admin());


--
-- Name: submissions Admins can delete submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete submissions" ON public.submissions FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))));


--
-- Name: classes Admins can insert classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert classes" ON public.classes FOR INSERT WITH CHECK (public.is_admin());


--
-- Name: coupon_codes Admins can manage coupons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage coupons" ON public.coupon_codes USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))));


--
-- Name: submissions Admins can update all submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all submissions" ON public.submissions FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))));


--
-- Name: classes Admins can update classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update classes" ON public.classes FOR UPDATE USING (public.is_admin());


--
-- Name: classes Admins can view all classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all classes" ON public.classes FOR SELECT USING (public.is_admin());


--
-- Name: submissions Admins can view all submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all submissions" ON public.submissions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))));


--
-- Name: users Admins can view all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (public.is_admin());


--
-- Name: classes Public can view approved classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view approved classes" ON public.classes FOR SELECT USING (((status = 'approved'::public.submission_status) AND (deleted_at IS NULL)));


--
-- Name: users Users can create own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own profile" ON public.users FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: submissions Users can insert own submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own submissions" ON public.submissions FOR INSERT WITH CHECK ((auth.uid() = submitted_by));


--
-- Name: submissions Users can update own pending submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own pending submissions" ON public.submissions FOR UPDATE USING (((auth.uid() = submitted_by) AND (status = 'pending'::public.submission_status)));


--
-- Name: users Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING ((auth.uid() = id));


--
-- Name: coupon_codes Users can view active coupons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view active coupons" ON public.coupon_codes FOR SELECT USING (((auth.uid() IS NOT NULL) AND (is_active = true)));


--
-- Name: users Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING ((auth.uid() = id));


--
-- Name: submissions Users can view own submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own submissions" ON public.submissions FOR SELECT USING ((auth.uid() = submitted_by));


--
-- Name: classes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

--
-- Name: coupon_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

