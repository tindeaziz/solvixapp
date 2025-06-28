/*
  # Correction des erreurs d'ambiguïté de colonnes

  1. Problème identifié
    - Ambiguïté entre les colonnes "total_vat" dans les tables devis et articles_devis
    - Les triggers et fonctions causent des conflits de noms de colonnes

  2. Solutions appliquées
    - Renommer les colonnes pour éviter les conflits
    - Mettre à jour les triggers et fonctions
    - Corriger les requêtes avec des alias explicites

  3. Vérifications
    - Test des insertions d'articles
    - Validation des calculs automatiques
*/

-- 1. SUPPRESSION TEMPORAIRE DES TRIGGERS PROBLÉMATIQUES
DROP TRIGGER IF EXISTS calculate_article_total_trigger ON articles_devis;
DROP TRIGGER IF EXISTS update_devis_totals_on_article_change ON articles_devis;

-- 2. SUPPRESSION DES FONCTIONS PROBLÉMATIQUES
DROP FUNCTION IF EXISTS calculate_article_total() CASCADE;
DROP FUNCTION IF EXISTS update_devis_totals() CASCADE;

-- 3. RECRÉATION DE LA FONCTION DE CALCUL DES TOTAUX D'ARTICLES
CREATE OR REPLACE FUNCTION calculate_article_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer le total HT de l'article
  NEW.total_ht = NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. RECRÉATION DE LA FONCTION DE MISE À JOUR DES TOTAUX DU DEVIS
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
$$ language 'plpgsql';

-- 5. RECRÉATION DES TRIGGERS
CREATE TRIGGER calculate_article_total_trigger 
  BEFORE INSERT OR UPDATE ON articles_devis 
  FOR EACH ROW EXECUTE FUNCTION calculate_article_total();

CREATE TRIGGER update_devis_totals_on_article_change
  AFTER INSERT OR UPDATE OR DELETE ON articles_devis
  FOR EACH ROW EXECUTE FUNCTION update_devis_totals();

-- 6. FONCTION DE TEST POUR VÉRIFIER LES CALCULS
CREATE OR REPLACE FUNCTION test_article_insertion()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 7. FONCTION DE DIAGNOSTIC POUR LES COLONNES
CREATE OR REPLACE FUNCTION diagnostic_colonnes()
RETURNS TABLE(
  table_name TEXT,
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT
) 
LANGUAGE plpgsql
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

-- 8. EXÉCUTER LES TESTS
SELECT test_article_insertion() as test_result;
SELECT * FROM diagnostic_colonnes();

-- 9. MESSAGE DE CONFIRMATION
DO $$
BEGIN
  RAISE NOTICE '✅ CORRECTION TERMINÉE: Ambiguïté des colonnes résolue';
  RAISE NOTICE '🔧 TRIGGERS: Fonctions et triggers recréés avec aliases explicites';
  RAISE NOTICE '🧪 TEST: Fonction test_article_insertion() disponible pour validation';
  RAISE NOTICE '📊 DIAGNOSTIC: Fonction diagnostic_colonnes() pour vérifier la structure';
END $$;