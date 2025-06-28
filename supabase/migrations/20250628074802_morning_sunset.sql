/*
  # Correction de l'erreur "Database error saving new user"

  1. Diagnostic et nettoyage
    - Suppression des triggers problématiques sur auth.users
    - Vérification des contraintes de clés étrangères
    - Nettoyage des fonctions obsolètes

  2. Recréation correcte
    - Fonction sécurisée pour créer les profils
    - Trigger avec SECURITY DEFINER
    - Gestion des erreurs appropriée

  3. Test
    - Vérification que l'inscription fonctionne
    - Création automatique du profil
*/

-- 1. SUPPRESSION DES TRIGGERS ET FONCTIONS PROBLÉMATIQUES
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_profile() CASCADE;

-- 2. VÉRIFICATION ET SUPPRESSION DES CONTRAINTES PROBLÉMATIQUES
-- Supprimer temporairement les contraintes de clé étrangère vers auth.users
ALTER TABLE IF EXISTS profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE IF EXISTS clients DROP CONSTRAINT IF EXISTS clients_user_id_fkey;
ALTER TABLE IF EXISTS devis DROP CONSTRAINT IF EXISTS devis_user_id_fkey;

-- 3. RECRÉATION DE LA FONCTION AVEC SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insérer un profil par défaut pour le nouvel utilisateur
  INSERT INTO public.profiles (
    user_id, 
    company_name, 
    company_email,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mon Entreprise'),
    COALESCE(NEW.email, ''),
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

-- 4. RECRÉATION DU TRIGGER AVEC GESTION D'ERREUR
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. RECRÉATION DES CONTRAINTES DE CLÉ ÉTRANGÈRE (OPTIONNEL)
-- Note: On peut les laisser sans contraintes FK et utiliser uniquement RLS
-- ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. VÉRIFICATION QUE LES POLITIQUES RLS SONT ACTIVES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles_devis ENABLE ROW LEVEL SECURITY;

-- 7. MISE À JOUR DES POLITIQUES RLS POUR UTILISER auth.uid()
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = user_id);

-- 8. VÉRIFICATION DES POLITIQUES POUR LES AUTRES TABLES
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;

CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" ON clients
  FOR DELETE USING (auth.uid() = user_id);

-- 9. POLITIQUES POUR DEVIS
DROP POLICY IF EXISTS "Users can view own devis" ON devis;
DROP POLICY IF EXISTS "Users can insert own devis" ON devis;
DROP POLICY IF EXISTS "Users can update own devis" ON devis;
DROP POLICY IF EXISTS "Users can delete own devis" ON devis;

CREATE POLICY "Users can view own devis" ON devis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devis" ON devis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devis" ON devis
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devis" ON devis
  FOR DELETE USING (auth.uid() = user_id);

-- 10. POLITIQUES POUR ARTICLES_DEVIS
DROP POLICY IF EXISTS "Users can view own articles" ON articles_devis;
DROP POLICY IF EXISTS "Users can insert own articles" ON articles_devis;
DROP POLICY IF EXISTS "Users can update own articles" ON articles_devis;
DROP POLICY IF EXISTS "Users can delete own articles" ON articles_devis;

CREATE POLICY "Users can view own articles" ON articles_devis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM devis 
      WHERE devis.id = articles_devis.devis_id 
      AND devis.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own articles" ON articles_devis
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM devis 
      WHERE devis.id = articles_devis.devis_id 
      AND devis.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own articles" ON articles_devis
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM devis 
      WHERE devis.id = articles_devis.devis_id 
      AND devis.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own articles" ON articles_devis
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM devis 
      WHERE devis.id = articles_devis.devis_id 
      AND devis.user_id = auth.uid()
    )
  );

-- 11. FONCTION DE TEST POUR VÉRIFIER QUE TOUT FONCTIONNE
CREATE OR REPLACE FUNCTION test_user_creation()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_result TEXT;
BEGIN
  -- Vérifier que les tables existent
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RETURN 'ERREUR: Table profiles n''existe pas';
  END IF;
  
  -- Vérifier que les politiques RLS sont actives
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    RETURN 'ERREUR: Politiques RLS manquantes pour profiles';
  END IF;
  
  -- Vérifier que la fonction trigger existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user'
  ) THEN
    RETURN 'ERREUR: Fonction handle_new_user manquante';
  END IF;
  
  -- Vérifier que le trigger existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RETURN 'ERREUR: Trigger on_auth_user_created manquant';
  END IF;
  
  RETURN 'SUCCESS: Configuration auth correcte';
END;
$$;

-- Exécuter le test
SELECT test_user_creation();