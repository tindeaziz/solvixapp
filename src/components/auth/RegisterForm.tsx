import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Loader2, Check, AlertCircle, Building, MapPin, Phone } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Le nom de l\'entreprise est requis';
    }

    if (!formData.companyAddress.trim()) {
      newErrors.companyAddress = 'L\'adresse de l\'entreprise est requise';
    }

    if (!formData.companyPhone.trim()) {
      newErrors.companyPhone = 'Le téléphone de l\'entreprise est requis';
    }

    // L'email de l'entreprise est optionnel, mais s'il est fourni, il doit être valide
    if (formData.companyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail)) {
      newErrors.companyEmail = 'Format d\'email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setFormSubmitted(true);

    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
      return;
    }

    if (!validateStep2()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('📝 REGISTER - Tentative d\'inscription avec les données:', {
        email: formData.email,
        name: formData.name,
        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        companyPhone: formData.companyPhone
      });
      
      const { data, error } = await signUp(
        formData.email, 
        formData.password,
        {
          full_name: formData.name,
          company_name: formData.companyName,
          company_address: formData.companyAddress,
          company_phone: formData.companyPhone,
          company_email: formData.companyEmail || formData.email
        }
      );
      
      if (error) {
        if (error.message.includes('User already registered')) {
          setGeneralError('Cette adresse email est déjà utilisée');
        } else if (error.message.includes('Password should be at least')) {
          setGeneralError('Le mot de passe doit contenir au moins 6 caractères');
        } else if (error.message.includes('Invalid email')) {
          setGeneralError('Format d\'email invalide');
        } else {
          setGeneralError('Erreur lors de la création du compte. Veuillez réessayer.');
        }
        return;
      }

      if (data?.user) {
        console.log('✅ REGISTER - Inscription réussie:', data.user);
        if (data.session) {
          onSuccess();
        } else {
          setGeneralError('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
          setTimeout(() => {
            onSwitchToLogin();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('❌ REGISTER - Erreur lors de l\'inscription:', error);
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

  const getPasswordStrength = () => {
    const password = formData.password;
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    return strength;
  };

  const passwordStrength = getPasswordStrength();

  const renderStep1 = () => (
    <>
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Créer un compte</h2>
        <p className="text-gray-600 text-sm sm:text-base">Étape 1/2 : Informations personnelles</p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom complet
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Jean Dupont"
              disabled={isLoading}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="votre@email.com"
              disabled={isLoading}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
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
          
          {/* Password strength indicator */}
          {formData.password && (
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
          
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Confirmez votre mot de passe"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {formData.confirmPassword && formData.password === formData.confirmPassword && (
            <div className="mt-1 flex items-center text-green-600">
              <Check className="h-4 w-4 mr-1" />
              <span className="text-sm">Les mots de passe correspondent</span>
            </div>
          )}
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:text-blue-700 font-medium"
          disabled={isLoading}
        >
          Retour à la connexion
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
          disabled={isLoading}
        >
          Suivant
        </button>
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Informations entreprise</h2>
        <p className="text-gray-600 text-sm sm:text-base">Étape 2/2 : Configurez votre entreprise</p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom de l'entreprise *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                errors.companyName ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Nom de votre entreprise"
              disabled={isLoading}
            />
          </div>
          {errors.companyName && (
            <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adresse de l'entreprise *
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <textarea
              value={formData.companyAddress}
              onChange={(e) => handleInputChange('companyAddress', e.target.value)}
              rows={3}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                errors.companyAddress ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Adresse complète de l'entreprise"
              disabled={isLoading}
            />
          </div>
          {errors.companyAddress && (
            <p className="mt-1 text-sm text-red-600">{errors.companyAddress}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Téléphone de l'entreprise *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              value={formData.companyPhone}
              onChange={(e) => handleInputChange('companyPhone', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                errors.companyPhone ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="+33 1 23 45 67 89"
              disabled={isLoading}
            />
          </div>
          {errors.companyPhone && (
            <p className="mt-1 text-sm text-red-600">{errors.companyPhone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email de l'entreprise (optionnel)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={formData.companyEmail}
              onChange={(e) => handleInputChange('companyEmail', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                errors.companyEmail ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="contact@entreprise.com (si différent)"
              disabled={isLoading}
            />
          </div>
          {errors.companyEmail && (
            <p className="mt-1 text-sm text-red-600">{errors.companyEmail}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Si non renseigné, votre email personnel sera utilisé
          </p>
        </div>
      </div>

      <div className="flex items-start mt-6">
        <input
          type="checkbox"
          required
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
          disabled={isLoading}
        />
        <label className="ml-2 text-sm text-gray-600">
          J'accepte les{' '}
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            conditions d'utilisation
          </a>{' '}
          et la{' '}
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            politique de confidentialité
          </a>
        </label>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
          disabled={isLoading}
        >
          Retour
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Création du compte...
            </>
          ) : (
            'Créer mon compte'
          )}
        </button>
      </div>
    </>
  );

  return (
    <div>
      {generalError && (
        <div className={`border rounded-lg p-4 mb-6 ${
          generalError.includes('succès') 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <p className="text-sm">{generalError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {currentStep === 1 ? renderStep1() : renderStep2()}
      </form>
    </div>
  );
};

export default RegisterForm;