-- Table des codes d'activation premium
CREATE TABLE IF NOT EXISTS premium_activation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'SOLD', 'USED', 'REVOKED'
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  sold_at timestamptz,
  used_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  customer_info jsonb DEFAULT '{}'::jsonb, -- Stocke les informations client (nom, contact, etc.)
  device_id text, -- ID de l'appareil qui a utilisé le code
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Utilisateur qui a activé le code
  price numeric(10,2) DEFAULT 5000, -- Prix du code en FCFA
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL -- Administrateur qui a créé le code
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_premium_codes_status ON premium_activation_codes(status);
CREATE INDEX IF NOT EXISTS idx_premium_codes_user_id ON premium_activation_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_codes_created_by ON premium_activation_codes(created_by);

-- Enable Row Level Security
ALTER TABLE premium_activation_codes ENABLE ROW LEVEL SECURITY;

-- Fonction pour vérifier si un utilisateur est administrateur
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Pour l'instant, on considère que l'utilisateur avec l'email 'admin@solvix.com' est admin
  -- Dans une implémentation réelle, vous auriez une table de rôles ou une vérification plus robuste
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id AND email = 'admin@solvix.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politiques RLS pour premium_activation_codes
-- Les administrateurs peuvent tout voir
CREATE POLICY "Admins can view all codes" ON premium_activation_codes
  FOR SELECT USING (is_admin(auth.uid()));

-- Les utilisateurs peuvent voir les codes qu'ils ont activés
CREATE POLICY "Users can view own codes" ON premium_activation_codes
  FOR SELECT USING (auth.uid() = user_id);

-- Les administrateurs peuvent insérer des codes
CREATE POLICY "Admins can insert codes" ON premium_activation_codes
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Les administrateurs peuvent mettre à jour tous les codes
CREATE POLICY "Admins can update all codes" ON premium_activation_codes
  FOR UPDATE USING (is_admin(auth.uid()));

-- Les utilisateurs peuvent mettre à jour les codes qu'ils activent
-- Note: Removed the NEW reference which was causing the error
CREATE POLICY "Users can update own codes" ON premium_activation_codes
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    status IN ('AVAILABLE', 'SOLD')
  );

-- Les administrateurs peuvent supprimer des codes
CREATE POLICY "Admins can delete codes" ON premium_activation_codes
  FOR DELETE USING (is_admin(auth.uid()));

-- Fonction pour générer un code d'activation aléatoire
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
$$ LANGUAGE plpgsql;

-- Fonction pour générer un lot de codes d'activation
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer un code comme vendu
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour révoquer un code
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour activer un code premium
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir des statistiques sur les codes
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
$$ LANGUAGE plpgsql SECURITY DEFINER;