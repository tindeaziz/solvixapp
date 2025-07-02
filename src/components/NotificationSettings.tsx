import React, { useState, useEffect } from 'react';
import { Bell, Check, AlertCircle, Loader2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    new_quotes_notifications: true,
    accepted_quotes_notifications: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) {
      console.log('⏳ NOTIFICATION_SETTINGS - En attente de l\'utilisateur...');
      return;
    }

    setLoading(true);
    setError('');
    console.log('🔍 NOTIFICATION_SETTINGS - Chargement des préférences pour User ID:', user.id);

    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ NOTIFICATION_SETTINGS - Erreur chargement préférences:', error);
        setError('Erreur lors du chargement des préférences');
        return;
      }

      if (data) {
        console.log('✅ NOTIFICATION_SETTINGS - Préférences chargées');
        setPreferences({
          email_notifications: data.email_notifications,
          new_quotes_notifications: data.new_quotes_notifications,
          accepted_quotes_notifications: data.accepted_quotes_notifications
        });
      } else {
        console.log('🆕 NOTIFICATION_SETTINGS - Création des préférences par défaut');
        // Créer des préférences par défaut
        const { error: insertError } = await supabase
          .from('user_notification_preferences')
          .insert({
            user_id: user.id,
            email_notifications: true,
            new_quotes_notifications: true,
            accepted_quotes_notifications: true
          });

        if (insertError) {
          console.error('❌ NOTIFICATION_SETTINGS - Erreur création préférences:', insertError);
          setError('Erreur lors de la création des préférences');
        }
      }
    } catch (error) {
      console.error('❌ NOTIFICATION_SETTINGS - Exception chargement préférences:', error);
      setError('Une erreur est survenue lors du chargement des préférences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);
    console.log('💾 NOTIFICATION_SETTINGS - Sauvegarde des préférences pour User ID:', user.id);

    try {
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: user.id,
          email_notifications: preferences.email_notifications,
          new_quotes_notifications: preferences.new_quotes_notifications,
          accepted_quotes_notifications: preferences.accepted_quotes_notifications,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('❌ NOTIFICATION_SETTINGS - Erreur sauvegarde préférences:', error);
        setError('Erreur lors de la sauvegarde des préférences');
        return;
      }

      console.log('✅ NOTIFICATION_SETTINGS - Préférences sauvegardées avec succès');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('❌ NOTIFICATION_SETTINGS - Exception sauvegarde préférences:', error);
      setError('Une erreur est survenue lors de la sauvegarde des préférences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-solvix-blue border-t-transparent mx-auto mb-4"></div>
            <p className="text-solvix-dark font-inter">Chargement des préférences de notification...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Paramètres de notification</h1>
              <p className="text-gray-600 text-sm sm:text-base">Configurez vos préférences de notification</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mx-4 sm:mx-6 mt-4 sm:mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <Check className="h-5 w-5 text-green-600 mr-3" />
            <p className="text-green-800 font-medium">Préférences sauvegardées avec succès !</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-4 sm:mx-6 mt-4 sm:mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="p-4 sm:p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Activer les notifications par email</h4>
                <p className="text-sm text-gray-500">Recevoir des notifications par email pour les événements importants</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_notifications}
                  onChange={(e) => setPreferences(prev => ({ ...prev, email_notifications: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {preferences.email_notifications && (
              <div className="ml-0 sm:ml-4 space-y-4">
                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Nouveaux devis</h4>
                    <p className="text-sm text-gray-500">Notification lors de la création d'un devis</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.new_quotes_notifications}
                      onChange={(e) => setPreferences(prev => ({ ...prev, new_quotes_notifications: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Devis acceptés</h4>
                    <p className="text-sm text-gray-500">Notification lors de l'acceptation d'un devis</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.accepted_quotes_notifications}
                      onChange={(e) => setPreferences(prev => ({ ...prev, accepted_quotes_notifications: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">À propos des notifications</h4>
            <p className="text-sm text-blue-800">
              Les notifications vous permettent de rester informé des événements importants concernant vos devis. 
              Vous pouvez personnaliser les types de notifications que vous souhaitez recevoir.
            </p>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              onClick={savePreferences}
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Sauvegarde en cours...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Sauvegarder les préférences
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;