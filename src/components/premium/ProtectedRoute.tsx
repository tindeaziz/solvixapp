import React, { ReactNode } from 'react';
import { isPremiumActive, getSecureQuotaInfo } from '../../utils/security';
import { AlertTriangle, Crown, Zap, FileText } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requirePremium?: boolean;
  requireQuota?: boolean;
  fallback?: ReactNode;
  onUpgradeClick?: () => void;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requirePremium = false,
  requireQuota = false,
  fallback,
  onUpgradeClick
}) => {
  const isPremium = isPremiumActive();
  const quotaInfo = getSecureQuotaInfo();

  // Si Premium requis et utilisateur n'est pas Premium
  if (requirePremium && !isPremium) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-solvix-light to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-solvix-dark mb-2 font-poppins">
              Accès Premium Requis
            </h2>
            <p className="text-gray-600 font-inter">
              Cette fonctionnalité est réservée aux utilisateurs Premium.
            </p>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-solvix-dark mb-3 font-poppins">
              Avantages Premium
            </h3>
            <ul className="text-sm text-solvix-dark space-y-2 font-inter">
              <li className="flex items-center">
                <Zap className="h-4 w-4 text-solvix-orange mr-2" />
                Devis illimités
              </li>
              <li className="flex items-center">
                <FileText className="h-4 w-4 text-solvix-orange mr-2" />
                Tous les modèles professionnels
              </li>
              <li className="flex items-center">
                <Crown className="h-4 w-4 text-solvix-orange mr-2" />
                Support prioritaire
              </li>
            </ul>
          </div>

          {onUpgradeClick && (
            <button
              onClick={onUpgradeClick}
              className="w-full bg-gradient-to-r from-solvix-orange to-solvix-orange-dark text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 font-inter"
            >
              <Crown className="h-5 w-5 mr-2 inline" />
              Activer Premium
            </button>
          )}
        </div>
      </div>
    );
  }

  // Si quota requis et utilisateur a épuisé son quota (et n'est pas Premium)
  if (requireQuota && !isPremium && !quotaInfo.canCreateQuote) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-solvix-light to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-solvix-dark mb-2 font-poppins">
              Quota Épuisé
            </h2>
            <p className="text-gray-600 font-inter">
              Vous avez utilisé votre {quotaInfo.total} devis gratuit ce mois.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-800 font-inter">
                Devis utilisés
              </span>
              <span className="text-sm font-bold text-red-800 font-inter">
                {quotaInfo.used} / {quotaInfo.total}
              </span>
            </div>
            <div className="w-full bg-red-200 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full w-full" />
            </div>
            <p className="text-xs text-red-700 mt-2 font-inter">
              Quota réinitialisé le 1er de chaque mois
            </p>
          </div>

          <div className="space-y-3">
            {onUpgradeClick && (
              <button
                onClick={onUpgradeClick}
                className="w-full bg-gradient-to-r from-solvix-orange to-solvix-orange-dark text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 font-inter"
              >
                <Zap className="h-5 w-5 mr-2 inline" />
                Passer au Premium
              </button>
            )}
            
            <p className="text-xs text-gray-500 font-inter">
              Premium: Devis illimités + Tous les modèles + Support prioritaire
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Afficher le contenu si toutes les conditions sont remplies
  return <>{children}</>;
};

export default ProtectedRoute;