import React, { useState, useEffect } from 'react';
import { Menu, X, LayoutDashboard, FileText, Settings as SettingsIcon, LogOut, User, ChevronDown, List, Home } from 'lucide-react';
import type { ActiveSection } from '../App';
import { useAuth } from '../hooks/useAuth';
import { profileService } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeSection, setActiveSection, onLogout }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // États pour les informations utilisateur réelles
  const [userInfo, setUserInfo] = useState({
    name: 'Utilisateur',
    email: 'demo@solvix.com',
    photo: null as string | null,
    lastConnection: new Date().toLocaleDateString('fr-FR')
  });
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);

  const navigation = [
    { id: 'dashboard' as ActiveSection, name: 'Dashboard', icon: LayoutDashboard, mobileLabel: 'Accueil' },
    { id: 'create-quote' as ActiveSection, name: 'Créer un devis', icon: FileText, mobileLabel: 'Créer' },
    { id: 'quote-management' as ActiveSection, name: 'Mes devis', icon: List, mobileLabel: 'Devis' },
    { id: 'settings' as ActiveSection, name: 'Paramètres', icon: SettingsIcon, mobileLabel: 'Réglages' },
  ];

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fermer la sidebar mobile quand on change de section
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [activeSection, isMobile]);

  // Fermer les menus quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Fermer la sidebar si on clique sur l'overlay
      if (sidebarOpen && isMobile && target.classList.contains('sidebar-overlay')) {
        setSidebarOpen(false);
      }
      
      // Fermer le menu utilisateur si on clique en dehors
      if (userMenuOpen && !target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [sidebarOpen, userMenuOpen, isMobile]);

  // Empêcher le scroll du body quand la sidebar est ouverte sur mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, sidebarOpen]);

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

  const handleLogout = () => {
    setShowLogoutModal(false);
    setUserMenuOpen(false);
    setSidebarOpen(false);
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
      <div className={`${sizeClasses} bg-solvix-blue rounded-full flex items-center justify-center overflow-hidden flex-shrink-0`}>
        {userInfo.photo ? (
          <img src={userInfo.photo} alt="Photo de profil" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white font-medium font-inter">{getInitials(userInfo.name)}</span>
        )}
      </div>
    );
  };

  const getCurrentSectionTitle = () => {
    switch (activeSection) {
      case 'create-quote':
        return 'Créer un devis';
      case 'quote-management':
        return 'Mes devis';
      case 'settings':
        return 'Paramètres';
      default:
        return 'Dashboard';
    }
  };

  const handleSectionChange = (section: ActiveSection) => {
    setActiveSection(section);
    setSidebarOpen(false); // Fermer la sidebar après sélection
    setUserMenuOpen(false); // Fermer le menu utilisateur
  };

  return (
    <div className="min-h-screen bg-solvix-light">
      {/* Overlay pour mobile - CORRECTION CRITIQUE */}
      {sidebarOpen && isMobile && (
        <div 
          className="sidebar-overlay fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="sidebar fixed inset-y-0 left-0 z-50 bg-white shadow-solvix-lg flex flex-col">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-solvix-blue">
            <div className="flex items-center">
              <img 
                src="/Logo-Solvix.png" 
                alt="Solvix Logo" 
                className="h-8 w-auto"
              />
            </div>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`nav-item w-full flex items-center text-left rounded-xl transition-all duration-200 font-inter ${
                    isActive
                      ? 'bg-solvix-blue text-white shadow-solvix border-l-4 border-solvix-orange'
                      : 'text-gray-600 hover:bg-solvix-light hover:text-solvix-dark'
                  }`}
                >
                  <Icon className={`h-5 w-5 mr-3 flex-shrink-0 ${isActive ? 'text-solvix-orange' : 'text-gray-400'}`} />
                  <span className="font-medium truncate">{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="relative user-menu-container">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-solvix-light transition-colors duration-200"
                disabled={loadingUserInfo}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {loadingUserInfo ? (
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                  ) : (
                    renderUserAvatar('sm')
                  )}
                  <div className="text-left min-w-0 flex-1">
                    {loadingUserInfo ? (
                      <>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-1 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-solvix-dark font-inter truncate">
                          {userInfo.name}
                        </p>
                        <p className="text-xs text-gray-500 font-inter truncate">
                          {userInfo.email}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {!loadingUserInfo && (
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${userMenuOpen ? 'rotate-180' : ''}`} />
                )}
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && !loadingUserInfo && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-solvix py-1">
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
                            ID: {user.id.slice(0, 8)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleSectionChange('settings');
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
        </div>
      )}

      {/* Mobile Sidebar - CORRECTION CRITIQUE */}
      {isMobile && (
        <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-solvix-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-solvix-blue">
            <div className="flex items-center">
              <img 
                src="/Logo-Solvix.png" 
                alt="Solvix Logo" 
                className="h-8 w-auto"
              />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-white hover:text-gray-200 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 font-inter ${
                    isActive
                      ? 'bg-solvix-blue text-white shadow-solvix border-l-4 border-solvix-orange'
                      : 'text-gray-600 hover:bg-solvix-light hover:text-solvix-dark'
                  }`}
                >
                  <Icon className={`h-5 w-5 mr-3 flex-shrink-0 ${isActive ? 'text-solvix-orange' : 'text-gray-400'}`} />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile User Profile Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              {loadingUserInfo ? (
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              ) : (
                renderUserAvatar('md')
              )}
              <div className="flex-1 min-w-0">
                {loadingUserInfo ? (
                  <>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-solvix-dark font-inter truncate">
                      {userInfo.name}
                    </p>
                    <p className="text-xs text-gray-500 font-inter truncate">
                      {userInfo.email}
                    </p>
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => {
                  handleSectionChange('settings');
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-solvix-light rounded-lg transition-colors duration-200 font-inter"
              >
                <User className="h-4 w-4 mr-3 text-gray-400" />
                Mon profil
              </button>
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-solvix-error hover:bg-red-50 rounded-lg transition-colors duration-200 font-inter"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-h-screen ${!isMobile ? 'ml-80' : ''}`}>
        {/* Mobile Header */}
        {isMobile && (
          <header className="bg-white shadow-solvix border-b border-gray-200 flex-shrink-0 sticky top-0 z-30">
            <div className="flex items-center justify-between h-16 px-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md text-gray-400 hover:text-solvix-blue hover:bg-solvix-light transition-colors duration-200"
                >
                  <Menu className="h-6 w-6" />
                </button>
                
                <div className="flex items-center space-x-2">
                  <img 
                    src="/Logo-Solvix.png" 
                    alt="Solvix Logo" 
                    className="h-6 w-auto"
                  />
                  <h1 className="text-lg font-semibold text-solvix-dark font-poppins">
                    {getCurrentSectionTitle()}
                  </h1>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!loadingUserInfo && (
                  <div className="relative user-menu-container">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="relative"
                    >
                      {renderUserAvatar('sm')}
                    </button>
                    
                    {userMenuOpen && (
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
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            handleSectionChange('settings');
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
                )}
              </div>
            </div>
          </header>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <header className="bg-white shadow-solvix border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between h-16 px-6">
              <div>
                <h2 className="text-xl font-semibold text-solvix-dark capitalize font-poppins">
                  {getCurrentSectionTitle()}
                </h2>
              </div>

              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500 font-inter">
                  {loadingUserInfo ? (
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  ) : (
                    <span className="text-sm">Dernière connexion: {userInfo.lastConnection}</span>
                  )}
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="w-full max-w-none">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-solvix-lg z-40">
            <div className="flex items-center justify-around py-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 transition-colors duration-200 ${
                      isActive ? 'text-solvix-blue' : 'text-gray-500'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-solvix-blue' : 'text-gray-400'}`} />
                    <span className={`text-xs font-medium font-inter truncate ${isActive ? 'text-solvix-blue' : 'text-gray-500'}`}>
                      {item.mobileLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};

export default Layout;