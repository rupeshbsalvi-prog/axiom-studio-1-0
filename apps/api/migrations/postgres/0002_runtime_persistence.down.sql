DELETE FROM storage.objects WHERE bucket_id = 'axiom-photo-assets';
DELETE FROM storage.buckets WHERE id = 'axiom-photo-assets';

DROP FUNCTION IF EXISTS public.axiom_consume_auth_flow(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.axiom_create_auth_flow(TEXT, TEXT, TEXT, BIGINT, INTEGER);
DROP TABLE IF EXISTS public.axiom_sessions;
DROP TABLE IF EXISTS public.axiom_auth_flows;
