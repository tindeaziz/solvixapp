import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, FileText, Users, DollarSign, Calendar, Clock, Search, Plus, Eye, Edit, Copy, Trash2, Filter, Download, MoreHorizontal, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Star, AlertTriangle, CheckCircle2, Send, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, getCurrencyByCode } from '../types/currency';
import { useAuth } from '../hooks/useAuth';
import { devisService, profileService, type Devis } from '../lib/supabase';

interface DashboardProps {
  onNavigate?: (section: 'dashboard' | 'create-quote' | 'quote-management' | 'settings') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'quote_number' | 'client' | 'date_creation' | 'subtotal_ht' | 'status' | 'date_expiration'>('date_creation');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Devis | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // États pour les devis réels
  const [quotes, setQuotes] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // État pour la devise par défaut
  const [defaultCurrency, setDefaultCurrency] = useState('EUR');

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Charger les devis et la devise par défaut depuis Supabase
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        console.log('⏳ DASHBOARD - En attente de l\'utilisateur...');
        return;
      }

      setLoading(true);
      setError('');
      console.log('📄 DASHBOARD - Chargement des données pour User ID:', user.id);

      try {
        // Charger le profil pour obtenir la devise par défaut
        const { data: profileData, error: profileError } = await profileService.getProfile();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('❌ DASHBOARD - Erreur chargement profil:', profileError);
        }

        if (profileData?.default_currency) {
          console.log('💰 DASHBOARD - Devise par défaut chargée:', profileData.default_currency);
          setDefaultCurrency(profileData.default_currency);
        }

        // Charger les devis
        const { data, error: fetchError } = await devisService.getDevis();
        
        if (fetchError) {
          console.error('❌ DASHBOARD - Erreur chargement devis:', fetchError);
          setError('Erreur lors du chargement des devis: ' + fetchError.message);
          return;
        }

        console.log('✅ DASHBOARD - Devis chargés:', data?.length || 0, 'devis trouvés');
        setQuotes(data || []);
      } catch (error) {
        console.error('❌ DASHBOARD - Exception chargement:', error);
        setError('Une erreur est survenue lors du chargement des devis');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Calcul des compteurs basé sur les données réelles
  const counters = useMemo(() => {
    const total = quotes.length;
    const pending = quotes.filter(q => q.status === 'En attente').length;
    const accepted = quotes.filter(q => q.status === 'Accepté').length;
    const sent = quotes.filter(q => q.status === 'Envoyé').length;
    const draft = quotes.filter(q => q.status === 'Brouillon').length;
    const rejected = quotes.filter(q => q.status === 'Refusé').length;

    return { total, pending, accepted, sent, draft, rejected };
  }, [quotes]);

  // Calcul du chiffre d'affaires total (devis acceptés) avec la devise par défaut
  const totalRevenue = useMemo(() => {
    return quotes
      .filter(q => q.status === 'Accepté')
      .reduce((sum, q) => {
        if (q.currency === defaultCurrency) {
          return sum + q.total_ttc;
        }
        return sum + q.total_ttc;
      }, 0);
  }, [quotes, defaultCurrency]);

  const stats = [
    {
      name: 'Devis créés ce mois',
      value: counters.total.toString(),
      change: '+12%',
      changeType: 'positive',
      icon: FileText,
      color: 'blue',
      description: 'Total des devis générés'
    },
    {
      name: 'Chiffre d\'affaires',
      value: formatCurrency(totalRevenue, defaultCurrency),
      change: '+8%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'green',
      description: 'Revenus des devis acceptés'
    },
    {
      name: 'Clients actifs',
      value: new Set(quotes.map(q => q.client_id).filter(Boolean)).size.toString(),
      change: '+3%',
      changeType: 'positive',
      icon: Users,
      color: 'purple',
      description: 'Clients avec devis actifs'
    },
    {
      name: 'Taux de conversion',
      value: `${Math.round((quotes.filter(q => q.status === 'Accepté').length / Math.max(1, quotes.filter(q => q.status !== 'Brouillon').length)) * 100)}%`,
      change: '-2%',
      changeType: 'negative',
      icon: TrendingUp,
      color: 'orange',
      description: 'Devis acceptés / envoyés'
    },
  ];

  // Filtrage et tri des devis
  const filteredAndSortedQuotes = useMemo(() => {
    let filtered = quotes.filter(quote => {
      const matchesSearch = 
        quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quote.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quote.client?.company || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const quoteDate = new Date(quote.date_creation);
        const now = new Date();
        
        switch (dateFilter) {
          case 'today':
            matchesDate = quoteDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = quoteDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = quoteDate >= monthAgo;
            break;
          case 'quarter':
            const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            matchesDate = quoteDate >= quarterAgo;
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });

    // Tri
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'client') {
        aValue = a.client?.name || '';
        bValue = b.client?.name || '';
      }

      if (sortField === 'date_creation' || sortField === 'date_expiration') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortField === 'subtotal_ht') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [quotes, searchTerm, statusFilter, dateFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedQuotes.length / itemsPerPage);
  const paginatedQuotes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedQuotes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedQuotes, currentPage, itemsPerPage]);

  const handleSort = (field: 'quote_number' | 'client' | 'date_creation' | 'subtotal_ht' | 'status' | 'date_expiration') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleNewQuoteClick = () => {
    if (onNavigate) {
      onNavigate('create-quote');
    }
  };

  const handleViewAllQuotes = () => {
    if (onNavigate) {
      onNavigate('quote-management');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Brouillon':
        return {
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: Edit,
          dotColor: 'bg-gray-400'
        };
      case 'Envoyé':
        return {
          color: 'bg-blue-100 text-solvix-blue border-blue-200',
          icon: Send,
          dotColor: 'bg-solvix-blue'
        };
      case 'En attente':
        return {
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: Clock,
          dotColor: 'bg-yellow-500'
        };
      case 'Accepté':
        return {
          color: 'bg-green-100 text-solvix-success border-green-200',
          icon: CheckCircle2,
          dotColor: 'bg-solvix-success'
        };
      case 'Refusé':
        return {
          color: 'bg-red-100 text-solvix-error border-red-200',
          icon: AlertTriangle,
          dotColor: 'bg-solvix-error'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: Edit,
          dotColor: 'bg-gray-400'
        };
    }
  };

  const handleMenuAction = (action: string, quote: Devis) => {
    console.log(`🔧 DASHBOARD - Action "${action}" sur le devis:`, quote.quote_number);
    setShowActionMenu(null);
    
    switch (action) {
      case 'voir':
        console.log('👁️ DASHBOARD - Voir devis:', quote.quote_number);
        handleView(quote);
        break;
      case 'modifier':
        console.log('✏️ DASHBOARD - Modifier devis:', quote.quote_number);
        navigate(`/devis/edit/${quote.id}`);
        break;
      case 'dupliquer':
        console.log('📋 DASHBOARD - Dupliquer devis:', quote.quote_number);
        handleDuplicate(quote);
        break;
      case 'telecharger':
        console.log('💾 DASHBOARD - Télécharger devis:', quote.quote_number);
        handleView(quote);
        break;
      case 'supprimer':
        console.log('🗑️ DASHBOARD - Supprimer devis:', quote.quote_number);
        handleDelete(quote);
        break;
      default:
        console.warn('❓ DASHBOARD - Action inconnue:', action);
    }
  };

  const handleView = async (quote: Devis) => {
    console.log('👁️ DASHBOARD - Préparation aperçu pour devis:', quote.quote_number);
    
    try {
      const { data: fullQuote, error } = await devisService.getDevisById(quote.id);
      
      if (error || !fullQuote) {
        console.error('❌ DASHBOARD - Erreur récupération devis complet:', error);
        navigate(`/devis/preview/${quote.id}`);
        return;
      }

      const { data: profileData } = await profileService.getProfile();
      
      const devisData = {
        articles: (fullQuote.articles || []).map(article => ({
          id: article.id,
          designation: article.designation,
          quantity: article.quantity,
          unitPrice: article.unit_price,
          vatRate: article.vat_rate,
          total: article.total_ht
        })),
        client: {
          name: fullQuote.client?.name || 'Client non défini',
          company: fullQuote.client?.company || '',
          email: fullQuote.client?.email || '',
          phone: fullQuote.client?.phone || '',
          address: fullQuote.client?.address || ''
        },
        entreprise: {
          name: profileData?.company_name || 'Mon Entreprise',
          address: profileData?.company_address || 'Adresse à renseigner',
          phone: profileData?.company_phone || 'Téléphone à renseigner',
          email: profileData?.company_email || 'Email à renseigner',
          logo: profileData?.company_logo || undefined,
          signature: profileData?.company_signature || undefined
        },
        numeroDevis: fullQuote.quote_number,
        dateCreation: fullQuote.date_creation,
        dateExpiration: fullQuote.date_expiration,
        devise: fullQuote.currency,
        notes: fullQuote.notes,
        template: fullQuote.template,
        sousTotal: fullQuote.subtotal_ht,
        totalTVA: fullQuote.total_vat,
        totalTTC: fullQuote.total_ttc
      };

      navigate(`/devis/preview/${quote.id}`, { state: devisData });
      
    } catch (error) {
      console.error('❌ DASHBOARD - Exception lors de la préparation de l\'aperçu:', error);
      navigate(`/devis/preview/${quote.id}`);
    }
  };

  const handleEdit = (quote: Devis) => {
    handleMenuAction('modifier', quote);
  };

  const handleDuplicate = async (quote: Devis) => {
    try {
      const newNumber = await devisService.generateQuoteNumber();
      
      const duplicatedQuote: Omit<Devis, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
        quote_number: newNumber,
        date_creation: new Date().toISOString().split('T')[0],
        date_expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: quote.currency,
        template: quote.template,
        notes: quote.notes,
        status: 'Brouillon',
        subtotal_ht: 0,
        total_vat: 0,
        total_ttc: 0,
        client_id: quote.client_id
      };

      const { data: newQuote, error } = await devisService.createDevis(duplicatedQuote);
      
      if (error) {
        console.error('❌ DASHBOARD - Erreur duplication:', error);
        return;
      }

      console.log('✅ DASHBOARD - Devis dupliqué avec succès:', newNumber);
      
      const { data: updatedQuotes } = await devisService.getDevis();
      setQuotes(updatedQuotes || []);
      
    } catch (error) {
      console.error('❌ DASHBOARD - Exception duplication:', error);
    }
  };

  const handleDelete = (quote: Devis) => {
    setQuoteToDelete(quote);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!quoteToDelete) return;

    try {
      const { error } = await devisService.deleteDevis(quoteToDelete.id);
      
      if (error) {
        console.error('❌ DASHBOARD - Erreur suppression:', error);
        return;
      }

      setQuotes(prev => prev.filter(q => q.id !== quoteToDelete.id));
      console.log('✅ DASHBOARD - Devis supprimé:', quoteToDelete.quote_number);
    } catch (error) {
      console.error('❌ DASHBOARD - Exception suppression:', error);
    } finally {
      setShowDeleteModal(false);
      setQuoteToDelete(null);
    }
  };

  const handleDownload = (quote: Devis) => {
    handleMenuAction('telecharger', quote);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getSortIcon = (field: 'quote_number' | 'client' | 'date_creation' | 'subtotal_ht' | 'status' | 'date_expiration') => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // Affichage de chargement
  if (loading) {
    return (
      <div className="w-full-safe space-y-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-solvix-blue border-t-transparent mx-auto mb-4"></div>
            <p className="text-solvix-dark font-inter">Chargement du dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="w-full-safe space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full-safe space-y-8">
      {/* Welcome Section - Mobile Optimized */}
      <div className="welcome-card relative bg-gradient-to-br from-solvix-blue via-solvix-blue-dark to-solvix-blue text-white shadow-solvix-lg overflow-hidden">
        {/* Motif de fond décoratif - Adapté mobile */}
        <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-white to-transparent rounded-full transform translate-x-8 sm:translate-x-16 -translate-y-8 sm:-translate-y-16"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-16 sm:w-32 h-16 sm:h-32 opacity-10">
          <div className="w-full h-full bg-gradient-to-tr from-white to-transparent rounded-full transform -translate-x-4 sm:-translate-x-8 translate-y-4 sm:translate-y-8"></div>
        </div>
        
        <div className="relative flex-container-safe">
          <div className="space-y-4 flex-item-safe">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm self-start">
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold font-poppins">Bienvenue sur Solvix</h1>
                <p className="text-blue-100 text-sm sm:text-lg font-inter mt-1">
                  Gérez vos devis facilement et efficacement
                </p>
              </div>
            </div>
            
            <div className="info-section">
              <div className="date-info flex items-center space-x-2 bg-white/10 rounded-lg px-2 sm:px-3 py-1 sm:py-2 backdrop-blur-sm">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-inter text-xs sm:text-sm">{new Date().toLocaleDateString('fr-FR', { 
                  weekday: isMobile ? 'short' : 'long', 
                  year: 'numeric', 
                  month: isMobile ? 'short' : 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="version-info flex items-center space-x-2 bg-white/10 rounded-lg px-2 sm:px-3 py-1 sm:py-2 backdrop-blur-sm">
                <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-inter text-xs sm:text-sm">Version Pro</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 lg:mt-0 lg:ml-8">
            <button
              onClick={handleNewQuoteClick}
              className="new-quote-btn group bg-solvix-orange hover:bg-solvix-orange-dark text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-inter flex items-center justify-center space-x-2 sm:space-x-3"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Nouveau devis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compteurs - Grille responsive mobile */}
      <div className="stats-grid">
        {[
          { label: 'Total', value: counters.total, icon: FileText, color: 'blue' },
          { label: 'En attente', value: counters.pending, icon: Clock, color: 'yellow' },
          { label: 'Acceptés', value: counters.accepted, icon: CheckCircle2, color: 'green' },
          { label: 'Envoyés', value: counters.sent, icon: Send, color: 'blue' },
          { label: 'Brouillons', value: counters.draft, icon: Edit, color: 'gray' },
          { label: 'Refusés', value: counters.rejected, icon: AlertTriangle, color: 'red' }
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="stat-card group bg-white rounded-lg sm:rounded-xl shadow-solvix border border-gray-200 hover:shadow-solvix-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 font-inter truncate">{item.label}</p>
                  <p className="stat-value font-bold text-solvix-dark font-poppins mt-1 group-hover:scale-110 transition-transform duration-300">{item.value}</p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 group-hover:scale-110 flex-shrink-0 ${
                  item.color === 'blue' ? 'bg-blue-50 group-hover:bg-blue-100' :
                  item.color === 'yellow' ? 'bg-yellow-50 group-hover:bg-yellow-100' :
                  item.color === 'green' ? 'bg-green-50 group-hover:bg-green-100' :
                  item.color === 'gray' ? 'bg-gray-50 group-hover:bg-gray-100' :
                  'bg-red-50 group-hover:bg-red-100'
                }`}>
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    item.color === 'blue' ? 'text-solvix-blue' :
                    item.color === 'yellow' ? 'text-solvix-warning' :
                    item.color === 'green' ? 'text-solvix-success' :
                    item.color === 'gray' ? 'text-gray-600' :
                    'text-solvix-error'
                  }`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Grid - Mobile Optimized */}
      <div className="bottom-stats">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bottom-card group bg-white rounded-lg sm:rounded-xl shadow-solvix border border-gray-200 hover:shadow-solvix-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              {/* Gradient de fond subtil */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${
                stat.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                stat.color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                stat.color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                'bg-gradient-to-br from-orange-500 to-orange-600'
              }`}></div>
              
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 font-inter mb-1 truncate">{stat.name}</p>
                    <p className="text-xs text-gray-500 font-inter">{stat.description}</p>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 group-hover:scale-110 flex-shrink-0 ${
                    stat.color === 'blue' ? 'bg-blue-50 group-hover:bg-blue-100' :
                    stat.color === 'green' ? 'bg-green-50 group-hover:bg-green-100' :
                    stat.color === 'purple' ? 'bg-purple-50 group-hover:bg-purple-100' :
                    'bg-orange-50 group-hover:bg-orange-100'
                  }`}>
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      stat.color === 'blue' ? 'text-solvix-blue' :
                      stat.color === 'green' ? 'text-solvix-success' :
                      stat.color === 'purple' ? 'text-purple-600' :
                      'text-solvix-orange'
                    }`} />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="stat-value font-bold text-solvix-dark font-poppins group-hover:scale-105 transition-transform duration-300 truncate">{stat.value}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center text-xs sm:text-sm font-medium font-inter px-2 py-1 rounded-full ${
                      stat.changeType === 'positive' 
                        ? 'text-solvix-success bg-green-50' 
                        : 'text-solvix-error bg-red-50'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-gray-500 font-inter">vs mois dernier</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quotes Management - Mobile Optimized */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-solvix border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200">
          <div className="flex-container-safe">
            <div className="flex items-center space-x-3 sm:space-x-4 flex-item-safe">
              <div className="p-2 sm:p-3 bg-solvix-blue rounded-lg sm:rounded-xl">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-solvix-dark font-poppins">Devis récents</h3>
                <p className="text-sm text-gray-500 font-inter">
                  {filteredAndSortedQuotes.length} devis trouvé{filteredAndSortedQuotes.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4 lg:mt-0">
              <button
                onClick={handleViewAllQuotes}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-solvix-light transition-colors duration-200 font-inter"
              >
                <span className="hidden sm:inline">Voir tous les devis</span>
                <span className="sm:hidden">Tous</span>
              </button>
              <button
                onClick={handleNewQuoteClick}
                className="group inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-solvix-orange text-white rounded-lg sm:rounded-xl font-semibold hover:bg-solvix-orange-dark focus:outline-none focus:ring-2 focus:ring-solvix-orange focus:ring-offset-2 transition-all duration-200 font-inter shadow-solvix hover:shadow-solvix-lg transform hover:scale-105"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                <span className="hidden sm:inline">Nouveau devis</span>
                <span className="sm:hidden">Nouveau</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table - Mobile Responsive */}
        <div className="table-container">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-solvix-light">
              <tr>
                {[
                  { field: 'quote_number' as const, label: 'N° Devis', mobile: 'N°' },
                  { field: 'client' as const, label: 'Client', mobile: 'Client' },
                  { field: 'date_creation' as const, label: 'Date', mobile: 'Date' },
                  { field: 'subtotal_ht' as const, label: 'Montant', mobile: 'Montant' },
                  { field: 'status' as const, label: 'Statut', mobile: 'Statut' },
                  { field: 'date_expiration' as const, label: 'Expiration', mobile: 'Exp.' },
                  { field: 'actions' as const, label: 'Actions', mobile: '' }
                ].map((header) => (
                  <th 
                    key={header.field}
                    className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-inter ${
                      header.field !== 'actions' ? 'cursor-pointer hover:bg-gray-100 transition-colors duration-200 group' : ''
                    }`}
                    onClick={() => header.field !== 'actions' && handleSort(header.field)}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`${header.field !== 'actions' ? "group-hover:text-solvix-blue transition-colors duration-200" : ""} hidden sm:inline`}>
                        {header.label}
                      </span>
                      <span className={`${header.field !== 'actions' ? "group-hover:text-solvix-blue transition-colors duration-200" : ""} sm:hidden`}>
                        {header.mobile}
                      </span>
                      {header.field !== 'actions' && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {getSortIcon(header.field)}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedQuotes.slice(0, 5).map((quote, index) => {
                const statusConfig = getStatusConfig(quote.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <tr key={quote.id} className={`group hover:bg-gradient-to-r hover:from-solvix-light hover:to-blue-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-2 h-2 bg-solvix-blue rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                        <div className="text-xs sm:text-sm font-semibold text-solvix-dark font-inter group-hover:text-solvix-blue transition-colors duration-200 truncate max-w-20 sm:max-w-none">
                          {quote.quote_number}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-solvix-dark font-inter truncate max-w-24 sm:max-w-none">
                          {quote.client?.name || 'Client non défini'}
                        </div>
                        <div className="text-xs text-gray-500 font-inter truncate max-w-24 sm:max-w-none hidden sm:block">
                          {quote.client?.company || ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-solvix-dark font-inter">
                      <span className="hidden sm:inline">{formatDate(quote.date_creation)}</span>
                      <span className="sm:hidden">{new Date(quote.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-bold text-solvix-dark font-montserrat bg-gray-50 px-2 sm:px-3 py-1 rounded-lg inline-block">
                        <span className="hidden sm:inline">{formatCurrency(quote.subtotal_ht, quote.currency)}</span>
                        <span className="sm:hidden">{Math.round(quote.subtotal_ht)}{quote.currency === 'EUR' ? '€' : quote.currency}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2 sm:px-3 py-1 text-xs font-medium rounded-full border font-inter ${statusConfig.color}`}>
                        <div className={`w-2 h-2 rounded-full mr-1 sm:mr-2 ${statusConfig.dotColor}`}></div>
                        <StatusIcon className="h-3 w-3 mr-1 hidden sm:inline" />
                        <span className="truncate max-w-16 sm:max-w-none">{quote.status}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 font-inter">
                      <span className="hidden sm:inline">{formatDate(quote.date_expiration)}</span>
                      <span className="sm:hidden">{new Date(quote.date_expiration).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleView(quote)}
                          className="p-1 sm:p-2 text-gray-500 hover:text-solvix-blue hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Voir / Imprimer"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(quote)}
                          className="p-1 sm:p-2 text-gray-500 hover:text-solvix-blue hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Modifier"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(quote)}
                          className="p-1 sm:p-2 text-gray-500 hover:text-solvix-blue hover:bg-blue-50 rounded-lg transition-colors duration-200 hidden sm:inline-flex"
                          title="Dupliquer"
                        >
                          <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(quote)}
                          className="p-1 sm:p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Voir tous les devis */}
          <div className="text-center py-4 border-t border-gray-100">
            <button
              onClick={handleViewAllQuotes}
              className="inline-flex items-center px-4 py-2 text-solvix-blue hover:text-solvix-blue-dark font-medium transition-colors duration-200 font-inter"
            >
              Voir tous les devis
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal - Mobile Optimized */}
      {showDeleteModal && quoteToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
            
            <div className="modal-container inline-block align-bottom bg-white rounded-xl sm:rounded-2xl text-left overflow-hidden shadow-solvix-lg transform transition-all sm:my-8 sm:align-middle mx-4 animate-in zoom-in-95 duration-300">
              <div className="bg-white px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:p-8 sm:pb-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-red-100 sm:mx-0 sm:h-12 sm:w-12">
                    <Trash2 className="h-6 w-6 sm:h-8 sm:w-8 text-solvix-error sm:h-6 sm:w-6" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg sm:text-xl leading-6 font-bold text-solvix-dark font-poppins">
                      Supprimer le devis
                    </h3>
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 font-inter leading-relaxed">
                        Êtes-vous sûr de vouloir supprimer le devis <span className="font-semibold text-solvix-dark">{quoteToDelete.quote_number}</span> ? 
                      </p>
                      <p className="text-sm text-solvix-error font-medium mt-2">
                        Cette action est irréversible.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-solvix-light px-4 sm:px-6 py-3 sm:py-4 sm:px-8 sm:flex sm:flex-row-reverse sm:space-x-reverse sm:space-x-3">
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="w-full inline-flex justify-center rounded-lg sm:rounded-xl border border-transparent shadow-sm px-4 sm:px-6 py-2 sm:py-3 bg-solvix-error text-base font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-solvix-error sm:w-auto sm:text-sm transition-all duration-200 font-inter transform hover:scale-105"
                >
                  Supprimer définitivement
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-lg sm:rounded-xl border border-gray-300 shadow-sm px-4 sm:px-6 py-2 sm:py-3 bg-white text-base font-medium text-gray-700 hover:bg-solvix-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-solvix-blue sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200 font-inter"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside handler for action menu */}
      {showActionMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowActionMenu(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;