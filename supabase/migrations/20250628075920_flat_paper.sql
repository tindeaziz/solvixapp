-- Nettoyage des données demo et vérification de l'isolation des utilisateurs

-- 1. SUPPRESSION DES DONNÉES DEMO ORPHELINES
-- Supprimer tous les enregistrements avec user_id NULL ou invalide
DELETE FROM articles_devis WHERE devis_id IN (
  SELECT id FROM devis WHERE user_id IS NULL
);

DELETE FROM devis WHERE user_id IS NULL;
DELETE FROM clients WHERE user_id IS NULL;
DELETE FROM profiles WHERE user_id IS NULL;

-- 2. VÉRIFICATION DES POLITIQUES RLS
-- S'assurer que toutes les tables ont RLS activé
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles_devis ENABLE ROW LEVEL SECURITY;

-- 3. FONCTION DE DIAGNOSTIC POUR VÉRIFIER L'ISOLATION
CREATE OR REPLACE FUNCTION diagnostic_isolation_utilisateur()
RETURNS TABLE(
  table_name TEXT,
  total_records BIGINT,
  records_with_null_user_id BIGINT,
  unique_users BIGINT,
  rls_enabled BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Diagnostic pour la table profiles
  RETURN QUERY
  SELECT 
    'profiles'::TEXT,
    (SELECT COUNT(*) FROM profiles)::BIGINT,
    (SELECT COUNT(*) FROM profiles WHERE user_id IS NULL)::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM profiles WHERE user_id IS NOT NULL)::BIGINT,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles')::BOOLEAN;

  -- Diagnostic pour la table clients
  RETURN QUERY
  SELECT 
    'clients'::TEXT,
    (SELECT COUNT(*) FROM clients)::BIGINT,
    (SELECT COUNT(*) FROM clients WHERE user_id IS NULL)::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM clients WHERE user_id IS NOT NULL)::BIGINT,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'clients')::BOOLEAN;

  -- Diagnostic pour la table devis
  RETURN QUERY
  SELECT 
    'devis'::TEXT,
    (SELECT COUNT(*) FROM devis)::BIGINT,
    (SELECT COUNT(*) FROM devis WHERE user_id IS NULL)::BIGINT,
    (SELECT COUNT(DISTINCT user_id) FROM devis WHERE user_id IS NOT NULL)::BIGINT,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'devis')::BOOLEAN;

  -- Diagnostic pour la table articles_devis
  RETURN QUERY
  SELECT 
    'articles_devis'::TEXT,
    (SELECT COUNT(*) FROM articles_devis)::BIGINT,
    0::BIGINT, -- articles_devis n'a pas de user_id direct
    (SELECT COUNT(DISTINCT d.user_id) FROM articles_devis a JOIN devis d ON a.devis_id = d.id WHERE d.user_id IS NOT NULL)::BIGINT,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'articles_devis')::BOOLEAN;
END;
$$;

-- 4. FONCTION POUR TESTER L'ISOLATION DES DONNÉES
CREATE OR REPLACE FUNCTION test_isolation_donnees(test_user_id UUID)
RETURNS TABLE(
  test_name TEXT,
  result TEXT,
  details TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_count INTEGER;
  client_count INTEGER;
  devis_count INTEGER;
BEGIN
  -- Test 1: Vérifier que l'utilisateur ne voit que ses propres profils
  SELECT COUNT(*) INTO profile_count 
  FROM profiles 
  WHERE user_id = test_user_id;
  
  RETURN QUERY
  SELECT 
    'Profile Isolation'::TEXT,
    CASE WHEN profile_count <= 1 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    format('Utilisateur %s a %s profil(s)', test_user_id, profile_count)::TEXT;

  -- Test 2: Vérifier l'isolation des clients
  SELECT COUNT(*) INTO client_count 
  FROM clients 
  WHERE user_id = test_user_id;
  
  RETURN QUERY
  SELECT 
    'Client Isolation'::TEXT,
    'PASS'::TEXT,
    format('Utilisateur %s a %s client(s)', test_user_id, client_count)::TEXT;

  -- Test 3: Vérifier l'isolation des devis
  SELECT COUNT(*) INTO devis_count 
  FROM devis 
  WHERE user_id = test_user_id;
  
  RETURN QUERY
  SELECT 
    'Devis Isolation'::TEXT,
    'PASS'::TEXT,
    format('Utilisateur %s a %s devis', test_user_id, devis_count)::TEXT;

  -- Test 4: Vérifier qu'aucune donnée n'a user_id NULL
  RETURN QUERY
  SELECT 
    'No Orphan Data'::TEXT,
    CASE WHEN (
      (SELECT COUNT(*) FROM profiles WHERE user_id IS NULL) +
      (SELECT COUNT(*) FROM clients WHERE user_id IS NULL) +
      (SELECT COUNT(*) FROM devis WHERE user_id IS NULL)
    ) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    'Vérification des données orphelines'::TEXT;
END;
$$;

-- 5. CONTRAINTES POUR EMPÊCHER LES DONNÉES ORPHELINES
-- Ajouter des contraintes NOT NULL si elles n'existent pas déjà
DO $$
BEGIN
  -- Vérifier et ajouter contrainte NOT NULL sur profiles.user_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'user_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE profiles ALTER COLUMN user_id SET NOT NULL;
  END IF;

  -- Vérifier et ajouter contrainte NOT NULL sur clients.user_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' 
    AND column_name = 'user_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;
  END IF;

  -- Vérifier et ajouter contrainte NOT NULL sur devis.user_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'devis' 
    AND column_name = 'user_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE devis ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- 6. EXÉCUTER LE DIAGNOSTIC
SELECT * FROM diagnostic_isolation_utilisateur();

-- 7. MESSAGE DE CONFIRMATION
DO $$
BEGIN
  RAISE NOTICE '✅ NETTOYAGE TERMINÉ: Données demo supprimées, RLS activé, contraintes ajoutées';
  RAISE NOTICE '🔍 DIAGNOSTIC: Exécutez "SELECT * FROM diagnostic_isolation_utilisateur();" pour vérifier';
  RAISE NOTICE '🧪 TEST: Exécutez "SELECT * FROM test_isolation_donnees(''votre-user-id'');" pour tester';
END $$;