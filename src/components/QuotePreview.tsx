import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Share2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { devisService, profileService } from '../lib/supabase';
import { generateDevisPDF } from '../utils/pdfGenerator';
import ShareModal from './ShareModal';

// Import des templates
import DevisModeleCreatif from './templates/DevisModeleCreatif';
import DevisModeleCorporate from './templates/DevisModeleCorporate';
import DevisModeleArtisan from './templates/DevisModeleArtisan';
import DevisModeleElegant from './templates/DevisModeleElegant';
import DevisModeleProfessionnel from './templates/DevisModeleProfessionnel';
import DevisModeleMinimaliste from './templates/DevisModeleMinimaliste';

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

interface DevisData {
  numeroDevis: string;
  dateCreation: string;
  dateExpiration: string;
  devise: string;
  notes: string;
  template: string;
  articles: QuoteItem[];
  client: ClientInfo;
  entreprise: CompanyInfo;
  sousTotal: number;
  totalTVA: number;
  totalTTC: number;
}

const QuotePreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [devisData, setDevisData] = useState<DevisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Charger les données du devis
  useEffect(() => {
    const loadDevisData = async () => {
      setLoading(true);
      setError('');

      try {
        // Si les données sont passées via location.state (nouveau devis ou édition)
        if (location.state) {
          console.log('📄 QUOTE_PREVIEW - Utilisation des données du state');
          setDevisData(location.state as DevisData);
          setLoading(false);
          return;
        }

        // Sinon, charger depuis la base de données
        if (!id || !user) {
          throw new Error('ID du devis ou utilisateur manquant');
        }

        console.log('📄 QUOTE_PREVIEW - Chargement du devis ID:', id);

        const { data: devis, error: devisError } = await devisService.getDevisById(id);
        if (devisError || !devis) {
          throw new Error('Devis non trouvé');
        }

        const { data: profile } = await profileService.getProfile();

        const formattedData: DevisData = {
          numeroDevis: devis.quote_number,
          dateCreation: devis.date_creation,
          dateExpiration: devis.date_expiration,
          devise: devis.currency,
          notes: devis.notes,
          template: devis.template,
          articles: (devis.articles || []).map(article => ({
            id: article.id,
            designation: article.designation,
            quantity: article.quantity,
            unitPrice: article.unit_price,
            vatRate: article.vat_rate,
            total: article.total_ht
          })),
          client: {
            name: devis.client?.name || 'Client non défini',
            company: devis.client?.company || '',
            email: devis.client?.email || '',
            phone: devis.client?.phone || '',
            address: devis.client?.address || ''
          },
          entreprise: {
            name: profile?.company_name || 'Mon Entreprise',
            address: profile?.company_address || 'Adresse à renseigner',
            phone: profile?.company_phone || 'Téléphone à renseigner',
            email: profile?.company_email || 'Email à renseigner',
            logo: profile?.company_logo || undefined,
            signature: profile?.company_signature || undefined
          },
          sousTotal: devis.subtotal_ht,
          totalTVA: devis.total_vat,
          totalTTC: devis.total_ttc
        };

        setDevisData(formattedData);

      } catch (error) {
        console.error('❌ QUOTE_PREVIEW - Erreur chargement:', error);
        setError(error instanceof Error ? error.message : 'Erreur lors du chargement du devis');
      } finally {
        setLoading(false);
      }
    };

    loadDevisData();
  }, [id, location.state, user]);

  const handleBack = () => {
    navigate(-1);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!devisData) return;

    setIsGeneratingPDF(true);
    try {
      console.log('📥 QUOTE_PREVIEW - Génération PDF pour devis:', devisData.numeroDevis);
      await generateDevisPDF(devisData);
      console.log('✅ QUOTE_PREVIEW - PDF généré avec succès');
    } catch (error) {
      console.error('❌ QUOTE_PREVIEW - Erreur génération PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const renderTemplate = () => {
    if (!devisData) return null;

    const templateProps = {
      devisData: {
        numeroDevis: devisData.numeroDevis,
        dateCreation: devisData.dateCreation,
        dateExpiration: devisData.dateExpiration,
        devise: devisData.devise,
        notes: devisData.notes
      },
      entrepriseData: devisData.entreprise,
      clientData: devisData.client,
      articles: devisData.articles
    };

    switch (devisData.template) {
      case 'creatif':
        return <DevisModeleCreatif {...templateProps} />;
      case 'corporate':
        return <DevisModeleCorporate {...templateProps} />;
      case 'artisan':
        return <DevisModeleArtisan {...templateProps} />;
      case 'elegant':
        return <DevisModeleElegant {...templateProps} />;
      case 'professionnel':
        return <DevisModeleProfessionnel {...templateProps} />;
      case 'minimaliste':
        return <DevisModeleMinimaliste {...templateProps} />;
      default:
        return <DevisModeleCreatif {...templateProps} />;
    }
  };

  // Affichage de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-solvix-blue border-t-transparent mx-auto mb-4"></div>
          <p className="text-solvix-dark font-inter">Chargement du devis...</p>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error || !devisData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error || 'Devis non trouvé'}</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 bg-solvix-blue text-white rounded-lg hover:bg-solvix-blue-dark transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header d'actions - Masqué à l'impression */}
      <div className="print:hidden bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-400 hover:text-solvix-blue rounded-lg hover:bg-solvix-light transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-solvix-dark font-poppins">
                  Aperçu du devis {devisData.numeroDevis}
                </h1>
                <p className="text-sm text-gray-500 font-inter">
                  Template: {devisData.template}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-solvix-light transition-colors duration-200 font-inter"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </button>
              
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-solvix-light transition-colors duration-200 font-inter"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="inline-flex items-center px-4 py-2 bg-solvix-orange text-white rounded-lg text-sm font-medium hover:bg-solvix-orange-dark transition-colors duration-200 disabled:opacity-50 font-inter shadow-solvix"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu du devis */}
      <div className="min-h-screen bg-gray-50 print:bg-white">
        <div className="max-w-4xl mx-auto print:max-w-none print:mx-0">
          <div className="bg-white print:bg-white print:shadow-none shadow-lg print:p-0 p-8">
            {renderTemplate()}
          </div>
        </div>
      </div>

      {/* Modal de partage */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        quoteNumber={devisData.numeroDevis}
        clientEmail={devisData.client.email}
        onEmailShare={async (email: string, message: string) => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log('📧 Email envoyé à:', email);
        }}
        onWhatsAppShare={() => {
          const message = `Bonjour,\n\nVoici le devis ${devisData.numeroDevis} que vous avez demandé.\n\nCordialement`;
          const encodedMessage = encodeURIComponent(message);
          window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
        }}
        onDownload={handleDownloadPDF}
      />

      {/* Styles d'impression */}
      <style jsx>{`
        @media print {
          @page {
            margin: 0;
            size: A4;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:bg-white {
            background: white !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          .print\\:max-w-none {
            max-width: none !important;
          }
          
          .print\\:mx-0 {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
        }
      `}</style>
    </>
  );
};

export default QuotePreview;