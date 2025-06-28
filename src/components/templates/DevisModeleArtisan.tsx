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
    <div className="devis-container" style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '20mm',
      fontFamily: 'Georgia, serif',
      fontSize: '11px',
      lineHeight: '1.4',
      color: '#3C2415',
      backgroundColor: '#FEFCF8',
      position: 'relative',
      boxSizing: 'border-box',
      border: '6px solid #8B4513',
      borderRadius: '12px'
    }}>
      
      {/* Bordure décorative intérieure */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        right: '10px',
        bottom: '10px',
        border: '2px solid #D2B48C',
        borderRadius: '6px',
        pointerEvents: 'none'
      }}></div>

      {/* Motifs décoratifs dans les coins */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        width: '20px',
        height: '20px',
        background: 'radial-gradient(circle, #8B4513 2px, transparent 2px)',
        backgroundSize: '6px 6px'
      }}></div>
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '20px',
        height: '20px',
        background: 'radial-gradient(circle, #8B4513 2px, transparent 2px)',
        backgroundSize: '6px 6px'
      }}></div>

      {/* Contenu principal avec marge pour les bordures */}
      <div style={{ margin: '20px', position: 'relative', zIndex: 1 }}>
        
        {/* HEADER - 25% de la page */}
        <div className="header-section" style={{
          height: '60mm',
          marginBottom: '10mm',
          borderBottom: '3px double #8B4513',
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
                  style={{ maxHeight: '40px', marginBottom: '8px' }} 
                />
              )}
              <h2 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#8B4513',
                margin: '0 0 8px 0',
                textShadow: '1px 1px 2px rgba(139, 69, 19, 0.3)',
                fontFamily: 'Georgia, serif'
              }}>
                {entrepriseData.name}
              </h2>
              <div style={{ fontSize: '10px', color: '#8B4513', lineHeight: '1.4' }}>
                <p style={{ margin: '2px 0' }}>{entrepriseData.address}</p>
                <p style={{ margin: '2px 0' }}>{entrepriseData.phone} | {entrepriseData.email}</p>
              </div>
            </div>

            {/* Titre DEVIS - Centre */}
            <div className="devis-title" style={{ width: '30%', textAlign: 'center' }}>
              <h1 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#8B4513',
                margin: '0 0 8px 0',
                textShadow: '2px 2px 4px rgba(139, 69, 19, 0.2)',
                letterSpacing: '3px'
              }}>
                DEVIS
              </h1>
              <div style={{
                fontSize: '14px',
                color: '#6B8E23',
                fontWeight: 'bold',
                padding: '4px 8px',
                border: '2px solid #8B4513',
                borderRadius: '4px',
                backgroundColor: '#F5F5DC'
              }}>
                {devisData.numeroDevis}
              </div>
            </div>

            {/* Dates - Droite */}
            <div className="dates-info" style={{ width: '25%', textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: '#8B4513' }}>
                <p style={{ margin: '4px 0' }}><strong>Date:</strong> {formatDate(devisData.dateCreation)}</p>
                <p style={{ margin: '4px 0' }}><strong>Valide jusqu'au:</strong> {formatDate(devisData.dateExpiration)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION CLIENT - 15% de la page */}
        <div className="client-section" style={{
          backgroundColor: '#F5F5DC',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '15mm',
          borderLeft: '4px solid #8B4513'
        }}>
          <h3 style={{
            fontSize: '12px',
            color: '#8B4513',
            margin: '0 0 8px 0',
            fontWeight: 'bold'
          }}>
            🏠 Facturé à:
          </h3>
          <div style={{ fontSize: '11px' }}>
            <p style={{ margin: '2px 0', fontWeight: 'bold', color: '#8B4513', fontFamily: 'Georgia, serif' }}>{clientData.name}</p>
            <p style={{ margin: '2px 0', color: '#6B8E23', fontStyle: 'italic' }}>{clientData.company}</p>
            <p style={{ margin: '2px 0', color: '#666' }}>{clientData.address}</p>
            <p style={{ margin: '2px 0', color: '#666' }}>{clientData.phone} | {clientData.email}</p>
          </div>
        </div>

        {/* TABLEAU PRESTATIONS - 45% de la page */}
        <div className="prestations-section" style={{ marginBottom: '15mm' }}>
          <h3 style={{
            fontSize: '12px',
            color: '#8B4513',
            margin: '0 0 8px 0',
            fontWeight: 'bold',
            fontFamily: 'Georgia, serif'
          }}>
            🔨 Détail des Travaux Artisanaux:
          </h3>

          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '10px',
            border: '3px solid #8B4513',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: '0 4px 8px rgba(139, 69, 19, 0.2)'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#DEB887' }}>
                <th style={{ padding: '10px 8px', textAlign: 'left', width: '45%', fontWeight: 'bold', color: '#8B4513' }}>Description des Travaux</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', width: '10%', fontWeight: 'bold', color: '#8B4513' }}>Qté</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', width: '15%', fontWeight: 'bold', color: '#8B4513' }}>Prix Unit.</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', width: '10%', fontWeight: 'bold', color: '#8B4513' }}>TVA %</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', width: '20%', fontWeight: 'bold', color: '#8B4513' }}>Total HT</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article, index) => (
                <tr key={article.id} style={{
                  backgroundColor: index % 2 === 0 ? '#FEFCF8' : '#F5F5DC',
                  borderLeft: '4px solid ' + (index % 2 === 0 ? '#8B4513' : '#6B8E23')
                }}>
                  <td style={{ padding: '8px', color: '#3C2415', borderBottom: '1px solid #D2B48C' }}>{article.designation}</td>
                  <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#8B4513', borderBottom: '1px solid #D2B48C' }}>{article.quantity}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#3C2415', borderBottom: '1px solid #D2B48C' }}>{formatCurrency(article.unitPrice, devisData.devise)}</td>
                  <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#6B8E23', borderBottom: '1px solid #D2B48C' }}>{article.vatRate}%</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#8B4513', borderBottom: '1px solid #D2B48C' }}>
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
            backgroundColor: '#F5F5DC',
            border: '3px solid #8B4513',
            borderRadius: '6px',
            padding: '12px',
            boxShadow: '0 4px 8px rgba(139, 69, 19, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', borderBottom: '2px solid #D2B48C', paddingBottom: '4px' }}>
              <span style={{ color: '#6B8E23', fontWeight: 'bold' }}>Sous-total HT:</span>
              <span style={{ fontWeight: 'bold', color: '#3C2415' }}>{formatCurrency(calculateSubtotal(), devisData.devise)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '2px solid #D2B48C', paddingBottom: '4px' }}>
              <span style={{ color: '#6B8E23', fontWeight: 'bold' }}>Total TVA:</span>
              <span style={{ fontWeight: 'bold', color: '#3C2415' }}>{formatCurrency(calculateVAT(), devisData.devise)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              backgroundColor: '#8B4513',
              margin: '0 -12px -12px -12px',
              padding: '12px',
              borderRadius: '0 0 3px 3px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#F5F5DC' }}>TOTAL TTC:</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#F5F5DC' }}>
                {formatCurrency(calculateTotal(), devisData.devise)}
              </span>
            </div>
          </div>
        </div>

        {/* NOTES */}
        {devisData.notes && (
          <div style={{
            backgroundColor: '#F5F5DC',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '10mm',
            border: '2px solid #D2B48C'
          }}>
            <h4 style={{
              fontSize: '10px',
              fontWeight: 'bold',
              color: '#8B4513',
              margin: '0 0 6px 0'
            }}>
              📜 Conditions Artisanales:
            </h4>
            <p style={{
              fontSize: '9px',
              color: '#3C2415',
              margin: '0',
              whiteSpace: 'pre-line',
              fontStyle: 'italic'
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
          borderTop: '3px double #8B4513',
          paddingTop: '12px'
        }}>
          <div style={{ fontSize: '9px', color: '#6B8E23' }}>
            <p style={{ margin: '2px 0' }}>Devis généré le {formatDate(new Date().toISOString().split('T')[0])}</p>
            <p style={{ margin: '2px 0' }}>Solvix - Génération de devis professionnels</p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontSize: '10px',
              margin: '0 0 8px 0',
              color: '#6B8E23',
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
    </div>
  );
};

export default DevisModeleArtisan;