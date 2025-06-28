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

interface DevisModeleMinimalisteProps {
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

const DevisModeleMinimaliste: React.FC<DevisModeleMinimalisteProps> = ({
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
    <div className="minimaliste-template" style={{
      fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
      fontSize: '14px',
      lineHeight: '1.5',
      color: '#333333',
      backgroundColor: 'white',
      minHeight: '100vh',
      padding: '20px',
      maxWidth: '100%',
      margin: '0 auto',
      position: 'relative',
      boxSizing: 'border-box',
      paddingBottom: '120px'
    }}>
      {/* En-tête ultra minimaliste */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginBottom: '25px',
        borderBottom: '3px solid #eee',
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
            fontWeight: '500',
            color: '#333',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            {entrepriseData.name}
          </div>
          <div style={{
            color: '#888',
            fontSize: '11px',
            lineHeight: '1.4',
            whiteSpace: 'pre-line'
          }}>
            {entrepriseData.address}
          </div>
          <div style={{
            color: '#888',
            fontSize: '11px',
            marginTop: '3px'
          }}>
            {entrepriseData.phone} | {entrepriseData.email}
          </div>
        </div>
        
        <div style={{ textAlign: 'left' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '300',
            color: '#333',
            marginBottom: '8px',
            letterSpacing: '1px'
          }}>
            DEVIS
          </div>
          <div style={{
            fontSize: '16px',
            color: '#888',
            marginBottom: '12px'
          }}>
            {devisData.numeroDevis}
          </div>
          <div style={{ fontSize: '11px', color: '#888' }}>
            Date: {formatDate(devisData.dateCreation)}
          </div>
          <div style={{ fontSize: '11px', color: '#888' }}>
            Valide jusqu'au: {formatDate(devisData.dateExpiration)}
          </div>
        </div>
      </div>

      {/* Section client - Dimensions standardisées */}
      <div className="section-client" style={{
        maxHeight: '80px',
        fontSize: '10px',
        lineHeight: '1.1',
        padding: '8px',
        margin: '15px 0',
        backgroundColor: '#f9f9f9',
        borderLeft: '4px solid #eee',
        borderRadius: '0 6px 6px 0',
        overflow: 'hidden'
      }}>
        <div style={{
          fontWeight: 'bold',
          color: '#888',
          marginBottom: '6px',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Client:
        </div>
        <div style={{
          fontWeight: 'bold',
          fontSize: '11px',
          marginBottom: '2px',
          color: '#333'
        }}>
          {clientData.name}
        </div>
        <div style={{
          fontSize: '10px',
          marginBottom: '2px',
          color: '#555'
        }}>
          {clientData.company}
        </div>
        <div style={{
          fontSize: '9px',
          color: '#888',
          marginBottom: '1px'
        }}>
          {clientData.email} | {clientData.phone}
        </div>
        <div style={{
          fontSize: '9px',
          color: '#888',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {clientData.address.replace(/\n/g, ', ')}
        </div>
      </div>

      {/* Tableau des prestations - Dimensions standardisées */}
      <div className="tableau-produits" style={{ margin: '10px 0', overflowX: 'auto' }}>
        <div style={{
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '12px',
          fontSize: '14px'
        }}>
          Prestations:
        </div>
        
        <div style={{ minWidth: '500px' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px'
          }}>
            <thead>
              <tr>
                <th style={{
                  padding: '10px 8px',
                  textAlign: 'left',
                  borderBottom: '2px solid #eee',
                  color: '#888',
                  fontWeight: '500',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Description
                </th>
                <th style={{
                  padding: '10px 8px',
                  textAlign: 'right',
                  borderBottom: '2px solid #eee',
                  color: '#888',
                  fontWeight: '500',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  width: '60px'
                }}>
                  Qté
                </th>
                <th style={{
                  padding: '10px 8px',
                  textAlign: 'right',
                  borderBottom: '2px solid #eee',
                  color: '#888',
                  fontWeight: '500',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  width: '90px'
                }}>
                  Prix
                </th>
                <th style={{
                  padding: '10px 8px',
                  textAlign: 'right',
                  borderBottom: '2px solid #eee',
                  color: '#888',
                  fontWeight: '500',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  width: '50px'
                }}>
                  TVA
                </th>
                <th style={{
                  padding: '10px 8px',
                  textAlign: 'right',
                  borderBottom: '2px solid #eee',
                  color: '#888',
                  fontWeight: '500',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  width: '90px'
                }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {articles.map((item, index) => (
                <tr key={item.id}>
                  <td style={{
                    padding: '8px',
                    fontSize: '10px',
                    lineHeight: '1.3',
                    color: '#333',
                    borderBottom: '1px solid #f5f5f5'
                  }}>
                    {item.designation}
                  </td>
                  <td style={{
                    padding: '8px',
                    textAlign: 'right',
                    fontSize: '10px',
                    color: '#333',
                    borderBottom: '1px solid #f5f5f5'
                  }}>
                    {item.quantity}
                  </td>
                  <td style={{
                    padding: '8px',
                    textAlign: 'right',
                    fontSize: '10px',
                    color: '#333',
                    borderBottom: '1px solid #f5f5f5'
                  }}>
                    {formatCurrency(item.unitPrice, devisData.devise)}
                  </td>
                  <td style={{
                    padding: '8px',
                    textAlign: 'right',
                    fontSize: '10px',
                    color: '#333',
                    borderBottom: '1px solid #f5f5f5'
                  }}>
                    {item.vatRate}%
                  </td>
                  <td style={{
                    padding: '8px',
                    textAlign: 'right',
                    fontSize: '10px',
                    fontWeight: '500',
                    color: '#333',
                    borderBottom: '1px solid #f5f5f5'
                  }}>
                    {formatCurrency(calculateItemTotal(item), devisData.devise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section Totaux - Dimensions standardisées */}
      <div style={{
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <div style={{ width: '100%', maxWidth: '280px' }}>
          <table style={{
            width: '100%',
            fontSize: '12px'
          }}>
            <tbody>
              <tr>
                <td style={{
                  padding: '8px 15px',
                  borderBottom: '1px solid #f5f5f5',
                  fontSize: '12px',
                  color: '#888'
                }}>
                  Sous-total HT:
                </td>
                <td style={{
                  padding: '8px 15px',
                  borderBottom: '1px solid #f5f5f5',
                  textAlign: 'right',
                  fontSize: '12px',
                  color: '#333'
                }}>
                  {formatCurrency(calculateSubtotal(), devisData.devise)}
                </td>
              </tr>
              <tr>
                <td style={{
                  padding: '8px 15px',
                  borderBottom: '1px solid #f5f5f5',
                  fontSize: '12px',
                  color: '#888'
                }}>
                  TVA:
                </td>
                <td style={{
                  padding: '8px 15px',
                  borderBottom: '1px solid #f5f5f5',
                  textAlign: 'right',
                  fontSize: '12px',
                  color: '#333'
                }}>
                  {formatCurrency(calculateVAT(), devisData.devise)}
                </td>
              </tr>
              <tr>
                <td style={{
                  padding: '12px 15px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#333',
                  borderTop: '2px solid #333'
                }}>
                  TOTAL TTC:
                </td>
                <td style={{
                  padding: '12px 15px',
                  textAlign: 'right',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#333',
                  borderTop: '2px solid #333'
                }}>
                  {formatCurrency(calculateTotal(), devisData.devise)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes - Dimensions standardisées */}
      {devisData.notes && (
        <div className="notes-conditions" style={{
          fontSize: '9px',
          maxHeight: '60px',
          padding: '5px',
          overflow: 'hidden',
          marginTop: '20px',
          backgroundColor: '#f9f9f9',
          borderRadius: '6px',
          borderLeft: '2px solid #eee'
        }}>
          <div style={{
            fontWeight: 'bold',
            color: '#888',
            marginBottom: '4px',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Notes:
          </div>
          <div style={{
            whiteSpace: 'pre-line',
            color: '#555',
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
        right: '20px',
        textAlign: 'center',
        fontSize: '10px',
        fontStyle: 'italic',
        color: '#888'
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
        left: '20px',
        right: '20px',
        textAlign: 'center',
        color: '#888',
        fontSize: '10px',
        borderTop: '1px solid #eee',
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

export default DevisModeleMinimaliste;