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

interface DevisModeleModerneProps {
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

const DevisModeleModerne: React.FC<DevisModeleModerneProps> = ({
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
      fontFamily: 'Segoe UI, Roboto, sans-serif',
      fontSize: '11px',
      lineHeight: '1.4',
      color: '#333333',
      backgroundColor: 'white',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      
      {/* HEADER - 25% de la page */}
      <div className="header-section" style={{
        height: '60mm',
        marginBottom: '15mm',
        background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        borderRadius: '10px',
        padding: '20px',
        color: 'white',
        boxShadow: '0 10px 25px rgba(59, 130, 246, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          {/* Logo et entreprise - Gauche */}
          <div className="entreprise-info" style={{ 
            width: '45%',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            {entrepriseData.logo && (
              <img 
                src={entrepriseData.logo} 
                style={{ 
                  maxHeight: '45px',
                  filter: 'brightness(0) invert(1)'
                }} 
              />
            )}
            <div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                margin: '0 0 5px 0'
              }}>
                {entrepriseData.name}
              </h2>
              <div style={{ fontSize: '10px', lineHeight: '1.4', opacity: '0.9' }}>
                <p style={{ margin: '2px 0' }}>{entrepriseData.phone} | {entrepriseData.email}</p>
              </div>
            </div>
          </div>

          {/* Titre DEVIS - Droite */}
          <div className="devis-title" style={{ 
            width: '45%', 
            textAlign: 'right',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end'
          }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              margin: '0 0 10px 0',
              letterSpacing: '1px'
            }}>
              DEVIS
            </h1>
            <div style={{
              fontSize: '15px',
              fontWeight: 'bold',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              padding: '8px 16px',
              borderRadius: '20px'
            }}>
              {devisData.numeroDevis}
            </div>
          </div>
        </div>
        
        {/* Dates et adresse - Bas */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '20px'
        }}>
          <div style={{ fontSize: '10px', opacity: '0.9', maxWidth: '45%' }}>
            <p style={{ margin: '2px 0' }}>{entrepriseData.address}</p>
          </div>
          
          <div style={{ 
            fontSize: '10px', 
            opacity: '0.9',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            padding: '8px 12px',
            borderRadius: '8px',
            display: 'flex',
            gap: '20px'
          }}>
            <div>
              <p style={{ margin: '2px 0', fontWeight: 'bold' }}>Date:</p>
              <p style={{ margin: '2px 0' }}>{formatDate(devisData.dateCreation)}</p>
            </div>
            <div>
              <p style={{ margin: '2px 0', fontWeight: 'bold' }}>Valide jusqu'au:</p>
              <p style={{ margin: '2px 0' }}>{formatDate(devisData.dateExpiration)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION CLIENT - 15% de la page */}
      <div className="client-section" style={{
        backgroundColor: '#F3F4F6',
        padding: '15px 20px',
        borderRadius: '10px',
        marginBottom: '15mm',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div style={{ width: '60%' }}>
            <h3 style={{
              fontSize: '14px',
              color: '#3B82F6',
              margin: '0 0 10px 0',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#3B82F6',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>C</span>
              CLIENT
            </h3>
            <p style={{ margin: '3px 0', fontWeight: 'bold', color: '#1F2937', fontSize: '14px' }}>{clientData.name}</p>
            <p style={{ margin: '3px 0', color: '#3B82F6', fontWeight: '500' }}>{clientData.company}</p>
            <p style={{ margin: '8px 0 3px 0', color: '#6B7280' }}>{clientData.address}</p>
          </div>
          
          <div style={{ 
            width: '35%',
            backgroundColor: 'white',
            padding: '12px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <p style={{ margin: '3px 0', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#EFF6FF',
                color: '#3B82F6',
                fontSize: '10px'
              }}>@</span>
              {clientData.email}
            </p>
            <p style={{ margin: '3px 0', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#EFF6FF',
                color: '#3B82F6',
                fontSize: '10px'
              }}>☏</span>
              {clientData.phone}
            </p>
          </div>
        </div>
      </div>

      {/* TABLEAU PRESTATIONS - 45% de la page */}
      <div className="prestations-section" style={{ marginBottom: '15mm' }}>
        <h3 style={{
          fontSize: '14px',
          color: '#1F2937',
          margin: '0 0 12px 0',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '8px',
            backgroundColor: '#EFF6FF',
            color: '#3B82F6',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>P</span>
          PRESTATIONS
        </h3>

        <table style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: '0',
          fontSize: '11px',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#3B82F6', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left', width: '45%', fontWeight: 'bold' }}>DESCRIPTION</th>
              <th style={{ padding: '12px', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>QTÉ</th>
              <th style={{ padding: '12px', textAlign: 'right', width: '15%', fontWeight: 'bold' }}>PRIX</th>
              <th style={{ padding: '12px', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>TVA</th>
              <th style={{ padding: '12px', textAlign: 'right', width: '20%', fontWeight: 'bold' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article, index) => (
              <tr key={article.id} style={{
                backgroundColor: index % 2 === 0 ? 'white' : '#F9FAFB',
                borderBottom: '1px solid #E5E7EB'
              }}>
                <td style={{ padding: '12px', color: '#1F2937' }}>{article.designation}</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#3B82F6' }}>{article.quantity}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#1F2937' }}>{formatCurrency(article.unitPrice, devisData.devise)}</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#6B7280' }}>{article.vatRate}%</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#3B82F6' }}>
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
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ backgroundColor: '#F9FAFB', padding: '12px 15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}>
              <span style={{ color: '#6B7280' }}>Sous-total HT:</span>
              <span style={{ fontWeight: 'bold', color: '#1F2937' }}>{formatCurrency(calculateSubtotal(), devisData.devise)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#6B7280' }}>TVA:</span>
              <span style={{ fontWeight: 'bold', color: '#1F2937' }}>{formatCurrency(calculateVAT(), devisData.devise)}</span>
            </div>
          </div>
          <div style={{
            backgroundColor: '#3B82F6',
            padding: '15px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>TOTAL TTC:</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {formatCurrency(calculateTotal(), devisData.devise)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NOTES */}
      {devisData.notes && (
        <div style={{
          backgroundColor: '#F3F4F6',
          padding: '15px 20px',
          borderRadius: '10px',
          marginBottom: '15mm',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#1F2937',
            margin: '0 0 10px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#EFF6FF',
              color: '#3B82F6',
              fontSize: '10px',
              fontWeight: 'bold'
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

      {/* Signature */}
      <div style={{ 
        textAlign: 'right',
        marginBottom: '15mm',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '15px'
      }}>
        <div style={{
          backgroundColor: '#EFF6FF',
          padding: '10px 15px',
          borderRadius: '8px',
          display: 'inline-block'
        }}>
          <p style={{
            fontSize: '11px',
            margin: '0',
            color: '#3B82F6',
            fontWeight: '500'
          }}>
            Fait le {formatDate(new Date().toISOString().split('T')[0])}
          </p>
        </div>
        
        {entrepriseData.signature && (
          <div style={{
            backgroundColor: 'white',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E5E7EB'
          }}>
            <img 
              src={entrepriseData.signature} 
              style={{ maxHeight: '40px', maxWidth: '120px' }} 
            />
          </div>
        )}
      </div>

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
        </div>
      )}
    </div>
  );
};

export default DevisModeleModerne;