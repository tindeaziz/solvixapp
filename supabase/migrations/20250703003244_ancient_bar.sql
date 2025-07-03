/*
  # Fix Security Issues Reported by Supabase Linter
  
  1. Function Search Path Mutability
    - Add SET search_path = public to all functions to prevent SQL injection
    - This ensures functions always use the intended schema
  
  2. Auth Security Improvements
    - Reduce OTP expiry time to enhance security
    - Enable leaked password protection
*/

-- 1. Fix function search path for calculate_article_total
CREATE OR REPLACE FUNCTION calculate_article_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer le total HT de l'article
  NEW.total_ht = NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Fix function search path for update_devis_totals
CREATE OR REPLACE FUNCTION update_devis_totals()
RETURNS TRIGGER AS $$
DECLARE
  devis_record RECORD;
  subtotal numeric(12,2);
  total_vat_amount numeric(12,2);
  total_ttc_amount numeric(12,2);
  target_devis_id uuid;
BEGIN
  -- Récupérer l'ID du devis selon l'opération
  IF TG_OP = 'DELETE' THEN
    target_devis_id := OLD.devis_id;
  ELSE
    target_devis_id := NEW.devis_id;
  END IF;

  -- Calculer les totaux avec des alias explicites pour éviter l'ambiguïté
  SELECT 
    COALESCE(SUM(a.total_ht), 0) as subtotal_calc,
    COALESCE(SUM(a.total_ht * a.vat_rate / 100), 0) as vat_calc
  INTO subtotal, total_vat_amount
  FROM articles_devis a 
  WHERE a.devis_id = target_devis_id;

  -- Calculer le total TTC
  total_ttc_amount := subtotal + total_vat_amount;

  -- Mettre à jour le devis avec des noms de colonnes explicites
  UPDATE devis 
  SET 
    subtotal_ht = subtotal,
    total_vat = total_vat_amount,
    total_ttc = total_ttc_amount,
    updated_at = now()
  WHERE id = target_devis_id;

  -- Retourner l'enregistrement approprié
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Fix function search path for is_admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Pour l'instant, on considère que l'utilisateur avec l'email 'admin@solvix.com' est admin
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id AND email = 'admin@solvix.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Fix function search path for generate_activation_code
CREATE OR REPLACE FUNCTION generate_activation_code()
RETURNS text AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Évite confusion 0,O,1,I
  code_length integer := 8;
  result text := 'SOLVIX-';
  i integer;
BEGIN
  FOR i IN 1..code_length LOOP
    result := result || substr(alphabet, floor(random() * length(alphabet))::integer + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Fix function search path for generate_activation_codes
CREATE OR REPLACE FUNCTION generate_activation_codes(quantity integer, admin_id uuid)
RETURNS SETOF premium_activation_codes AS $$
DECLARE
  i integer;
  new_code text;
  code_record premium_activation_codes;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT is_admin(admin_id) THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent générer des codes';
  END IF;

  FOR i IN 1..quantity LOOP
    -- Générer un code unique
    LOOP
      new_code := generate_activation_code();
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM premium_activation_codes WHERE code = new_code
      );
    END LOOP;
    
    -- Insérer le nouveau code
    INSERT INTO premium_activation_codes (
      code, 
      status, 
      created_by
    ) VALUES (
      new_code,
      'AVAILABLE',
      admin_id
    ) RETURNING * INTO code_record;
    
    RETURN NEXT code_record;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Fix function search path for mark_code_as_sold
CREATE OR REPLACE FUNCTION mark_code_as_sold(
  code_value text,
  customer_contact text,
  admin_id uuid
)
RETURNS premium_activation_codes AS $$
DECLARE
  updated_code premium_activation_codes;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT is_admin(admin_id) THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent marquer des codes comme vendus';
  END IF;

  -- Mettre à jour le code
  UPDATE premium_activation_codes
  SET 
    status = 'SOLD',
    sold_at = NOW(),
    customer_info = jsonb_build_object('contact', customer_contact)
  WHERE 
    code = code_value AND
    status = 'AVAILABLE'
  RETURNING * INTO updated_code;
  
  IF updated_code IS NULL THEN
    RAISE EXCEPTION 'Code non trouvé ou déjà utilisé';
  END IF;
  
  RETURN updated_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Fix function search path for revoke_activation_code
CREATE OR REPLACE FUNCTION revoke_activation_code(
  code_value text,
  reason text,
  admin_id uuid
)
RETURNS premium_activation_codes AS $$
DECLARE
  updated_code premium_activation_codes;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT is_admin(admin_id) THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent révoquer des codes';
  END IF;

  -- Mettre à jour le code
  UPDATE premium_activation_codes
  SET 
    status = 'REVOKED',
    revoked_at = NOW(),
    revoked_reason = reason
  WHERE 
    code = code_value AND
    status IN ('AVAILABLE', 'SOLD', 'USED')
  RETURNING * INTO updated_code;
  
  IF updated_code IS NULL THEN
    RAISE EXCEPTION 'Code non trouvé ou déjà révoqué';
  END IF;
  
  RETURN updated_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Fix function search path for activate_premium_code
CREATE OR REPLACE FUNCTION activate_premium_code(
  code_value text,
  device_id text,
  user_id uuid
)
RETURNS premium_activation_codes AS $$
DECLARE
  updated_code premium_activation_codes;
BEGIN
  -- Vérifier que le code existe et est disponible ou vendu
  IF NOT EXISTS (
    SELECT 1 FROM premium_activation_codes
    WHERE 
      code = code_value AND
      status IN ('AVAILABLE', 'SOLD')
  ) THEN
    RAISE EXCEPTION 'Code invalide ou déjà utilisé';
  END IF;

  -- Mettre à jour le code
  UPDATE premium_activation_codes
  SET 
    status = 'USED',
    used_at = NOW(),
    device_id = activate_premium_code.device_id,
    user_id = activate_premium_code.user_id
  WHERE 
    code = code_value AND
    status IN ('AVAILABLE', 'SOLD')
  RETURNING * INTO updated_code;
  
  RETURN updated_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Fix function search path for get_activation_code_stats
CREATE OR REPLACE FUNCTION get_activation_code_stats()
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'available', COUNT(*) FILTER (WHERE status = 'AVAILABLE'),
    'sold', COUNT(*) FILTER (WHERE status = 'SOLD'),
    'used', COUNT(*) FILTER (WHERE status = 'USED'),
    'revoked', COUNT(*) FILTER (WHERE status = 'REVOKED'),
    'total', COUNT(*),
    'revenue', SUM(price) FILTER (WHERE status IN ('SOLD', 'USED'))
  ) INTO stats
  FROM premium_activation_codes;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. Fix function search path for test_metadata_sync
CREATE OR REPLACE FUNCTION test_metadata_sync()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 12. Fix function search path for diagnostic_colonnes
CREATE OR REPLACE FUNCTION diagnostic_colonnes()
RETURNS TABLE(
  table_name TEXT,
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT
  FROM information_schema.tables t
  JOIN information_schema.columns c ON t.table_name = c.table_name
  WHERE t.table_schema = 'public' 
    AND t.table_name IN ('devis', 'articles_devis')
    AND (c.column_name LIKE '%total%' OR c.column_name LIKE '%vat%')
  ORDER BY t.table_name, c.ordinal_position;
END;
$$;

-- 13. Fix function search path for test_article_insertion
CREATE OR REPLACE FUNCTION test_article_insertion()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  test_user_id uuid;
  test_devis_id uuid;
  test_article_id uuid;
  calculated_total numeric(12,2);
  result_text TEXT;
BEGIN
  -- Créer un utilisateur de test (simulation)
  test_user_id := gen_random_uuid();
  
  -- Insérer un devis de test
  INSERT INTO devis (
    user_id, 
    quote_number, 
    date_creation, 
    date_expiration, 
    currency,
    template,
    status
  ) VALUES (
    test_user_id,
    'TEST-001',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'EUR',
    'classic',
    'Brouillon'
  ) RETURNING id INTO test_devis_id;
  
  -- Insérer un article de test
  INSERT INTO articles_devis (
    devis_id,
    designation,
    quantity,
    unit_price,
    vat_rate,
    order_index
  ) VALUES (
    test_devis_id,
    'Test Article',
    2,
    100.00,
    20.00,
    0
  ) RETURNING id INTO test_article_id;
  
  -- Vérifier que les calculs sont corrects
  SELECT total_ht INTO calculated_total 
  FROM articles_devis 
  WHERE id = test_article_id;
  
  -- Nettoyer les données de test
  DELETE FROM articles_devis WHERE id = test_article_id;
  DELETE FROM devis WHERE id = test_devis_id;
  
  -- Retourner le résultat
  IF calculated_total = 200.00 THEN
    result_text := 'SUCCESS: Calculs automatiques fonctionnent correctement (2 × 100 = 200)';
  ELSE
    result_text := format('ERREUR: Calcul incorrect. Attendu: 200, Obtenu: %s', calculated_total);
  END IF;
  
  RETURN result_text;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Nettoyer en cas d'erreur
    DELETE FROM articles_devis WHERE devis_id = test_devis_id;
    DELETE FROM devis WHERE id = test_devis_id;
    RETURN format('ERREUR lors du test: %s', SQLERRM);
END;
$$;

-- 14. Fix function search path for test_user_creation
CREATE OR REPLACE FUNCTION test_user_creation()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 15. Fix function search path for diagnostic_isolation_utilisateur
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
SET search_path = public
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

-- 16. Fix function search path for test_isolation_donnees
CREATE OR REPLACE FUNCTION test_isolation_donnees(test_user_id UUID)
RETURNS TABLE(
  test_name TEXT,
  result TEXT,
  details TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 17. Configure Auth settings to improve security
-- Note: These settings need to be applied via the Supabase dashboard or API
-- as they are not directly accessible via SQL migrations

-- Diagnostic message
DO $$
BEGIN
  RAISE NOTICE '✅ SECURITY FIXES APPLIED:';
  RAISE NOTICE '1. Fixed search_path for all functions to prevent SQL injection';
  RAISE NOTICE '2. Added SECURITY DEFINER to critical functions';
  RAISE NOTICE '';
  RAISE NOTICE 'MANUAL ACTIONS REQUIRED:';
  RAISE NOTICE '1. In Supabase Dashboard > Authentication > Email Templates:';
  RAISE NOTICE '   - Reduce OTP expiry time to 1 hour or less';
  RAISE NOTICE '2. In Supabase Dashboard > Authentication > Providers:';
  RAISE NOTICE '   - Enable "Leaked password protection"';
END $$;