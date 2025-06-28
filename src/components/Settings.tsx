import React, { useState, useEffect } from 'react';
import { Save, User, Building, Palette, Bell, Lock, Globe, Upload, Check, AlertCircle, Loader2 } from 'lucide-react';
import CompanySettings from './CompanySettings';
import { useAuth } from '../hooks/useAuth';
import { profileService } from '../lib/supabase';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    photo: null as string | null
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const tabs = [
    { id: 'profile', name: 'Profil utilisateur', icon: User },
    { id: 'company', name: 'Entreprise', icon: Building },
    { id: 'appearance', name: 'Apparence', icon: Palette },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Sécurité', icon: Lock },
    { id: 'language', name: 'Langue', icon: Globe },
  ];

  // Charger les données du profil au montage
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) {
        console.log('⏳ SETTINGS - En attente de l\'utilisateur...');
        return;
      }

      setIsLoading(true);
      console.log('🔍 SETTINGS - Chargement du profil pour User ID:', user.id);

      try {
        // Charger les données depuis Supabase
        const { data, error } = await profileService.getProfile();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = pas de données trouvées
          console.error('❌ SETTINGS - Erreur chargement profil:', error);
          setSaveError('Erreur lors du chargement du profil');
          return;
        }

        if (data) {
          console.log('✅ SETTINGS - Profil chargé depuis Supabase');
          setProfile({
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            email: user.email || '',
            phone: data.company_phone || '',
            position: 'Utilisateur',
            photo: data.company_logo || null
          });
          
          if (data.company_logo) {
            setPhotoPreview(data.company_logo);
          }
        } else {
          console.log('📝 SETTINGS - Nouveau profil, utilisation des données utilisateur');
          // Nouveau profil, utiliser les données de l'utilisateur
          setProfile({
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            email: user.email || '',
            phone: '',
            position: 'Utilisateur',
            photo: null
          });
        }
      } catch (error) {
        console.error('❌ SETTINGS - Exception chargement profil:', error);
        setSaveError('Erreur lors du chargement du profil');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [user]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoError('');
    setIsUploading(true);

    try {
      // Validation du fichier
      if (!file.type.startsWith('image/')) {
        throw new Error('Veuillez sélectionner un fichier image (JPG, PNG, GIF)');
      }

      if (file.size > 2 * 1024 * 1024) { // 2MB
        throw new Error('La taille du fichier ne doit pas dépasser 2MB');
      }

      // Simulation d'un délai d'upload
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotoPreview(result);
        setProfile(prev => ({ ...prev, photo: result }));
        console.log('📸 SETTINGS - Photo mise à jour dans le state');
      };
      reader.readAsDataURL(file);

    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Erreur lors du chargement de l\'image');
    } finally {
      setIsUploading(false);
      // Reset input value pour permettre de sélectionner le même fichier
      event.target.value = '';
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setProfile(prev => ({ ...prev, photo: null }));
    setPhotoError('');
    console.log('🗑️ SETTINGS - Photo supprimée du state');
  };

  const handleSaveProfile = async () => {
    if (!user) {
      setSaveError('Utilisateur non connecté');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    console.log('💾 SETTINGS - Sauvegarde du profil pour User ID:', user.id);

    try {
      // Préparer les données à sauvegarder
      const profileData = {
        company_name: profile.name || 'Mon Entreprise',
        company_email: profile.email,
        company_phone: profile.phone,
        company_logo: profile.photo || '',
        updated_at: new Date().toISOString()
      };

      console.log('📝 SETTINGS - Données à sauvegarder:', Object.keys(profileData));

      // Vérifier si un profil existe déjà
      const { data: existingProfile } = await profileService.getProfile();

      let result;
      if (existingProfile) {
        // Mettre à jour le profil existant
        console.log('🔄 SETTINGS - Mise à jour du profil existant');
        result = await profileService.updateProfile(profileData);
      } else {
        // Créer un nouveau profil
        console.log('🆕 SETTINGS - Création d\'un nouveau profil');
        result = await profileService.createProfile({
          user_id: user.id,
          ...profileData,
          company_address: '',
          company_rccm: '',
          company_ncc: '',
          company_signature: '',
          signature_type: 'drawn' as const,
          vat_enabled: true,
          vat_rate: 20,
          default_currency: 'EUR',
          created_at: new Date().toISOString()
        });
      }

      if (result.error) {
        console.error('❌ SETTINGS - Erreur sauvegarde:', result.error);
        setSaveError('Erreur lors de la sauvegarde: ' + result.error.message);
        return;
      }

      console.log('✅ SETTINGS - Profil sauvegardé avec succès');
      setShowSuccess(true);
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (error) {
      console.error('❌ SETTINGS - Exception sauvegarde:', error);
      setSaveError('Une erreur est survenue lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderProfileSettings = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-solvix-blue border-t-transparent mx-auto mb-4"></div>
            <p className="text-solvix-dark font-inter">Chargement du profil...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <Check className="h-5 w-5 text-green-600 mr-3" />
            <p className="text-green-800 font-medium">Profil sauvegardé avec succès dans Supabase !</p>
          </div>
        )}

        {/* Error Message */}
        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <p className="text-red-800">{saveError}</p>
          </div>
        )}

        {/* User Info Display */}
        {user && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Informations de connexion</h4>
            <div className="text-sm text-blue-800">
              <div><strong>User ID:</strong> {user.id}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Dernière connexion:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('fr-FR') : 'N/A'}</div>
            </div>
          </div>
        )}

        {/* Photo de profil */}
        <div className="border-b border-gray-200 pb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Photo de profil</h3>
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0 relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                {photoPreview || profile.photo ? (
                  <img 
                    src={photoPreview || profile.photo || ''} 
                    alt="Photo de profil" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-2xl font-medium">
                    {getInitials(profile.name || 'U')}
                  </span>
                )}
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap gap-3 mb-3">
                <label
                  htmlFor="photo-upload"
                  className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Chargement...' : 'Changer la photo'}
                </label>
                
                {(photoPreview || profile.photo) && (
                  <button
                    onClick={removePhoto}
                    disabled={isUploading}
                    className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={isUploading}
              />
              
              <p className="text-sm text-gray-500 mb-2">
                JPG, PNG ou GIF. Taille maximale : 2MB
              </p>
              
              {photoError && (
                <div className="flex items-center text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {photoError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Informations personnelles */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informations personnelles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre nom complet"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                placeholder="votre@email.com"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié ici</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+33 1 23 45 67 89"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Poste</label>
              <input
                type="text"
                value={profile.position}
                onChange={(e) => setProfile({...profile, position: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre poste"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSettings();
      case 'company':
        return <CompanySettings />;
      case 'appearance':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Paramètres d'apparence</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Thème</label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input type="radio" name="theme" value="light" className="mr-3" defaultChecked />
                  <span>Clair</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="theme" value="dark" className="mr-3" />
                  <span>Sombre</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="theme" value="auto" className="mr-3" />
                  <span>Automatique</span>
                </label>
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Paramètres de notification</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Notifications par email</h4>
                  <p className="text-sm text-gray-500">Recevoir des notifications par email</p>
                </div>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Nouveaux devis</h4>
                  <p className="text-sm text-gray-500">Notification lors de la création d'un devis</p>
                </div>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Devis acceptés</h4>
                  <p className="text-sm text-gray-500">Notification lors de l'acceptation d'un devis</p>
                </div>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Sécurité</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        );
      case 'language':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Langue et région</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Langue</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fuseau horaire</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                <option value="Europe/London">Europe/London (GMT+0)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
              </select>
            </div>
          </div>
        );
      default:
        return renderProfileSettings();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
            <p className="text-gray-600 mt-1">Gérez vos préférences et paramètres d'application</p>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200">
            <nav className="p-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-3 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {renderTabContent()}
            
            {/* Save Button - Only show for profile tab */}
            {activeTab === 'profile' && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving || isLoading}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sauvegarde en cours...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder les modifications
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Save Button - For other tabs (non-company) */}
            {activeTab !== 'company' && activeTab !== 'profile' && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder les modifications
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;