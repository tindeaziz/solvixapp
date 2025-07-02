import React from 'react';
import { formatCurrency } from '../../types/currency';
import { isPremiumActive } from '../../utils/security';

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

  // Vérifier si l'utilisateur est premium
  const isPremium = isPremiumActive();

  return (
    <div className="devis-container" style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '20mm',
      fontFamily: 'Helvetica, Arial, sans-serif',
      fontSize: '11px',
      lineHeight: '1.4',
      color: '#333333',
      backgroundColor: 'white',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      
      {/* Bande colorée en haut */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '12px',
        backgroundColor: '#2C3E50'
      }}></div>

      {/* HEADER - 25% de la page */}
      <div className="header-section" style={{
        height: '60mm',
        marginBottom: '10mm',
        paddingTop: '15mm',
        borderBottom: '3px solid #2C3E50',
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
              color: '#2C3E50',
              margin: '0 0 8px 0'
            }}>
              {entrepriseData.name}
            </h2>
            <div style={{ fontSize: '10px', lineHeight: '1.4', color: '#7F8C8D' }}>
              <p style={{ margin: '2px 0' }}>{entrepriseData.address}</p>
              <p style={{ margin: '2px 0' }}>{entrepriseData.phone} | {entrepriseData.email}</p>
            </div>
          </div>

          {/* Titre DEVIS - Centre */}
          <div className="devis-title" style={{
            width: '30%',
            textAlign: 'center',
            backgroundColor: '#F8F9FA',
            padding: '15px',
            borderRadius: '5px',
            border: '1px solid #E9ECEF'
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#2C3E50',
              margin: '0 0 8px 0'
            }}>
              DEVIS
            </h1>
            <div style={{
              fontSize: '14px',
              color: '#3498DB',
              fontWeight: 'bold',
              padding: '4px 8px',
              backgroundColor: 'rgba(52, 152, 219, 0.1)',
              borderRadius: '4px'
            }}>
              {devisData.numeroDevis}
            </div>
          </div>

          {/* Dates - Droite */}
          <div className="dates-info" style={{ width: '25%', textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#7F8C8D' }}>
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
        borderRadius: '6px',
        marginBottom: '15mm',
        borderLeft: '4px solid #3498DB'
      }}>
        <h3 style={{
          fontSize: '12px',
          color: '#2C3E50',
          margin: '0 0 8px 0',
          fontWeight: 'bold'
        }}>
          FACTURÉ À:
        </h3>
        <div style={{ fontSize: '11px' }}>
          <p style={{ margin: '2px 0', fontWeight: 'bold', color: '#2C3E50' }}>{clientData.name}</p>
          <p style={{ margin: '2px 0', color: '#3498DB' }}>{clientData.company}</p>
          <p style={{ margin: '2px 0', color: '#7F8C8D' }}>{clientData.address}</p>
          <p style={{ margin: '2px 0', color: '#7F8C8D' }}>{clientData.phone} | {clientData.email}</p>
        </div>
      </div>

      {/* TABLEAU PRESTATIONS - 45% de la page */}
      <div className="prestations-section" style={{ marginBottom: '15mm' }}>
        <h3 style={{
          fontSize: '12px',
          color: '#2C3E50',
          margin: '0 0 8px 0',
          fontWeight: 'bold'
        }}>
          DÉTAIL DES PRESTATIONS:
        </h3>

        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '10px',
          border: '1px solid #E9ECEF',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#F8F9FA' }}>
              <th style={{
                padding: '10px 8px',
                textAlign: 'left',
                width: '45%',
                borderBottom: '2px solid #3498DB',
                color: '#2C3E50',
                fontWeight: 'bold'
              }}>DESCRIPTION</th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'center',
                width: '10%',
                borderBottom: '2px solid #3498DB',
                color: '#2C3E50',
                fontWeight: 'bold'
              }}>QTÉ</th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'right',
                width: '15%',
                borderBottom: '2px solid #3498DB',
                color: '#2C3E50',
                fontWeight: 'bold'
              }}>PRIX UNIT.</th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'center',
                width: '10%',
                borderBottom: '2px solid #3498DB',
                color: '#2C3E50',
                fontWeight: 'bold'
              }}>TVA %</th>
              <th style={{
                padding: '10px 8px',
                textAlign: 'right',
                width: '20%',
                borderBottom: '2px solid #3498DB',
                color: '#2C3E50',
                fontWeight: 'bold'
              }}>TOTAL HT</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article, index) => (
              <tr key={article.id} style={{
                backgroundColor: index % 2 === 0 ? 'white' : '#F8F9FA',
                borderBottom: '1px solid #E9ECEF'
              }}>
                <td style={{ padding: '8px', color: '#2C3E50' }}>{article.designation}</td>
                <td style={{ padding: '8px', textAlign: 'center', color: '#2C3E50' }}>{article.quantity}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: '#2C3E50' }}>{formatCurrency(article.unitPrice, devisData.devise)}</td>
                <td style={{ padding: '8px', textAlign: 'center', color: '#2C3E50' }}>{article.vatRate}%</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#3498DB' }}>
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
          border: '1px solid #E9ECEF',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <div style={{ backgroundColor: '#F8F9FA', padding: '8px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#7F8C8D', fontWeight: 'bold' }}>SOUS-TOTAL HT:</span>
              <span style={{ fontWeight: 'bold', color: '#2C3E50' }}>{formatCurrency(calculateSubtotal(), devisData.devise)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', borderTop: '1px solid #E9ECEF', paddingTop: '4px' }}>
              <span style={{ color: '#7F8C8D', fontWeight: 'bold' }}>TOTAL TVA:</span>
              <span style={{ fontWeight: 'bold', color: '#2C3E50' }}>{formatCurrency(calculateVAT(), devisData.devise)}</span>
            </div>
          </div>
          <div style={{
            backgroundColor: '#2C3E50',
            padding: '12px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 'bold' }}>TOTAL TTC:</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                {formatCurrency(calculateTotal(), devisData.devise)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NOTES */}
      {devisData.notes && (
        <div style={{
          backgroundColor: '#F8F9FA',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '10mm',
          border: '1px solid #E9ECEF'
        }}>
          <h4 style={{
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#2C3E50',
            margin: '0 0 6px 0'
          }}>
            CONDITIONS & NOTES:
          </h4>
          <p style={{
            fontSize: '9px',
            color: '#7F8C8D',
            margin: '0',
            whiteSpace: 'pre-line'
          }}>
            {devisData.notes}
          </p>
        </div>
      )}

      {/* FOOTER - 5% de la page - Supprimé pour les utilisateurs premium */}
      {!isPremium && (
        <div className="footer-section" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: 'auto',
          borderTop: '1px solid #E9ECEF',
          paddingTop: '12px'
        }}>
          <div style={{ fontSize: '9px', color: '#7F8C8D' }}>
            <p style={{ margin: '2px 0' }}>Devis généré le {formatDate(new Date().toISOString().split('T')[0])}</p>
            <p style={{ margin: '2px 0' }}>Solvix - Génération de devis professionnels</p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontSize: '10px',
              margin: '0 0 8px 0',
              color: '#7F8C8D',
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
      )}

      {/* Bande colorée en bas */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '12px',
        backgroundColor: '#3498DB'
      }}></div>
    </div>
  );
};

export default DevisModeleProfessionnel;