import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
  onSwitchToForgotPassword,
}) => {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 LOGIN - Tentative de connexion pour:', formData.email);
      
      const { data, error } = await signIn(formData.email, formData.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          console.error('❌ LOGIN - Identifiants invalides');
          setGeneralError('Email ou mot de passe incorrect');
        } else if (error.message.includes('Email not confirmed')) {
          console.error('❌ LOGIN - Email non confirmé');
          setGeneralError('Veuillez confirmer votre email avant de vous connecter');
        } else {
          console.error('❌ LOGIN - Erreur de connexion:', error.message);
          setGeneralError('Erreur de connexion. Veuillez réessayer.');
        }
        return;
      }

      if (data?.user) {
        console.log('✅ LOGIN - Connexion réussie pour User ID:', data.user.id);
        onSuccess();
      }
    } catch (error) {
      console.error('❌ LOGIN - Exception lors de la connexion:', error);
      setGeneralError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-solvix-dark mb-2 font-poppins">Connexion</h2>
        <p className="text-gray-600 font-inter text-sm sm:text-base">Accédez à votre espace Solvix</p>
      </div>

      {/* Demo credentials info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-solvix-blue font-medium mb-1 font-inter">Compte de test disponible :</p>
        <p className="text-sm text-solvix-blue font-inter">Créez votre compte ou utilisez vos identifiants</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {generalError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-solvix-error font-inter">{generalError}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-solvix-dark mb-2 font-inter">
            Adresse email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent transition-colors duration-200 font-inter ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="votre@email.com"
              disabled={isLoading}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-solvix-error font-inter">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-solvix-dark mb-2 font-inter">
            Mot de passe
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent transition-colors duration-200 font-inter ${
                errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Votre mot de passe"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-solvix-error font-inter">{errors.password}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-solvix-blue focus:ring-solvix-blue border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-600 font-inter">Se souvenir de moi</span>
          </label>
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            className="text-sm text-solvix-blue hover:text-solvix-blue-dark font-medium font-inter"
            disabled={isLoading}
          >
            Mot de passe oublié ?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-solvix-orange text-white py-3 px-4 rounded-lg font-medium hover:bg-solvix-orange-dark focus:outline-none focus:ring-2 focus:ring-solvix-orange focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-inter shadow-solvix"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Connexion en cours...
            </>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 font-inter">
          Pas encore de compte ?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-solvix-blue hover:text-solvix-blue-dark font-medium font-inter"
            disabled={isLoading}
          >
            Créer un compte
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;