import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CreateQuote from './components/CreateQuote';
import QuoteManagement from './components/QuoteManagement';
import EditQuote from './components/EditQuote';
import Settings from './components/Settings';
import AuthWrapper from './components/auth/AuthWrapper';
import QuotePreview from './components/QuotePreview';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import PremiumActivation from './components/premium/PremiumActivation';
import ProtectedRoute from './components/premium/ProtectedRoute';
import AdminPanel from './components/admin/AdminPanel';
import { useAuth } from './hooks/useAuth';
import { isPremiumActive, getSecureQuotaInfo, incrementQuotaUsage, fixExistingQuotas } from './utils/security';
import { Star } from 'lucide-react';

export type ActiveSection = 'dashboard' | 'create-quote' | 'quote-management' | 'settings';

function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const { user, loading, signOut } = useAuth();
  
  // États Premium et Quota
  const [isPremium, setIsPremium] = useState(isPremiumActive());
  const [quotaInfo, setQuotaInfo] = useState(getSecureQuotaInfo());
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Vérification périodique du statut Premium et correction des quotas
  useEffect(() => {
    // Corriger les quotas mal initialisés au démarrage
    fixExistingQuotas();
    
    const checkPremiumStatus = () => {
      const premiumStatus = isPremiumActive();
      setIsPremium(premiumStatus);
      
      if (!premiumStatus) {
        setQuotaInfo(getSecureQuotaInfo());
      }
    };

    // Vérification initiale
    checkPremiumStatus();

    // Vérification périodique toutes les 60 secondes
    const interval = setInterval(checkPremiumStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  // Raccourci clavier pour accès admin (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setShowAdminPanel(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveSection} />;
      case 'create-quote':
        return (
          <ProtectedRoute 
            requireQuota={true}
            onUpgradeClick={() => setShowPremiumModal(true)}
          >
            <CreateQuote onQuoteCreated={handleQuoteCreated} />
          </ProtectedRoute>
        );
      case 'quote-management':
        return <QuoteManagement />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={setActiveSection} />;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setActiveSection('dashboard');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handlePremiumActivation = () => {
    setIsPremium(true);
    setShowPremiumModal(false);
    setQuotaInfo({ used: 0, remaining: Infinity, total: Infinity, canCreateQuote: true });
  };

  const handleQuoteCreated = () => {
    if (!isPremium) {
      const success = incrementQuotaUsage();
      if (success) {
        setQuotaInfo(getSecureQuotaInfo());
      }
    }
  };

  // Afficher un loader pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="min-h-screen bg-solvix-light flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-solvix-blue border-t-transparent mx-auto mb-4"></div>
          <p className="text-solvix-dark font-inter text-sm sm:text-base">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Route pour la réinitialisation du mot de passe - accessible sans authentification */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Route pour la prévisualisation d'impression */}
        <Route path="/devis/preview/:id" element={<QuotePreview />} />
        <Route path="/devis/preview/new" element={<QuotePreview />} />
        <Route path="/devis/preview/edit" element={<QuotePreview />} />
        
        {/* Route pour la gestion des devis */}
        <Route path="/devis" element={user ? <QuoteManagement /> : <AuthWrapper onAuthSuccess={() => {}} />} />
        <Route path="/devis/edit/:id" element={user ? <EditQuote /> : <AuthWrapper onAuthSuccess={() => {}} />} />
        
        {/* Routes principales de l'application */}
        <Route path="/*" element={
          user ? (
            <Layout 
              activeSection={activeSection} 
              setActiveSection={setActiveSection}
              onLogout={handleLogout}
              onShowPremiumModal={() => setShowPremiumModal(true)}
            >
              {renderContent()}
            </Layout>
          ) : (
            <AuthWrapper onAuthSuccess={() => {}} />
          )
        } />
      </Routes>

      {/* Bouton Premium flottant pour les utilisateurs non premium */}
      {user && !isPremium && !showPremiumModal && (
        <button
          onClick={() => setShowPremiumModal(true)}
          className="fixed bottom-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 z-40 flex items-center"
        >
          <Star className="h-5 w-5 mr-2 text-yellow-100" />
          <span className="font-medium font-inter">Passer au Premium</span>
        </button>
      )}

      {/* Modal d'activation Premium */}
      {showPremiumModal && (
        <PremiumActivation
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          onSuccess={handlePremiumActivation}
        />
      )}

      {/* Panel d'administration */}
      {showAdminPanel && (
        <AdminPanel
          isOpen={showAdminPanel}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
    </>
  );
}

export default App;