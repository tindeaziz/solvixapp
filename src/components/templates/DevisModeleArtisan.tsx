import React from 'react';
import { formatCurrency } from '../../types/currency';

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

interface DevisModeleArtisanProps {
  devisData: {
    numeroDevis: string;
    dateCreation: string;
    dateExpiration: string;
    devise: string;
    notes: string;
  };
  entrepriseData: CompanyInfo;
  clientData: ClientInfo;
  articles: QuoteItem[];
}

const DevisModeleArtisan: React.FC<DevisModeleArtisanProps> = ({
  devisData,
  entrepriseData,
  clientData,
  articles
}) => {
  const calculateItemTotal = (item: QuoteItem) => item.quantity * item.unitPrice;
  
  const calculateSubtotal = () => {
    return articles.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const calculateVAT = () => {
    return articles.reduce((sum, item) => {
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

  return (
    <div className="artisan-template" style={{
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      lineHeight: '1.5',
      color: '#3C2415',
      backgroundColor: '#FEFCF8',
      minHeight: '100vh',
      padding: '20px',
      maxWidth: '210mm',
      margin: '0 auto',
      position: 'relative',
      border: '8px solid #8B4513',
      borderRadius: '15px',
      boxSizing: 'border-box',
      paddingBottom: '120px'
    }}>
      {/* Bordure décorative intérieure */}
      <div style={{
        position: 'absolute',
        top: '15px',
        left: '15px',
        right: '15px',
        bottom: '15px',
        border: '2px solid #D2B48C',
        borderRadius: '8px',
        pointerEvents: 'none'
      }}></div>

      {/* Motifs décoratifs dans les coins */}
      <div style={{
        position: 'absolute',
        top: '25px',
        left: '25px',
        width: '30px',
        height: '30px',
        background: 'radial-gradient(circle, #8B4513 2px, transparent 2px)',
        backgroundSize: '8px 8px'
      }}></div>
      <div style={{
        position: 'absolute',
        top: '25px',
        right: '25px',
        width: '30px',
        height: '30px',
        background: 'radial-gradient(circle, #8B4513 2px, transparent 2px)',
        backgroundSize: '8px 8px'
      }}></div>

      {/* Contenu principal avec marge pour les bordures */}
      <div style={{ margin: '25px', position: 'relative', zIndex: 1 }}>
        
        {/* Header Artisan - Style traditionnel */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '25px',
          borderBottom: '3px double #8B4513',
          paddingBottom: '15px'
        }}>
          <div>
            {entrepriseData.logo && (
              <img 
                src={entrepriseData.logo} 
                alt="Logo" 
                style={{ 
                  maxHeight: '50px', 
                  width: 'auto',
                  marginBottom: '10px'
                }} 
              />
            )}
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#8B4513',
              marginBottom: '5px',
              textShadow: '1px 1px 2px rgba(139, 69, 19, 0.3)',
              fontFamily: 'Georgia, serif'
            }}>
              {entrepriseData.name}
            </div>
            <div style={{
              fontSize: '10px',
              color: '#8B4513',
              lineHeight: '1.4',
              whiteSpace: 'pre-line'
            }}>
              {entrepriseData.address}
            </div>
            <div style={{ color: '#8B4513', fontSize: '10px', marginTop: '3px' }}>
              {entrepriseData.phone} | {entrepriseData.email}
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#8B4513',
              marginBottom: '5px',
              textShadow: '2px 2px 4px rgba(139, 69, 19, 0.2)',
              letterSpacing: '3px'
            }}>
              DEVIS
            </div>
            <div style={{
              fontSize: '16px',
              color: '#6B8E23',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              {devisData.numeroDevis}
            </div>
            <div style={{ color: '#8B4513', fontSize: '10px' }}>
              Date: {formatDate(devisData.dateCreation)}
            </div>
            <div style={{ color: '#8B4513', fontSize: '10px' }}>
              Valide jusqu'au: {formatDate(devisData.dateExpiration)}
            </div>
          </div>
        </div>

        {/* Section Client */}
        <div className="section-client" style={{
          maxHeight: '80px',
          fontSize: '10px',
          lineHeight: '1.2',
          padding: '10px',
          margin: '15px 0',
          backgroundColor: '#F5F5DC',
          borderLeft: '4px solid #8B4513',
          borderRadius: '0 6px 6px 0',
          overflow: 'hidden'
        }}>
          <div style={{
            fontWeight: 'bold',
            color: '#8B4513',
            marginBottom: '6px',
            fontSize: '11px'
          }}>
            Facturé à:
          </div>
          <div style={{
            fontWeight: 'bold',
            fontSize: '11px',
            marginBottom: '2px',
            color: '#8B4513'
          }}>
            {clientData.name}
          </div>
          <div style={{
            fontSize: '10px',
            marginBottom: '2px',
            color: '#6B8E23'
          }}>
            {clientData.company}
          </div>
          <div style={{
            fontSize: '9px',
            color: '#8B4513',
            marginBottom: '1px'
          }}>
            {clientData.email} | {clientData.phone}
          </div>
          <div style={{
            fontSize: '9px',
            color: '#8B4513',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {clientData.address.replace(/\n/g, ', ')}
          </div>
        </div>

        {/* Tableau des prestations */}
        <div className="tableau-produits" style={{ margin: '15px 0' }}>
          <div style={{
            fontWeight: 'bold',
            color: '#8B4513',
            marginBottom: '10px',
            fontSize: '14px'
          }}>
            🔨 Détail des Travaux Artisanaux:
          </div>
          
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '3px solid #8B4513',
            borderRadius: '6px',
            overflow: 'hidden',
            fontSize: '11px',
            boxShadow: '0 4px 8px rgba(139, 69, 19, 0.2)'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#DEB887' }}>
                <th style={{
                  padding: '8px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  color: '#8B4513'
                }}>
                  Description des Travaux
                </th>
                <th style={{
                  padding: '8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  color: '#8B4513',
                  width: '60px'
                }}>
                  Qté
                </th>
                <th style={{
                  padding: '8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  color: '#8B4513',
                  width: '90px'
                }}>
                  Prix Unit.
                </th>
                <th style={{
                  padding: '8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  color: '#8B4513',
                  width: '50px'
                }}>
                  TVA %
                </th>
                <th style={{
                  padding: '8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  color: '#8B4513',
                  width: '90px'
                }}>
                  Total HT
                </th>
              </tr>
            </thead>
            <tbody>
              {articles.map((item, index) => (
                <tr key={item.id} style={{
                  backgroundColor: index % 2 === 0 ? '#FEFCF8' : '#F5F5DC',
                  borderLeft: '4px solid ' + (index % 2 === 0 ? '#8B4513' : '#6B8E23')
                }}>
                  <td style={{
                    padding: '8px',
                    fontSize: '10px',
                    lineHeight: '1.3',
                    color: '#3C2415',
                    borderBottom: '1px solid #D2B48C'
                  }}>
                    {item.designation}
                  </td>
                  <td style={{
                    padding: '8px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: '#8B4513',
                    borderBottom: '1px solid #D2B48C',
                    fontSize: '10px'
                  }}>
                    {item.quantity}
                  </td>
                  <td style={{
                    padding: '8px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: '#3C2415',
                    borderBottom: '1px solid #D2B48C',
                    fontSize: '10px'
                  }}>
                    {formatCurrency(item.unitPrice, devisData.devise)}
                  </td>
                  <td style={{
                    padding: '8px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: '#6B8E23',
                    borderBottom: '1px solid #D2B48C',
                    fontSize: '10px'
                  }}>
                    {item.vatRate}%
                  </td>
                  <td style={{
                    padding: '8px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: '#8B4513',
                    fontSize: '10px',
                    borderBottom: '1px solid #D2B48C'
                  }}>
                    {formatCurrency(calculateItemTotal(item), devisData.devise)}
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
              backgroundColor: '#F5F5DC',
              border: '3px solid #8B4513',
              borderRadius: '6px',
              overflow: 'hidden',
              fontSize: '12px',
              boxShadow: '0 4px 8px rgba(139, 69, 19, 0.2)'
            }}>
              <tbody>
                <tr>
                  <td style={{
                    padding: '8px 15px',
                    borderBottom: '2px solid #D2B48C',
                    fontSize: '12px',
                    color: '#6B8E23',
                    fontWeight: 'bold'
                  }}>
                    Sous-total HT:
                  </td>
                  <td style={{
                    padding: '8px 15px',
                    borderBottom: '2px solid #D2B48C',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#3C2415'
                  }}>
                    {formatCurrency(calculateSubtotal(), devisData.devise)}
                  </td>
                </tr>
                <tr>
                  <td style={{
                    padding: '8px 15px',
                    borderBottom: '2px solid #D2B48C',
                    fontSize: '12px',
                    color: '#6B8E23',
                    fontWeight: 'bold'
                  }}>
                    Total TVA:
                  </td>
                  <td style={{
                    padding: '8px 15px',
                    borderBottom: '2px solid #D2B48C',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#3C2415'
                  }}>
                    {formatCurrency(calculateVAT(), devisData.devise)}
                  </td>
                </tr>
                <tr style={{ backgroundColor: '#8B4513' }}>
                  <td style={{
                    padding: '12px 15px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#F5F5DC'
                  }}>
                    TOTAL TTC:
                  </td>
                  <td style={{
                    padding: '12px 15px',
                    textAlign: 'right',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#F5F5DC'
                  }}>
                    {formatCurrency(calculateTotal(), devisData.devise)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {devisData.notes && (
          <div className="notes-conditions" style={{
            fontSize: '9px',
            maxHeight: '60px',
            padding: '8px',
            overflow: 'hidden',
            marginTop: '20px',
            backgroundColor: '#F5F5DC',
            borderRadius: '6px',
            border: '2px solid #D2B48C'
          }}>
            <div style={{
              fontWeight: 'bold',
              color: '#8B4513',
              marginBottom: '4px',
              fontSize: '10px'
            }}>
              📜 Conditions Artisanales:
            </div>
            <div style={{
              whiteSpace: 'pre-line',
              color: '#3C2415',
              fontSize: '9px',
              lineHeight: '1.2',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontStyle: 'italic'
            }}>
              {devisData.notes}
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
          color: '#6B8E23'
        }}>
          <div style={{ marginBottom: '5px' }}>
            Fait le {new Date().toLocaleDateString('fr-FR')}, {entrepriseData.name}
          </div>
          {entrepriseData.signature && (
            <img 
              src={entrepriseData.signature} 
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
          color: '#6B8E23',
          fontSize: '10px',
          borderTop: '3px double #8B4513',
          paddingTop: '12px'
        }}>
          <div>Devis généré le {formatDate(new Date().toISOString().split('T')[0])}</div>
          <div style={{ marginTop: '3px' }}>
            Solvix - Génération de devis professionnels
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevisModeleArtisan;