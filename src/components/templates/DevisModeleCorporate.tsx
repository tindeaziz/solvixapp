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

interface DevisModeleCorporateProps {
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

const DevisModeleCorporate: React.FC<DevisModeleCorporateProps> = ({
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
    <div className="corporate-template" style={{
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      lineHeight: '1.5',
      color: '#1B4B8C',
      backgroundColor: 'white',
      minHeight: '100vh',
      padding: '20px',
      maxWidth: '100%',
      margin: '0 auto',
      position: 'relative',
      boxSizing: 'border-box',
      paddingBottom: '120px'
    }}>
      {/* Header Corporate - Très structuré */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginBottom: '25px',
        borderBottom: '3px solid #1B4B8C',
        paddingBottom: '15px'
      }}>
        {/* Logo et infos entreprise - Alignement gauche */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', flexWrap: 'wrap' }}>
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
              fontWeight: '700',
              color: '#1B4B8C',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              {entrepriseData.name}
            </div>
            <div style={{
              color: '#6C757D',
              fontSize: '11px',
              lineHeight: '1.3',
              whiteSpace: 'pre-line'
            }}>
              {entrepriseData.address}
            </div>
            <div style={{ 
              color: '#6C757D', 
              fontSize: '11px', 
              marginTop: '3px'
            }}>
              {entrepriseData.phone} | {entrepriseData.email}
            </div>
          </div>
        </div>
        
        {/* Section devis - Alignement gauche sur mobile */}
        <div style={{ textAlign: 'left' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1B4B8C',
            marginBottom: '8px',
            letterSpacing: '1px'
          }}>
            DEVIS
          </div>
          <div style={{
            fontSize: '16px',
            color: '#6C757D',
            fontWeight: '600',
            marginBottom: '12px'
          }}>
            {devisData.numeroDevis}
          </div>
          <div style={{ color: '#6C757D', fontSize: '11px' }}>
            Date: {formatDate(devisData.dateCreation)}
          </div>
          <div style={{ color: '#6C757D', fontSize: '11px' }}>
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
        border: '1px solid #E9ECEF',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          fontWeight: 'bold',
          color: '#1B4B8C',
          marginBottom: '6px',
          fontSize: '11px'
        }}>
          Facturé à:
        </div>
        <div style={{
          fontWeight: 'bold',
          fontSize: '11px',
          marginBottom: '2px',
          color: '#1B4B8C'
        }}>
          {clientData.name}
        </div>
        <div style={{
          fontSize: '10px',
          marginBottom: '2px',
          color: '#6C757D'
        }}>
          {clientData.company}
        </div>
        <div style={{
          fontSize: '9px',
          color: '#6C757D',
          marginBottom: '1px'
        }}>
          {clientData.email} | {clientData.phone}
        </div>
        <div style={{
          fontSize: '9px',
          color: '#6C757D',
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
          color: '#1B4B8C',
          marginBottom: '12px',
          fontSize: '14px'
        }}>
          Détail des prestations:
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
                  color: '#1B4B8C',
                  padding: '10px 8px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}>
                  Description
                </th>
                <th style={{
                  color: '#1B4B8C',
                  padding: '10px 8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  width: '60px'
                }}>
                  Qté
                </th>
                <th style={{
                  color: '#1B4B8C',
                  padding: '10px 8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  width: '90px'
                }}>
                  Prix unitaire
                </th>
                <th style={{
                  color: '#1B4B8C',
                  padding: '10px 8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  width: '50px'
                }}>
                  TVA %
                </th>
                <th style={{
                  color: '#1B4B8C',
                  padding: '10px 8px',
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
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#FAFBFC'
                }}>
                  <td style={{
                    padding: '8px',
                    borderBottom: '1px solid #E9ECEF',
                    fontSize: '10px',
                    lineHeight: '1.3',
                    color: '#374151'
                  }}>
                    {item.designation}
                  </td>
                  <td style={{
                    padding: '8px',
                    borderBottom: '1px solid #E9ECEF',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '10px',
                    color: '#374151'
                  }}>
                    {item.quantity}
                  </td>
                  <td style={{
                    padding: '8px',
                    borderBottom: '1px solid #E9ECEF',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '10px',
                    color: '#374151'
                  }}>
                    {formatCurrency(item.unitPrice, devisData.devise)}
                  </td>
                  <td style={{
                    padding: '8px',
                    borderBottom: '1px solid #E9ECEF',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '10px',
                    color: '#374151'
                  }}>
                    {item.vatRate}%
                  </td>
                  <td style={{
                    padding: '8px',
                    borderBottom: '1px solid #E9ECEF',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '10px',
                    color: '#1B4B8C'
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
            backgroundColor: '#F8F9FA',
            border: '2px solid #1B4B8C',
            borderRadius: '6px',
            overflow: 'hidden',
            fontSize: '12px'
          }}>
            <tbody>
              <tr>
                <td style={{
                  padding: '8px 15px',
                  borderBottom: '1px solid #E9ECEF',
                  fontSize: '12px',
                  color: '#6C757D'
                }}>
                  Sous-total HT:
                </td>
                <td style={{
                  padding: '8px 15px',
                  borderBottom: '1px solid #E9ECEF',
                  textAlign: 'right',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#1B4B8C'
                }}>
                  {formatCurrency(calculateSubtotal(), devisData.devise)}
                </td>
              </tr>
              <tr>
                <td style={{
                  padding: '8px 15px',
                  borderBottom: '1px solid #E9ECEF',
                  fontSize: '12px',
                  color: '#6C757D'
                }}>
                  Total TVA:
                </td>
                <td style={{
                  padding: '8px 15px',
                  borderBottom: '1px solid #E9ECEF',
                  textAlign: 'right',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#1B4B8C'
                }}>
                  {formatCurrency(calculateVAT(), devisData.devise)}
                </td>
              </tr>
              <tr style={{ backgroundColor: '#1B4B8C' }}>
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
            color: '#1B4B8C',
            marginBottom: '4px',
            fontSize: '10px'
          }}>
            Notes et conditions:
          </div>
          <div style={{
            whiteSpace: 'pre-line',
            color: '#6C757D',
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
        color: '#6C757D'
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
        color: '#6C757D',
        fontSize: '10px',
        borderTop: '1px solid #E9ECEF',
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

export default DevisModeleCorporate;