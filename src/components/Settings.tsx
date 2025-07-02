import React, { useState, useRef, useEffect } from 'react';
import { Save, Upload, Building, MapPin, Phone, Mail, FileText, DollarSign, Check, AlertCircle, Loader2, PenTool, Image, Trash2, Download, User, Palette, Bell, Lock, Globe } from 'lucide-react';
import { CURRENCIES, type Currency } from '../types/currency';
import { profileService } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { validatePassword } from '../utils/sanitizer';
import CompanySettings from './CompanySettings';
import NotificationSettings from './NotificationSettings';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    photo: null as string | null
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // États pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const tabs = [
    { id: 'profile', name: 'Profil utilisateur', icon: User },
    { id: 'company', name: 'Entreprise', icon: Building },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'appearance', name: 'Apparence', icon: Palette },
    { id: 'security', name: 'Sécurité', icon: Lock },
    { id: 'language', name: 'Langue', icon: Globe },
  ];

  // Vérification périodique du statut Premium et quota
  useEffect(() => {
    const loadUserInfo = async () => {
      if (!user) {
        console.log('⏳ SETTINGS - En attente de l\'utilisateur...');
        return;
      }

      setIsLoading(true);
      console.log('👤 SETTINGS - Chargement des informations pour User ID:', user.id);

      try {
        const { data, error } = await profileService.getProfile();
        
        if (error && error.code !== 'PGRST116') {
          console.error('❌ SETTINGS - Erreur chargement profil:', error);
        }

        const userName = data?.company_name || 
                        user.user_metadata?.full_name || 
                        user.email?.split('@')[0] || 
                        'Utilisateur';
        
        const userEmail = user.email || 'email@example.com';
        const userPhone = data?.company_phone || '';
        const userPhoto = data?.company_logo || null;

        setUserInfo({
          name: userName,
          email: userEmail,
          phone: userPhone,
          position: 'Utilisateur',
          photo: userPhoto
        });

        if (userPhoto) {
          setPhotoPreview(userPhoto);
        }

      } catch (error) {
        console.error('❌ SETTINGS - Exception chargement utilisateur:', error);
        
        setUserInfo({
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur',
          email: user.email || 'email@example.com',
          phone: '',
          position: 'Utilisateur',
          photo: null
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserInfo();
  }, [user]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoError('');
    setIsUploading(true);

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Veuillez sélectionner un fichier image (JPG, PNG, GIF)');
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error('La taille du fichier ne doit pas dépasser 2MB');
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotoPreview(result);
        setUserInfo(prev => ({ ...prev, photo: result }));
        console.log('📸 SETTINGS - Photo mise à jour dans le state');
      };
      reader.readAsDataURL(file);

    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Erreur lors du chargement de l\'image');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setUserInfo(prev => ({ ...prev, photo: null }));
    setPhotoError('');
    console.log('🗑️ SETTINGS - Photo supprimée du state');
  };

  // Gestion du changement de mot de passe
  const handlePasswordChange = async () => {
    // Réinitialiser les états
    setPasswordErrors({});
    setPasswordSuccess(false);
    
    // Validation
    const errors: Record<string, string> = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Le mot de passe actuel est requis';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'Le nouveau mot de passe est requis';
    } else {
      const validation = validatePassword(passwordData.newPassword);
      if (!validation.isValid) {
        errors.newPassword = validation.errors[0] || 'Mot de passe invalide';
      }
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      console.log('🔐 SETTINGS - Tentative de changement de mot de passe');
      
      // Vérifier d'abord le mot de passe actuel
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordData.currentPassword
      });
      
      if (signInError) {
        console.error('❌ SETTINGS - Mot de passe actuel incorrect:', signInError);
        setPasswordErrors({
          currentPassword: 'Mot de passe actuel incorrect'
        });
        return;
      }
      
      // Changer le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      
      if (updateError) {
        console.error('❌ SETTINGS - Erreur changement mot de passe:', updateError);
        setPasswordErrors({
          general: 'Erreur lors du changement de mot de passe: ' + updateError.message
        });
        return;
      }
      
      console.log('✅ SETTINGS - Mot de passe changé avec succès');
      setPasswordSuccess(true);
      
      // Réinitialiser le formulaire
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (error) {
      console.error('❌ SETTINGS - Exception changement mot de passe:', error);
      setPasswordErrors({
        general: 'Une erreur est survenue lors du changement de mot de passe'
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) {
      setErrors({ general: 'Utilisateur non connecté' });
      return;
    }

    setIsSaving(true);
    setErrors({});
    console.log('💾 SETTINGS - Sauvegarde du profil pour User ID:', user.id);

    try {
      const profileData = {
        company_name: userInfo.name || 'Mon Entreprise',
        company_email: userInfo.email,
        company_phone: userInfo.phone,
        company_logo: userInfo.photo || '',
        updated_at: new Date().toISOString()
      };

      console.log('📝 SETTINGS - Données à sauvegarder:', Object.keys(profileData));

      const { data: existingProfile } = await profileService.getProfile();

      let result;
      if (existingProfile) {
        console.log('🔄 SETTINGS - Mise à jour du profil existant');
        result = await profileService.updateProfile(profileData);
      } else {
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
        setErrors({ general: 'Erreur lors de la sauvegarde: ' + result.error.message });
        return;
      }

      console.log('✅ SETTINGS - Profil sauvegardé avec succès');
      setShowSuccess(true);
      
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (error) {
      console.error('❌ SETTINGS - Exception sauvegarde:', error);
      setErrors({ general: 'Une erreur est survenue lors de la sauvegarde' });
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

  const renderSecuritySettings = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Sécurité</h3>
        
        {/* Messages de statut */}
        {passwordErrors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <p className="text-red-800">{passwordErrors.general}</p>
          </div>
        )}
        
        {passwordSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <Check className="h-5 w-5 text-green-600 mr-3" />
            <p className="text-green-800">Mot de passe modifié avec succès !</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                passwordErrors.currentPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                passwordErrors.newPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {passwordErrors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                passwordErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {passwordErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
            )}
          </div>
          
          <button
            onClick={handlePasswordChange}
            disabled={isChangingPassword}
            className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Modification en cours...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Changer le mot de passe
              </>
            )}
          </button>
        </div>
        
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Conseils de sécurité</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Utilisez un mot de passe unique pour chaque service</li>
            <li>• Incluez des caractères spéciaux et des chiffres</li>
            <li>• Évitez d'utiliser des informations personnelles facilement devinables</li>
            <li>• Changez régulièrement votre mot de passe</li>
          </ul>
        </div>
      </div>
    );
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
      <div className="space-y-6 sm:space-y-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <Check className="h-5 w-5 text-green-600 mr-3" />
            <p className="text-green-800 font-medium">Profil sauvegardé avec succès dans Supabase !</p>
          </div>
        )}

        {/* Error Message */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <p className="text-red-800">{errors.general}</p>
          </div>
        )}

        {/* User Info Display */}
        {user && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Informations de connexion</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div><strong>User ID:</strong> <span className="font-mono text-xs">{user.id}</span></div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Dernière connexion:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('fr-FR') : 'N/A'}</div>
            </div>
          </div>
        )}

        {/* Photo de profil */}
        <div className="border-b border-gray-200 pb-6 sm:pb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 sm:mb-6">Photo de profil</h3>
          <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="flex-shrink-0 relative mx-auto sm:mx-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                {photoPreview || userInfo.photo ? (
                  <img 
                    src={photoPreview || userInfo.photo || ''} 
                    alt="Photo de profil" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-lg sm:text-2xl font-medium">
                    {getInitials(userInfo.name || 'U')}
                  </span>
                )}
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <label
                  htmlFor="photo-upload"
                  className={`inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Chargement...' : 'Changer la photo'}
                </label>
                
                {(photoPreview || userInfo.photo) && (
                  <button
                    onClick={removePhoto}
                    disabled={isUploading}
                    className="inline-flex items-center justify-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
              <input
                type="text"
                value={userInfo.name}
                onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre nom complet"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={userInfo.email}
                onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
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
                value={userInfo.phone}
                onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+33 1 23 45 67 89"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Poste</label>
              <input
                type="text"
                value={userInfo.position}
                onChange={(e) => setUserInfo({...userInfo, position: e.target.value})}
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
      case 'notifications':
        return <NotificationSettings />;
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
      case 'security':
        return renderSecuritySettings();
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
          <div className="px-4 sm:px-6 py-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Paramètres</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Gérez vos préférences et paramètres d'application</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Sidebar - Responsive */}
          <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-200">
            <nav className="p-4 space-y-1 overflow-x-auto lg:overflow-x-visible">
              <div className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1 min-w-max lg:min-w-0">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-3 py-2 text-left rounded-lg transition-colors duration-200 whitespace-nowrap lg:w-full ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="text-sm font-medium">{tab.name}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-6">
            {renderTabContent()}
            
            {/* Save Button - Only show for profile tab */}
            {activeTab === 'profile' && (
              <div className="mt-6 sm:mt-8 pt-6 border-t border-gray-200">
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving || isLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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

            {/* Save Button - For other tabs (non-company, non-profile, non-security, non-notifications) */}
            {activeTab !== 'company' && activeTab !== 'profile' && activeTab !== 'security' && activeTab !== 'notifications' && (
              <div className="mt-6 sm:mt-8 pt-6 border-t border-gray-200">
                <button className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
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