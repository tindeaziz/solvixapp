import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBackToLogin,
}) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('L\'adresse email est requise');
      return;
    }

    if (!validateEmail(email)) {
      setError('Format d\'email invalide');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔄 FORGOT_PASSWORD - Demande de réinitialisation pour:', email);
      
      const { data, error } = await resetPassword(email);
      
      if (error) {
        console.error('❌ FORGOT_PASSWORD - Erreur réinitialisation:', error.message);
        
        if (error.message.includes('User not found')) {
          setError('Aucun compte associé à cette adresse email');
        } else {
          setError('Erreur lors de l\'envoi de l\'email. Veuillez réessayer.');
        }
        return;
      }

      console.log('✅ FORGOT_PASSWORD - Email de réinitialisation envoyé');
      setIsSuccess(true);
    } catch (error) {
      console.error('❌ FORGOT_PASSWORD - Exception lors de la réinitialisation:', error);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    if (error) {
      setError('');
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email envoyé !</h2>
          <p className="text-gray-600">
            Nous avons envoyé un lien de réinitialisation à
          </p>
          <p className="text-blue-600 font-medium">{email}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Vérifiez votre boîte de réception</strong> et cliquez sur le lien pour réinitialiser votre mot de passe.
          </p>
          <p className="text-sm text-blue-700 mt-2">
            Le lien expirera dans 24 heures.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onBackToLogin}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Retour à la connexion
          </button>
          
          <button
            onClick={() => {
              setIsSuccess(false);
              setEmail('');
            }}
            className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm font-medium"
          >
            Renvoyer l'email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe oublié</h2>
        <p className="text-gray-600">
          Entrez votre adresse email pour recevoir un lien de réinitialisation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

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
              value={email}
              onChange={(e) => handleInputChange(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="votre@email.com"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              'Envoyer le lien de réinitialisation'
            )}
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la connexion
          </button>
        </div>
      </form>

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Besoin d'aide ?</h4>
        <p className="text-sm text-gray-600">
          Si vous ne recevez pas l'email, vérifiez votre dossier spam ou{' '}
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            contactez le support
          </a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;