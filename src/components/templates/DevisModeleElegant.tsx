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

interface DevisModeleElegantProps {
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

const DevisModeleElegant: React.FC<DevisModeleElegantProps> = ({
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
    <div className="elegant-template" style={{
      fontFamily: 'Garamond, serif',
      fontSize: '12px',
      lineHeight: '1.5',
      color: '#333333',
      backgroundColor: '#FFFCF7',
      minHeight: '100vh',
      padding: '20px',
      maxWidth: '210mm',
      margin: '0 auto',
      position: 'relative',
      border: '1px solid #E8E0D0',
      boxSizing: 'border-box',
      paddingBottom: '120px'
    }}>
      {/* En-tête élégant */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '25px',
        borderBottom: '3px solid #D4B78F',
        paddingBottom: '15px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
          {entrepriseData.logo && (
            <img 
              src={entrepriseData.logo} 
              alt="Logo" 
              style={{ 
                maxHeight: '50px', 
                width: 'auto'
              }} 
            />
          )}
          <div>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#8A6D3B',
              marginBottom: '5px',
              fontFamily: 'Garamond, serif'
            }}>
              {entrepriseData.name}
            </div>
            <div style={{
              color: '#8A6D3B',
              fontSize: '10px',
              lineHeight: '1.4',
              fontStyle: 'italic',
              whiteSpace: 'pre-line'
            }}>
              {entrepriseData.address}
            </div>
            <div style={{ color: '#8A6D3B', fontSize: '10px', marginTop: '3px' }}>
              {entrepriseData.phone} | {entrepriseData.email}
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'normal',
            color: '#8A6D3B',
            marginBottom: '5px',
            fontFamily: 'Garamond, serif',
            letterSpacing: '2px'
          }}>
            DEVIS
          </div>
          <div style={{
            fontSize: '16px',
            color: '#8A6D3B',
            fontStyle: 'italic',
            marginBottom: '10px'
          }}>
            {devisData.numeroDevis}
          </div>
          <div style={{ fontSize: '10px', color: '#8A6D3B' }}>
            Date: {formatDate(devisData.dateCreation)}
          </div>
          <div style={{ fontSize: '10px', color: '#8A6D3B' }}>
            Valide jusqu'au: {formatDate(devisData.dateExpiration)}
          </div>
        </div>
      </div>

      {/* Section client */}
      <div className="section-client" style={{
        maxHeight: '80px',
        fontSize: '10px',
        lineHeight: '1.2',
        padding: '10px',
        margin: '15px 0',
        backgroundColor: '#F9F5ED',
        border: '1px solid #E8E0D0',
        borderRadius: '0 6px 6px 0',
        overflow: 'hidden'
      }}>
        <div style={{
          fontWeight: 'bold',
          color: '#8A6D3B',
          marginBottom: '6px',
          fontSize: '11px',
          fontStyle: 'italic'
        }}>
          À l'attention de:
        </div>
        <div style={{
          fontWeight: 'bold',
          fontSize: '11px',
          marginBottom: '2px',
          color: '#8A6D3B',
          fontFamily: 'Garamond, serif'
        }}>
          {clientData.name}
        </div>
        <div style={{
          fontSize: '10px',
          marginBottom: '2px',
          color: '#8A6D3B',
          fontStyle: 'italic'
        }}>
          {clientData.company}
        </div>
        <div style={{
          fontSize: '9px',
          color: '#666',
          marginBottom: '1px'
        }}>
          {clientData.email} | {clientData.phone}
        </div>
        <div style={{
          fontSize: '9px',
          color: '#666',
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
          color: '#8A6D3B',
          marginBottom: '10px',
          fontSize: '14px',
          fontFamily: 'Garamond, serif',
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          Détail des prestations:
        </div>
        
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #E8E0D0',
          borderRadius: '6px',
          overflow: 'hidden',
          fontSize: '11px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#F9F5ED' }}>
              <th style={{
                padding: '8px',
                textAlign: 'left',
                borderBottom: '2px solid #D4B78F',
                color: '#8A6D3B',
                fontWeight: 'normal',
                fontSize: '11px',
                fontStyle: 'italic'
              }}>
                Description
              </th>
              <th style={{
                padding: '8px',
                textAlign: 'right',
                borderBottom: '2px solid #D4B78F',
                color: '#8A6D3B',
                fontWeight: 'normal',
                fontSize: '11px',
                fontStyle: 'italic',
                width: '60px'
              }}>
                Qté
              </th>
              <th style={{
                padding: '8px',
                textAlign: 'right',
                borderBottom: '2px solid #D4B78F',
                color: '#8A6D3B',
                fontWeight: 'normal',
                fontSize: '11px',
                fontStyle: 'italic',
                width: '90px'
              }}>
                Prix unitaire
              </th>
              <th style={{
                padding: '8px',
                textAlign: 'right',
                borderBottom: '2px solid #D4B78F',
                color: '#8A6D3B',
                fontWeight: 'normal',
                fontSize: '11px',
                fontStyle: 'italic',
                width: '50px'
              }}>
                TVA %
              </th>
              <th style={{
                padding: '8px',
                textAlign: 'right',
                borderBottom: '2px solid #D4B78F',
                color: '#8A6D3B',
                fontWeight: 'normal',
                fontSize: '11px',
                fontStyle: 'italic',
                width: '90px'
              }}>
                Total HT
              </th>
            </tr>
          </thead>
          <tbody>
            {articles.map((item, index) => (
              <tr key={item.id} style={{
                backgroundColor: index % 2 === 0 ? '#FFFCF7' : '#F9F5ED',
                borderBottom: '1px solid #E8E0D0'
              }}>
                <td style={{
                  padding: '8px',
                  fontSize: '10px',
                  lineHeight: '1.3',
                  color: '#333'
                }}>
                  {item.designation}
                </td>
                <td style={{
                  padding: '8px',
                  textAlign: 'right',
                  fontSize: '10px',
                  color: '#333'
                }}>
                  {item.quantity}
                </td>
                <td style={{
                  padding: '8px',
                  textAlign: 'right',
                  fontSize: '10px',
                  color: '#333'
                }}>
                  {formatCurrency(item.unitPrice, devisData.devise)}
                </td>
                <td style={{
                  padding: '8px',
                  textAlign: 'right',
                  fontSize: '10px',
                  color: '#333'
                }}>
                  {item.vatRate}%
                </td>
                <td style={{
                  padding: '8px',
                  textAlign: 'right',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#8A6D3B'
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
            border: '1px solid #E8E0D0',
            borderRadius: '6px',
            overflow: 'hidden',
            fontSize: '12px'
          }}>
            <tbody>
              <tr style={{ backgroundColor: '#F9F5ED' }}>
                <td style={{
                  padding: '8px 15px',
                  fontSize: '12px',
                  color: '#8A6D3B',
                  fontStyle: 'italic'
                }}>
                  Sous-total HT:
                </td>
                <td style={{
                  padding: '8px 15px',
                  textAlign: 'right',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  {formatCurrency(calculateSubtotal(), devisData.devise)}
                </td>
              </tr>
              <tr style={{ backgroundColor: '#F9F5ED' }}>
                <td style={{
                  padding: '8px 15px',
                  fontSize: '12px',
                  color: '#8A6D3B',
                  fontStyle: 'italic',
                  borderTop: '1px solid #E8E0D0'
                }}>
                  Total TVA:
                </td>
                <td style={{
                  padding: '8px 15px',
                  textAlign: 'right',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#333',
                  borderTop: '1px solid #E8E0D0'
                }}>
                  {formatCurrency(calculateVAT(), devisData.devise)}
                </td>
              </tr>
              <tr style={{ backgroundColor: '#8A6D3B' }}>
                <td style={{
                  padding: '12px 15px',
                  fontSize: '16px',
                  color: '#FFFCF7',
                  fontFamily: 'Garamond, serif'
                }}>
                  TOTAL TTC:
                </td>
                <td style={{
                  padding: '12px 15px',
                  textAlign: 'right',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#FFFCF7',
                  fontFamily: 'Garamond, serif'
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
          backgroundColor: '#F9F5ED',
          borderRadius: '6px',
          border: '1px solid #E8E0D0'
        }}>
          <div style={{
            fontWeight: 'bold',
            color: '#8A6D3B',
            marginBottom: '4px',
            fontSize: '10px',
            fontStyle: 'italic'
          }}>
            Conditions & Notes:
          </div>
          <div style={{
            whiteSpace: 'pre-line',
            color: '#333',
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
        color: '#8A6D3B'
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
        color: '#8A6D3B',
        fontSize: '10px',
        borderTop: '1px solid #E8E0D0',
        paddingTop: '12px',
        fontStyle: 'italic'
      }}>
        <div>Devis généré le {formatDate(new Date().toISOString().split('T')[0])}</div>
        <div style={{ marginTop: '3px' }}>
          Solvix - Génération de devis professionnels
        </div>
      </div>
    </div>
  );
};

export default DevisModeleElegant;