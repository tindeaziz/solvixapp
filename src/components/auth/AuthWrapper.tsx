import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';

type AuthView = 'login' | 'register' | 'forgot-password';

interface AuthWrapperProps {
  onAuthSuccess: () => void;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ onAuthSuccess }) => {
  const [currentView, setCurrentView] = useState<AuthView>('login');

  const renderAuthForm = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginForm
            onSuccess={onAuthSuccess}
            onSwitchToRegister={() => setCurrentView('register')}
            onSwitchToForgotPassword={() => setCurrentView('forgot-password')}
          />
        );
      case 'register':
        return (
          <RegisterForm
            onSuccess={onAuthSuccess}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onBackToLogin={() => setCurrentView('login')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-solvix-light via-white to-solvix-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/Logo-Solvix.png" 
              alt="Solvix Logo" 
              className="h-12 w-auto"
            />
          </div>
          <p className="text-gray-600 font-inter">Génération de devis professionnels</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-2xl shadow-solvix-lg border border-gray-100 p-8">
          {renderAuthForm()}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 font-inter">
          © 2025 Solvix. Tous droits réservés.
        </div>
      </div>
    </div>
  );
};

export default AuthWrapper;