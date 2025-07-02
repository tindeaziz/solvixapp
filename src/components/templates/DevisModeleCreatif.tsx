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
        background: 'linear-gradient(120deg, #6366F1 0%, #8B5CF6 100%)',
        borderRadius: '16px',
        padding: '15mm',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(99, 102, 241, 0.2)'
      }}>
        {/* Éléments décoratifs */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '100px',
          height: '100px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%'
        }}></div>
        
        <div style={{
          position: 'absolute',
          bottom: '-20px',
          left: '30%',
          width: '80px',
          height: '80px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%'
        }}></div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          height: '100%',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Logo et entreprise - Gauche */}
          <div className="entreprise-info" style={{ width: '45%' }}>
            {entrepriseData.logo && (
              <img 
                src={entrepriseData.logo} 
                style={{ 
                  maxHeight: '40px', 
                  marginBottom: '12px',
                  filter: 'brightness(0) invert(1)'
                }} 
              />
            )}
            <h2 style={{
              fontSize: '18px',
              margin: '0 0 8px 0',
              fontWeight: 'bold',
              letterSpacing: '0.5px'
            }}>
              {entrepriseData.name}
            </h2>
            <div style={{ fontSize: '10px', lineHeight: '1.5', opacity: '0.9' }}>
              <p style={{ margin: '2px 0' }}>{entrepriseData.address}</p>
              <p style={{ margin: '2px 0' }}>{entrepriseData.phone} | {entrepriseData.email}</p>
            </div>
          </div>

          {/* Titre DEVIS - Centre */}
          <div className="devis-title" style={{ width: '30%', textAlign: 'center' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              margin: '0 0 12px 0',
              letterSpacing: '3px',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              DEVIS
            </h1>
            <div style={{
              fontSize: '15px',
              fontWeight: 'bold',
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '30px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              {devisData.numeroDevis}
            </div>
          </div>

          {/* Dates - Droite */}
          <div className="dates-info" style={{ width: '25%', textAlign: 'right' }}>
            <div style={{ 
              fontSize: '11px', 
              opacity: '0.9',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '10px',
              borderRadius: '12px'
            }}>
              <p style={{ margin: '4px 0' }}><strong>Date:</strong> {formatDate(devisData.dateCreation)}</p>
              <p style={{ margin: '4px 0' }}><strong>Valide jusqu'au:</strong> {formatDate(devisData.dateExpiration)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION CLIENT - 15% de la page */}
      <div className="client-section" style={{
        background: 'linear-gradient(to right, #F9FAFB, #F3F4F6)',
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '15mm',
        borderLeft: '4px solid #8B5CF6',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        <h3 style={{
          fontSize: '13px',
          color: '#4F46E5',
          margin: '0 0 10px 0',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{
            display: 'inline-block',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#8B5CF6',
            marginRight: '8px',
            position: 'relative'
          }}>
            <span style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>C</span>
          </span>
          CLIENT
        </h3>
        <div style={{ 
          fontSize: '11px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px'
        }}>
          <div>
            <p style={{ margin: '2px 0', fontWeight: 'bold', color: '#1F2937', fontSize: '13px' }}>{clientData.name}</p>
            <p style={{ margin: '2px 0', color: '#6366F1', fontWeight: '500' }}>{clientData.company}</p>
            <p style={{ margin: '8px 0 2px 0', color: '#4B5563' }}>{clientData.address}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '2px 0', color: '#4B5563' }}>
              <span style={{ 
                display: 'inline-block',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#EEF2FF',
                textAlign: 'center',
                marginRight: '5px',
                fontSize: '9px',
                color: '#6366F1'
              }}>✉</span>
              {clientData.email}
            </p>
            <p style={{ margin: '2px 0', color: '#4B5563' }}>
              <span style={{ 
                display: 'inline-block',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#EEF2FF',
                textAlign: 'center',
                marginRight: '5px',
                fontSize: '9px',
                color: '#6366F1'
              }}>✆</span>
              {clientData.phone}
            </p>
          </div>
        </div>
      </div>

      {/* TABLEAU PRESTATIONS - 45% de la page */}
      <div className="prestations-section" style={{ marginBottom: '15mm' }}>
        <h3 style={{
          fontSize: '13px',
          color: '#1F2937',
          margin: '0 0 12px 0',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{
            display: 'inline-block',
            width: '20px',
            height: '20px',
            borderRadius: '6px',
            backgroundColor: '#EEF2FF',
            marginRight: '8px',
            textAlign: 'center',
            lineHeight: '20px',
            color: '#6366F1'
          }}>✓</span>
          PRESTATIONS
        </h3>

        <table style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: '0',
          fontSize: '10px',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        }}>
          <thead>
            <tr style={{ 
              background: 'linear-gradient(120deg, #6366F1 0%, #8B5CF6 100%)', 
              color: 'white' 
            }}>
              <th style={{ padding: '12px 10px', textAlign: 'left', width: '45%', fontWeight: 'bold' }}>DESCRIPTION</th>
              <th style={{ padding: '12px 10px', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>QTÉ</th>
              <th style={{ padding: '12px 10px', textAlign: 'right', width: '15%', fontWeight: 'bold' }}>PRIX</th>
              <th style={{ padding: '12px 10px', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>TVA</th>
              <th style={{ padding: '12px 10px', textAlign: 'right', width: '20%', fontWeight: 'bold' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article, index) => (
              <tr key={article.id} style={{
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#F9FAFB',
                borderLeft: index % 2 === 0 ? '3px solid #6366F1' : '3px solid #8B5CF6'
              }}>
                <td style={{ padding: '10px', color: '#1F2937' }}>{article.designation}</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#6366F1' }}>{article.quantity}</td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#1F2937' }}>{formatCurrency(article.unitPrice, devisData.devise)}</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#8B5CF6' }}>{article.vatRate}%</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#6366F1' }}>
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
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ backgroundColor: '#F9FAFB', padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#6B7280' }}>Sous-total HT:</span>
              <span style={{ fontWeight: 'bold', color: '#1F2937' }}>{formatCurrency(calculateSubtotal(), devisData.devise)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#6B7280' }}>TVA:</span>
              <span style={{ fontWeight: 'bold', color: '#1F2937' }}>{formatCurrency(calculateVAT(), devisData.devise)}</span>
            </div>
          </div>
          <div style={{
            background: 'linear-gradient(120deg, #6366F1 0%, #8B5CF6 100%)',
            padding: '14px 16px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>TOTAL TTC:</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {formatCurrency(calculateTotal(), devisData.devise)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NOTES */}
      {devisData.notes && (
        <div style={{
          background: 'linear-gradient(to right, #F9FAFB, #F3F4F6)',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '10mm',
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
          <h4 style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#4F46E5',
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{
              display: 'inline-block',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#EEF2FF',
              marginRight: '8px',
              textAlign: 'center',
              lineHeight: '18px',
              color: '#6366F1'
            }}>i</span>
            Notes et conditions
          </h4>
          <p style={{
            fontSize: '10px',
            color: '#4B5563',
            margin: '0',
            whiteSpace: 'pre-line',
            lineHeight: '1.6'
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
          borderTop: '1px solid #E5E7EB',
          paddingTop: '12px'
        }}>
          <div style={{ fontSize: '9px', color: '#9CA3AF' }}>
            <p style={{ margin: '2px 0' }}>Devis généré le {formatDate(new Date().toISOString().split('T')[0])}</p>
            <p style={{ margin: '2px 0' }}>Solvix - Génération de devis professionnels</p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontSize: '10px',
              margin: '0 0 8px 0',
              color: '#9CA3AF',
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