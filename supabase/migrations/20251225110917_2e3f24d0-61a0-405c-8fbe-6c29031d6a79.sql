-- Add CHECK constraints to contact_submissions for server-side input validation
ALTER TABLE public.contact_submissions
ADD CONSTRAINT name_length CHECK (length(name) > 0 AND length(name) <= 100),
ADD CONSTRAINT email_length CHECK (length(email) > 0 AND length(email) <= 255),
ADD CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
ADD CONSTRAINT subject_length CHECK (subject IS NULL OR length(subject) <= 200),
ADD CONSTRAINT message_length CHECK (length(message) > 0 AND length(message) <= 2000);

-- Create rate limiting function to prevent spam (max 3 submissions per email per hour)
CREATE OR REPLACE FUNCTION public.check_contact_submission_rate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the same email has submitted more than 3 times in the last hour
  IF (SELECT COUNT(*) FROM contact_submissions 
      WHERE email = NEW.email 
      AND created_at > NOW() - INTERVAL '1 hour') >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to enforce rate limiting on INSERT
CREATE TRIGGER enforce_contact_rate_limit
  BEFORE INSERT ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_contact_submission_rate();