import React, { useState, useEffect } from 'react';
import { X, Shield, Star, Zap, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { validateActivationCode } from '../../utils/sanitizer';
import { validatePremiumCode, activatePremium, getDeviceFingerprint } from '../../utils/security';

interface PremiumActivationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PremiumActivation: React.FC<PremiumActivationProps> = ({ isOpen, onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [loading, setLoading] = useState(false);
  const [showDeviceInfo, setShowDeviceInfo] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Vérifier si l'utilisateur est bloqué
    const checkBlockStatus = () => {
      try {
        const blockData = localStorage.getItem('solvix_activation_block');
        if (blockData) {
          const { timestamp, attempts: savedAttempts } = JSON.parse(blockData);
          const hoursSinceBlock = (Date.now() - timestamp) / (1000 * 60 * 60);

          if (hoursSinceBlock < 24 && savedAttempts >= 5) {
            setIsBlocked(true);
            const remainingHours = Math.ceil(24 - hoursSinceBlock);
            setMessage(`Trop de tentatives. Réessayez dans ${remainingHours}h ou contactez le support.`);
            setMessageType('error');
          } else if (hoursSinceBlock >= 24) {
            // Reset du blocage après 24h
            localStorage.removeItem('solvix_activation_block');
            setAttempts(0);
          } else {
            setAttempts(savedAttempts);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du blocage:', error);
      }
    };

    checkBlockStatus();
  }, [isOpen]);

  const handleCodeChange = (value: string) => {
    // Formater automatiquement le code
    const formatted = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setCode(formatted);
    
    // Effacer le message d'erreur quand l'utilisateur tape
    if (message && messageType === 'error') {
      setMessage('');
    }
  };

  const handleActivation = async () => {
    if (isBlocked || loading) return;

    // Validation côté client
    if (!code.trim()) {
      setMessage('Veuillez entrer un code d\'activation');
      setMessageType('error');
      return;
    }

    if (!validateActivationCode(code)) {
      setMessage('Format de code invalide. Format attendu: SOLVIX2025-XXX-XXX');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('Vérification du code...');
    setMessageType('info');

    try {
      // Simulation d'un délai pour éviter les attaques par force brute
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Validation du code
      if (!validatePremiumCode(code)) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        // Sauvegarder les tentatives
        const blockData = {
          timestamp: Date.now(),
          attempts: newAttempts
        };
        localStorage.setItem('solvix_activation_block', JSON.stringify(blockData));
        
        if (newAttempts >= 5) {
          setIsBlocked(true);
          setMessage('Trop de tentatives incorrectes. Accès bloqué pendant 24h.');
          setMessageType('error');
        } else {
          setMessage(`Code invalide ou déjà utilisé. ${5 - newAttempts} tentatives restantes.`);
          setMessageType('error');
        }
        setLoading(false);
        return;
      }

      // Activation du Premium
      const success = activatePremium(code);
      
      if (success) {
        setMessage('🎉 Premium activé avec succès !');
        setMessageType('success');
        
        // Nettoyer les données de blocage
        localStorage.removeItem('solvix_activation_block');
        
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setMessage('Erreur lors de l\'activation. Veuillez réessayer.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erreur lors de l\'activation:', error);
      setMessage('Une erreur technique est survenue. Veuillez réessayer.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isBlocked && !loading) {
      handleActivation();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-solvix-blue to-solvix-orange text-white p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <Star className="h-8 w-8 text-yellow-300 mr-2" />
              <h2 className="text-2xl font-bold font-poppins">Solvix Premium</h2>
            </div>
            <p className="text-blue-100 font-inter">Accès à vie - 5 000 FCFA</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Avantages Premium */}
          <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-solvix-dark mb-3 flex items-center font-poppins">
              <Zap className="h-5 w-5 text-solvix-orange mr-2" />
              Avantages Premium
            </h3>
            <ul className="space-y-2">
              {[
                'Devis illimités',
                'Tous les modèles professionnels',
                'Export PDF sans filigrane',
                'Support WhatsApp prioritaire',
                'Sauvegarde cloud sécurisée'
              ].map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-solvix-dark font-inter">
                  <CheckCircle className="h-4 w-4 text-solvix-success mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Formulaire d'activation */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-solvix-dark mb-2 font-inter">
                Code d'activation
              </label>
              <input
                type="text"
                placeholder="SOLVIX2025-XXX-XXX"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isBlocked || loading}
                className={`w-full px-4 py-3 border-2 rounded-lg text-center font-mono text-lg focus:outline-none transition-colors duration-200 ${
                  isBlocked 
                    ? 'border-red-300 bg-red-50 cursor-not-allowed' 
                    : 'border-gray-300 focus:border-solvix-blue'
                }`}
                maxLength={25}
                autoComplete="off"
              />
            </div>
            
            <button
              onClick={handleActivation}
              disabled={isBlocked || loading || !code.trim()}
              className="w-full py-3 bg-gradient-to-r from-solvix-orange to-solvix-orange-dark text-white rounded-lg font-semibold hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-inter flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Activation en cours...
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 mr-2" />
                  Activer Premium
                </>
              )}
            </button>
          </div>

          {/* Message de statut */}
          {message && (
            <div className={`mt-4 p-3 rounded-lg text-center transition-all duration-300 ${
              messageType === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : messageType === 'error'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              <div className="flex items-center justify-center">
                {messageType === 'success' && <CheckCircle className="h-4 w-4 mr-2" />}
                {messageType === 'error' && <AlertTriangle className="h-4 w-4 mr-2" />}
                <span className="font-inter text-sm">{message}</span>
              </div>
            </div>
          )}

          {/* Informations de contact */}
          <div className="mt-6 text-center">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 font-inter mb-2">
                <strong>Pour obtenir un code d'activation :</strong>
              </p>
              <div className="space-y-1">
                <p className="font-semibold text-solvix-blue font-inter">
                  📱 WhatsApp: +225 XX XX XX XX
                </p>
                <p className="font-semibold text-solvix-blue font-inter">
                  📧 Email: premium@solvix.com
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2 font-inter">
                Paiement sécurisé par Mobile Money ou Orange Money
              </p>
            </div>
          </div>

          {/* Informations de sécurité */}
          <div className="mt-4">
            <button
              onClick={() => setShowDeviceInfo(!showDeviceInfo)}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200 font-inter"
            >
              {showDeviceInfo ? 'Masquer' : 'Afficher'} les informations de sécurité
            </button>
            
            {showDeviceInfo && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 font-inter mb-1">
                  <strong>ID Dispositif:</strong> {getDeviceFingerprint()}
                </p>
                <p className="text-xs text-gray-500 font-inter">
                  Cet identifiant unique sécurise votre licence Premium sur cet appareil.
                </p>
              </div>
            )}
          </div>

          {/* Tentatives restantes */}
          {attempts > 0 && !isBlocked && (
            <div className="mt-4 text-center">
              <p className="text-sm text-orange-600 font-inter">
                Tentatives restantes: {5 - attempts}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumActivation;