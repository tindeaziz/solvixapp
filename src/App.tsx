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
import { useAuth } from './hooks/useAuth';

export type ActiveSection = 'dashboard' | 'create-quote' | 'quote-management' | 'settings';

function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const { user, loading, signOut } = useAuth();

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveSection} />;
      case 'create-quote':
        return <CreateQuote />;
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
      setActiveSection('dashboard'); // Reset to dashboard on logout
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
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

  // Si l'utilisateur n'est pas connecté, afficher l'interface d'authentification
  if (!user) {
    return <AuthWrapper onAuthSuccess={() => {}} />;
  }

  return (
    <Routes>
      {/* Route pour la prévisualisation d'impression */}
      <Route path="/devis/preview/:id" element={<QuotePreview />} />
      <Route path="/devis/preview/new" element={<QuotePreview />} />
      <Route path="/devis/preview/edit" element={<QuotePreview />} />
      
      {/* Route pour la gestion des devis */}
      <Route path="/devis" element={<QuoteManagement />} />
      <Route path="/devis/edit/:id" element={<EditQuote />} />
      
      {/* Routes principales de l'application */}
      <Route path="/*" element={
        <Layout 
          activeSection={activeSection} 
          setActiveSection={setActiveSection}
          onLogout={handleLogout}
        >
          {renderContent()}
        </Layout>
      } />
    </Routes>
  );
}

export default App;