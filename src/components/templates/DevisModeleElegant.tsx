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
    <div className="devis-container" style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '20mm',
      fontFamily: 'Garamond, serif',
      fontSize: '11px',
      lineHeight: '1.4',
      color: '#333333',
      backgroundColor: '#FFFCF7',
      position: 'relative',
      boxSizing: 'border-box',
      border: '1px solid #E8E0D0'
    }}>
      
      {/* HEADER - 25% de la page */}
      <div className="header-section" style={{
        height: '60mm',
        marginBottom: '10mm',
        borderBottom: '3px solid #D4B78F',
        paddingBottom: '15mm'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          height: '100%'
        }}>
          {/* Logo et entreprise - Gauche */}
          <div className="entreprise-info" style={{ width: '45%', display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
            {entrepriseData.logo && (
              <img 
                src={entrepriseData.logo} 
                style={{ maxHeight: '40px', marginBottom: '8px' }} 
              />
            )}
            <div>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#8A6D3B',
                margin: '0 0 8px 0',
                fontFamily: 'Garamond, serif'
              }}>
                {entrepriseData.name}
              </h2>
              <div style={{ fontSize: '10px', lineHeight: '1.4', fontStyle: 'italic', color: '#8A6D3B' }}>
                <p style={{ margin: '2px 0' }}>{entrepriseData.address}</p>
                <p style={{ margin: '2px 0' }}>{entrepriseData.phone} | {entrepriseData.email}</p>
              </div>
            </div>
          </div>

          {/* Titre DEVIS - Centre */}
          <div className="devis-title" style={{ width: '30%', textAlign: 'center' }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'normal',
              color: '#8A6D3B',
              margin: '0 0 8px 0',
              fontFamily: 'Garamond, serif',
              letterSpacing: '2px'
            }}>
              DEVIS
            </h1>
            <div style={{
              fontSize: '14px',
              color: '#8A6D3B',
              fontStyle: 'italic',
              padding: '4px 8px',
              border: '1px solid #E8E0D0',
              borderRadius: '4px',
              backgroundColor: '#F9F5ED'
            }}>
              {devisData.numeroDevis}
            </div>
          </div>

          {/* Dates - Droite */}
          <div className="dates-info" style={{ width: '25%', textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#8A6D3B' }}>
              <p style={{ margin: '4px 0' }}><strong>Date:</strong> {formatDate(devisData.dateCreation)}</p>
              <p style={{ margin: '4px 0' }}><strong>Valide jusqu'au:</strong> {formatDate(devisData.dateExpiration)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION CLIENT - 15% de la page */}
      <div className="client-section" style={{
        backgroundColor: '#F9F5ED',
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '15mm',
        border: '1px solid #E8E0D0'
      }}>
        <h3 style={{
          fontSize: '12px',
          color: '#8A6D3B',
          margin: '0 0 8px 0',
          fontWeight: 'bold',
          fontStyle: 'italic'
        }}>
          À l'attention de:
        </h3>
        <div style={{ fontSize: '11px' }}>
          <p style={{ margin: '2px 0', fontWeight: 'bold', color: '#8A6D3B', fontFamily: 'Garamond, serif' }}>{clientData.name}</p>
          <p style={{ margin: '2px 0', color: '#8A6D3B', fontStyle: 'italic' }}>{clientData.company}</p>
          <p style={{ margin: '2px 0', color: '#666' }}>{clientData.address}</p>
          <p style={{ margin: '2px 0', color: '#666' }}>{clientData.phone} | {clientData.email}</p>
        </div>
      </div>

      {/* TABLEAU PRESTATIONS - 45% de la page */}
      <div className="prestations-section" style={{ marginBottom: '15mm' }}>
        <h3 style={{
          fontSize: '12px',
          color: '#8A6D3B',
          margin: '0 0 8px 0',
          fontWeight: 'bold',
          fontFamily: 'Garamond, serif',
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          Détail des prestations:
        </h3>

        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '10px',
          border: '1px solid #E8E0D0',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#F9F5ED' }}>
              <th style={{
                padding: '10px 8px',
                textAlign: 'left',
                width: '45%',
                borderBottom: '2px solid #D4B78F',
                color: '#8A6D3B',
                fontWeight: 'normal',
                fontStyle: 'italic'
              }}>Description</th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'center',
                width: '10%',
                borderBottom: '2px solid #D4B78F',
                color: '#8A6D3B',
                fontWeight: 'normal',
                fontStyle: 'italic'
              }}>Qté</th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'right',
                width: '15%',
                borderBottom: '2px solid #D4B78F',
                color: '#8A6D3B',
                fontWeight: 'normal',
                fontStyle: 'italic'
              }}>Prix unitaire</th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'center',
                width: '10%',
                borderBottom: '2px solid #D4B78F',
                color: '#8A6D3B',
                fontWeight: 'normal',
                fontStyle: 'italic'
              }}>TVA %</th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'right',
                width: '20%',
                borderBottom: '2px solid #D4B78F',
                color: '#8A6D3B',
                fontWeight: 'normal',
                fontStyle: 'italic'
              }}>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article, index) => (
              <tr key={article.id} style={{
                backgroundColor: index % 2 === 0 ? '#FFFCF7' : '#F9F5ED',
                borderBottom: '1px solid #E8E0D0'
              }}>
                <td style={{ padding: '8px', color: '#333' }}>{article.designation}</td>
                <td style={{ padding: '8px', textAlign: 'center', color: '#333' }}>{article.quantity}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: '#333' }}>{formatCurrency(article.unitPrice, devisData.devise)}</td>
                <td style={{ padding: '8px', textAlign: 'center', color: '#333' }}>{article.vatRate}%</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#8A6D3B' }}>
                  {formatCurrency(calculateItemTotal(article), devisData.devise)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOTAUX - 10% de la page */}
      <div className="totaux-section" style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '15mm'
      }}>
        <div style={{
          width: '40%',
          border: '1px solid #E8E0D0',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <div style={{ backgroundColor: '#F9F5ED', padding: '8px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#8A6D3B', fontStyle: 'italic' }}>Sous-total HT:</span>
              <span style={{ fontWeight: 'bold', color: '#333' }}>{formatCurrency(calculateSubtotal(), devisData.devise)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', borderTop: '1px solid #E8E0D0', paddingTop: '4px' }}>
              <span style={{ color: '#8A6D3B', fontStyle: 'italic' }}>Total TVA:</span>
              <span style={{ fontWeight: 'bold', color: '#333' }}>{formatCurrency(calculateVAT(), devisData.devise)}</span>
            </div>
          </div>
          <div style={{
            backgroundColor: '#8A6D3B',
            padding: '12px',
            color: '#FFFCF7'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Garamond, serif' }}>TOTAL TTC:</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', fontFamily: 'Garamond, serif' }}>
                {formatCurrency(calculateTotal(), devisData.devise)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NOTES */}
      {devisData.notes && (
        <div style={{
          backgroundColor: '#F9F5ED',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '10mm',
          border: '1px solid #E8E0D0'
        }}>
          <h4 style={{
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#8A6D3B',
            margin: '0 0 6px 0',
            fontStyle: 'italic'
          }}>
            Conditions & Notes:
          </h4>
          <p style={{
            fontSize: '9px',
            color: '#333',
            margin: '0',
            whiteSpace: 'pre-line'
          }}>
            {devisData.notes}
          </p>
        </div>
      )}

      {/* FOOTER - 5% de la page */}
      <div className="footer-section" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 'auto',
        borderTop: '1px solid #E8E0D0',
        paddingTop: '12px'
      }}>
        <div style={{ fontSize: '9px', color: '#8A6D3B', fontStyle: 'italic' }}>
          <p style={{ margin: '2px 0' }}>Devis généré le {formatDate(new Date().toISOString().split('T')[0])}</p>
          <p style={{ margin: '2px 0' }}>Solvix - Génération de devis professionnels</p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: '10px',
            margin: '0 0 8px 0',
            color: '#8A6D3B',
            fontStyle: 'italic'
          }}>
            Fait le {formatDate(new Date().toISOString().split('T')[0])}, {entrepriseData.name}
          </p>
          {entrepriseData.signature && (
            <img 
              src={entrepriseData.signature} 
              style={{ maxHeight: '40px', maxWidth: '120px' }} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DevisModeleElegant;