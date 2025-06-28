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

interface DevisModeleCreatifProps {
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

const DevisModeleCreatif: React.FC<DevisModeleCreatifProps> = ({
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
    <div className="creatif-template" style={{
      fontFamily: 'Poppins, sans-serif',
      fontSize: '12px',
      lineHeight: '1.5',
      color: '#2D3748',
      backgroundColor: 'white',
      minHeight: '100vh',
      padding: '20px',
      maxWidth: '210mm',
      margin: '0 auto',
      position: 'relative',
      boxSizing: 'border-box',
      paddingBottom: '120px'
    }}>
      {/* Header Créatif - Design moderne avec gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #FF6B35 0%, #6F42C1 100%)',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '20px',
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
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '80px',
          height: '80px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%'
        }}></div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Logo et entreprise */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
            {entrepriseData.logo && (
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '8px',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)'
              }}>
                <img 
                  src={entrepriseData.logo} 
                  alt="Logo" 
                  style={{ 
                    maxHeight: '40px', 
                    width: 'auto',
                    filter: 'brightness(0) invert(1)'
                  }} 
                />
              </div>
            )}
            <div>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                marginBottom: '5px',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {entrepriseData.name}
              </div>
              <div style={{
                fontSize: '10px',
                opacity: '0.9',
                lineHeight: '1.3',
                whiteSpace: 'pre-line'
              }}>
                {entrepriseData.address}
              </div>
              <div style={{ fontSize: '10px', opacity: '0.9', marginTop: '3px' }}>
                {entrepriseData.phone} | {entrepriseData.email}
              </div>
            </div>
          </div>

          {/* Section DEVIS */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '800',
              marginBottom: '5px',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              letterSpacing: '2px'
            }}>
              DEVIS
            </div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              backdropFilter: 'blur(10px)',
              marginBottom: '10px',
              display: 'inline-block'
            }}>
              {devisData.numeroDevis}
            </div>
            <div style={{ fontSize: '10px', opacity: '0.9' }}>
              Date: {formatDate(devisData.dateCreation)}
            </div>
            <div style={{ fontSize: '10px', opacity: '0.9' }}>
              Valide jusqu'au: {formatDate(devisData.dateExpiration)}
            </div>
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
        background: 'linear-gradient(135deg, #F7FAFC 0%, #E2E8F0 100%)',
        borderLeft: '4px solid #FF6B35',
        borderRadius: '0 6px 6px 0',
        overflow: 'hidden'
      }}>
        <div style={{
          fontWeight: 'bold',
          color: '#6F42C1',
          marginBottom: '6px',
          fontSize: '11px'
        }}>
          Facturé à:
        </div>
        <div style={{
          fontWeight: 'bold',
          fontSize: '11px',
          marginBottom: '2px',
          color: '#2D3748'
        }}>
          {clientData.name}
        </div>
        <div style={{
          fontSize: '10px',
          marginBottom: '2px',
          color: '#FF6B35'
        }}>
          {clientData.company}
        </div>
        <div style={{
          fontSize: '9px',
          color: '#718096',
          marginBottom: '1px'
        }}>
          {clientData.email} | {clientData.phone}
        </div>
        <div style={{
          fontSize: '9px',
          color: '#718096',
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
          color: '#2D3748',
          marginBottom: '10px',
          fontSize: '14px'
        }}>
          🎨 Prestations Créatives:
        </div>
        
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          borderRadius: '6px',
          overflow: 'hidden',
          fontSize: '11px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #6F42C1 100%)' }}>
              <th style={{
                color: 'white',
                padding: '8px',
                textAlign: 'left',
                fontWeight: 'bold',
                fontSize: '11px'
              }}>
                Description
              </th>
              <th style={{
                color: 'white',
                padding: '8px',
                textAlign: 'right',
                fontWeight: 'bold',
                fontSize: '11px',
                width: '60px'
              }}>
                Qté
              </th>
              <th style={{
                color: 'white',
                padding: '8px',
                textAlign: 'right',
                fontWeight: 'bold',
                fontSize: '11px',
                width: '90px'
              }}>
                Prix unitaire
              </th>
              <th style={{
                color: 'white',
                padding: '8px',
                textAlign: 'right',
                fontWeight: 'bold',
                fontSize: '11px',
                width: '50px'
              }}>
                TVA %
              </th>
              <th style={{
                color: 'white',
                padding: '8px',
                textAlign: 'right',
                fontWeight: 'bold',
                fontSize: '11px',
                width: '90px'
              }}>
                Total HT
              </th>
            </tr>
          </thead>
          <tbody>
            {articles.map((item, index) => (
              <tr key={item.id} style={{
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#F7FAFC',
                borderLeft: index % 2 === 0 ? '3px solid #FF6B35' : '3px solid #6F42C1'
              }}>
                <td style={{
                  padding: '8px',
                  fontSize: '10px',
                  lineHeight: '1.3',
                  color: '#2D3748'
                }}>
                  {item.designation}
                </td>
                <td style={{
                  padding: '8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: '#FF6B35',
                  fontSize: '10px'
                }}>
                  {item.quantity}
                </td>
                <td style={{
                  padding: '8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: '#2D3748',
                  fontSize: '10px'
                }}>
                  {formatCurrency(item.unitPrice, devisData.devise)}
                </td>
                <td style={{
                  padding: '8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: '#6F42C1',
                  fontSize: '10px'
                }}>
                  {item.vatRate}%
                </td>
                <td style={{
                  padding: '8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: '#FF6B35',
                  fontSize: '10px'
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
            borderCollapse: 'collapse',
            borderRadius: '6px',
            overflow: 'hidden',
            fontSize: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <tbody>
              <tr>
                <td style={{
                  padding: '8px 15px',
                  fontSize: '12px',
                  color: '#718096',
                  backgroundColor: '#F7FAFC'
                }}>
                  Sous-total HT:
                </td>
                <td style={{
                  padding: '8px 15px',
                  textAlign: 'right',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#2D3748',
                  backgroundColor: '#F7FAFC'
                }}>
                  {formatCurrency(calculateSubtotal(), devisData.devise)}
                </td>
              </tr>
              <tr>
                <td style={{
                  padding: '8px 15px',
                  fontSize: '12px',
                  color: '#718096',
                  backgroundColor: '#F7FAFC'
                }}>
                  Total TVA:
                </td>
                <td style={{
                  padding: '8px 15px',
                  textAlign: 'right',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#2D3748',
                  backgroundColor: '#F7FAFC'
                }}>
                  {formatCurrency(calculateVAT(), devisData.devise)}
                </td>
              </tr>
              <tr style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #6F42C1 100%)' }}>
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
          background: 'linear-gradient(135deg, #F7FAFC 0%, #E2E8F0 100%)',
          borderRadius: '6px',
          border: '2px solid #E2E8F0'
        }}>
          <div style={{
            fontWeight: 'bold',
            color: '#6F42C1',
            marginBottom: '4px',
            fontSize: '10px'
          }}>
            📝 Notes et conditions:
          </div>
          <div style={{
            whiteSpace: 'pre-line',
            color: '#4A5568',
            fontSize: '9px',
            lineHeight: '1.2',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
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
        color: '#718096'
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
        color: '#718096',
        fontSize: '10px',
        borderTop: '1px solid #E2E8F0',
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

export default DevisModeleCreatif;