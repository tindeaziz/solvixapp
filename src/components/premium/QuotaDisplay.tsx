import React, { useState, useEffect } from 'react';
import { FileText, AlertTriangle, Zap, Crown } from 'lucide-react';
import { getSecureQuotaInfo, isPremiumActive } from '../../utils/security';

interface QuotaDisplayProps {
  onUpgradeClick: () => void;
  variant?: 'header' | 'card' | 'inline';
  className?: string;
}

const QuotaDisplay: React.FC<QuotaDisplayProps> = ({ 
  onUpgradeClick, 
  variant = 'header',
  className = '' 
}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [quotaInfo, setQuotaInfo] = useState(getSecureQuotaInfo());

  useEffect(() => {
    const checkPremiumStatus = async () => {
      setIsLoading(true);
      try {
        const premiumStatus = await isPremiumActive();
        setIsPremium(premiumStatus);
        
        if (!premiumStatus) {
          setQuotaInfo(getSecureQuotaInfo());
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut premium:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkPremiumStatus();
  }, []);

  if (isLoading) {
    return null;
  }

  if (isPremium) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Crown className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-medium text-yellow-700 font-inter">
          Devis illimités
        </span>
      </div>
    );
  }

  const getProgressColor = () => {
    const percentage = (quotaInfo.used / quotaInfo.total) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    const percentage = (quotaInfo.used / quotaInfo.total) * 100;
    if (percentage >= 100) return 'text-red-700';
    if (percentage >= 80) return 'text-orange-700';
    return 'text-gray-700';
  };

  switch (variant) {
    case 'card':
      return (
        <div className={`bg-white rounded-xl border-2 border-gray-200 p-4 ${className}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 font-poppins">Quota mensuel</h3>
            <FileText className="h-5 w-5 text-gray-500" />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-inter">
              <span className="text-gray-600">Devis créés</span>
              <span className={`font-semibold ${getTextColor()}`}>
                {quotaInfo.used} / {quotaInfo.total}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${Math.min((quotaInfo.used / quotaInfo.total) * 100, 100)}%` }}
              />
            </div>
            
            {quotaInfo.remaining === 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-sm font-semibold text-red-800 font-inter">
                    Quota épuisé
                  </span>
                </div>
                <p className="text-xs text-red-700 mb-3 font-inter">
                  Vous avez atteint votre limite mensuelle de {quotaInfo.total} devis gratuits.
                </p>
                <button
                  onClick={onUpgradeClick}
                  className="w-full bg-gradient-to-r from-solvix-orange to-solvix-orange-dark text-white py-2 px-4 rounded-lg text-sm font-semibold hover:shadow-lg transition-all duration-200 font-inter"
                >
                  <Zap className="h-4 w-4 mr-1 inline" />
                  Passer au Premium
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-2 font-inter">
                  {quotaInfo.remaining} {quotaInfo.remaining === 1 ? 'devis restant' : 'devis restants'} ce mois
                </p>
                <button
                  onClick={onUpgradeClick}
                  className="text-xs text-solvix-blue hover:text-solvix-blue-dark font-medium transition-colors duration-200 font-inter"
                >
                  Passer au Premium pour un accès illimité
                </button>
              </div>
            )}
          </div>
        </div>
      );

    case 'inline':
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          <FileText className="h-4 w-4 text-gray-500" />
          <span className={`text-sm font-medium ${getTextColor()} font-inter`}>
            {quotaInfo.used}/{quotaInfo.total}
          </span>
          {quotaInfo.remaining === 0 && (
            <button
              onClick={onUpgradeClick}
              className="text-xs bg-solvix-orange text-white px-2 py-1 rounded font-medium hover:bg-solvix-orange-dark transition-colors duration-200 font-inter"
            >
              Upgrade
            </button>
          )}
        </div>
      );

    default: // header
      return (
        <div className={`flex items-center space-x-3 ${className}`}>
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className={`text-sm font-medium ${getTextColor()} font-inter`}>
              Devis: {quotaInfo.used}/{quotaInfo.total}
            </span>
          </div>
          
          {quotaInfo.remaining === 0 ? (
            <button
              onClick={onUpgradeClick}
              className="bg-gradient-to-r from-solvix-orange to-solvix-orange-dark text-white px-3 py-1 rounded-lg text-xs font-semibold hover:shadow-lg transition-all duration-200 font-inter flex items-center"
            >
              <Zap className="h-3 w-3 mr-1" />
              Upgrade
            </button>
          ) : quotaInfo.remaining <= 1 ? (
            <button
              onClick={onUpgradeClick}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200 font-inter"
            >
              Premium ?
            </button>
          ) : null}
        </div>
      );
  }
};

export default QuotaDisplay;