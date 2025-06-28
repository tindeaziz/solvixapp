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
    <div className="devis-container" style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '20mm',
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      lineHeight: '1.4',
      color: '#212529',
      backgroundColor: 'white',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      
      {/* HEADER - 25% de la page */}
      <div className="header-section" style={{
        height: '60mm',
        marginBottom: '10mm',
        borderBottom: '3px solid #1B4B8C',
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
                color: '#1B4B8C',
                margin: '0 0 8px 0',
                fontWeight: '700',
                letterSpacing: '0.5px'
              }}>
                {entrepriseData.name}
              </h2>
              <div style={{ fontSize: '10px', lineHeight: '1.3', color: '#6C757D' }}>
                <p style={{ margin: '2px 0' }}>{entrepriseData.address}</p>
                <p style={{ margin: '2px 0' }}>{entrepriseData.phone} | {entrepriseData.email}</p>
              </div>
            </div>
          </div>

          {/* Titre DEVIS - Centre */}
          <div className="devis-title" style={{ width: '30%', textAlign: 'center' }}>
            <h1 style={{
              fontSize: '24px',
              color: '#1B4B8C',
              fontWeight: '700',
              margin: '0 0 8px 0',
              letterSpacing: '1px'
            }}>
              DEVIS
            </h1>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#6C757D',
              padding: '4px 8px',
              border: '1px solid #E9ECEF',
              borderRadius: '4px',
              backgroundColor: '#F8F9FA'
            }}>
              {devisData.numeroDevis}
            </div>
          </div>

          {/* Dates - Droite */}
          <div className="dates-info" style={{ width: '25%', textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#6C757D' }}>
              <p style={{ margin: '4px 0' }}><strong>Date:</strong> {formatDate(devisData.dateCreation)}</p>
              <p style={{ margin: '4px 0' }}><strong>Valide jusqu'au:</strong> {formatDate(devisData.dateExpiration)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION CLIENT - 15% de la page */}
      <div className="client-section" style={{
        backgroundColor: '#F8F9FA',
        padding: '12px',
        borderRadius: '4px',
        marginBottom: '15mm',
        border: '1px solid #E9ECEF'
      }}>
        <h3 style={{
          fontSize: '12px',
          color: '#1B4B8C',
          margin: '0 0 8px 0',
          fontWeight: 'bold'
        }}>
          CLIENT:
        </h3>
        <div style={{ fontSize: '11px' }}>
          <p style={{ margin: '2px 0', fontWeight: 'bold', color: '#1B4B8C' }}>{clientData.name}</p>
          <p style={{ margin: '2px 0', color: '#6C757D' }}>{clientData.company}</p>
          <p style={{ margin: '2px 0', color: '#6C757D' }}>{clientData.address}</p>
          <p style={{ margin: '2px 0', color: '#6C757D' }}>{clientData.phone} | {clientData.email}</p>
        </div>
      </div>

      {/* TABLEAU PRESTATIONS - 45% de la page */}
      <div className="prestations-section" style={{ marginBottom: '15mm' }}>
        <h3 style={{
          fontSize: '12px',
          color: '#1B4B8C',
          margin: '0 0 8px 0',
          fontWeight: 'bold'
        }}>
          Détail des prestations:
        </h3>

        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '10px',
          border: '1px solid #E9ECEF',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#F8F9FA' }}>
              <th style={{ padding: '10px 8px', textAlign: 'left', width: '45%', fontWeight: 'bold', color: '#1B4B8C' }}>DESCRIPTION</th>
              <th style={{ padding: '10px 8px', textAlign: 'center', width: '10%', fontWeight: 'bold', color: '#1B4B8C' }}>QTÉ</th>
              <th style={{ padding: '10px 8px', textAlign: 'right', width: '15%', fontWeight: 'bold', color: '#1B4B8C' }}>PRIX</th>
              <th style={{ padding: '10px 8px', textAlign: 'center', width: '10%', fontWeight: 'bold', color: '#1B4B8C' }}>TVA</th>
              <th style={{ padding: '10px 8px', textAlign: 'right', width: '20%', fontWeight: 'bold', color: '#1B4B8C' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article, index) => (
              <tr key={article.id} style={{
                borderBottom: '1px solid #E9ECEF',
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#FAFBFC'
              }}>
                <td style={{ padding: '8px', color: '#374151' }}>{article.designation}</td>
                <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#374151' }}>{article.quantity}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: '#374151' }}>{formatCurrency(article.unitPrice, devisData.devise)}</td>
                <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#374151' }}>{article.vatRate}%</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#1B4B8C' }}>
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
          border: '2px solid #1B4B8C',
          borderRadius: '4px',
          padding: '12px',
          backgroundColor: '#F8F9FA'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#6C757D' }}>Sous-total HT:</span>
            <span style={{ fontWeight: 'bold', color: '#1B4B8C' }}>{formatCurrency(calculateSubtotal(), devisData.devise)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#6C757D' }}>TVA:</span>
            <span style={{ fontWeight: 'bold', color: '#1B4B8C' }}>{formatCurrency(calculateVAT(), devisData.devise)}</span>
          </div>
          <hr style={{ margin: '8px 0', border: '1px solid #1B4B8C' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1B4B8C' }}>TOTAL TTC:</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1B4B8C' }}>
              {formatCurrency(calculateTotal(), devisData.devise)}
            </span>
          </div>
        </div>
      </div>

      {/* NOTES */}
      {devisData.notes && (
        <div style={{
          backgroundColor: '#F8F9FA',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '10mm',
          border: '1px solid #E9ECEF'
        }}>
          <h4 style={{
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#1B4B8C',
            margin: '0 0 6px 0'
          }}>
            Notes et conditions:
          </h4>
          <p style={{
            fontSize: '9px',
            color: '#6C757D',
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
        borderTop: '1px solid #E9ECEF',
        paddingTop: '12px'
      }}>
        <div style={{ fontSize: '9px', color: '#6C757D' }}>
          <p style={{ margin: '2px 0' }}>Devis généré le {formatDate(new Date().toISOString().split('T')[0])}</p>
          <p style={{ margin: '2px 0' }}>Solvix - Génération de devis professionnels</p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: '10px',
            margin: '0 0 8px 0',
            color: '#6C757D',
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

export default DevisModeleCorporate;