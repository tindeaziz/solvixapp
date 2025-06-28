/*
  # Création du schéma complet de la base de données Solvix

  1. Nouvelles Tables
    - `profiles` : Informations entreprise (nom, adresse, logo, signature, etc.)
    - `clients` : Stockage des informations clients
    - `devis` : Sauvegarde de tous les devis créés
    - `articles_devis` : Lignes de produits/services des devis

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques pour que chaque utilisateur ne voit que ses propres données
    - Liaison des données aux utilisateurs authentifiés

  3. Fonctionnalités
    - Gestion des signatures et logos (stockage base64)
    - Historique complet des devis
    - Relations entre tables avec contraintes
*/

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des profils entreprise (un par utilisateur)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL DEFAULT '',
  company_address text DEFAULT '',
  company_phone text DEFAULT '',
  company_email text DEFAULT '',
  company_rccm text DEFAULT '',
  company_ncc text DEFAULT '',
  company_logo text DEFAULT '', -- Base64 ou URL
  company_signature text DEFAULT '', -- Base64 ou URL
  signature_type text DEFAULT 'drawn', -- 'drawn' | 'uploaded'
  vat_enabled boolean DEFAULT true,
  vat_rate numeric(5,2) DEFAULT 20.00,
  default_currency text DEFAULT 'EUR',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Table des clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  company text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des devis
CREATE TABLE IF NOT EXISTS devis (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  quote_number text NOT NULL,
  date_creation date NOT NULL DEFAULT CURRENT_DATE,
  date_expiration date NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  template text NOT NULL DEFAULT 'classic',
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'Brouillon', -- 'Brouillon', 'Envoyé', 'En attente', 'Accepté', 'Refusé'
  subtotal_ht numeric(12,2) DEFAULT 0,
  total_vat numeric(12,2) DEFAULT 0,
  total_ttc numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, quote_number)
);

-- Table des articles/lignes de devis
CREATE TABLE IF NOT EXISTS articles_devis (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  devis_id uuid REFERENCES devis(id) ON DELETE CASCADE NOT NULL,
  designation text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  vat_rate numeric(5,2) NOT NULL DEFAULT 20.00,
  total_ht numeric(12,2) NOT NULL DEFAULT 0,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_devis_user_id ON devis(user_id);
CREATE INDEX IF NOT EXISTS idx_devis_client_id ON devis(client_id);
CREATE INDEX IF NOT EXISTS idx_devis_status ON devis(status);
CREATE INDEX IF NOT EXISTS idx_devis_date_creation ON devis(date_creation);
CREATE INDEX IF NOT EXISTS idx_articles_devis_id ON articles_devis(devis_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devis_updated_at BEFORE UPDATE ON devis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer automatiquement les totaux des articles
CREATE OR REPLACE FUNCTION calculate_article_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_ht = NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour calculer automatiquement le total HT des articles
CREATE TRIGGER calculate_article_total_trigger 
  BEFORE INSERT OR UPDATE ON articles_devis 
  FOR EACH ROW EXECUTE FUNCTION calculate_article_total();

-- Fonction pour recalculer les totaux du devis
CREATE OR REPLACE FUNCTION update_devis_totals()
RETURNS TRIGGER AS $$
DECLARE
  devis_record RECORD;
  subtotal numeric(12,2);
  total_vat numeric(12,2);
  total_ttc numeric(12,2);
BEGIN
  -- Récupérer l'ID du devis (que ce soit INSERT, UPDATE ou DELETE)
  IF TG_OP = 'DELETE' THEN
    devis_record := OLD;
  ELSE
    devis_record := NEW;
  END IF;

  -- Calculer les totaux
  SELECT 
    COALESCE(SUM(total_ht), 0),
    COALESCE(SUM(total_ht * vat_rate / 100), 0)
  INTO subtotal, total_vat
  FROM articles_devis 
  WHERE devis_id = devis_record.devis_id;

  total_ttc := subtotal + total_vat;

  -- Mettre à jour le devis
  UPDATE devis 
  SET 
    subtotal_ht = subtotal,
    total_vat = total_vat,
    total_ttc = total_ttc,
    updated_at = now()
  WHERE id = devis_record.devis_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers pour recalculer les totaux du devis
CREATE TRIGGER update_devis_totals_on_article_change
  AFTER INSERT OR UPDATE OR DELETE ON articles_devis
  FOR EACH ROW EXECUTE FUNCTION update_devis_totals();

-- Enable Row Level Security sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles_devis ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour clients
CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" ON clients
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour devis
CREATE POLICY "Users can view own devis" ON devis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devis" ON devis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devis" ON devis
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devis" ON devis
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour articles_devis
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

-- Fonction pour créer un profil par défaut lors de l'inscription
CREATE OR REPLACE FUNCTION create_default_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, company_name, company_email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mon Entreprise'),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour créer automatiquement un profil lors de l'inscription
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_profile();