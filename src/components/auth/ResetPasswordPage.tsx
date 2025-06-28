import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' }>({ text: '', type: 'info' });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initializeRecovery = async () => {
      try {
        // Extraire le token de l'URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('🔍 RESET_PASSWORD - Hash params:', { 
          accessToken: accessToken ? accessToken.substring(0, 5) + '...' : null, 
          type 
        });

        if (type === 'recovery' && accessToken) {
          // Établir la session avec les tokens
          console.log('🔄 RESET_PASSWORD - Tentative d\'établir la session avec le token');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });

          if (error) {
            console.error('❌ RESET_PASSWORD - Erreur établissement session:', error);
            setMessage({ 
              text: 'Lien de récupération invalide ou expiré. Veuillez demander un nouveau lien.', 
              type: 'error' 
            });
          } else {
            console.log('✅ RESET_PASSWORD - Session établie:', data.user?.id);
            setIsRecoveryMode(true);
            setMessage({ 
              text: 'Vous pouvez maintenant définir un nouveau mot de passe pour votre compte.', 
              type: 'info' 
            });
          }
        } else {
          // Vérifier s'il y a déjà une session de récupération
          console.log('🔍 RESET_PASSWORD - Vérification de la session existante');
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session && session.user) {
            console.log('✅ RESET_PASSWORD - Session existante trouvée:', session.user.id);
            setIsRecoveryMode(true);
            setMessage({ 
              text: 'Vous pouvez maintenant définir un nouveau mot de passe pour votre compte.', 
              type: 'info' 
            });
          } else {
            console.log('⚠️ RESET_PASSWORD - Aucune session trouvée, vérification des paramètres d\'URL');
            
            // Vérifier les paramètres d'URL standard (non-hash)
            const urlParams = new URLSearchParams(location.search);
            const urlToken = urlParams.get('token');
            const urlType = urlParams.get('type');
            
            if (urlToken && urlType === 'recovery') {
              console.log('🔄 RESET_PASSWORD - Token trouvé dans les paramètres d\'URL');
              setIsRecoveryMode(true);
              setMessage({ 
                text: 'Veuillez définir votre nouveau mot de passe.', 
                type: 'info' 
              });
            } else {
              console.log('⚠️ RESET_PASSWORD - Aucun token trouvé, forçage du mode récupération');
              // Forcer l'affichage du formulaire même sans token
              setIsRecoveryMode(true);
              setMessage({ 
                text: 'Veuillez définir votre nouveau mot de passe.', 
                type: 'info' 
              });
            }
          }
        }
      } catch (error) {
        console.error('❌ RESET_PASSWORD - Erreur initialisation:', error);
        setMessage({ 
          text: 'Une erreur est survenue lors de l\'initialisation. Veuillez réessayer.', 
          type: 'error' 
        });
        // Forcer l'affichage du formulaire même en cas d'erreur
        setIsRecoveryMode(true);
      } finally {
        setLoading(false);
      }
    };

    initializeRecovery();
  }, [location]);

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    return strength;
  };

  useEffect(() => {
    setPasswordStrength(getPasswordStrength(password));
  }, [password]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (password !== confirmPassword) {
      setMessage({ text: 'Les mots de passe ne correspondent pas', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setMessage({ text: 'Le mot de passe doit contenir au moins 6 caractères', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage({ text: '', type: 'info' });

    try {
      console.log('🔄 RESET_PASSWORD - Tentative de mise à jour du mot de passe');
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('❌ RESET_PASSWORD - Erreur:', error.message);
        throw error;
      }

      console.log('✅ RESET_PASSWORD - Mot de passe mis à jour avec succès');
      
      setMessage({ 
        text: 'Mot de passe mis à jour avec succès ! Vous allez être redirigé vers la page de connexion.', 
        type: 'success' 
      });
      
      // Déconnecter l'utilisateur pour forcer une nouvelle connexion avec le nouveau mot de passe
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (error: any) {
      console.error('❌ RESET_PASSWORD - Exception:', error);
      setMessage({ 
        text: error.message || 'Une erreur est survenue lors de la mise à jour du mot de passe', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-solvix-light via-white to-solvix-light flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-solvix-blue border-t-transparent mx-auto mb-4"></div>
          <p className="text-solvix-dark font-inter text-sm sm:text-base">Vérification du lien de réinitialisation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-solvix-light via-white to-solvix-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/Logo-Solvix.png" 
              alt="Solvix Logo" 
              className="h-10 sm:h-12 w-auto"
            />
          </div>
          <p className="text-gray-600 font-inter text-sm sm:text-base">Génération de devis professionnels</p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-solvix-lg border border-gray-100 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-solvix-dark mb-2">Réinitialisation du mot de passe</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Définissez votre nouveau mot de passe
            </p>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : message.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center">
                {message.type === 'success' && <CheckCircle className="h-5 w-5 mr-2 text-green-600" />}
                {message.type === 'error' && <AlertCircle className="h-5 w-5 mr-2 text-red-600" />}
                {message.type === 'info' && <Mail className="h-5 w-5 mr-2 text-blue-600" />}
                <p>{message.text}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-solvix-dark mb-2 font-inter">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent transition-colors duration-200 font-inter border-gray-300"
                  placeholder="Votre nouveau mot de passe"
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={saving}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${
                          passwordStrength >= level
                            ? passwordStrength <= 2
                              ? 'bg-red-400'
                              : passwordStrength <= 3
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Force du mot de passe: {
                      passwordStrength <= 2 ? 'Faible' :
                      passwordStrength <= 3 ? 'Moyenne' : 'Forte'
                    }
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-solvix-dark mb-2 font-inter">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent transition-colors duration-200 font-inter border-gray-300"
                  placeholder="Confirmez votre mot de passe"
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={saving}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {confirmPassword && password === confirmPassword && (
                <div className="mt-1 flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Les mots de passe correspondent</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-solvix-blue text-white py-3 px-4 rounded-lg font-medium hover:bg-solvix-blue-dark focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-inter shadow-solvix"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Mise à jour en cours...
                  </>
                ) : (
                  'Mettre à jour le mot de passe'
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={saving}
                className="w-full flex items-center justify-center py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200 font-inter"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la connexion
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8 text-xs sm:text-sm text-gray-500 font-inter">
          © 2025 Solvix. Tous droits réservés.
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;