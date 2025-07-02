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
  Calendar
} from 'lucide-react';
import { codeManager } from '../../utils/security';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
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

  // Mot de passe admin (en production, cela serait géré côté serveur)
  const ADMIN_PASSWORD = 'SolvixAdmin2025!';

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated]);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setCodes(codeManager.getAllCodes());
      setStats(codeManager.getStats());
      setLoading(false);
    }, 500);
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
      setMessage('');
    } else {
      setMessage('Mot de passe incorrect');
      setMessageType('error');
    }
  };

  const generateSingleCode = () => {
    setLoading(true);
    setTimeout(() => {
      const newCode = codeManager.generateCode();
      refreshData();
      setMessage(`Code généré: ${newCode}`);
      setMessageType('success');
      setLoading(false);
    }, 500);
  };

  const generateBatchCodes = () => {
    setLoading(true);
    setTimeout(() => {
      const newCodes = codeManager.generateBatch(batchSize);
      refreshData();
      setMessage(`${batchSize} codes générés avec succès`);
      setMessageType('success');
      setLoading(false);
    }, 1000);
  };

  const handleMarkAsSold = (code: string) => {
    setSelectedCode(code);
    setCustomerContact('');
    setShowCustomerForm(true);
  };

  const confirmMarkAsSold = () => {
    if (!customerContact.trim()) {
      setMessage('Le contact client est requis');
      setMessageType('error');
      return;
    }

    const success = codeManager.markAsSold(selectedCode, customerContact);
    if (success) {
      refreshData();
      setMessage(`Code ${selectedCode} marqué comme vendu à ${customerContact}`);
      setMessageType('success');
      setShowCustomerForm(false);
    } else {
      setMessage('Erreur: Impossible de marquer ce code comme vendu');
      setMessageType('error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage(`Code copié: ${text}`);
    setMessageType('success');
    setTimeout(() => setMessage(''), 2000);
  };

  const exportCodes = () => {
    const csv = codeManager.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solvix-codes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Codes exportés avec succès');
    setMessageType('success');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SOLD':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'USED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'REVOKED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
        (code.customerInfo?.contact || '').toLowerCase().includes(term)
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

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-solvix-dark font-poppins flex items-center">
              <Lock className="h-6 w-6 mr-2 text-solvix-blue" />
              Administration Solvix
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">
                Mot de passe administrateur
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent font-inter"
                placeholder="Entrez le mot de passe admin"
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-solvix-blue text-white py-3 rounded-lg font-medium hover:bg-solvix-blue-dark transition-colors duration-200 font-inter"
            >
              Se connecter
            </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                <p className="text-2xl font-bold text-gray-600 font-poppins">{stats.used || 0}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-gray-600" />
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
                        {codeItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Créé: {formatDate(codeItem.createdAt)}</div>
                      {codeItem.soldAt && <div>Vendu: {formatDate(codeItem.soldAt)}</div>}
                      {codeItem.usedAt && <div>Utilisé: {formatDate(codeItem.usedAt)}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {codeItem.customerInfo?.contact || '-'}
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
    </div>
  );
};

export default AdminPanel;