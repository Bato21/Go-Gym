-- rls_auto_enable() la crea Supabase para el event trigger ensure_rls (activa RLS
-- en cada tabla nueva de public). Solo la dispara Postgres: nadie de la Data API
-- necesita ejecutarla.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
