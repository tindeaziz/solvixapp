import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Printer, ArrowLeft, FileText } from 'lucide-react';
import { formatCurrency } from '../types/currency';

// Import des nouveaux modèles
import DevisModeleCorporate from './templates/DevisModeleCorporate';
import DevisModeleCreatif from './templates/DevisModeleCreatif';
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
  articles: QuoteItem[];
  client: ClientInfo;
  entreprise: CompanyInfo;
  numeroDevis: string;
  dateCreation: string;
  dateExpiration: string;
  devise: string;
  notes: string;
  template: 'classic' | 'modern' | 'minimal' | 'corporate' | 'creatif' | 'artisan' | 'elegant' | 'professionnel' | 'minimaliste';
  sousTotal: number;
  totalTVA: number;
  totalTTC: number;
}

const QuotePreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [quote, setQuote] = useState<DevisData | null>(null);
  const [loading, setLoading] = useState(true);

  // 3. RÉCEPTION DANS LE COMPOSANT D'IMPRESSION avec useLocation
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        console.log("=== RÉCEPTION DES DONNÉES DANS QUOTEPREVIEW ===");
        console.log("Location state:", location.state);
        console.log("Params ID:", id);

        // Récupérer les données depuis location.state (données dynamiques)
        const devisData = location.state as DevisData;
        
        if (devisData) {
          console.log("=== DONNÉES REÇUES AVEC SUCCÈS ===");
          console.log("Données reçues:", devisData);
          console.log("Articles reçus:", devisData.articles);
          console.log("Client reçu:", devisData.client);
          console.log("Numéro de devis:", devisData.numeroDevis);
          console.log("Template:", devisData.template);
          console.log("Signature reçue:", devisData.entreprise.signature ? "OUI" : "NON");
          
          setQuote(devisData);
        } else {
          console.log("=== AUCUNE DONNÉE REÇUE - UTILISATION DES DONNÉES SIMULÉES ===");
          
          // 5. GESTION DES CAS D'ERREUR - Données simulées si pas de données reçues
          const mockQuote: DevisData = {
            numeroDevis: `DEV-2025-${id?.padStart(3, '0') || '001'}`,
            dateCreation: '2025-01-15',
            dateExpiration: '2025-02-14',
            client: {
              name: 'Aziz Tindé',
              company: 'Danitechs',
              email: 'aziztinde@danitechs.pro',
              phone: '+33 6 12 34 56 78',
              address: '456 Avenue de l\'Innovation\n69000 Lyon, France'
            },
            articles: [
              {
                id: '1',
                designation: 'Développement application web React avec interface moderne et responsive',
                quantity: 1,
                unitPrice: 15000,
                vatRate: 20,
                total: 15000
              },
              {
                id: '2',
                designation: 'Formation équipe développement (3 jours)',
                quantity: 2,
                unitPrice: 1200,
                vatRate: 20,
                total: 2400
              },
              {
                id: '3',
                designation: 'Maintenance et support technique (6 mois)',
                quantity: 1,
                unitPrice: 3600,
                vatRate: 20,
                total: 3600
              },
              {
                id: '4',
                designation: 'Hébergement cloud premium (12 mois)',
                quantity: 1,
                unitPrice: 1800,
                vatRate: 20,
                total: 1800
              }
            ],
            devise: 'EUR',
            notes: 'Conditions de paiement : 30% à la commande, 70% à la livraison.\nGarantie : 12 mois sur les développements.\nFormation incluse pour 3 personnes maximum.\nSupport technique inclus pendant 6 mois.\nHébergement avec sauvegarde quotidienne automatique.',
            template: 'classic',
            entreprise: {
              name: 'Solvix',
              address: '123 Rue de la Technologie\n75001 Paris, France',
              phone: '+33 1 23 45 67 89',
              email: 'contact@solvix.com',
              signature: localStorage.getItem('companySignature') || undefined // Récupérer la signature depuis localStorage
            },
            sousTotal: 22800,
            totalTVA: 4560,
            totalTTC: 27360
          };

          console.log("Données simulées utilisées:", mockQuote);
          console.log("Signature simulée:", mockQuote.entreprise.signature ? "OUI" : "NON");
          setQuote(mockQuote);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du devis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id, location.state]);

  const calculateItemTotal = (item: QuoteItem) => item.quantity * item.unitPrice;
  
  const calculateSubtotal = () => {
    if (!quote) return 0;
    return quote.articles.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const calculateVAT = () => {
    if (!quote) return 0;
    return quote.articles.reduce((sum, item) => {
      const itemTotal = calculateItemTotal(item);
      return sum + (itemTotal * item.vatRate / 100);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateVAT();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate('/');
  };

  // Fonction pour rendre le bon modèle selon le template sélectionné
  const renderTemplate = () => {
    if (!quote) return null;

    const templateProps = {
      devisData: {
        numeroDevis: quote.numeroDevis,
        dateCreation: quote.dateCreation,
        dateExpiration: quote.dateExpiration,
        devise: quote.devise,
        notes: quote.notes
      },
      entrepriseData: quote.entreprise,
      clientData: quote.client,
      articles: quote.articles
    };

    switch (quote.template) {
      case 'corporate':
        return <DevisModeleCorporate {...templateProps} />;
      case 'creatif':
        return <DevisModeleCreatif {...templateProps} />;
      case 'artisan':
        return <DevisModeleArtisan {...templateProps} />;
      case 'elegant':
        return <DevisModeleElegant {...templateProps} />;
      case 'professionnel':
        return <DevisModeleProfessionnel {...templateProps} />;
      case 'minimaliste':
        return <DevisModeleMinimaliste {...templateProps} />;
      case 'modern':
        return renderModernTemplate();
      case 'minimal':
        return renderMinimalTemplate();
      default:
        return renderClassicTemplate();
    }
  };

  // Template Moderne - Design épuré avec gradients
  const renderModernTemplate = () => {
    if (!quote) return null;

    return (
      <div style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        lineHeight: '1.5',
        color: '#1f2937',
        backgroundColor: 'white',
        minHeight: '100vh',
        padding: '30px',
        maxWidth: '210mm',
        margin: '0 auto',
        position: 'relative'
      }}>
        {/* Header Moderne avec gradient */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '25px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Éléments décoratifs */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '100px',
            height: '100px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%'
          }}></div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            zIndex: 2
          }}>
            {/* Logo et entreprise */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {quote.entreprise.logo && (
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  padding: '10px',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <img 
                    src={quote.entreprise.logo} 
                    alt="Logo" 
                    style={{ 
                      maxHeight: '45px', 
                      width: 'auto',
                      filter: 'brightness(0) invert(1)'
                    }} 
                  />
                </div>
              )}
              <div>
                <div style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  marginBottom: '5px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {quote.entreprise.name}
                </div>
                <div style={{
                  fontSize: '11px',
                  opacity: '0.9',
                  lineHeight: '1.3'
                }}>
                  {quote.entreprise.phone} • {quote.entreprise.email}
                </div>
              </div>
            </div>

            {/* Section DEVIS */}
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '800',
                marginBottom: '5px',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                letterSpacing: '2px'
              }}>
                DEVIS
              </div>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '8px 15px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                backdropFilter: 'blur(10px)'
              }}>
                {quote.numeroDevis}
              </div>
            </div>
          </div>
        </div>

        {/* Informations date et client - Cards modernes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '20px',
          marginBottom: '25px'
        }}>
          {/* Card dates */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '20px',
            color: 'white',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
          }}>
            <div style={{
              fontSize: '12px',
              opacity: '0.8',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Dates importantes
            </div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', opacity: '0.7' }}>Émission</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>
                {formatDate(quote.dateCreation)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', opacity: '0.7' }}>Expiration</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>
                {formatDate(quote.dateExpiration)}
              </div>
            </div>
          </div>

          {/* Card client */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Accent coloré */}
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '4px',
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}></div>

            <div style={{
              fontSize: '12px',
              color: '#667eea',
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: '600'
            }}>
              Client
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '5px'
            }}>
              {quote.client.name}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#667eea',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              {quote.client.company}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#64748b',
              lineHeight: '1.4'
            }}>
              <div>{quote.client.email}</div>
              <div>{quote.client.phone}</div>
              {quote.client.address && (
                <div style={{ marginTop: '5px', whiteSpace: 'pre-line' }}>
                  {quote.client.address}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tableau des prestations - Style moderne */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          marginBottom: '25px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '15px 20px',
            fontSize: '14px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            💼 Prestations Modernes
          </div>
          
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{
                  padding: '15px 12px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#667eea'
                }}>
                  Description
                </th>
                <th style={{
                  padding: '15px 12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#667eea',
                  width: '70px'
                }}>
                  Qté
                </th>
                <th style={{
                  padding: '15px 12px',
                  textAlign: 'right',
                  fontWeight: '600',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#667eea',
                  width: '100px'
                }}>
                  Prix Unit.
                </th>
                <th style={{
                  padding: '15px 12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#667eea',
                  width: '60px'
                }}>
                  TVA
                </th>
                <th style={{
                  padding: '15px 12px',
                  textAlign: 'right',
                  fontWeight: '600',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#667eea',
                  width: '100px'
                }}>
                  Total HT
                </th>
              </tr>
            </thead>
            <tbody>
              {quote.articles.map((item, index) => (
                <tr key={item.id} style={{
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc',
                  borderLeft: index % 2 === 0 ? '3px solid #667eea' : '3px solid #764ba2'
                }}>
                  <td style={{
                    padding: '12px',
                    fontSize: '11px',
                    lineHeight: '1.4',
                    color: '#1f2937'
                  }}>
                    {item.designation}
                  </td>
                  <td style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontWeight: '700',
                    color: '#667eea'
                  }}>
                    {item.quantity}
                  </td>
                  <td style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {formatCurrency(item.unitPrice, quote.devise)}
                  </td>
                  <td style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#764ba2'
                  }}>
                    {item.vatRate}%
                  </td>
                  <td style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontWeight: '700',
                    color: '#667eea',
                    fontSize: '12px'
                  }}>
                    {formatCurrency(calculateItemTotal(item), quote.devise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section Totaux - Style moderne avec gradient */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '25px'
        }}>
          <div style={{ width: '320px' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '15px',
              overflow: 'hidden',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                padding: '15px 20px',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>Sous-total HT</span>
                  <span style={{ fontWeight: '600', fontSize: '12px' }}>
                    {formatCurrency(calculateSubtotal(), quote.devise)}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>Total TVA</span>
                  <span style={{ fontWeight: '600', fontSize: '12px' }}>
                    {formatCurrency(calculateVAT(), quote.devise)}
                  </span>
                </div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px',
                color: 'white'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    Total TTC
                  </span>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: '800'
                  }}>
                    {formatCurrency(calculateTotal(), quote.devise)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes - Style moderne */}
        {quote.notes && (
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '25px',
            border: '2px solid #e2e8f0',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '20px',
              backgroundColor: '#667eea',
              color: 'white',
              padding: '5px 15px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              📝 Notes & Conditions
            </div>
            <div style={{
              marginTop: '10px',
              fontSize: '11px',
              color: '#374151',
              lineHeight: '1.5',
              whiteSpace: 'pre-line'
            }}>
              {quote.notes}
            </div>
          </div>
        )}

        {/* Footer moderne avec signature */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '2px solid #e2e8f0'
        }}>
          <div style={{
            fontSize: '10px',
            color: '#64748b'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '3px' }}>
              Devis généré le {formatDate(new Date().toISOString().split('T')[0])}
            </div>
            <div>
              Solvix - Génération de devis professionnels
            </div>
          </div>
          
          {quote.entreprise.signature && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '10px',
                color: '#667eea',
                marginBottom: '8px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                ✨ Signature
              </div>
              <div style={{
                padding: '10px',
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                border: '2px solid #e2e8f0'
              }}>
                <img 
                  src={quote.entreprise.signature} 
                  alt="Signature" 
                  style={{ 
                    maxHeight: '45px', 
                    maxWidth: '120px'
                  }} 
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Template Minimaliste - Design épuré et simple
  const renderMinimalTemplate = () => {
    if (!quote) return null;

    return (
      <div style={{
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: '13px',
        lineHeight: '1.6',
        color: '#2d3748',
        backgroundColor: 'white',
        minHeight: '100vh',
        padding: '40px',
        maxWidth: '210mm',
        margin: '0 auto',
        position: 'relative'
      }}>
        {/* Header minimaliste */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '20px'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '300',
            color: '#2d3748',
            marginBottom: '5px'
          }}>
            {quote.entreprise.name}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#718096'
          }}>
            {quote.entreprise.phone} • {quote.entreprise.email}
          </div>
        </div>

        {/* Titre DEVIS minimaliste */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: '300',
            color: '#2d3748',
            marginBottom: '10px',
            letterSpacing: '1px'
          }}>
            DEVIS
          </div>
          <div style={{
            fontSize: '14px',
            color: '#718096',
            marginBottom: '5px'
          }}>
            {quote.numeroDevis}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#718096'
          }}>
            {formatDate(quote.dateCreation)} - Valide jusqu'au {formatDate(quote.dateExpiration)}
          </div>
        </div>

        {/* Client minimaliste */}
        <div style={{
          marginBottom: '30px',
          fontSize: '14px',
          color: '#2d3748'
        }}>
          <strong>Pour: {quote.client.name}</strong>
          {quote.client.company && <span> ({quote.client.company})</span>}
          {quote.client.email && (
            <div style={{ fontSize: '12px', color: '#718096', marginTop: '5px' }}>
              {quote.client.email} • {quote.client.phone}
            </div>
          )}
        </div>

        {/* Articles minimalistes */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 'normal',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#718096',
            marginBottom: '20px'
          }}>
            PRESTATIONS:
          </h3>
          {quote.articles.map((item, index) => (
            <div key={item.id} style={{
              marginBottom: '15px',
              paddingBottom: '10px',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#2d3748',
                marginBottom: '5px'
              }}>
                {index + 1}. {item.designation}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#718096',
                marginLeft: '20px'
              }}>
                {item.quantity} × {formatCurrency(item.unitPrice, quote.devise)} = {formatCurrency(calculateItemTotal(item), quote.devise)}
              </div>
            </div>
          ))}
        </div>

        {/* Totaux minimalistes */}
        <div style={{
          margin: '30px 0',
          textAlign: 'right',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '20px'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#718096',
            marginBottom: '8px'
          }}>
            TOTAL HT: {formatCurrency(calculateSubtotal(), quote.devise)}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#718096',
            marginBottom: '8px'
          }}>
            TVA: {formatCurrency(calculateVAT(), quote.devise)}
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#2d3748',
            borderTop: '2px solid #2d3748',
            paddingTop: '10px',
            marginTop: '10px'
          }}>
            TOTAL TTC: {formatCurrency(calculateTotal(), quote.devise)}
          </div>
        </div>

        {/* Notes minimalistes */}
        {quote.notes && (
          <div style={{
            margin: '30px 0',
            padding: '20px 0',
            borderTop: '1px solid #e2e8f0',
            fontSize: '12px',
            color: '#718096',
            whiteSpace: 'pre-line'
          }}>
            {quote.notes}
          </div>
        )}

        {/* Footer minimaliste */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <div style={{
            fontSize: '10px',
            color: '#718096'
          }}>
            Devis généré le {formatDate(new Date().toISOString().split('T')[0])}
            <br />
            Solvix - Génération de devis professionnels
          </div>
          
          {quote.entreprise.signature && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '10px',
                color: '#718096',
                marginBottom: '5px'
              }}>
                Signature
              </div>
              <img 
                src={quote.entreprise.signature} 
                alt="Signature" 
                style={{ 
                  maxHeight: '40px', 
                  maxWidth: '100px'
                }} 
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Template Classique existant
  const renderClassicTemplate = () => {
    if (!quote) return null;

    return (
      <div style={{
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#1e293b',
        backgroundColor: 'white',
        minHeight: '100vh',
        padding: '30px',
        maxWidth: '210mm',
        margin: '0 auto',
        boxSizing: 'border-box',
        position: 'relative',
        paddingBottom: '120px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '25px',
          borderBottom: '3px solid #8b5cf6',
          paddingBottom: '15px'
        }}>
          <div>
            {quote.entreprise.logo && (
              <img 
                src={quote.entreprise.logo} 
                alt="Logo" 
                style={{ 
                  maxHeight: '50px', 
                  width: 'auto', 
                  marginBottom: '10px' 
                }} 
              />
            )}
            <div style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '8px'
            }}>
              {quote.entreprise.name}
            </div>
            <div style={{
              color: '#64748b',
              fontSize: '11px',
              lineHeight: '1.3',
              whiteSpace: 'pre-line'
            }}>
              {quote.entreprise.address}
            </div>
            <div style={{ color: '#64748b', fontSize: '11px', marginTop: '3px' }}>
              {quote.entreprise.phone} | {quote.entreprise.email}
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '8px'
            }}>
              DEVIS
            </div>
            <div style={{
              fontSize: '16px',
              color: '#8b5cf6',
              fontWeight: 'bold',
              marginBottom: '12px'
            }}>
              {quote.numeroDevis}
            </div>
            <div style={{ color: '#64748b', fontSize: '11px' }}>
              Date: {formatDate(quote.dateCreation)}
            </div>
            <div style={{ color: '#64748b', fontSize: '11px' }}>
              Valide jusqu'au: {formatDate(quote.dateExpiration)}
            </div>
          </div>
        </div>

        {/* Section Client */}
        <div className="section-client" style={{
          maxHeight: '80px',
          fontSize: '10px',
          lineHeight: '1.1',
          padding: '8px',
          margin: '15px 0',
          backgroundColor: '#f8f9fa',
          borderLeft: '4px solid #8b5cf6',
          borderRadius: '0 6px 6px 0',
          overflow: 'hidden'
        }}>
          <div style={{
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '6px',
            fontSize: '11px'
          }}>
            Facturé à:
          </div>
          <div style={{
            fontWeight: 'bold',
            fontSize: '11px',
            marginBottom: '2px',
            color: '#1e293b'
          }}>
            {quote.client.name}
          </div>
          <div style={{
            fontSize: '10px',
            marginBottom: '2px',
            color: '#374151'
          }}>
            {quote.client.company}
          </div>
          <div style={{
            fontSize: '9px',
            color: '#64748b',
            marginBottom: '1px'
          }}>
            {quote.client.email} | {quote.client.phone}
          </div>
          <div style={{
            fontSize: '9px',
            color: '#64748b',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {quote.client.address.replace(/\n/g, ', ')}
          </div>
        </div>

        {/* Tableau des prestations */}
        <div className="tableau-produits" style={{ margin: '10px 0' }}>
          <div style={{
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '12px',
            fontSize: '14px'
          }}>
            Détail des prestations:
          </div>
          
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            overflow: 'hidden',
            fontSize: '11px'
          }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                <th style={{
                  color: '#1e293b',
                  padding: '10px 8px',
                  textAlign: 'left',
                  borderBottom: '2px solid #8b5cf6',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}>
                  Description
                </th>
                <th style={{
                  color: '#1e293b',
                  padding: '10px 8px',
                  textAlign: 'right',
                  borderBottom: '2px solid #8b5cf6',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  width: '60px'
                }}>
                  Qté
                </th>
                <th style={{
                  color: '#1e293b',
                  padding: '10px 8px',
                  textAlign: 'right',
                  borderBottom: '2px solid #8b5cf6',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  width: '90px'
                }}>
                  Prix unitaire
                </th>
                <th style={{
                  color: '#1e293b',
                  padding: '10px 8px',
                  textAlign: 'right',
                  borderBottom: '2px solid #8b5cf6',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  width: '50px'
                }}>
                  TVA %
                </th>
                <th style={{
                  color: '#1e293b',
                  padding: '10px 8px',
                  textAlign: 'right',
                  borderBottom: '2px solid #8b5cf6',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  width: '90px'
                }}>
                  Total HT
                </th>
              </tr>
            </thead>
            <tbody>
              {quote.articles.map((item, index) => (
                <tr key={item.id} style={{
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                }}>
                  <td style={{
                    padding: '8px',
                    borderBottom: '1px solid #e5e7eb',
                    color: '#374151',
                    fontSize: '10px',
                    lineHeight: '1.3'
                  }}>
                    {item.designation}
                  </td>
                  <td style={{
                    padding: '8px',
                    borderBottom: '1px solid #e5e7eb',
                    color: '#374151',
                    fontSize: '10px',
                    textAlign: 'right',
                    fontWeight: 'bold'
                  }}>
                    {item.quantity}
                  </td>
                  <td style={{
                    padding: '8px',
                    borderBottom: '1px solid #e5e7eb',
                    color: '#374151',
                    fontSize: '10px',
                    textAlign: 'right',
                    fontWeight: 'bold'
                  }}>
                    {formatCurrency(item.unitPrice, quote.devise)}
                  </td>
                  <td style={{
                    padding: '8px',
                    borderBottom: '1px solid #e5e7eb',
                    color: '#374151',
                    fontSize: '10px',
                    textAlign: 'right',
                    fontWeight: 'bold'
                  }}>
                    {item.vatRate}%
                  </td>
                  <td style={{
                    padding: '8px',
                    borderBottom: '1px solid #e5e7eb',
                    color: '#1e293b',
                    fontSize: '10px',
                    textAlign: 'right',
                    fontWeight: 'bold'
                  }}>
                    {formatCurrency(calculateItemTotal(item), quote.devise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section Totaux */}
        <div style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <div style={{ width: '280px' }}>
            <table style={{
              width: '100%',
              backgroundColor: '#f8f9fa',
              border: '2px solid #8b5cf6',
              borderRadius: '6px',
              overflow: 'hidden',
              fontSize: '12px'
            }}>
              <tbody>
                <tr>
                  <td style={{
                    padding: '8px 15px',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '12px',
                    color: '#64748b'
                  }}>
                    Sous-total HT:
                  </td>
                  <td style={{
                    padding: '8px 15px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#1e293b'
                  }}>
                    {formatCurrency(calculateSubtotal(), quote.devise)}
                  </td>
                </tr>
                <tr>
                  <td style={{
                    padding: '8px 15px',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '12px',
                    color: '#64748b'
                  }}>
                    Total TVA:
                  </td>
                  <td style={{
                    padding: '8px 15px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#1e293b'
                  }}>
                    {formatCurrency(calculateVAT(), quote.devise)}
                  </td>
                </tr>
                <tr style={{ backgroundColor: '#8b5cf6' }}>
                  <td style={{
                    padding: '12px 15px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    TOTAL TTC:
                  </td>
                  <td style={{
                    padding: '12px 15px',
                    textAlign: 'right',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    {formatCurrency(calculateTotal(), quote.devise)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="notes-conditions" style={{
            fontSize: '9px',
            maxHeight: '60px',
            padding: '5px',
            overflow: 'hidden',
            marginTop: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '4px',
              fontSize: '10px'
            }}>
              Notes et conditions:
            </div>
            <div style={{
              whiteSpace: 'pre-line',
              color: '#64748b',
              fontSize: '9px',
              lineHeight: '1.2',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {quote.notes}
            </div>
          </div>
        )}

        {/* SECTION SIGNATURE AUTOMATIQUE */}
        <div className="signature-footer" style={{
          position: 'absolute',
          bottom: '60px',
          right: '30px',
          textAlign: 'center',
          fontSize: '10px',
          fontStyle: 'italic',
          color: '#64748b'
        }}>
          <div style={{ marginBottom: '5px' }}>
            Fait le {new Date().toLocaleDateString('fr-FR')}, {quote.entreprise.name}
          </div>
          {quote.entreprise.signature && (
            <img 
              src={quote.entreprise.signature} 
              alt="Signature" 
              className="signature-image"
              style={{ 
                maxHeight: '60px', 
                maxWidth: '150px',
                marginTop: '5px'
              }} 
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '30px',
          right: '30px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '10px',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '12px'
        }}>
          <div>Devis généré le {formatDate(new Date().toISOString().split('T')[0])}</div>
          <div style={{ marginTop: '3px' }}>
            Solvix - Génération de devis professionnels
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Chargement du devis...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <FileText style={{ width: '48px', height: '48px', color: '#64748b', margin: '0 auto 20px' }} />
          <h2 style={{ color: '#1e293b', marginBottom: '10px' }}>Erreur: données manquantes</h2>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>Les données du devis n'ont pas pu être récupérées.</p>
          <button
            onClick={handleBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  console.log("=== RENDU FINAL DU DEVIS ===");
  console.log("Quote à afficher:", quote);
  console.log("Articles à afficher:", quote.articles);
  console.log("Template sélectionné:", quote.template);
  console.log("Signature à afficher:", quote.entreprise.signature ? "OUI" : "NON");

  return (
    <>
      {/* Boutons d'action - Cachés à l'impression */}
      <div className="print:hidden" style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        gap: '12px'
      }}>
        <button
          onClick={handleBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px', marginRight: '8px' }} />
          Retour
        </button>
        <button
          onClick={handlePrint}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Printer style={{ width: '16px', height: '16px', marginRight: '8px' }} />
          Imprimer / PDF
        </button>
      </div>

      {/* Rendu du template sélectionné */}
      {renderTemplate()}

      {/* Styles pour l'impression */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          @page {
            size: A4;
            margin: 12mm;
          }
          
          .section-client,
          .tableau-produits,
          .notes-conditions,
          .signature-footer {
            page-break-inside: avoid;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .section-client {
            max-height: 80px !important;
            font-size: 10px !important;
            line-height: 1.1 !important;
            padding: 8px !important;
          }

          .notes-conditions {
            font-size: 9px !important;
            max-height: 60px !important;
            padding: 5px !important;
            overflow: hidden !important;
          }

          .tableau-produits {
            margin: 10px 0 !important;
          }

          .signature-footer {
            position: absolute !important;
            bottom: 60px !important;
            right: 30px !important;
            text-align: center !important;
            font-size: 10px !important;
            font-style: italic !important;
            page-break-inside: avoid !important;
          }

          .signature-image {
            max-height: 60px !important;
            max-width: 150px !important;
            margin-top: 5px !important;
          }

          /* Styles spécifiques pour les nouveaux templates */
          .corporate-template,
          .creatif-template,
          .artisan-template,
          .elegant-template,
          .professionnel-template,
          .minimaliste-template {
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
          }
        }
      `}</style>
    </>
  );
};

export default QuotePreview;