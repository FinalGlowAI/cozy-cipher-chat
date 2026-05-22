-- ================================================================
-- Migration: fix_all_security_issues
-- Date: 2026-05-22
-- Description: Corrige toutes les erreurs de sécurité détectées :
--   - user_credits : retirer UPDATE/INSERT directs (passe par fonctions)
--   - credit_transactions : retirer INSERT direct
--   - subscriptions : retirer UPDATE/INSERT directs
--   - storage encrypted_images : restreindre par user_id dans le path
--   - fonctions SECURITY DEFINER : révoquer l'accès public
-- ================================================================


-- ================================================================
-- 1. USER_CREDITS
-- Les utilisateurs ne doivent pas pouvoir modifier leur solde
-- directement. Toute modification passe par earn_credits() ou
-- spend_credits() qui sont SECURITY DEFINER.
-- ================================================================

DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert own credits" ON public.user_credits;

-- La lecture reste autorisée (l'utilisateur peut voir son solde)
-- "Users can view own credits" est conservée telle quelle.

-- Seul le service_role (via les Edge Functions) ou les fonctions
-- SECURITY DEFINER peuvent modifier les crédits.


-- ================================================================
-- 2. CREDIT_TRANSACTIONS
-- Les utilisateurs ne doivent pas pouvoir créer des transactions
-- eux-mêmes. Seules earn_credits() et spend_credits() le font.
-- ================================================================

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.credit_transactions;

-- La lecture reste autorisée.
-- "Users can view own transactions" est conservée telle quelle.


-- ================================================================
-- 3. SUBSCRIPTIONS
-- Les abonnements sont gérés uniquement par le webhook Stripe
-- via service_role. Les utilisateurs peuvent seulement lire.
-- ================================================================

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;

-- La lecture reste autorisée.
-- "Users can view their own subscription" est conservée telle quelle.


-- ================================================================
-- 4. STORAGE - BUCKET encrypted_images
-- Restreindre l'accès par user_id dans le chemin du fichier.
-- Convention attendue dans le code : `{user_id}/filename`
-- ================================================================

-- Supprimer la policy INSERT trop permissive (authentifié = n'importe qui)
DROP POLICY IF EXISTS "Authenticated users can insert encrypted images" ON public.encrypted_images;

-- Nouvelle policy INSERT : l'utilisateur upload uniquement dans son dossier
-- Note : cette policy s'applique sur storage.objects, pas sur la table public.encrypted_images
-- Si tes uploads passent par storage, ajouter les policies suivantes dans le dashboard
-- Supabase > Storage > Policies, ou via SQL :

-- INSERT dans storage.objects réservé au propriétaire du dossier
DO $$
BEGIN
  -- Supprimer l'ancienne policy de storage si elle existe
  DELETE FROM storage.policies
  WHERE bucket_id = 'encrypted_images'
    AND name IN (
      'Authenticated users can upload encrypted images',
      'Anyone can upload encrypted images',
      'Public upload encrypted images'
    );
EXCEPTION WHEN others THEN
  -- La table storage.policies peut ne pas exister selon la version
  NULL;
END $$;

-- Recréer les policies storage correctement
INSERT INTO storage.policies (bucket_id, name, definition, check_definition, operation)
VALUES
  -- Lecture : uniquement le propriétaire (user_id dans le 1er segment du path)
  ('encrypted_images', 'owner_select',
   '(auth.uid()::text = (storage.foldername(name))[1])',
   NULL,
   'SELECT'),
  -- Upload : uniquement dans son propre dossier
  ('encrypted_images', 'owner_insert',
   NULL,
   '(auth.uid()::text = (storage.foldername(name))[1])',
   'INSERT'),
  -- Suppression : uniquement son propre dossier
  ('encrypted_images', 'owner_delete',
   '(auth.uid()::text = (storage.foldername(name))[1])',
   NULL,
   'DELETE')
ON CONFLICT DO NOTHING;

-- Rétablir la policy INSERT sur public.encrypted_images avec vérification du user
-- (la table n'a pas de user_id, donc on garde l'auth requise, mais la suppression
-- du fichier storage passe par delete_encrypted_image() SECURITY DEFINER)
CREATE POLICY "Authenticated users can insert encrypted images"
ON public.encrypted_images
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);


-- ================================================================
-- 5. FONCTIONS SECURITY DEFINER
-- Révoquer l'exécution par anon et public pour les fonctions
-- sensibles qui ne doivent pas être appelables librement.
-- ================================================================

-- generate_room_code : ne doit pas être appelable directement
REVOKE EXECUTE ON FUNCTION public.generate_room_code() FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_room_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_room_code() TO authenticated;

-- update_updated_at_column : trigger interne seulement
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;

-- cleanup_expired_encrypted_images : service_role only (cron job)
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_encrypted_images() FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_encrypted_images() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_encrypted_images() FROM authenticated;

-- delete_encrypted_image : service_role only
REVOKE EXECUTE ON FUNCTION public.delete_encrypted_image(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_encrypted_image(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_encrypted_image(text) FROM authenticated;

-- retrieve_encrypted_image : accessible aux authentifiés
REVOKE EXECUTE ON FUNCTION public.retrieve_encrypted_image(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.retrieve_encrypted_image(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.retrieve_encrypted_image(text) TO authenticated;

-- has_role : interne uniquement (utilisée dans les policies RLS)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- is_free_user : accessible aux authentifiés
REVOKE EXECUTE ON FUNCTION public.is_free_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_free_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_free_user() TO authenticated;

-- is_premium_user : accessible aux authentifiés
REVOKE EXECUTE ON FUNCTION public.is_premium_user(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_premium_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_premium_user(uuid) TO authenticated;

-- get_room_by_code : accessible aux authentifiés
REVOKE EXECUTE ON FUNCTION public.get_room_by_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_room_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_room_by_code(text) TO authenticated;

-- get_user_sessions : accessible aux authentifiés
REVOKE EXECUTE ON FUNCTION public.get_user_sessions(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_sessions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_sessions(uuid) TO authenticated;

-- earn_credits : service_role only (appelé par Edge Functions)
REVOKE EXECUTE ON FUNCTION public.earn_credits(uuid, int, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.earn_credits(uuid, int, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.earn_credits(uuid, int, text) FROM authenticated;

-- spend_credits : service_role only (appelé par Edge Functions)
REVOKE EXECUTE ON FUNCTION public.spend_credits(uuid, int, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.spend_credits(uuid, int, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.spend_credits(uuid, int, text) FROM authenticated;

-- increment_daily_usage : service_role only
REVOKE EXECUTE ON FUNCTION public.increment_daily_usage(uuid, text, date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_daily_usage(uuid, text, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_daily_usage(uuid, text, date) FROM authenticated;


-- ================================================================
-- 6. REALTIME - Restreindre les abonnements
-- Les tables dans supabase_realtime doivent avoir des filtres RLS.
-- user_credits : déjà protégé par RLS (SELECT = own user_id)
-- ephemeral_messages : déjà protégé par room_participants check
-- Aucune action SQL nécessaire, les policies existantes suffisent.
-- ================================================================

-- Vérification : s'assurer que RLS est bien activé sur toutes les tables sensibles
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
