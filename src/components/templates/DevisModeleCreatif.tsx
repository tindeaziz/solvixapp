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

  // Vérifier si l'utilisateur est premium
  const isPremium = isPremiumActive();

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
        background: 'linear-gradient(135deg, #FF6B35 0%, #6F42C1 100%)',
        borderRadius: '12px',
        padding: '15mm',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Éléments décoratifs */}
        <div style={{
          position: 'absolute',
          top: '-10px',
          right: '-10px',
          width: '60px',
          height: '60px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%'
        }}></div>
        
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
                style={{ 
                  maxHeight: '40px', 
                  marginBottom: '8px',
                  filter: 'brightness(0) invert(1)'
                }} 
              />
            )}
            <h2 style={{
              fontSize: '16px',
              margin: '0 0 8px 0',
              fontWeight: 'bold'
            }}>
              {entrepriseData.name}
            </h2>
            <div style={{ fontSize: '10px', lineHeight: '1.3', opacity: '0.9' }}>
              <p style={{ margin: '2px 0' }}>{entrepriseData.address}</p>
              <p style={{ margin: '2px 0' }}>{entrepriseData.phone} | {entrepriseData.email}</p>
            </div>
          </div>

          {/* Titre DEVIS - Centre */}
          <div className="devis-title" style={{ width: '30%', textAlign: 'center' }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '0 0 8px 0',
              letterSpacing: '2px',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              DEVIS
            </h1>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              padding: '6px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              {devisData.numeroDevis}
            </div>
          </div>

          {/* Dates - Droite */}
          <div className="dates-info" style={{ width: '25%', textAlign: 'right' }}>
            <div style={{ fontSize: '10px', opacity: '0.9' }}>
              <p style={{ margin: '4px 0' }}><strong>Date:</strong> {formatDate(devisData.dateCreation)}</p>
              <p style={{ margin: '4px 0' }}><strong>Valide jusqu'au:</strong> {formatDate(devisData.dateExpiration)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION CLIENT - 15% de la page */}
      <div className="client-section" style={{
        background: 'linear-gradient(135deg, #F7FAFC 0%, #E2E8F0 100%)',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '15mm',
        borderLeft: '4px solid #FF6B35'
      }}>
        <h3 style={{
          fontSize: '12px',
          color: '#6F42C1',
          margin: '0 0 8px 0',
          fontWeight: 'bold'
        }}>
          CLIENT:
        </h3>
        <div style={{ fontSize: '11px' }}>
          <p style={{ margin: '2px 0', fontWeight: 'bold', color: '#2D3748' }}>{clientData.name}</p>
          <p style={{ margin: '2px 0', color: '#FF6B35' }}>{clientData.company}</p>
          <p style={{ margin: '2px 0', color: '#718096' }}>{clientData.address}</p>
          <p style={{ margin: '2px 0', color: '#718096' }}>{clientData.phone} | {clientData.email}</p>
        </div>
      </div>

      {/* TABLEAU PRESTATIONS - 45% de la page */}
      <div className="prestations-section" style={{ marginBottom: '15mm' }}>
        <h3 style={{
          fontSize: '12px',
          color: '#2D3748',
          margin: '0 0 8px 0',
          fontWeight: 'bold'
        }}>
          🎨 Prestations Créatives:
        </h3>

        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '10px',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #6F42C1 100%)', color: 'white' }}>
              <th style={{ padding: '10px 8px', textAlign: 'left', width: '45%', fontWeight: 'bold' }}>DESCRIPTION</th>
              <th style={{ padding: '10px 8px', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>QTÉ</th>
              <th style={{ padding: '10px 8px', textAlign: 'right', width: '15%', fontWeight: 'bold' }}>PRIX</th>
              <th style={{ padding: '10px 8px', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>TVA</th>
              <th style={{ padding: '10px 8px', textAlign: 'right', width: '20%', fontWeight: 'bold' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article, index) => (
              <tr key={article.id} style={{
                borderBottom: '1px solid #E2E8F0',
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#F7FAFC',
                borderLeft: index % 2 === 0 ? '3px solid #FF6B35' : '3px solid #6F42C1'
              }}>
                <td style={{ padding: '8px', color: '#2D3748' }}>{article.designation}</td>
                <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#FF6B35' }}>{article.quantity}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: '#2D3748' }}>{formatCurrency(article.unitPrice, devisData.devise)}</td>
                <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#6F42C1' }}>{article.vatRate}%</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#FF6B35' }}>
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
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ backgroundColor: '#F7FAFC', padding: '8px 12px', marginBottom: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#718096' }}>Sous-total HT:</span>
              <span style={{ fontWeight: 'bold', color: '#2D3748' }}>{formatCurrency(calculateSubtotal(), devisData.devise)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#718096' }}>TVA:</span>
              <span style={{ fontWeight: 'bold', color: '#2D3748' }}>{formatCurrency(calculateVAT(), devisData.devise)}</span>
            </div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #FF6B35 0%, #6F42C1 100%)',
            padding: '12px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>TOTAL TTC:</span>
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
          background: 'linear-gradient(135deg, #F7FAFC 0%, #E2E8F0 100%)',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '10mm',
          border: '2px solid #E2E8F0'
        }}>
          <h4 style={{
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#6F42C1',
            margin: '0 0 6px 0'
          }}>
            📝 Notes et conditions:
          </h4>
          <p style={{
            fontSize: '9px',
            color: '#4A5568',
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
          borderTop: '1px solid #E2E8F0',
          paddingTop: '12px'
        }}>
          <div style={{ fontSize: '9px', color: '#718096' }}>
            <p style={{ margin: '2px 0' }}>Devis généré le {formatDate(new Date().toISOString().split('T')[0])}</p>
            <p style={{ margin: '2px 0' }}>Solvix - Génération de devis professionnels</p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontSize: '10px',
              margin: '0 0 8px 0',
              color: '#718096',
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
    </div>
  );
};

export default DevisModeleCreatif;