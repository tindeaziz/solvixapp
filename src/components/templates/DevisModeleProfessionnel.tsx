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

interface DevisModeleProfessionnelProps {
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

const DevisModeleProfessionnel: React.FC<DevisModeleProfessionnelProps> = ({
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
    <div className="professionnel-template" style={{
      fontFamily: 'Helvetica, Arial, sans-serif',
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
      {/* Bande colorée en haut */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '15px',
        backgroundColor: '#2C3E50'
      }}></div>

      {/* Header professionnel avec bande colorée */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginBottom: '25px',
        paddingTop: '20px',
        borderBottom: '3px solid #2C3E50',
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
            color: '#2C3E50',
            marginBottom: '8px'
          }}>
            {entrepriseData.name}
          </div>
          <div style={{
            color: '#7F8C8D',
            fontSize: '11px',
            lineHeight: '1.4',
            whiteSpace: 'pre-line'
          }}>
            {entrepriseData.address}
          </div>
          <div style={{
            color: '#7F8C8D',
            fontSize: '11px',
            marginTop: '3px'
          }}>
            {entrepriseData.phone} | {entrepriseData.email}
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#F8F9FA',
          padding: '15px',
          borderRadius: '5px',
          border: '1px solid #E9ECEF'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#2C3E50',
            marginBottom: '8px'
          }}>
            DEVIS
          </div>
          <div style={{
            fontSize: '16px',
            color: '#3498DB',
            fontWeight: 'bold',
            marginBottom: '12px'
          }}>
            {devisData.numeroDevis}
          </div>
          <div style={{ fontSize: '11px', color: '#7F8C8D' }}>
            Date: {formatDate(devisData.dateCreation)}
          </div>
          <div style={{ fontSize: '11px', color: '#7F8C8D' }}>
            Valide jusqu'au: {formatDate(devisData.dateExpiration)}
          </div>
        </div>
      </div>

      {/* Section Client - Dimensions standardisées */}
      <div className="section-client" style={{
        maxHeight: '80px',
        fontSize: '10px',
        lineHeight: '1.1',
        padding: '8px',
        margin: '15px 0',
        backgroundColor: '#F8F9FA',
        borderLeft: '4px solid #3498DB',
        borderRadius: '0 6px 6px 0',
        overflow: 'hidden'
      }}>
        <div style={{
          fontWeight: 'bold',
          color: '#2C3E50',
          marginBottom: '6px',
          fontSize: '11px'
        }}>
          Facturé à:
        </div>
        <div style={{
          fontWeight: 'bold',
          fontSize: '11px',
          marginBottom: '2px',
          color: '#2C3E50'
        }}>
          {clientData.name}
        </div>
        <div style={{
          fontSize: '10px',
          marginBottom: '2px',
          color: '#3498DB'
        }}>
          {clientData.company}
        </div>
        <div style={{
          fontSize: '9px',
          color: '#7F8C8D',
          marginBottom: '1px'
        }}>
          {clientData.email} | {clientData.phone}
        </div>
        <div style={{
          fontSize: '9px',
          color: '#7F8C8D',
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
          color: '#2C3E50',
          marginBottom: '12px',
          fontSize: '14px'
        }}>
          DÉTAIL DES PRESTATIONS:
        </div>
        
        <div style={{ minWidth: '500px' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #E9ECEF',
            borderRadius: '6px',
            overflow: 'hidden',
            fontSize: '11px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#F8F9FA' }}>
                <th style={{
                  padding: '10px 8px',
                  textAlign: 'left',
                  borderBottom: '2px solid #3498DB',
                  color: '#2C3E50',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}>
                  DESCRIPTION
                </th>
                <th style={{
                  padding: '10px 8px',
                  textAlign: 'right',
                  borderBottom: '2px solid #3498DB',
                  color: '#2C3E50',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  width: '60px'
                }}>
                  QTÉ
                </th>
                <th style={{
                  padding: '10px 8px',
                  textAlign: 'right',
                  borderBottom: '2px solid #3498DB',
                  color: '#2C3E50',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  width: '90px'
                }}>
                  PRIX UNIT.
                </th>
                <th style={{
                  padding: '10px 8px',
                  textAlign: 'right',
                  borderBottom: '2px solid #3498DB',
                  color: '#2C3E50',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  width: '50px'
                }}>
                  TVA %
                </th>
                <th style={{
                  padding: '10px 8px',
                  textAlign: 'right',
                  borderBottom: '2px solid #3498DB',
                  color: '#2C3E50',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  width: '90px'
                }}>
                  TOTAL HT
                </th>
              </tr>
            </thead>
            <tbody>
              {articles.map((item, index) => (
                <tr key={item.id} style={{
                  backgroundColor: index % 2 === 0 ? 'white' : '#F8F9FA',
                  borderBottom: '1px solid #E9ECEF'
                }}>
                  <td style={{
                    padding: '8px',
                    fontSize: '10px',
                    lineHeight: '1.3',
                    color: '#2C3E50'
                  }}>
                    {item.designation}
                  </td>
                  <td style={{
                    padding: '8px',
                    textAlign: 'right',
                    fontSize: '10px',
                    color: '#2C3E50'
                  }}>
                    {item.quantity}
                  </td>
                  <td style={{
                    padding: '8px',
                    textAlign: 'right',
                    fontSize: '10px',
                    color: '#2C3E50'
                  }}>
                    {formatCurrency(item.unitPrice, devisData.devise)}
                  </td>
                  <td style={{
                    padding: '8px',
                    textAlign: 'right',
                    fontSize: '10px',
                    color: '#2C3E50'
                  }}>
                    {item.vatRate}%
                  </td>
                  <td style={{
                    padding: '8px',
                    textAlign: 'right',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#3498DB'
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
            borderCollapse: 'collapse',
            border: '1px solid #E9ECEF',
            borderRadius: '6px',
            overflow: 'hidden',
            fontSize: '12px'
          }}>
            <tbody>
              <tr>
                <td style={{
                  padding: '8px 15px',
                  backgroundColor: '#F8F9FA',
                  color: '#7F8C8D',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  SOUS-TOTAL HT:
                </td>
                <td style={{
                  padding: '8px 15px',
                  backgroundColor: '#F8F9FA',
                  textAlign: 'right',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#2C3E50'
                }}>
                  {formatCurrency(calculateSubtotal(), devisData.devise)}
                </td>
              </tr>
              <tr>
                <td style={{
                  padding: '8px 15px',
                  backgroundColor: '#F8F9FA',
                  color: '#7F8C8D',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  borderTop: '1px solid #E9ECEF'
                }}>
                  TOTAL TVA:
                </td>
                <td style={{
                  padding: '8px 15px',
                  backgroundColor: '#F8F9FA',
                  textAlign: 'right',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#2C3E50',
                  borderTop: '1px solid #E9ECEF'
                }}>
                  {formatCurrency(calculateVAT(), devisData.devise)}
                </td>
              </tr>
              <tr>
                <td style={{
                  padding: '12px 15px',
                  backgroundColor: '#2C3E50',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  TOTAL TTC:
                </td>
                <td style={{
                  padding: '12px 15px',
                  backgroundColor: '#2C3E50',
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

      {/* Notes - Dimensions standardisées */}
      {devisData.notes && (
        <div className="notes-conditions" style={{
          fontSize: '9px',
          maxHeight: '60px',
          padding: '5px',
          overflow: 'hidden',
          marginTop: '20px',
          backgroundColor: '#F8F9FA',
          borderRadius: '6px',
          border: '1px solid #E9ECEF'
        }}>
          <div style={{
            fontWeight: 'bold',
            color: '#2C3E50',
            marginBottom: '4px',
            fontSize: '10px'
          }}>
            CONDITIONS & NOTES:
          </div>
          <div style={{
            whiteSpace: 'pre-line',
            color: '#7F8C8D',
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
        color: '#7F8C8D'
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
        color: '#7F8C8D',
        fontSize: '10px',
        borderTop: '1px solid #E9ECEF',
        paddingTop: '12px'
      }}>
        <div>Devis généré le {formatDate(new Date().toISOString().split('T')[0])}</div>
        <div style={{ marginTop: '3px' }}>
          Solvix - Génération de devis professionnels
        </div>
      </div>

      {/* Bande colorée en bas */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '15px',
        backgroundColor: '#3498DB'
      }}></div>
    </div>
  );
};

export default DevisModeleProfessionnel;