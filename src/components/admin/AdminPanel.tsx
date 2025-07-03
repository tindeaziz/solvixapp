import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  Download, 
  Copy, 
  Zap, 
  RefreshCw, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Lock,
  Users,
  DollarSign,
  FileText,
  Clipboard,
  Calendar,
  Ban,
  ShieldOff,
  Smartphone
} from 'lucide-react';
import { codeManager } from '../../utils/security';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [codes, setCodes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [batchSize, setBatchSize] = useState(10);
  const [customerContact, setCustomerContact] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [selectedCode, setSelectedCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'code'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  // Check if user is admin when component mounts or user changes
  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated]);

  const checkAdminStatus = async () => {
    setIsCheckingAuth(true);
    try {
      if (!user) {
        setIsAuthenticated(false);
        setMessage('Vous devez être connecté pour accéder au panneau d\'administration');
        setMessageType('error');
        setIsCheckingAuth(false);
        return;
      }

      // Check if user has admin privileges by calling the is_admin function
      const { data, error } = await supabase.rpc('is_admin', { user_id: user.id });
      
      if (error) {
        console.error('Erreur lors de la vérification des privilèges admin:', error);
        setIsAuthenticated(false);
        setMessage('Erreur lors de la vérification des privilèges administrateur');
        setMessageType('error');
      } else if (data === true) {
        setIsAuthenticated(true);
        setMessage('');
      } else {
        setIsAuthenticated(false);
        setMessage('Accès refusé: Privilèges administrateur requis');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Exception lors de la vérification admin:', error);
      setIsAuthenticated(false);
      setMessage('Erreur lors de la vérification des privilèges');
      setMessageType('error');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      // Récupérer les codes depuis la base de données
      const allCodes = await codeManager.getAllCodes();
      setCodes(allCodes);
      
      // Récupérer les statistiques
      const statsData = await codeManager.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setMessage('Erreur lors du chargement des données');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const generateSingleCode = async () => {
    setLoading(true);
    try {
      const newCode = await codeManager.generateCode();
      if (newCode) {
        await refreshData();
        setMessage(`Code généré: ${newCode}`);
        setMessageType('success');
      } else {
        setMessage('Erreur lors de la génération du code');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erreur lors de la génération du code:', error);
      setMessage('Erreur lors de la génération du code');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const generateBatchCodes = async () => {
    setLoading(true);
    try {
      const newCodes = await codeManager.generateBatch(batchSize);
      if (newCodes.length > 0) {
        await refreshData();
        setMessage(`${newCodes.length} codes générés avec succès`);
        setMessageType('success');
      } else {
        setMessage('Erreur lors de la génération des codes');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erreur lors de la génération des codes:', error);
      setMessage('Erreur lors de la génération des codes');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSold = (code: string) => {
    setSelectedCode(code);
    setCustomerContact('');
    setShowCustomerForm(true);
    setShowRevokeModal(false);
  };

  const handleRevokeCode = (code: string) => {
    setSelectedCode(code);
    setRevokeReason('');
    setShowRevokeModal(true);
    setShowCustomerForm(false);
  };

  const confirmRevokeCode = async () => {
    if (!selectedCode) return;
    
    setLoading(true);
    try {
      const success = await codeManager.revokeCode(selectedCode, revokeReason);
      if (success) {
        await refreshData();
        setMessage(`Code ${selectedCode} révoqué avec succès`);
        setMessageType('success');
        setShowRevokeModal(false);
      } else {
        setMessage('Erreur: Impossible de révoquer ce code');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erreur lors de la révocation du code:', error);
      setMessage('Erreur: Impossible de révoquer ce code');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const confirmMarkAsSold = async () => {
    if (!customerContact.trim()) {
      setMessage('Le contact client est requis');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const success = await codeManager.markAsSold(selectedCode, customerContact);
      if (success) {
        await refreshData();
        setMessage(`Code ${selectedCode} marqué comme vendu à ${customerContact}`);
        setMessageType('success');
        setShowCustomerForm(false);
      } else {
        setMessage('Erreur: Impossible de marquer ce code comme vendu');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erreur lors du marquage du code comme vendu:', error);
      setMessage('Erreur: Impossible de marquer ce code comme vendu');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage(`Code copié: ${text}`);
    setMessageType('success');
    setTimeout(() => setMessage(''), 2000);
  };

  const exportCodes = async () => {
    try {
      const csv = await codeManager.exportToCSV();
      if (!csv) {
        setMessage('Erreur lors de l\'export des codes');
        setMessageType('error');
        return;
      }
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `solvix-codes-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Codes exportés avec succès');
      setMessageType('success');
    } catch (error) {
      console.error('Erreur lors de l\'export des codes:', error);
      setMessage('Erreur lors de l\'export des codes');
      setMessageType('error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SOLD':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'USED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REVOKED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case 'SOLD':
        return <Users className="h-4 w-4 mr-1" />;
      case 'USED':
        return <Smartphone className="h-4 w-4 mr-1" />;
      case 'REVOKED':
        return <Ban className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sortedAndFilteredCodes = () => {
    let filtered = [...codes];
    
    // Filtrer par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(code => 
        code.code.toLowerCase().includes(term) || 
        (code.customerInfo?.contact || '').toLowerCase().includes(term) ||
        (code.deviceId || '').toLowerCase().includes(term) ||
        (code.revokedReason || '').toLowerCase().includes(term)
      );
    }
    
    // Trier
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  };

  const toggleSort = (field: 'date' | 'status' | 'code') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  if (!isOpen) return null;

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-solvix-blue mr-3" />
            <span className="text-lg font-medium text-solvix-dark font-inter">
              Vérification des privilèges...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if not authenticated as admin
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-solvix-dark font-poppins flex items-center">
              <Lock className="h-6 w-6 mr-2 text-red-500" />
              Accès Refusé
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                messageType === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {messageType === 'error' && <AlertTriangle className="h-4 w-4 inline mr-2" />}
                {message}
              </div>
            )}

            <div className="text-center">
              <div className="mb-4">
                <ShieldOff className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600 font-inter">
                  Vous n'avez pas les privilèges administrateur nécessaires pour accéder à ce panneau.
                </p>
              </div>
              
              <button
                onClick={onClose}
                className="w-full bg-gray-500 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors duration-200 font-inter"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 overflow-y-auto">
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-solvix-blue font-poppins flex items-center">
            <Star className="h-6 w-6 sm:h-8 sm:w-8 text-solvix-orange mr-2" />
            Administration Solvix Premium
          </h1>
          <button
            onClick={onClose}
            className="bg-red-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 font-inter"
          >
            <X className="h-5 w-5 inline sm:mr-2" />
            <span className="hidden sm:inline">Fermer</span>
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            messageType === 'success' 
              ? 'bg-green-100 border border-green-200 text-green-800' 
              : messageType === 'error'
              ? 'bg-red-100 border border-red-200 text-red-800'
              : 'bg-blue-100 border border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center">
              {messageType === 'success' && <CheckCircle className="h-5 w-5 mr-2 text-green-600" />}
              {messageType === 'error' && <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />}
              <span className="font-inter">{message}</span>
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-inter">Codes disponibles</p>
                <p className="text-2xl font-bold text-green-600 font-poppins">{stats.available || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-inter">Codes vendus</p>
                <p className="text-2xl font-bold text-yellow-600 font-poppins">{stats.sold || 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-inter">Codes utilisés</p>
                <p className="text-2xl font-bold text-blue-600 font-poppins">{stats.used || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Smartphone className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-inter">Codes révoqués</p>
                <p className="text-2xl font-bold text-red-600 font-poppins">{stats.revoked || 0}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Ban className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-inter">Revenus</p>
                <p className="text-2xl font-bold text-solvix-blue font-poppins">
                  {(stats.revenue || 0).toLocaleString()} FCFA
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-solvix-blue" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-solvix-dark mb-4 font-poppins">Actions</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <button
                onClick={generateSingleCode}
                disabled={loading}
                className="w-full bg-solvix-orange text-white px-4 py-2 rounded-lg hover:bg-solvix-orange-dark transition-colors duration-200 font-inter flex items-center justify-center"
              >
                {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Zap className="h-5 w-5 mr-2" />}
                Générer 1 code
              </button>
            </div>
            
            <div className="flex space-x-2">
              <input
                type="number"
                min="1"
                max="100"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 10)}
                className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center"
              />
              <button
                onClick={generateBatchCodes}
                disabled={loading}
                className="flex-1 bg-solvix-orange text-white px-4 py-2 rounded-lg hover:bg-solvix-orange-dark transition-colors duration-200 font-inter flex items-center justify-center"
              >
                {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Clipboard className="h-5 w-5 mr-2" />}
                Générer en lot
              </button>
            </div>
            
            <button
              onClick={exportCodes}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 font-inter flex items-center justify-center"
            >
              <Download className="h-5 w-5 mr-2" />
              Exporter CSV
            </button>
            
            <button
              onClick={refreshData}
              disabled={loading}
              className="w-full bg-solvix-blue text-white px-4 py-2 rounded-lg hover:bg-solvix-blue-dark transition-colors duration-200 font-inter flex items-center justify-center"
            >
              {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <RefreshCw className="h-5 w-5 mr-2" />}
              Actualiser
            </button>
          </div>
        </div>

        {/* Liste des codes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <h2 className="text-lg font-semibold text-solvix-dark font-poppins">
                Liste des codes ({codes.length})
              </h2>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent font-inter"
                />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('code')}
                  >
                    <div className="flex items-center">
                      Code
                      {sortBy === 'code' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('status')}
                  >
                    <div className="flex items-center">
                      Statut
                      {sortBy === 'status' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Date
                      {sortBy === 'date' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appareil
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAndFilteredCodes().map((codeItem) => (
                  <tr key={codeItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono font-medium text-gray-900">{codeItem.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(codeItem.status)}`}>
                        {getStatusIcon(codeItem.status)}
                        {codeItem.status}
                      </span>
                      {codeItem.status === 'REVOKED' && codeItem.revokedReason && (
                        <p className="text-xs text-red-600 mt-1">{codeItem.revokedReason}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Créé: {formatDate(codeItem.createdAt)}</div>
                      {codeItem.soldAt && <div>Vendu: {formatDate(codeItem.soldAt)}</div>}
                      {codeItem.usedAt && <div>Utilisé: {formatDate(codeItem.usedAt)}</div>}
                      {codeItem.revokedAt && <div>Révoqué: {formatDate(codeItem.revokedAt)}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {codeItem.customerInfo?.contact || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {codeItem.deviceId ? (
                        <span className="font-mono">{codeItem.deviceId.substring(0, 8)}...</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {codeItem.status === 'AVAILABLE' && (
                        <button
                          onClick={() => handleMarkAsSold(codeItem.code)}
                          className="text-yellow-600 hover:text-yellow-900 mr-3"
                        >
                          Marquer vendu
                        </button>
                      )}
                      {(codeItem.status === 'AVAILABLE' || codeItem.status === 'SOLD' || codeItem.status === 'USED') && (
                        <button
                          onClick={() => handleRevokeCode(codeItem.code)}
                          className="text-red-600 hover:text-red-900 mr-3"
                        >
                          Révoquer
                        </button>
                      )}
                      <button
                        onClick={() => copyToClipboard(codeItem.code)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Copy className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {codes.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-500 font-inter">Aucun code disponible. Générez des codes pour commencer.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal pour marquer comme vendu */}
      {showCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-solvix-dark mb-4 font-poppins">
              Marquer comme vendu
            </h3>
            <p className="text-sm text-gray-600 mb-4 font-inter">
              Code: <span className="font-mono font-medium">{selectedCode}</span>
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">
                Contact client (WhatsApp/Email) *
              </label>
              <input
                type="text"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent font-inter"
                placeholder="+225 XX XX XX XX ou email@example.com"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCustomerForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-inter"
              >
                Annuler
              </button>
              <button
                onClick={confirmMarkAsSold}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 font-inter"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour révoquer un code */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-solvix-dark mb-4 font-poppins flex items-center">
              <ShieldOff className="h-5 w-5 mr-2 text-red-600" />
              Révoquer un code
            </h3>
            <p className="text-sm text-gray-600 mb-2 font-inter">
              Code: <span className="font-mono font-medium">{selectedCode}</span>
            </p>
            <p className="text-sm text-red-600 mb-4 font-inter">
              Attention: La révocation est irréversible et désactivera immédiatement l'accès Premium pour l'utilisateur.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">
                Raison de la révocation (optionnel)
              </label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent font-inter"
                placeholder="Ex: Utilisation frauduleuse, demande de remboursement..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRevokeModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-inter"
              >
                Annuler
              </button>
              <button
                onClick={confirmRevokeCode}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-inter flex items-center"
              >
                <Ban className="h-4 w-4 mr-2" />
                Révoquer le code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;