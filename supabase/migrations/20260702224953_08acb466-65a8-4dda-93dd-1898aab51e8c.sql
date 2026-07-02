
SELECT cron.unschedule('daily-financial-automation');
SELECT cron.unschedule('daily-payment-reminders');

SELECT cron.schedule(
  'daily-financial-automation',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url:='https://ubzuisaxbsbohgshoqns.supabase.co/functions/v1/financial-automation',
    headers:='{"Content-Type": "application/json", "x-cron-secret": "61a8ab657a35b9aef846c528dbaa81eb25769004e1456fbd791d463c0deec997"}'::jsonb,
    body:='{"time": "scheduled"}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'daily-payment-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url:='https://ubzuisaxbsbohgshoqns.supabase.co/functions/v1/payment-reminders',
    headers:='{"Content-Type": "application/json", "x-cron-secret": "61a8ab657a35b9aef846c528dbaa81eb25769004e1456fbd791d463c0deec997"}'::jsonb,
    body:='{"time": "scheduled"}'::jsonb
  ) AS request_id;
  $$
);
