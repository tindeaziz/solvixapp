import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  Edit, 
  Copy, 
  Trash2, 
  Plus,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  ArrowLeft,
  Download
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { devisService, clientService, profileService, type Devis } from '../lib/supabase';
import { formatCurrency } from '../types/currency';

type SortField = 'quote_number' | 'client' | 'date_creation' | 'subtotal_ht' | 'status' | 'date_expiration';
type SortDirection = 'asc' | 'desc';

const QuoteManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // États pour les données
  const [quotes, setQuotes] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // États pour les filtres et tri
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date_creation');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // États pour l'interface
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Devis | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // État pour la devise par défaut
  const [defaultCurrency, setDefaultCurrency] = useState('EUR');

  // Charger les devis et la devise par défaut au montage
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        console.log('⏳ QUOTE_MANAGEMENT - En attente de l\'utilisateur...');
        return;
      }

      setLoading(true);
      setError('');
      console.log('📄 QUOTE_MANAGEMENT - Chargement des données pour User ID:', user.id);

      try {
        // Charger le profil pour obtenir la devise par défaut
        const { data: profileData, error: profileError } = await profileService.getProfile();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('❌ QUOTE_MANAGEMENT - Erreur chargement profil:', profileError);
        }

        if (profileData?.default_currency) {
          console.log('💰 QUOTE_MANAGEMENT - Devise par défaut chargée:', profileData.default_currency);
          setDefaultCurrency(profileData.default_currency);
        }

        // Charger les devis
        const { data, error: fetchError } = await devisService.getDevis();
        
        if (fetchError) {
          console.error('❌ QUOTE_MANAGEMENT - Erreur chargement devis:', fetchError);
          setError('Erreur lors du chargement des devis: ' + fetchError.message);
          return;
        }

        console.log('✅ QUOTE_MANAGEMENT - Devis chargés:', data?.length || 0, 'devis trouvés');
        setQuotes(data || []);
      } catch (error) {
        console.error('❌ QUOTE_MANAGEMENT - Exception chargement:', error);
        setError('Une erreur est survenue lors du chargement des devis');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Fonction de tri
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtrage et tri des devis
  const filteredAndSortedQuotes = React.useMemo(() => {
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
  const paginatedQuotes = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedQuotes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedQuotes, currentPage, itemsPerPage]);

  // Gestionnaires d'actions
  const handleView = (quote: Devis) => {
    console.log('👁️ QUOTE_MANAGEMENT - Voir devis:', quote.quote_number);
    navigate(`/devis/preview/${quote.id}`);
  };

  const handleEdit = (quote: Devis) => {
    console.log('✏️ QUOTE_MANAGEMENT - Modifier devis:', quote.quote_number);
    navigate(`/devis/edit/${quote.id}`);
  };

  const handleDuplicate = async (quote: Devis) => {
    console.log('📋 QUOTE_MANAGEMENT - Dupliquer devis:', quote.quote_number);
    
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
        console.error('❌ QUOTE_MANAGEMENT - Erreur duplication:', error);
        setError('Erreur lors de la duplication du devis');
        return;
      }

      console.log('✅ QUOTE_MANAGEMENT - Devis dupliqué avec succès:', newNumber);
      
      const { data: updatedQuotes } = await devisService.getDevis();
      setQuotes(updatedQuotes || []);
      
    } catch (error) {
      console.error('❌ QUOTE_MANAGEMENT - Exception duplication:', error);
      setError('Une erreur est survenue lors de la duplication');
    }
  };

  const handleDelete = (quote: Devis) => {
    setQuoteToDelete(quote);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!quoteToDelete) return;

    setIsDeleting(true);
    console.log('🗑️ QUOTE_MANAGEMENT - Suppression devis:', quoteToDelete.quote_number);

    try {
      const { error } = await devisService.deleteDevis(quoteToDelete.id);
      
      if (error) {
        console.error('❌ QUOTE_MANAGEMENT - Erreur suppression:', error);
        setError('Erreur lors de la suppression du devis');
        return;
      }

      console.log('✅ QUOTE_MANAGEMENT - Devis supprimé avec succès');
      
      setQuotes(prev => prev.filter(q => q.id !== quoteToDelete.id));
      
    } catch (error) {
      console.error('❌ QUOTE_MANAGEMENT - Exception suppression:', error);
      setError('Une erreur est survenue lors de la suppression');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setQuoteToDelete(null);
    }
  };

  const handleNewQuote = () => {
    navigate('/');
  };

  // Configuration des statuts
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
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: Send,
          dotColor: 'bg-blue-500'
        };
      case 'En attente':
        return {
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: Clock,
          dotColor: 'bg-yellow-500'
        };
      case 'Accepté':
        return {
          color: 'bg-green-100 text-green-700 border-green-200',
          icon: CheckCircle2,
          dotColor: 'bg-green-500'
        };
      case 'Refusé':
        return {
          color: 'bg-red-100 text-red-700 border-red-200',
          icon: AlertTriangle,
          dotColor: 'bg-red-500'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: Edit,
          dotColor: 'bg-gray-400'
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // Pagination responsive
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 space-y-3 sm:space-y-0">
        <div className="flex items-center text-sm text-gray-500 font-inter">
          Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredAndSortedQuotes.length)} sur {filteredAndSortedQuotes.length} résultats
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-solvix-light disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-inter hover:shadow-sm"
          >
            <ChevronDown className="h-4 w-4 mr-1 rotate-90" />
            <span className="hidden sm:inline">Précédent</span>
          </button>

          <div className="flex space-x-1">
            {startPage > 1 && (
              <>
                <button
                  onClick={() => setCurrentPage(1)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-solvix-light transition-all duration-200 font-inter hover:shadow-sm"
                >
                  1
                </button>
                {startPage > 2 && <span className="px-2 py-2 text-gray-500 font-inter">...</span>}
              </>
            )}

            {pages.map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 border rounded-lg text-sm font-medium transition-all duration-200 font-inter hover:shadow-sm ${
                  currentPage === page
                    ? 'bg-solvix-blue text-white border-solvix-blue shadow-solvix'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-solvix-light'
                }`}
              >
                {page}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && <span className="px-2 py-2 text-gray-500 font-inter">...</span>}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-solvix-light transition-all duration-200 font-inter hover:shadow-sm"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-solvix-light disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-inter hover:shadow-sm"
          >
            <span className="hidden sm:inline">Suivant</span>
            <ChevronDown className="h-4 w-4 ml-1 -rotate-90" />
          </button>
        </div>
      </div>
    );
  };

  // Affichage de chargement
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-solvix-blue border-t-transparent mx-auto mb-4"></div>
            <p className="text-solvix-dark font-inter">Chargement des devis...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header - Responsive */}
      <div className="bg-white rounded-xl shadow-solvix border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-400 hover:text-solvix-blue rounded-lg hover:bg-solvix-light transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-solvix-blue" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-solvix-dark font-poppins">Gestion des devis</h1>
                <p className="text-gray-600 font-inter text-sm sm:text-base">
                  {filteredAndSortedQuotes.length} devis trouvé{filteredAndSortedQuotes.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleNewQuote}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-solvix-orange text-white rounded-xl font-semibold hover:bg-solvix-orange-dark transition-colors duration-200 font-inter shadow-solvix"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouveau devis
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Filtres - Responsive */}
      <div className="bg-white rounded-xl shadow-solvix border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
          {/* Barre de recherche */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher par numéro, client ou entreprise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent font-inter"
            />
          </div>

          {/* Filtres */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent bg-white min-w-[160px] font-inter"
              >
                <option value="all">Tous les statuts</option>
                <option value="Brouillon">Brouillon</option>
                <option value="Envoyé">Envoyé</option>
                <option value="En attente">En attente</option>
                <option value="Accepté">Accepté</option>
                <option value="Refusé">Refusé</option>
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent bg-white min-w-[140px] font-inter"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="quarter">Ce trimestre</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des devis - Responsive */}
      <div className="bg-white rounded-xl shadow-solvix border border-gray-200 overflow-hidden">
        {filteredAndSortedQuotes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gradient-to-r from-gray-50 to-solvix-light">
                <tr>
                  {[
                    { field: 'quote_number' as SortField, label: 'N° Devis' },
                    { field: 'client' as SortField, label: 'Client' },
                    { field: 'date_creation' as SortField, label: 'Date création' },
                    { field: 'subtotal_ht' as SortField, label: 'Montant HT' },
                    { field: 'status' as SortField, label: 'Statut' },
                    { field: 'date_expiration' as SortField, label: 'Expiration' },
                    { field: 'actions' as any, label: 'Actions' }
                  ].map((header) => (
                    <th 
                      key={header.field}
                      className={`px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-inter ${
                        header.field !== 'actions' ? 'cursor-pointer hover:bg-gray-100 transition-colors duration-200 group' : ''
                      }`}
                      onClick={() => header.field !== 'actions' && handleSort(header.field)}
                    >
                      <div className="flex items-center space-x-2">
                        <span className={header.field !== 'actions' ? "group-hover:text-solvix-blue transition-colors duration-200" : ""}>{header.label}</span>
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
                {paginatedQuotes.map((quote, index) => {
                  const statusConfig = getStatusConfig(quote.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <tr key={quote.id} className={`group hover:bg-gradient-to-r hover:from-solvix-light hover:to-blue-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-solvix-blue rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                          <div className="text-sm font-semibold text-solvix-dark font-inter group-hover:text-solvix-blue transition-colors duration-200">
                            {quote.quote_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-solvix-dark font-inter">
                            {quote.client?.name || 'Client non défini'}
                          </div>
                          <div className="text-xs text-gray-500 font-inter">
                            {quote.client?.company || ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-solvix-dark font-inter">
                        {formatDate(quote.date_creation)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-solvix-dark font-montserrat bg-gray-50 px-3 py-1 rounded-lg inline-block">
                          {formatCurrency(quote.subtotal_ht, quote.currency)}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2 sm:px-3 py-1 text-xs font-medium rounded-full border font-inter ${statusConfig.color}`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${statusConfig.dotColor}`}></div>
                          <StatusIcon className="h-3 w-3 mr-1 hidden sm:inline" />
                          {quote.status}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-inter">
                        {formatDate(quote.date_expiration)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleView(quote)}
                            className="p-1 sm:p-2 text-gray-500 hover:text-solvix-blue hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="Voir / Imprimer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(quote)}
                            className="p-1 sm:p-2 text-gray-500 hover:text-solvix-blue hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(quote)}
                            className="p-1 sm:p-2 text-gray-500 hover:text-solvix-blue hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="Dupliquer"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(quote)}
                            className="p-1 sm:p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Pagination */}
            {renderPagination()}
          </div>
        ) : (
          /* État vide - Responsive */
          <div className="text-center py-12 sm:py-16 bg-gradient-to-b from-white to-gray-50 px-4">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-solvix-dark mb-2 sm:mb-3 font-poppins">Aucun devis trouvé</h3>
              <p className="text-gray-500 mb-6 sm:mb-8 font-inter leading-relaxed text-sm sm:text-base">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Aucun devis ne correspond à vos critères de recherche. Essayez de modifier vos filtres.'
                  : 'Vous n\'avez pas encore créé de devis. Commencez par créer votre premier devis professionnel.'
                }
              </p>
              {(!searchTerm && statusFilter === 'all' && dateFilter === 'all') && (
                <button
                  onClick={handleNewQuote}
                  className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-solvix-orange text-white rounded-xl font-semibold hover:bg-solvix-orange-dark transition-all duration-200 font-inter shadow-solvix"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Créer mon premier devis
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression - Responsive */}
      {showDeleteModal && quoteToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity backdrop-blur-sm" onClick={() => !isDeleting && setShowDeleteModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-xl sm:rounded-2xl text-left overflow-hidden shadow-solvix-lg transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full mx-4">
              <div className="bg-white px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:p-8 sm:pb-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-12 sm:w-12">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg sm:text-xl leading-6 font-bold text-solvix-dark font-poppins">
                      Supprimer le devis
                    </h3>
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 font-inter leading-relaxed">
                        Êtes-vous sûr de vouloir supprimer le devis <span className="font-semibold text-solvix-dark">{quoteToDelete.quote_number}</span> ? 
                      </p>
                      <p className="text-sm text-red-600 font-medium mt-2">
                        Cette action est irréversible.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 sm:px-8 sm:flex sm:flex-row-reverse sm:space-x-reverse sm:space-x-3">
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-base font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm transition-all duration-200 font-inter disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    'Supprimer définitivement'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 sm:px-6 py-2 sm:py-3 bg-white text-base font-medium text-gray-700 hover:bg-solvix-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-solvix-blue sm:w-auto sm:text-sm transition-all duration-200 font-inter disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteManagement;