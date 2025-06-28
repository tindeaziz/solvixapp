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
    <div className="devis-container" style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '25mm',
      fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
      fontSize: '11px',
      lineHeight: '1.5',
      color: '#333333',
      backgroundColor: 'white',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      
      {/* HEADER - 25% de la page */}
      <div className="header-section" style={{
        height: '60mm',
        marginBottom: '15mm',
        borderBottom: '1px solid #eee',
        paddingBottom: '15mm'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          height: '100%'
        }}>
          {/* Logo et entreprise - Gauche */}
          <div className="entreprise-info" style={{ width: '45%' }}>
            {entrepriseData.logo && (
              <img 
                src={entrepriseData.logo} 
                style={{ maxHeight: '40px', marginBottom: '12px' }} 
              />
            )}
            <h2 style={{
              fontSize: '16px',
              color: '#333',
              margin: '0 0 12px 0',
              fontWeight: '500',
              letterSpacing: '0.5px'
            }}>
              {entrepriseData.name}
            </h2>
            <div style={{ fontSize: '10px', lineHeight: '1.4', color: '#888' }}>
              <p style={{ margin: '3px 0' }}>{entrepriseData.address}</p>
              <p style={{ margin: '3px 0' }}>{entrepriseData.phone} | {entrepriseData.email}</p>
            </div>
          </div>

          {/* Titre DEVIS - Centre */}
          <div className="devis-title" style={{ width: '30%', textAlign: 'center' }}>
            <h1 style={{
              fontSize: '24px',
              color: '#333',
              fontWeight: '300',
              margin: '0 0 12px 0',
              letterSpacing: '2px'
            }}>
              DEVIS
            </h1>
            <div style={{
              fontSize: '14px',
              color: '#888',
              fontWeight: '400'
            }}>
              {devisData.numeroDevis}
            </div>
          </div>

          {/* Dates - Droite */}
          <div className="dates-info" style={{ width: '25%', textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#888' }}>
              <p style={{ margin: '4px 0' }}><strong>Date:</strong> {formatDate(devisData.dateCreation)}</p>
              <p style={{ margin: '4px 0' }}><strong>Valide jusqu'au:</strong> {formatDate(devisData.dateExpiration)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION CLIENT - 15% de la page */}
      <div className="client-section" style={{
        backgroundColor: '#f9f9f9',
        padding: '15px',
        borderRadius: '0',
        marginBottom: '15mm',
        borderLeft: '3px solid #eee'
      }}>
        <h3 style={{
          fontSize: '12px',
          color: '#888',
          margin: '0 0 10px 0',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          CLIENT:
        </h3>
        <div style={{ fontSize: '11px' }}>
          <p style={{ margin: '3px 0', fontWeight: 'bold', color: '#333' }}>{clientData.name}</p>
          <p style={{ margin: '3px 0', color: '#555' }}>{clientData.company}</p>
          <p style={{ margin: '3px 0', color: '#888' }}>{clientData.address}</p>
          <p style={{ margin: '3px 0', color: '#888' }}>{clientData.phone} | {clientData.email}</p>
        </div>
      </div>

      {/* TABLEAU PRESTATIONS - 45% de la page */}
      <div className="prestations-section" style={{ marginBottom: '15mm' }}>
        <h3 style={{
          fontSize: '12px',
          color: '#333',
          margin: '0 0 12px 0',
          fontWeight: 'bold'
        }}>
          Prestations:
        </h3>

        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '10px'
        }}>
          <thead>
            <tr>
              <th style={{
                padding: '12px 8px',
                textAlign: 'left',
                width: '45%',
                borderBottom: '2px solid #eee',
                color: '#888',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>DESCRIPTION</th>
              <th style={{
                padding: '12px 8px',
                textAlign: 'center',
                width: '10%',
                borderBottom: '2px solid #eee',
                color: '#888',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>QTÉ</th>
              <th style={{
                padding: '12px 8px',
                textAlign: 'right',
                width: '15%',
                borderBottom: '2px solid #eee',
                color: '#888',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>PRIX</th>
              <th style={{
                padding: '12px 8px',
                textAlign: 'center',
                width: '10%',
                borderBottom: '2px solid #eee',
                color: '#888',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>TVA</th>
              <th style={{
                padding: '12px 8px',
                textAlign: 'right',
                width: '20%',
                borderBottom: '2px solid #eee',
                color: '#888',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article, index) => (
              <tr key={article.id}>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f5f5f5', color: '#333' }}>{article.designation}</td>
                <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #f5f5f5', color: '#333' }}>{article.quantity}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '1px solid #f5f5f5', color: '#333' }}>{formatCurrency(article.unitPrice, devisData.devise)}</td>
                <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #f5f5f5', color: '#333' }}>{article.vatRate}%</td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f5f5f5', color: '#333' }}>
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
        <div style={{ width: '40%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #f5f5f5' }}>
            <span style={{ color: '#888' }}>Sous-total HT:</span>
            <span style={{ color: '#333' }}>{formatCurrency(calculateSubtotal(), devisData.devise)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #f5f5f5' }}>
            <span style={{ color: '#888' }}>TVA:</span>
            <span style={{ color: '#333' }}>{formatCurrency(calculateVAT(), devisData.devise)}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '2px solid #333'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#333' }}>TOTAL TTC:</span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
              {formatCurrency(calculateTotal(), devisData.devise)}
            </span>
          </div>
        </div>
      </div>

      {/* NOTES */}
      {devisData.notes && (
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '15px',
          borderRadius: '0',
          marginBottom: '10mm',
          borderLeft: '2px solid #eee'
        }}>
          <h4 style={{
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#888',
            margin: '0 0 8px 0',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Notes:
          </h4>
          <p style={{
            fontSize: '9px',
            color: '#555',
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
        borderTop: '1px solid #eee',
        paddingTop: '15px'
      }}>
        <div style={{ fontSize: '9px', color: '#888' }}>
          <p style={{ margin: '2px 0' }}>Devis généré le {formatDate(new Date().toISOString().split('T')[0])}</p>
          <p style={{ margin: '2px 0' }}>Solvix - Génération de devis professionnels</p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: '10px',
            margin: '0 0 8px 0',
            color: '#888',
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

export default DevisModeleMinimaliste;