/*
  # Création de la table des préférences de notification utilisateur

  1. Nouvelles Tables
    - `user_notification_preferences` : Stockage des préférences de notification par utilisateur

  2. Sécurité
    - Enable RLS sur la table
    - Politiques pour que chaque utilisateur ne gère que ses propres préférences
*/

-- Table pour stocker les préférences de notification
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_notifications BOOLEAN DEFAULT true,
  new_quotes_notifications BOOLEAN DEFAULT true,
  accepted_quotes_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activer RLS
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Politique de sécurité
CREATE POLICY "Users can manage own notification preferences" ON user_notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_notification_prefs_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer des préférences par défaut lors de l'inscription
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour créer automatiquement des préférences lors de l'inscription
CREATE TRIGGER create_notification_prefs_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();