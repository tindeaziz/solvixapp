/*
  # Ajout de champs pour les informations d'entreprise dans la table auth.users

  1. Nouvelles Fonctionnalités
    - Ajout de champs pour les informations d'entreprise dans les métadonnées utilisateur
    - Mise à jour de la fonction de création de profil pour utiliser ces métadonnées
    - Amélioration de la synchronisation entre auth.users et profiles

  2. Sécurité
    - Maintien des politiques RLS existantes
    - Aucune modification des contraintes de sécurité
*/

-- Fonction pour créer un profil complet à partir des métadonnées utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insérer un profil par défaut pour le nouvel utilisateur avec toutes les métadonnées disponibles
  INSERT INTO public.profiles (
    user_id, 
    company_name,
    company_address,
    company_phone,
    company_email,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mon Entreprise'),
    COALESCE(NEW.raw_user_meta_data->>'company_address', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_email', NEW.email),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne pas faire échouer l'inscription
    RAISE LOG 'Erreur lors de la création du profil pour l''utilisateur %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Vérifier que le trigger existe toujours
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Fonction pour mettre à jour le profil quand les métadonnées utilisateur changent
CREATE OR REPLACE FUNCTION public.handle_user_metadata_update()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mettre à jour le profil si les métadonnées ont changé
  IF NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data THEN
    UPDATE public.profiles
    SET 
      company_name = COALESCE(NEW.raw_user_meta_data->>'company_name', company_name),
      company_address = COALESCE(NEW.raw_user_meta_data->>'company_address', company_address),
      company_phone = COALESCE(NEW.raw_user_meta_data->>'company_phone', company_phone),
      company_email = COALESCE(NEW.raw_user_meta_data->>'company_email', company_email),
      updated_at = NOW()
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Erreur lors de la mise à jour du profil pour l''utilisateur %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Créer un trigger pour mettre à jour le profil quand les métadonnées utilisateur changent
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data)
  EXECUTE FUNCTION public.handle_user_metadata_update();

-- Fonction pour tester la synchronisation des métadonnées
CREATE OR REPLACE FUNCTION test_metadata_sync()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_result TEXT;
BEGIN
  -- Vérifier que les triggers existent
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) AND EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_updated'
  ) THEN
    test_result := 'SUCCESS: Les triggers de synchronisation des métadonnées sont correctement configurés';
  ELSE
    test_result := 'ERREUR: Les triggers de synchronisation des métadonnées ne sont pas correctement configurés';
  END IF;
  
  RETURN test_result;
END;
$$;

-- Exécuter le test
SELECT test_metadata_sync();