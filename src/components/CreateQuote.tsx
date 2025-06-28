import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Eye, Save, User, Building, Mail, Phone, MapPin, DollarSign, Share2, Printer, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CURRENCIES, formatCurrency, getCurrencyByCode, type Currency } from '../types/currency';
import ShareModal from './ShareModal';
import { useAuth } from '../hooks/useAuth';
import { profileService, devisService, clientService, articleService } from '../lib/supabase';

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

interface QuoteData {
  number: string;
  date: string;
  validUntil: string;
  client: ClientInfo;
  items: QuoteItem[];
  currency: string;
  notes: string;
  template: 'classic' | 'modern' | 'minimal' | 'corporate' | 'creatif' | 'artisan' | 'elegant' | 'professionnel' | 'minimaliste';
}

const CreateQuote: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // AJOUT : États pour les paramètres TVA du profil
  const [profileVatSettings, setProfileVatSettings] = useState({
    vat_enabled: true,
    vat_rate: 20,
    default_currency: 'EUR'
  });
  
  const [quoteData, setQuoteData] = useState<QuoteData>({
    number: `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
    date: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    client: {
      name: '',
      company: '',
      email: '',
      phone: '',
      address: ''
    },
    items: [
      {
        id: '1',
        designation: '',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20, // Sera mis à jour avec les paramètres du profil
        total: 0
      }
    ],
    currency: 'EUR',
    notes: '',
    template: 'classic'
  });

  // AJOUT : État pour les données entreprise
  const [entrepriseData, setEntrepriseData] = useState<CompanyInfo>({
    name: 'Mon Entreprise',
    address: 'Adresse à renseigner',
    phone: 'Téléphone à renseigner',
    email: 'Email à renseigner',
    logo: undefined,
    signature: undefined
  });

  const [showPreview, setShowPreview] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string>('');

  // RÉCUPÉRATION DES DONNÉES ENTREPRISE ET PARAMÈTRES TVA DEPUIS SUPABASE
  useEffect(() => {
    const fetchEntrepriseData = async () => {
      if (!user) {
        console.log('⏳ CREATE_QUOTE - En attente de l\'utilisateur...');
        return;
      }

      setIsLoadingCompany(true);
      console.log('🏢 CREATE_QUOTE - Récupération des données entreprise pour User ID:', user.id);

      try {
        const { data, error } = await profileService.getProfile();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = pas de données trouvées
          console.error('❌ CREATE_QUOTE - Erreur récupération profil:', error);
          return;
        }

        if (data) {
          console.log('✅ CREATE_QUOTE - Données entreprise récupérées depuis Supabase');
          console.log('🏢 CREATE_QUOTE - Nom entreprise:', data.company_name);
          console.log('📧 CREATE_QUOTE - Email entreprise:', data.company_email);
          console.log('📱 CREATE_QUOTE - Téléphone entreprise:', data.company_phone);
          console.log('🏠 CREATE_QUOTE - Adresse entreprise:', data.company_address);
          console.log('🖼️ CREATE_QUOTE - Logo présent:', data.company_logo ? 'OUI' : 'NON');
          console.log('✍️ CREATE_QUOTE - Signature présente:', data.company_signature ? 'OUI' : 'NON');
          
          // NOUVEAU : Log des paramètres TVA
          console.log('💰 CREATE_QUOTE - TVA activée:', data.vat_enabled);
          console.log('📊 CREATE_QUOTE - Taux TVA:', data.vat_rate);
          console.log('💱 CREATE_QUOTE - Devise par défaut:', data.default_currency);

          setEntrepriseData({
            name: data.company_name || 'Mon Entreprise',
            address: data.company_address || 'Adresse à renseigner',
            phone: data.company_phone || 'Téléphone à renseigner',
            email: data.company_email || 'Email à renseigner',
            logo: data.company_logo || undefined,
            signature: data.company_signature || undefined
          });

          // NOUVEAU : Sauvegarder les paramètres TVA du profil
          const vatSettings = {
            vat_enabled: data.vat_enabled ?? true,
            vat_rate: data.vat_rate || 20,
            default_currency: data.default_currency || 'EUR'
          };
          
          setProfileVatSettings(vatSettings);
          console.log('⚙️ CREATE_QUOTE - Paramètres TVA appliqués:', vatSettings);

          // NOUVEAU : Appliquer automatiquement les paramètres au devis
          setQuoteData(prev => ({
            ...prev,
            currency: vatSettings.default_currency,
            items: prev.items.map(item => ({
              ...item,
              vatRate: vatSettings.vat_enabled ? vatSettings.vat_rate : 0
            }))
          }));
          
          console.log('🔄 CREATE_QUOTE - Paramètres TVA appliqués automatiquement au devis');
        } else {
          console.log('📝 CREATE_QUOTE - Aucun profil trouvé, utilisation des données par défaut');
          // Utiliser les données par défaut avec l'email de l'utilisateur
          setEntrepriseData({
            name: 'Mon Entreprise',
            address: 'Adresse à renseigner',
            phone: 'Téléphone à renseigner',
            email: user.email || 'Email à renseigner',
            logo: undefined,
            signature: undefined
          });
          
          // Paramètres TVA par défaut
          const defaultVatSettings = {
            vat_enabled: true,
            vat_rate: 20,
            default_currency: 'EUR'
          };
          
          setProfileVatSettings(defaultVatSettings);
          console.log('⚙️ CREATE_QUOTE - Paramètres TVA par défaut appliqués:', defaultVatSettings);
        }
      } catch (error) {
        console.error('❌ CREATE_QUOTE - Exception récupération entreprise:', error);
      } finally {
        setIsLoadingCompany(false);
      }
    };

    fetchEntrepriseData();
  }, [user]);

  // Générer un nouveau numéro de devis au chargement
  useEffect(() => {
    const generateQuoteNumber = async () => {
      if (!user) return;

      try {
        const newNumber = await devisService.generateQuoteNumber();
        setQuoteData(prev => ({ ...prev, number: newNumber }));
        console.log('🔢 CREATE_QUOTE - Nouveau numéro généré:', newNumber);
      } catch (error) {
        console.error('❌ CREATE_QUOTE - Erreur génération numéro:', error);
      }
    };

    generateQuoteNumber();
  }, [user]);

  const templates = [
    {
      id: 'classic' as const,
      name: 'Classique',
      description: 'Design traditionnel et professionnel',
      preview: '/api/placeholder/200/150',
      free: true,
      category: 'Gratuit'
    },
    {
      id: 'modern' as const,
      name: 'Moderne',
      description: 'Style contemporain et épuré',
      preview: '/api/placeholder/200/150',
      free: true,
      category: 'Gratuit'
    },
    {
      id: 'minimal' as const,
      name: 'Minimaliste',
      description: 'Design simple et élégant',
      preview: '/api/placeholder/200/150',
      free: true,
      category: 'Gratuit'
    },
    {
      id: 'corporate' as const,
      name: 'Corporate',
      description: 'Style très professionnel avec lignes épurées',
      preview: '/api/placeholder/200/150',
      free: false,
      category: 'Premium'
    },
    {
      id: 'creatif' as const,
      name: 'Créatif',
      description: 'Design moderne avec accents colorés',
      preview: '/api/placeholder/200/150',
      free: false,
      category: 'Premium'
    },
    {
      id: 'artisan' as const,
      name: 'Artisan',
      description: 'Style chaleureux avec bordures décoratives',
      preview: '/api/placeholder/200/150',
      free: false,
      category: 'Premium'
    },
    {
      id: 'elegant' as const,
      name: 'Élégant',
      description: 'Design raffiné et sophistiqué',
      preview: '/api/placeholder/200/150',
      free: false,
      category: 'Premium'
    },
    {
      id: 'professionnel' as const,
      name: 'Professionnel',
      description: 'Style business avec bandes colorées',
      preview: '/api/placeholder/200/150',
      free: false,
      category: 'Premium'
    },
    {
      id: 'minimaliste' as const,
      name: 'Ultra Minimaliste',
      description: 'Design épuré et moderne',
      preview: '/api/placeholder/200/150',
      free: false,
      category: 'Premium'
    }
  ];

  const selectedCurrency = getCurrencyByCode(quoteData.currency);

  const calculateItemTotal = (item: QuoteItem) => {
    return item.quantity * item.unitPrice;
  };

  const calculateSubtotal = () => {
    return quoteData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const calculateVAT = () => {
    // MODIFICATION : Utiliser les paramètres TVA du profil
    if (!profileVatSettings.vat_enabled) {
      return 0;
    }
    
    return quoteData.items.reduce((sum, item) => {
      const itemTotal = calculateItemTotal(item);
      return sum + (itemTotal * item.vatRate / 100);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateVAT();
  };

  // MODIFICATION : Fonction addItem avec application automatique des paramètres TVA
  const addItem = () => {
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      designation: '',
      quantity: 1,
      unitPrice: 0,
      vatRate: profileVatSettings.vat_enabled ? profileVatSettings.vat_rate : 0, // Application automatique
      total: 0
    };
    
    setQuoteData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    console.log('➕ CREATE_QUOTE - Nouvel article ajouté avec TVA:', newItem.vatRate, '%');
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

  // FONCTION DE PRÉVISUALISATION AVEC TRANSMISSION COMPLÈTE DES DONNÉES
  const handlePreview = () => {
    console.log("=== VÉRIFICATION DES DONNÉES AVANT TRANSMISSION ===");
    console.log("📄 Articles saisis:", quoteData.items);
    console.log("👤 Info client:", quoteData.client);
    console.log("🏢 Données entreprise à transmettre:", entrepriseData);
    console.log("📋 Numéro de devis:", quoteData.number);
    console.log("📅 Date création:", quoteData.date);
    console.log("📅 Date expiration:", quoteData.validUntil);
    console.log("💰 Devise:", quoteData.currency);
    console.log("📝 Notes:", quoteData.notes);
    console.log("🎨 Template:", quoteData.template);
    console.log("✍️ Signature entreprise:", entrepriseData.signature ? "PRÉSENTE" : "ABSENTE");
    console.log("🖼️ Logo entreprise:", entrepriseData.logo ? "PRÉSENT" : "ABSENT");
    console.log("⚙️ Paramètres TVA appliqués:", profileVatSettings);
    
    // Vérifier que tous les produits ont des données valides
    const validItems = quoteData.items.filter(item => 
      item.designation.trim() !== '' && 
      item.quantity > 0 && 
      item.unitPrice >= 0
    );
    
    console.log("✅ Articles valides:", validItems.length, "sur", quoteData.items.length);
    
    if (validItems.length === 0) {
      alert('Veuillez ajouter au moins un produit avec une désignation et un prix valides.');
      return;
    }
    
    // TRANSMISSION CORRECTE DES DONNÉES avec toutes les informations entreprise
    const devisData = {
      articles: validItems,
      client: quoteData.client,
      entreprise: {
        name: entrepriseData.name,
        address: entrepriseData.address,
        phone: entrepriseData.phone,
        email: entrepriseData.email,
        logo: entrepriseData.logo,
        signature: entrepriseData.signature
      },
      numeroDevis: quoteData.number,
      dateCreation: quoteData.date,
      dateExpiration: quoteData.validUntil,
      devise: quoteData.currency,
      notes: quoteData.notes,
      template: quoteData.template,
      // Calculs
      sousTotal: calculateSubtotal(),
      totalTVA: calculateVAT(),
      totalTTC: calculateTotal()
    };
    
    console.log("=== DONNÉES TRANSMISES À L'APERÇU ===");
    console.log("📦 Données complètes:", devisData);
    console.log("🏢 Entreprise transmise:", devisData.entreprise);
    console.log("✍️ Signature incluse:", devisData.entreprise.signature ? "OUI" : "NON");
    console.log("🖼️ Logo inclus:", devisData.entreprise.logo ? "OUI" : "NON");
    
    // Navigation avec state
    navigate('/devis/preview/new', { state: devisData });
  };

  const handlePrint = () => {
    handlePreview();
  };

  // NOUVELLE FONCTION DE SAUVEGARDE DANS SUPABASE
  const handleSaveDraft = async () => {
    if (!user) {
      setSaveError('Utilisateur non connecté');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      console.log('💾 CREATE_QUOTE - Début de la sauvegarde pour User ID:', user.id);

      // 1. Vérifier et créer le client si nécessaire
      let clientId = null;
      if (quoteData.client.name.trim()) {
        console.log('👤 CREATE_QUOTE - Création/recherche du client:', quoteData.client.name);
        
        // Rechercher si le client existe déjà
        const { data: existingClients } = await clientService.searchClients(quoteData.client.name);
        
        if (existingClients && existingClients.length > 0) {
          // Client existant trouvé
          clientId = existingClients[0].id;
          console.log('✅ CREATE_QUOTE - Client existant trouvé:', clientId);
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
            console.error('❌ CREATE_QUOTE - Erreur création client:', clientError);
            throw new Error('Erreur lors de la création du client');
          }

          clientId = newClient?.id;
          console.log('✅ CREATE_QUOTE - Nouveau client créé:', clientId);
        }
      }

      // 2. Créer le devis
      console.log('📄 CREATE_QUOTE - Création du devis:', quoteData.number);
      
      const { data: newDevis, error: devisError } = await devisService.createDevis({
        quote_number: quoteData.number,
        date_creation: quoteData.date,
        date_expiration: quoteData.validUntil,
        currency: quoteData.currency,
        template: quoteData.template,
        notes: quoteData.notes,
        status: 'Brouillon',
        subtotal_ht: calculateSubtotal(),
        total_vat: calculateVAT(),
        total_ttc: calculateTotal(),
        client_id: clientId
      });

      if (devisError) {
        console.error('❌ CREATE_QUOTE - Erreur création devis:', devisError);
        throw new Error('Erreur lors de la création du devis: ' + devisError.message);
      }

      const devisId = newDevis?.id;
      console.log('✅ CREATE_QUOTE - Devis créé avec ID:', devisId);

      // 3. Créer les articles du devis
      if (devisId && quoteData.items.length > 0) {
        console.log('📦 CREATE_QUOTE - Création des articles:', quoteData.items.length, 'articles');
        
        const articlesData = quoteData.items
          .filter(item => item.designation.trim() !== '')
          .map((item, index) => ({
            devis_id: devisId,
            designation: item.designation,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            vat_rate: item.vatRate,
            total_ht: calculateItemTotal(item),
            order_index: index
          }));

        const { error: articlesError } = await articleService.createMultipleArticles(articlesData);

        if (articlesError) {
          console.error('❌ CREATE_QUOTE - Erreur création articles:', articlesError);
          throw new Error('Erreur lors de la création des articles');
        }

        console.log('✅ CREATE_QUOTE - Articles créés avec succès');
      }

      // 4. Succès
      console.log('🎉 CREATE_QUOTE - Sauvegarde terminée avec succès');
      setSaveSuccess(true);
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error('❌ CREATE_QUOTE - Exception lors de la sauvegarde:', error);
      setSaveError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailShare = async (email: string, message: string): Promise<void> => {
    // Simulation d'envoi d'email
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📧 CREATE_QUOTE - Email envoyé à:', email);
    console.log('💬 CREATE_QUOTE - Message:', message);
    console.log('📄 CREATE_QUOTE - Devis joint:', quoteData.number);
  };

  const handleWhatsAppShare = () => {
    const message = `Bonjour,

Voici le devis ${quoteData.number} que vous avez demandé.

N'hésitez pas à me contacter si vous avez des questions.

Cordialement`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleDownloadShare = () => {
    handlePreview();
  };

  const renderPreview = () => {
    const template = templates.find(t => t.id === quoteData.template);
    
    return (
      <div className="bg-white p-8 max-w-4xl mx-auto">
        <div className="border border-gray-200 rounded-lg p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-solvix-dark mb-2 font-poppins">DEVIS</h1>
              <p className="text-gray-600 font-inter">N° {quoteData.number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 font-inter">Date: {new Date(quoteData.date).toLocaleDateString('fr-FR')}</p>
              <p className="text-sm text-gray-600 font-inter">Valide jusqu'au: {new Date(quoteData.validUntil).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* Company Info - UTILISATION DES VRAIES DONNÉES */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-solvix-dark mb-4 font-poppins">Entreprise</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              {entrepriseData.logo && (
                <img 
                  src={entrepriseData.logo} 
                  alt="Logo entreprise" 
                  className="max-h-16 w-auto mb-3"
                />
              )}
              <p className="font-medium font-inter">{entrepriseData.name}</p>
              <p className="whitespace-pre-line font-inter">{entrepriseData.address}</p>
              <p className="font-inter">{entrepriseData.phone}</p>
              <p className="font-inter">{entrepriseData.email}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-solvix-dark mb-4 font-poppins">Informations client</h3>
            <div className="bg-solvix-light p-4 rounded-lg">
              <p className="font-medium font-inter">{quoteData.client.name}</p>
              <p className="font-inter">{quoteData.client.company}</p>
              <p className="font-inter">{quoteData.client.email}</p>
              <p className="font-inter">{quoteData.client.phone}</p>
              <p className="whitespace-pre-line font-inter">{quoteData.client.address}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-solvix-dark mb-4 font-poppins">Détail des prestations</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200">
                <thead className="bg-solvix-light">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-solvix-dark border-b font-inter">Désignation</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-solvix-dark border-b font-inter">Qté</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-solvix-dark border-b font-inter">Prix unitaire</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-solvix-dark border-b font-inter">TVA</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-solvix-dark border-b font-inter">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteData.items.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-solvix-light'}>
                      <td className="px-4 py-2 text-sm text-solvix-dark border-b font-inter">{item.designation}</td>
                      <td className="px-4 py-2 text-sm text-solvix-dark text-center border-b font-inter">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-solvix-dark text-right border-b font-montserrat">{formatCurrency(item.unitPrice, quoteData.currency)}</td>
                      <td className="px-4 py-2 text-sm text-solvix-dark text-center border-b font-inter">{item.vatRate}%</td>
                      <td className="px-4 py-2 text-sm text-solvix-dark text-right border-b font-medium font-montserrat">{formatCurrency(calculateItemTotal(item), quoteData.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="bg-solvix-light p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 font-inter">Sous-total HT:</span>
                  <span className="text-sm font-medium font-montserrat">{formatCurrency(calculateSubtotal(), quoteData.currency)}</span>
                </div>
                {profileVatSettings.vat_enabled && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-inter">TVA:</span>
                    <span className="text-sm font-medium font-montserrat">{formatCurrency(calculateVAT(), quoteData.currency)}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-solvix-dark font-poppins">TOTAL {profileVatSettings.vat_enabled ? 'TTC' : 'HT'}:</span>
                    <span className="text-lg font-bold text-solvix-orange font-montserrat">{formatCurrency(calculateTotal(), quoteData.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quoteData.notes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-solvix-dark mb-4 font-poppins">Notes</h3>
              <div className="bg-solvix-light p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-line font-inter">{quoteData.notes}</p>
              </div>
            </div>
          )}

          {/* Signature Section - UTILISATION DE LA VRAIE SIGNATURE */}
          <div className="flex justify-end mt-8">
            <div className="text-center">
              <p className="text-xs text-gray-600 italic mb-2 font-inter">
                Fait le {new Date().toLocaleDateString('fr-FR')}, {entrepriseData.name}
              </p>
              {entrepriseData.signature && (
                <img 
                  src={entrepriseData.signature} 
                  alt="Signature" 
                  className="max-h-12 max-w-32 mx-auto"
                />
              )}
            </div>
          </div>

          {/* Template Info */}
          <div className="text-center text-xs text-gray-500 mt-8 font-inter">
            Devis généré le {new Date().toLocaleDateString('fr-FR')}
            <br />
            Solvix - Génération de devis professionnels
          </div>
        </div>
      </div>
    );
  };

  // Affichage de chargement si les données entreprise sont en cours de récupération
  if (isLoadingCompany) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-solvix-blue border-t-transparent mx-auto mb-4"></div>
            <p className="text-solvix-dark font-inter">Chargement des informations entreprise...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-solvix border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <FileText className="h-6 w-6 text-solvix-orange" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-solvix-dark font-poppins">Créer un devis</h1>
              <p className="text-gray-600 font-inter">Générez un devis professionnel en quelques clics</p>
              {/* AFFICHAGE DES INFORMATIONS ENTREPRISE CHARGÉES */}
              <p className="text-sm text-solvix-blue font-inter mt-1">
                Entreprise: {entrepriseData.name} | Email: {entrepriseData.email}
              </p>
              {/* NOUVEAU : Affichage des paramètres TVA appliqués */}
              <p className="text-xs text-gray-500 font-inter mt-1">
                TVA: {profileVatSettings.vat_enabled ? `${profileVatSettings.vat_rate}% (activée)` : 'Désactivée'} | 
                Devise: {profileVatSettings.default_currency}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            {/* Messages de statut */}
            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-800 font-inter">Devis sauvegardé !</span>
              </div>
            )}
            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-red-800 font-inter">{saveError}</span>
              </div>
            )}
            
            <button
              onClick={() => setShowPreview(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-solvix-light transition-colors duration-200 font-inter"
            >
              <Eye className="h-4 w-4 mr-2" />
              Aperçu
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-solvix-light transition-colors duration-200 font-inter"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-solvix-light transition-colors duration-200 disabled:opacity-50 font-inter"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600 mr-2"></div>
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
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 bg-solvix-orange text-white rounded-lg text-sm font-medium hover:bg-solvix-orange-dark transition-colors duration-200 font-inter shadow-solvix"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimer / PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Info */}
          <div className="bg-white rounded-xl shadow-solvix border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-solvix-dark mb-4 font-poppins">Informations du devis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Currency Selection */}
            <div className="mt-4">
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
              {selectedCurrency && (
                <p className="text-sm text-gray-500 mt-1 font-inter">
                  Les montants seront affichés en {selectedCurrency.name}
                </p>
              )}
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-white rounded-xl shadow-solvix border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-solvix-dark mb-4 flex items-center font-poppins">
              <User className="h-5 w-5 mr-2" />
              Informations client
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Products/Services */}
          <div className="bg-white rounded-xl shadow-solvix border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-solvix-dark font-poppins">Produits/Services</h3>
              <button
                onClick={addItem}
                className="inline-flex items-center px-3 py-2 bg-solvix-orange text-white rounded-lg text-sm font-medium hover:bg-solvix-orange-dark transition-colors duration-200 font-inter shadow-solvix"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </button>
            </div>

            {/* NOUVEAU : Affichage des paramètres TVA appliqués */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-inter">
                <strong>Paramètres TVA appliqués :</strong> 
                {profileVatSettings.vat_enabled ? (
                  <span> TVA activée à {profileVatSettings.vat_rate}% (appliquée automatiquement aux nouveaux articles)</span>
                ) : (
                  <span> TVA désactivée (aucune TVA ne sera appliquée)</span>
                )}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-medium text-solvix-dark font-inter">Désignation</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-solvix-dark w-20 font-inter">Qté</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-solvix-dark w-32 font-inter">Prix unitaire</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-solvix-dark w-20 font-inter">TVA%</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-solvix-dark w-32 font-inter">Total HT</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {quoteData.items.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={item.designation}
                          onChange={(e) => updateItem(item.id, 'designation', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-solvix-blue focus:border-transparent text-sm font-inter"
                          placeholder="Description du produit/service"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-solvix-blue focus:border-transparent text-sm text-center font-inter"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-solvix-blue focus:border-transparent text-sm text-right font-inter"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={item.vatRate}
                          onChange={(e) => updateItem(item.id, 'vatRate', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-solvix-blue focus:border-transparent text-sm text-center font-inter"
                          disabled={!profileVatSettings.vat_enabled}
                          style={{ 
                            backgroundColor: !profileVatSettings.vat_enabled ? '#f3f4f6' : 'white',
                            cursor: !profileVatSettings.vat_enabled ? 'not-allowed' : 'text'
                          }}
                        />
                      </td>
                      <td className="py-3 px-2 text-right text-sm font-medium font-montserrat">
                        {formatCurrency(calculateItemTotal(item), quoteData.currency)}
                      </td>
                      <td className="py-3 px-2">
                        {quoteData.items.length > 1 && (
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-solvix-error hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-200"
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

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-solvix border border-gray-200 p-6">
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Template Selection */}
          <div className="bg-white rounded-xl shadow-solvix border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-solvix-dark mb-4 font-poppins">Modèle de devis</h3>
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                    quoteData.template === template.id
                      ? 'border-solvix-blue bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setQuoteData(prev => ({ ...prev, template: template.id }))}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-12 bg-gray-100 rounded border flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-solvix-dark font-inter">{template.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded font-inter ${
                          template.free 
                            ? 'bg-green-100 text-solvix-success' 
                            : 'bg-orange-100 text-solvix-orange'
                        }`}>
                          {template.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 font-inter">{template.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white rounded-xl shadow-solvix border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-solvix-dark mb-4 font-poppins">Récapitulatif</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-inter">Sous-total HT:</span>
                <span className="font-medium font-montserrat">{formatCurrency(calculateSubtotal(), quoteData.currency)}</span>
              </div>
              {profileVatSettings.vat_enabled && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-inter">TVA:</span>
                  <span className="font-medium font-montserrat">{formatCurrency(calculateVAT(), quoteData.currency)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-solvix-dark font-poppins">TOTAL {profileVatSettings.vat_enabled ? 'TTC' : 'HT'}:</span>
                  <span className="text-lg font-bold text-solvix-orange font-montserrat">{formatCurrency(calculateTotal(), quoteData.currency)}</span>
                </div>
              </div>
            </div>
            
            {selectedCurrency && (
              <div className="mt-4 p-3 bg-solvix-light rounded-lg">
                <p className="text-xs text-gray-600 font-inter">
                  Devise: {selectedCurrency.name} ({selectedCurrency.symbol})
                </p>
                <p className="text-xs text-gray-600 font-inter mt-1">
                  TVA: {profileVatSettings.vat_enabled ? `${profileVatSettings.vat_rate}% (activée)` : 'Désactivée'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowPreview(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-solvix-lg transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-solvix-dark font-poppins">
                    Aperçu du devis - Template: {templates.find(t => t.id === quoteData.template)?.name}
                  </h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Fermer</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {renderPreview()}
                </div>
              </div>
              
              <div className="bg-solvix-light px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-solvix-orange text-base font-medium text-white hover:bg-solvix-orange-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-solvix-orange sm:ml-3 sm:w-auto sm:text-sm font-inter"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimer / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-solvix-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-solvix-blue sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm font-inter"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        quoteNumber={quoteData.number}
        clientEmail={quoteData.client.email}
        onEmailShare={handleEmailShare}
        onWhatsAppShare={handleWhatsAppShare}
        onDownload={handleDownloadShare}
      />
    </div>
  );
};

export default CreateQuote;