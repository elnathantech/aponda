import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

/**
 * Authorize a request as either:
 *  - A scheduled cron invocation carrying the shared x-cron-secret header, or
 *  - A signed-in user with a valid Supabase JWT.
 * Returns { ok: true } on success, or { ok: false, response } with a 401.
 */
export async function authorizeCronOrUser(req: Request): Promise<
  { ok: true; userId?: string } | { ok: false; response: Response }
> {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const providedSecret = req.headers.get("x-cron-secret");
  if (cronSecret && providedSecret && providedSecret === cronSecret) {
    return { ok: true };
  }

  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        return { ok: true, userId: data.user.id };
      }
    } catch (_e) {
      // fall through to 401
    }
  }

  return {
    ok: false,
    response: new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }),
  };
}
