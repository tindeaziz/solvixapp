import React, { useState, useEffect } from 'react';
import { Menu, X, LayoutDashboard, FileText, Settings as SettingsIcon, LogOut, User, ChevronDown, List } from 'lucide-react';
import type { ActiveSection } from '../App';
import { useAuth } from '../hooks/useAuth';
import { profileService } from '../lib/supabase';
import { isPremiumActive, getSecureQuotaInfo } from '../utils/security';
import PremiumBadge from './premium/PremiumBadge';
import QuotaDisplay from './premium/QuotaDisplay';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
  onLogout: () => void;
  onShowPremiumModal?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeSection, 
  setActiveSection, 
  onLogout,
  onShowPremiumModal 
}) => {
  const { user } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isPremium, setIsPremium] = useState(isPremiumActive());
  const [quotaInfo, setQuotaInfo] = useState(getSecureQuotaInfo());
  
  // États pour les informations utilisateur réelles
  const [userInfo, setUserInfo] = useState({
    name: 'Utilisateur',
    email: 'demo@solvix.com',
    photo: null as string | null,
    lastConnection: new Date().toLocaleDateString('fr-FR')
  });
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);

  const navigation = [
    { id: 'dashboard' as ActiveSection, name: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'create-quote' as ActiveSection, name: 'Créer un devis', icon: FileText },
    { id: 'quote-management' as ActiveSection, name: 'Mes devis', icon: List },
    { id: 'settings' as ActiveSection, name: 'Paramètres', icon: SettingsIcon },
  ];

  // Vérification périodique du statut Premium et quota
  useEffect(() => {
    const checkPremiumStatus = () => {
      setIsPremium(isPremiumActive());
      if (!isPremiumActive()) {
        setQuotaInfo(getSecureQuotaInfo());
      }
    };

    // Vérification initiale
    checkPremiumStatus();

    // Vérification périodique toutes les 30 secondes
    const interval = setInterval(checkPremiumStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  // Charger les informations utilisateur réelles
  useEffect(() => {
    const loadUserInfo = async () => {
      if (!user) {
        console.log('⏳ LAYOUT - En attente de l\'utilisateur...');
        return;
      }

      setLoadingUserInfo(true);
      console.log('👤 LAYOUT - Chargement des informations pour User ID:', user.id);

      try {
        const { data, error } = await profileService.getProfile();
        
        if (error && error.code !== 'PGRST116') {
          console.error('❌ LAYOUT - Erreur chargement profil:', error);
        }

        const userName = data?.company_name || 
                        user.user_metadata?.full_name || 
                        user.email?.split('@')[0] || 
                        'Utilisateur';
        
        const userEmail = user.email || 'email@example.com';
        const userPhoto = data?.company_logo || null;
        const lastConnection = user.last_sign_in_at ? 
                              new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : 
                              new Date().toLocaleDateString('fr-FR');

        setUserInfo({
          name: userName,
          email: userEmail,
          photo: userPhoto,
          lastConnection: lastConnection
        });

      } catch (error) {
        console.error('❌ LAYOUT - Exception chargement utilisateur:', error);
        
        setUserInfo({
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur',
          email: user.email || 'email@example.com',
          photo: null,
          lastConnection: user.last_sign_in_at ? 
                          new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : 
                          new Date().toLocaleDateString('fr-FR')
        });
      } finally {
        setLoadingUserInfo(false);
      }
    };

    loadUserInfo();
  }, [user]);

  // Fermer les menus quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen || mobileMenuOpen) {
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userMenuOpen, mobileMenuOpen]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    setUserMenuOpen(false);
    onLogout();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderUserAvatar = (size: 'sm' | 'md' = 'sm') => {
    const sizeClasses = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
    
    return (
      <div className={`${sizeClasses} bg-solvix-orange rounded-full flex items-center justify-center overflow-hidden flex-shrink-0`}>
        {userInfo.photo ? (
          <img src={userInfo.photo} alt="Photo de profil" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white font-medium font-inter">{getInitials(userInfo.name)}</span>
        )}
      </div>
    );
  };

  const handleUpgradeClick = () => {
    if (onShowPremiumModal) {
      onShowPremiumModal();
    }
  };

  return (
    <div className="app-layout">
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowLogoutModal(false)}></div>
            
            <div className="modal-container inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-solvix-lg transform transition-all sm:my-8 sm:align-middle mx-4">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <LogOut className="h-6 w-6 text-solvix-error" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-semibold text-solvix-dark font-poppins">
                      Confirmer la déconnexion
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 font-inter">
                        Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre compte.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-solvix-light px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-solvix-error text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-solvix-error sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200 font-inter"
                >
                  Se déconnecter
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-solvix-blue sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200 font-inter"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Navigation */}
      <header className="top-navbar fixed top-0 left-0 right-0 z-50 bg-solvix-blue text-white shadow-solvix-lg">
        <div className="navbar-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo et Brand */}
            <div className="navbar-brand flex items-center space-x-3">
              <img 
                src="/Logo-Solvix-blanc.png" 
                alt="Solvix Logo" 
                className="h-8 w-auto"
              />
              <span className="brand-name text-xl font-bold text-white font-poppins block sm:hidden">
                Solvix
              </span>
            </div>

            {/* Navigation Desktop */}
            <nav className="navbar-menu hidden md:flex">
              <ul className="menu-items flex space-x-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveSection(item.id)}
                        className={`nav-link flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 font-inter ${
                          isActive
                            ? 'bg-solvix-orange text-white shadow-solvix'
                            : 'text-white hover:bg-solvix-orange hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden lg:inline">{item.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Actions Desktop */}
            <div className="navbar-actions hidden md:flex items-center space-x-4">
              {/* Premium Badge et Quota */}
              <div className="flex items-center space-x-3">
                {isPremium ? (
                  <PremiumBadge variant="compact" />
                ) : (
                  <QuotaDisplay 
                    onUpgradeClick={handleUpgradeClick}
                    variant="header"
                  />
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(!userMenuOpen);
                  }}
                  className="profile-btn flex items-center space-x-2 bg-solvix-orange hover:bg-solvix-orange-dark px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 font-inter"
                  disabled={loadingUserInfo}
                >
                  {loadingUserInfo ? (
                    <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full animate-pulse"></div>
                  ) : (
                    renderUserAvatar('sm')
                  )}
                  <span className="hidden xl:inline text-white">
                    {loadingUserInfo ? 'Chargement...' : userInfo.name}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-white transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown */}
                {userMenuOpen && !loadingUserInfo && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-solvix-lg py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        {renderUserAvatar('md')}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-solvix-dark font-inter truncate">
                            {userInfo.name}
                          </p>
                          <p className="text-xs text-gray-500 font-inter truncate">
                            {userInfo.email}
                          </p>
                          {user && (
                            <p className="text-xs text-gray-400 font-inter mt-1">
                              Connecté depuis: {userInfo.lastConnection}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Premium Status dans le menu */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {isPremium ? (
                          <PremiumBadge variant="detailed" className="w-full" />
                        ) : (
                          <QuotaDisplay 
                            onUpgradeClick={handleUpgradeClick}
                            variant="card"
                            className="w-full"
                          />
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveSection('settings');
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-solvix-light transition-colors duration-200 font-inter"
                    >
                      <User className="h-4 w-4 mr-3 text-gray-400" />
                      Mon profil
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-solvix-error hover:bg-red-50 transition-colors duration-200 font-inter"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="mobile-menu-toggle md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1"
            >
              <span className={`hamburger-line w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
              <span className={`hamburger-line w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`hamburger-line w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-solvix-blue-dark">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 font-inter ${
                        isActive
                          ? 'bg-solvix-orange text-white'
                          : 'text-white hover:bg-solvix-orange hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
                
                {/* Mobile User Section */}
                <div className="border-t border-solvix-blue-dark pt-3 mt-3">
                  {/* Premium/Quota Status Mobile */}
                  <div className="px-3 py-2 mb-3">
                    {isPremium ? (
                      <PremiumBadge variant="default" />
                    ) : (
                      <QuotaDisplay 
                        onUpgradeClick={handleUpgradeClick}
                        variant="inline"
                      />
                    )}
                  </div>

                  <div className="flex items-center space-x-3 px-3 py-2">
                    {loadingUserInfo ? (
                      <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full animate-pulse"></div>
                    ) : (
                      renderUserAvatar('sm')
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white font-inter truncate">
                        {loadingUserInfo ? 'Chargement...' : userInfo.name}
                      </p>
                      <p className="text-xs text-blue-200 font-inter truncate">
                        {userInfo.email}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setActiveSection('settings');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-white hover:bg-solvix-orange rounded-lg transition-colors duration-200 font-inter"
                  >
                    <User className="h-4 w-4" />
                    <span>Mon profil</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-300 hover:bg-red-600 hover:text-white rounded-lg transition-colors duration-200 font-inter"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="main-content pt-16 min-h-screen bg-solvix-light">
        <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;