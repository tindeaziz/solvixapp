import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Eye, 
  Save, 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign, 
  Share2, 
  Printer,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Download
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { devisService, clientService, articleService, profileService, type Devis, type ArticleDevis } from '../lib/supabase';
import { CURRENCIES, formatCurrency, getCurrencyByCode } from '../types/currency';
import { generateDevisPDF } from '../utils/pdfGenerator';
import { notifyQuoteStatusChanged } from '../utils/notifications';
import { isPremiumActive } from '../utils/security';
import ShareModal from './ShareModal';

interface QuoteItem {
  id: string;
  designation: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

interface ClientInfo {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
}

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  signature?: string;
}

const EditQuote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // États pour les données
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);
  
  // États pour le devis
  const [quoteData, setQuoteData] = useState({
    number: '',
    date: '',
    validUntil: '',
    client: {
      name: '',
      company: '',
      email: '',
      phone: '',
      address: ''
    } as ClientInfo,
    items: [] as QuoteItem[],
    currency: 'EUR',
    notes: '',
    template: 'classic' as 'classic' | 'modern' | 'minimal' | 'corporate' | 'creatif' | 'artisan' | 'elegant' | 'professionnel' | 'minimaliste',
    status: 'Brouillon' as 'Brouillon' | 'Envoyé' | 'En attente' | 'Accepté' | 'Refusé'
  });

  const [entrepriseData, setEntrepriseData] = useState<CompanyInfo>({
    name: 'Mon Entreprise',
    address: 'Adresse à renseigner',
    phone: 'Téléphone à renseigner',
    email: 'Email à renseigner',
    logo: undefined,
    signature: undefined
  });

  const [originalDevis, setOriginalDevis] = useState<Devis | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [defaultVatRate, setDefaultVatRate] = useState<number>(20);
  const [vatEnabled, setVatEnabled] = useState<boolean>(true);

  // Charger le devis à éditer
  useEffect(() => {
    const loadQuote = async () => {
      if (!user || !id) {
        console.log('⏳ EDIT_QUOTE - En attente de l\'utilisateur ou ID manquant');
        return;
      }

      setLoading(true);
      setError('');
      console.log('📄 EDIT_QUOTE - Chargement du devis ID:', id, 'pour User ID:', user.id);

      try {
        // Charger les paramètres de TVA depuis le profil
        const { data: profile } = await profileService.getProfile();
        if (profile) {
          setDefaultVatRate(profile.vat_rate || 20);
          setVatEnabled(profile.vat_enabled !== undefined ? profile.vat_enabled : true);
          
          setEntrepriseData({
            name: profile.company_name || 'Mon Entreprise',
            address: profile.company_address || 'Adresse à renseigner',
            phone: profile.company_phone || 'Téléphone à renseigner',
            email: profile.company_email || 'Email à renseigner',
            logo: profile.company_logo || undefined,
            signature: profile.company_signature || undefined
          });
        }

        // Charger le devis
        const { data: devis, error: devisError } = await devisService.getDevisById(id);
        
        if (devisError) {
          console.error('❌ EDIT_QUOTE - Erreur chargement devis:', devisError);
          setError('Erreur lors du chargement du devis: ' + devisError.message);
          return;
        }

        if (!devis) {
          console.error('❌ EDIT_QUOTE - Devis non trouvé');
          setError('Devis non trouvé');
          return;
        }

        console.log('✅ EDIT_QUOTE - Devis chargé:', devis.quote_number);
        setOriginalDevis(devis);

        // Convertir les données pour l'édition
        const items: QuoteItem[] = (devis.articles || []).map(article => ({
          id: article.id,
          designation: article.designation,
          quantity: article.quantity,
          unitPrice: article.unit_price,
          vatRate: article.vat_rate,
          total: article.total_ht
        }));

        setQuoteData({
          number: devis.quote_number,
          date: devis.date_creation,
          validUntil: devis.date_expiration,
          client: {
            name: devis.client?.name || '',
            company: devis.client?.company || '',
            email: devis.client?.email || '',
            phone: devis.client?.phone || '',
            address: devis.client?.address || ''
          },
          items: items.length > 0 ? items : [{
            id: 'new-1',
            designation: '',
            quantity: 1,
            unitPrice: 0,
            vatRate: vatEnabled ? defaultVatRate : 0,
            total: 0
          }],
          currency: devis.currency,
          notes: devis.notes,
          template: devis.template as any,
          status: devis.status
        });

      } catch (error) {
        console.error('❌ EDIT_QUOTE - Exception chargement:', error);
        setError('Une erreur est survenue lors du chargement du devis');
      } finally {
        setLoading(false);
      }
    };

    loadQuote();
  }, [user, id]);

  // Fonctions de calcul
  const calculateItemTotal = (item: QuoteItem) => {
    return item.quantity * item.unitPrice;
  };

  const calculateSubtotal = () => {
    return quoteData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const calculateVAT = () => {
    return quoteData.items.reduce((sum, item) => {
      const itemTotal = calculateItemTotal(item);
      return sum + (itemTotal * item.vatRate / 100);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateVAT();
  };

  // Gestion des articles
  const addItem = () => {
    // Récupérer le taux de TVA du premier article pour l'appliquer aux nouveaux
    const vatRate = quoteData.items.length > 0 ? quoteData.items[0].vatRate : (vatEnabled ? defaultVatRate : 0);
    
    const newItem: QuoteItem = {
      id: `new-${Date.now()}`,
      designation: '',
      quantity: 1,
      unitPrice: 0,
      vatRate: vatRate, // Utiliser le même taux de TVA que les autres articles
      total: 0
    };
    setQuoteData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (id: string) => {
    if (quoteData.items.length > 1) {
      setQuoteData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }));
    }
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: string | number) => {
    setQuoteData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          updatedItem.total = calculateItemTotal(updatedItem);
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const updateClient = (field: keyof ClientInfo, value: string) => {
    setQuoteData(prev => ({
      ...prev,
      client: { ...prev.client, [field]: value }
    }));
  };

  // Sauvegarde
  const handleSave = async () => {
    if (!user || !originalDevis) {
      setError('Données manquantes pour la sauvegarde');
      return;
    }

    setSaving(true);
    setError('');
    setSaveSuccess(false);
    setNotificationSent(false);

    try {
      console.log('💾 EDIT_QUOTE - Sauvegarde du devis:', quoteData.number);

      // Vérifier si le statut a changé
      const statusChanged = originalDevis.status !== quoteData.status;
      const oldStatus = originalDevis.status;

      // 1. Mettre à jour le client si nécessaire
      let clientId = originalDevis.client_id;
      if (quoteData.client.name.trim()) {
        if (originalDevis.client) {
          // Mettre à jour le client existant
          const { error: clientError } = await clientService.updateClient(originalDevis.client.id, {
            name: quoteData.client.name,
            company: quoteData.client.company,
            email: quoteData.client.email,
            phone: quoteData.client.phone,
            address: quoteData.client.address
          });

          if (clientError) {
            console.error('❌ EDIT_QUOTE - Erreur mise à jour client:', clientError);
            throw new Error('Erreur lors de la mise à jour du client');
          }
        } else {
          // Créer un nouveau client
          const { data: newClient, error: clientError } = await clientService.createClient({
            name: quoteData.client.name,
            company: quoteData.client.company,
            email: quoteData.client.email,
            phone: quoteData.client.phone,
            address: quoteData.client.address
          });

          if (clientError) {
            console.error('❌ EDIT_QUOTE - Erreur création client:', clientError);
            throw new Error('Erreur lors de la création du client');
          }

          clientId = newClient?.id;
        }
      }

      // 2. Mettre à jour le devis
      const { data: updatedDevis, error: devisError } = await devisService.updateDevis(originalDevis.id, {
        quote_number: quoteData.number,
        date_creation: quoteData.date,
        date_expiration: quoteData.validUntil,
        currency: quoteData.currency,
        template: quoteData.template,
        notes: quoteData.notes,
        status: quoteData.status,
        subtotal_ht: calculateSubtotal(),
        total_vat: calculateVAT(),
        total_ttc: calculateTotal(),
        client_id: clientId
      });

      if (devisError) {
        console.error('❌ EDIT_QUOTE - Erreur mise à jour devis:', devisError);
        throw new Error('Erreur lors de la mise à jour du devis');
      }

      // 3. Supprimer tous les anciens articles
      const { error: deleteError } = await articleService.deleteArticlesByDevis(originalDevis.id);
      if (deleteError) {
        console.error('❌ EDIT_QUOTE - Erreur suppression articles:', deleteError);
        throw new Error('Erreur lors de la suppression des anciens articles');
      }

      // 4. Créer les nouveaux articles
      const validItems = quoteData.items.filter(item => item.designation.trim() !== '');
      if (validItems.length > 0) {
        const articlesData = validItems.map((item, index) => ({
          devis_id: originalDevis.id,
          designation: item.designation,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          vat_rate: item.vatRate,
          total_ht: calculateItemTotal(item),
          order_index: index
        }));

        const { error: articlesError } = await articleService.createMultipleArticles(articlesData);
        if (articlesError) {
          console.error('❌ EDIT_QUOTE - Erreur création articles:', articlesError);
          throw new Error('Erreur lors de la création des articles');
        }
      }

      // 5. Envoyer une notification si le statut a changé
      if (statusChanged && updatedDevis) {
        try {
          const notificationResult = await notifyQuoteStatusChanged(
            {
              ...updatedDevis,
              client: {
                name: quoteData.client.name,
                company: quoteData.client.company
              }
            },
            oldStatus,
            quoteData.status
          );
          
          if (notificationResult.success) {
            console.log('✅ EDIT_QUOTE - Notification de changement de statut envoyée');
            setNotificationSent(true);
          }
        } catch (notifError) {
          console.error('⚠️ EDIT_QUOTE - Erreur notification (non bloquante):', notifError);
          // Ne pas bloquer la sauvegarde si la notification échoue
        }
      }

      console.log('✅ EDIT_QUOTE - Devis sauvegardé avec succès');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error('❌ EDIT_QUOTE - Exception sauvegarde:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Navigation
  const handleBack = () => {
    navigate('/devis');
  };

  const handlePreview = () => {
    const validItems = quoteData.items.filter(item => 
      item.designation.trim() !== '' && 
      item.quantity > 0 && 
      item.unitPrice >= 0
    );
    
    if (validItems.length === 0) {
      setError('Veuillez ajouter au moins un produit avec une désignation et un prix valides.');
      return;
    }
    
    const devisData = {
      articles: validItems,
      client: quoteData.client,
      entreprise: entrepriseData,
      numeroDevis: quoteData.number,
      dateCreation: quoteData.date,
      dateExpiration: quoteData.validUntil,
      devise: quoteData.currency,
      notes: quoteData.notes,
      template: quoteData.template,
      sousTotal: calculateSubtotal(),
      totalTVA: calculateVAT(),
      totalTTC: calculateTotal()
    };
    
    navigate('/devis/preview/edit', { state: devisData });
  };

  const handleDownloadPDF = async () => {
    const validItems = quoteData.items.filter(item => 
      item.designation.trim() !== '' && 
      item.quantity > 0 && 
      item.unitPrice >= 0
    );
    
    if (validItems.length === 0) {
      setError('Veuillez ajouter au moins un produit avec une désignation et un prix valides.');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const devisData = {
        articles: validItems,
        client: quoteData.client,
        entreprise: entrepriseData,
        numeroDevis: quoteData.number,
        dateCreation: quoteData.date,
        dateExpiration: quoteData.validUntil,
        devise: quoteData.currency,
        notes: quoteData.notes,
        template: quoteData.template,
        sousTotal: calculateSubtotal(),
        totalTVA: calculateVAT(),
        totalTTC: calculateTotal()
      };

      console.log('📥 EDIT_QUOTE - Génération PDF pour devis:', devisData.numeroDevis);
      await generateDevisPDF(devisData);
      console.log('✅ EDIT_QUOTE - PDF généré avec succès');
    } catch (error) {
      console.error('❌ EDIT_QUOTE - Erreur génération PDF:', error);
      setError('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const selectedCurrency = getCurrencyByCode(quoteData.currency);

  // Affichage de chargement
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-solvix-blue border-t-transparent mx-auto mb-4"></div>
            <p className="text-solvix-dark font-inter">Chargement du devis...</p>
          </div>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error && !originalDevis) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 bg-solvix-blue text-white rounded-lg hover:bg-solvix-blue-dark transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* Header - Responsive */}
      <div className="bg-white rounded-xl shadow-solvix border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={handleBack}
              className="p-2 text-gray-400 hover:text-solvix-blue rounded-lg hover:bg-solvix-light transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-solvix-orange" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-solvix-dark font-poppins">Modifier le devis</h1>
                <p className="text-gray-600 font-inter">Devis {quoteData.number}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {/* Messages de statut */}
            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 sm:px-4 py-2 flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-green-800 font-inter">
                  {notificationSent ? 'Devis sauvegardé et notification envoyée !' : 'Devis sauvegardé !'}
                </span>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 sm:px-4 py-2 flex items-center">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-sm text-red-800 font-inter">{error}</span>
              </div>
            )}
            
            <button
              onClick={handlePreview}
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-solvix-light transition-colors duration-200 font-inter"
            >
              <Eye className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Aperçu</span>
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-solvix-light transition-colors duration-200 font-inter"
            >
              <Share2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Partager</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-3 sm:px-4 py-2 bg-solvix-orange text-white rounded-lg text-sm font-medium hover:bg-solvix-orange-dark transition-colors duration-200 disabled:opacity-50 font-inter shadow-solvix"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Sauvegarder</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="inline-flex items-center px-3 sm:px-4 py-2 bg-solvix-blue text-white rounded-lg text-sm font-medium hover:bg-solvix-blue-dark transition-colors duration-200 disabled:opacity-50 font-inter shadow-solvix"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">PDF...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Télécharger PDF</span>
                </>
              )}
            </button>
            <button
              onClick={handlePreview}
              className="inline-flex items-center px-3 sm:px-4 py-2 bg-solvix-blue text-white rounded-lg text-sm font-medium hover:bg-solvix-blue-dark transition-colors duration-200 font-inter shadow-solvix"
            >
              <Printer className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Imprimer / PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Form - Responsive */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Quote Info */}
          <div className="bg-white rounded-xl shadow-solvix border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-solvix-dark mb-4 font-poppins">Informations du devis</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-solvix-dark mb-2 font-inter">
                  Numéro de devis
                </label>
                <input
                  type="text"
                  value={quoteData.number}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent font-inter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-solvix-dark mb-2 font-inter">
                  Date
                </label>
                <input
                  type="date"
                  value={quoteData.date}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent font-inter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-solvix-dark mb-2 font-inter">
                  Valide jusqu'au
                </label>
                <input
                  type="date"
                  value={quoteData.validUntil}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, validUntil: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent font-inter"
                />
              </div>
            </div>

            {/* Currency and Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-solvix-dark mb-2 font-inter">
                  Devise du devis
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    value={quoteData.currency}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent font-inter"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.name} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-solvix-dark mb-2 font-inter">
                  Statut
                </label>
                <select
                  value={quoteData.status}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent font-inter"
                >
                  <option value="Brouillon">Brouillon</option>
                  <option value="Envoyé">Envoyé</option>
                  <option value="En attente">En attente</option>
                  <option value="Accepté">Accepté</option>
                  <option value="Refusé">Refusé</option>
                </select>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-white rounded-xl shadow-solvix border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-solvix-dark mb-4 flex items-center font-poppins">
              <User className="h-5 w-5 mr-2" />
              Informations client
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-solvix-dark mb-2 font-inter">
                  Nom du contact
                </label>
                <input
                  type="text"
                  value={quoteData.client.name}
                  onChange={(e) => updateClient('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent font-inter"
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-solvix-dark mb-2 font-inter">
                  Entreprise
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={quoteData.client.company}
                    onChange={(e) => updateClient('company', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent font-inter"
                    placeholder="Nom de l'entreprise"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-solvix-dark mb-2 font-inter">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={quoteData.client.email}
                    onChange={(e) => updateClient('email', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent font-inter"
                    placeholder="contact@entreprise.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-solvix-dark mb-2 font-inter">
                  Téléphone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={quoteData.client.phone}
                    onChange={(e) => updateClient('phone', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent font-inter"
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-solvix-dark mb-2 font-inter">
                Adresse
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
                <textarea
                  value={quoteData.client.address}
                  onChange={(e) => updateClient('address', e.target.value)}
                  rows={3}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent font-inter"
                  placeholder="Adresse complète du client"
                />
              </div>
            </div>
          </div>

          {/* Products/Services - Responsive */}
          <div className="bg-white rounded-xl shadow-solvix border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
              <h3 className="text-lg font-semibold text-solvix-dark font-poppins">Produits/Services</h3>
              <button
                onClick={addItem}
                className="inline-flex items-center px-3 py-2 bg-solvix-orange text-white rounded-lg text-sm font-medium hover:bg-solvix-orange-dark transition-colors duration-200 font-inter shadow-solvix"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </button>
            </div>

            <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-solvix-dark font-inter">Désignation</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-solvix-dark w-16 sm:w-20 font-inter">Qté</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-solvix-dark w-24 sm:w-32 font-inter">Prix unitaire</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-solvix-dark w-16 sm:w-20 font-inter">TVA%</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-solvix-dark w-24 sm:w-32 font-inter">Total HT</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {quoteData.items.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-2 sm:py-3 px-2">
                          <input
                            type="text"
                            value={item.designation}
                            onChange={(e) => updateItem(item.id, 'designation', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-solvix-blue focus:border-transparent text-sm font-inter"
                            placeholder="Description du produit/service"
                          />
                        </td>
                        <td className="py-2 sm:py-3 px-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-solvix-blue focus:border-transparent text-sm text-center font-inter"
                          />
                        </td>
                        <td className="py-2 sm:py-3 px-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-solvix-blue focus:border-transparent text-sm text-right font-inter"
                          />
                        </td>
                        <td className="py-2 sm:py-3 px-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={item.vatRate}
                            onChange={(e) => updateItem(item.id, 'vatRate', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-solvix-blue focus:border-transparent text-sm text-center font-inter"
                          />
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-right text-sm font-medium font-montserrat">
                          {formatCurrency(calculateItemTotal(item), quoteData.currency)}
                        </td>
                        <td className="py-2 sm:py-3 px-2">
                          {quoteData.items.length > 1 && (
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-solvix border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-solvix-dark mb-4 font-poppins">Notes et conditions</h3>
            <textarea
              value={quoteData.notes}
              onChange={(e) => setQuoteData(prev => ({ ...prev, notes: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solvix-blue focus:border-transparent font-inter"
              placeholder="Conditions de paiement, garanties, notes particulières..."
            />
          </div>
        </div>

        {/* Sidebar - Responsive */}
        <div className="space-y-4 sm:space-y-6">
          {/* Totals */}
          <div className="bg-white rounded-xl shadow-solvix border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-solvix-dark mb-4 font-poppins">Récapitulatif</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-inter">Sous-total HT:</span>
                <span className="font-medium font-montserrat">{formatCurrency(calculateSubtotal(), quoteData.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-inter">TVA:</span>
                <span className="font-medium font-montserrat">{formatCurrency(calculateVAT(), quoteData.currency)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-base sm:text-lg font-semibold text-solvix-dark font-poppins">TOTAL TTC:</span>
                  <span className="text-base sm:text-lg font-bold text-solvix-orange font-montserrat">{formatCurrency(calculateTotal(), quoteData.currency)}</span>
                </div>
              </div>
            </div>
            
            {selectedCurrency && (
              <div className="mt-4 p-3 bg-solvix-light rounded-lg">
                <p className="text-xs text-gray-600 font-inter">
                  Devise: {selectedCurrency.name} ({selectedCurrency.symbol})
                </p>
              </div>
            )}
          </div>

          {/* Template Selection - Responsive Grid */}
          <div className="bg-white rounded-xl shadow-solvix border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-solvix-dark mb-4 font-poppins">Modèle de devis</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'classic', name: 'Classique', description: 'Design traditionnel et professionnel' },
                { id: 'modern', name: 'Moderne', description: 'Style contemporain et épuré' },
                { id: 'minimal', name: 'Minimaliste', description: 'Design simple et élégant' },
                { id: 'corporate', name: 'Corporate', description: 'Style très professionnel' },
                { id: 'creatif', name: 'Créatif', description: 'Design moderne avec accents colorés' },
                { id: 'artisan', name: 'Artisan', description: 'Style chaleureux avec bordures décoratives' },
                { id: 'elegant', name: 'Élégant', description: 'Design raffiné avec typographie serif' },
                { id: 'professionnel', name: 'Professionnel', description: 'Style business avec bandes colorées' },
                { id: 'minimaliste', name: 'Ultra Minimaliste', description: 'Design épuré et moderne' }
              ].map((template) => (
                <div
                  key={template.id}
                  className={`border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                    quoteData.template === template.id
                      ? 'border-solvix-blue bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setQuoteData(prev => ({ ...prev, template: template.id as any }))}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-10 sm:w-16 sm:h-12 bg-gray-100 rounded border flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-solvix-dark font-inter text-sm truncate">{template.name}</h4>
                      <p className="text-xs text-gray-500 font-inter truncate">{template.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bloc d'actions - sous les modèles de devis */}
          <div className="bg-white rounded-xl shadow-solvix border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-solvix-dark mb-4 font-poppins">Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePreview}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-solvix-light transition-colors duration-200 font-inter"
              >
                <Eye className="h-4 w-4 mr-2" />
                Aperçu
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-solvix-light transition-colors duration-200 font-inter"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center px-4 py-3 bg-solvix-blue text-white rounded-lg text-sm font-medium hover:bg-solvix-blue-dark transition-colors duration-200 disabled:opacity-50 font-inter shadow-solvix"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="flex items-center justify-center px-4 py-3 bg-solvix-orange text-white rounded-lg text-sm font-medium hover:bg-solvix-orange-dark transition-colors duration-200 disabled:opacity-50 font-inter shadow-solvix"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        quoteNumber={quoteData.number}
        clientEmail={quoteData.client.email}
        onEmailShare={async (email: string, message: string) => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log('📧 Email envoyé à:', email);
        }}
        onWhatsAppShare={() => {
          const message = `Bonjour,\n\nVoici le devis ${quoteData.number} que vous avez demandé.\n\nCordialement`;
          const encodedMessage = encodeURIComponent(message);
          window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
        }}
        onDownload={handleDownloadPDF}
      />
    </div>
  );
};

export default EditQuote;