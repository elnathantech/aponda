
-- 1. Fix privilege escalation: block non-admin INSERT on user_roles
-- Drop the existing ALL policy and recreate with proper separation
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Admin-only INSERT
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO public
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin-only UPDATE
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO public
USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only DELETE
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO public
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Fix hr_documents NULL bypass: replace ALL policy with one that enforces ownership
DROP POLICY IF EXISTS "Users can manage documents for their companies" ON public.hr_documents;

CREATE POLICY "Users can manage documents for their companies"
ON public.hr_documents
FOR ALL
TO authenticated
USING (
  (company_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM companies WHERE companies.id = hr_documents.company_id AND companies.user_id = auth.uid()
  ))
  OR
  (employee_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM employees e JOIN companies c ON e.company_id = c.id
    WHERE e.id = hr_documents.employee_id AND c.user_id = auth.uid()
  ))
)
WITH CHECK (
  (company_id IS NOT NULL OR employee_id IS NOT NULL)
  AND
  (
    (company_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM companies WHERE companies.id = hr_documents.company_id AND companies.user_id = auth.uid()
    ))
    OR
    (employee_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM employees e JOIN companies c ON e.company_id = c.id
      WHERE e.id = hr_documents.employee_id AND c.user_id = auth.uid()
    ))
  )
);

-- 3. Fix contact_submissions overly permissive INSERT
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;

CREATE POLICY "Anyone can submit contact form"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  name IS NOT NULL AND length(name) > 0 AND length(name) <= 500
  AND email IS NOT NULL AND length(email) > 0 AND length(email) <= 500
  AND message IS NOT NULL AND length(message) > 0 AND length(message) <= 5000
);
