import React from 'react';
import { Star, Crown, Zap } from 'lucide-react';
import { isPremiumActive, getPremiumInfo } from '../../utils/security';

interface PremiumBadgeProps {
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({ variant = 'default', className = '' }) => {
  const isActive = isPremiumActive();
  const premiumInfo = getPremiumInfo();

  if (!isActive) return null;

  const baseClasses = "inline-flex items-center font-semibold transition-all duration-200";

  switch (variant) {
    case 'compact':
      return (
        <span className={`${baseClasses} px-2 py-1 text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full shadow-sm ${className}`}>
          <Crown className="h-3 w-3 mr-1" />
          PRO
        </span>
      );

    case 'detailed':
      return (
        <div className={`${baseClasses} flex-col bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4 ${className}`}>
          <div className="flex items-center mb-2">
            <Star className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="text-lg font-bold text-yellow-700 font-poppins">Premium Actif</span>
          </div>
          {premiumInfo && (
            <div className="text-sm text-yellow-600 space-y-1 font-inter">
              <p>Activé le: {premiumInfo.activationDate.toLocaleDateString('fr-FR')}</p>
              <p>Code: ***{premiumInfo.code}</p>
              <p className="flex items-center">
                <Zap className="h-3 w-3 mr-1" />
                Accès illimité à vie
              </p>
            </div>
          )}
        </div>
      );

    default:
      return (
        <span className={`${baseClasses} px-3 py-1 text-sm bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 ${className}`}>
          <Star className="h-4 w-4 mr-1" />
          PREMIUM
        </span>
      );
  }
};

export default PremiumBadge;