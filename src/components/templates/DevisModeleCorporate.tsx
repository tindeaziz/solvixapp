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
      
      {/* Bande supérieure */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '15mm',
        background: 'linear-gradient(90deg, #0F172A 0%, #1E293B 100%)',
        zIndex: 0
      }}></div>
      
      {/* HEADER - 25% de la page */}
      <div className="header-section" style={{
        height: '60mm',
        marginBottom: '10mm',
        borderBottom: '3px solid #0F172A',
        paddingBottom: '15mm',
        marginTop: '10mm',
        position: 'relative',
        zIndex: 1
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
                style={{ 
                  maxHeight: '45px', 
                  marginBottom: '8px',
                  objectFit: 'contain'
                }} 
              />
            )}
            <div>
              <h2 style={{
                fontSize: '18px',
                color: '#0F172A',
                margin: '0 0 8px 0',
                fontWeight: '700',
                letterSpacing: '0.5px'
              }}>
                {entrepriseData.name}
              </h2>
              <div style={{ fontSize: '10px', lineHeight: '1.5', color: '#64748B' }}>
                <p style={{ margin: '2px 0' }}>{entrepriseData.address}</p>
                <p style={{ margin: '2px 0' }}>{entrepriseData.phone} | {entrepriseData.email}</p>
              </div>
            </div>
          </div>

          {/* Titre DEVIS - Centre */}
          <div className="devis-title" style={{ 
            width: '30%', 
            textAlign: 'center',
            backgroundColor: '#F8FAFC',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)'
          }}>
            <h1 style={{
              fontSize: '26px',
              color: '#0F172A',
              fontWeight: '700',
              margin: '0 0 8px 0',
              letterSpacing: '1px'
            }}>
              DEVIS
            </h1>
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: '#0F172A',
              padding: '6px 10px',
              border: '2px solid #0F172A',
              borderRadius: '4px',
              display: 'inline-block'
            }}>
              {devisData.numeroDevis}
            </div>
          </div>

          {/* Dates - Droite */}
          <div className="dates-info" style={{ width: '25%', textAlign: 'right' }}>
            <div style={{ 
              fontSize: '11px', 
              color: '#64748B',
              backgroundColor: '#F8FAFC',
              padding: '12px',
              borderRadius: '8px',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.05)'
            }}>
              <p style={{ margin: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: '#0F172A' }}>Date:</strong> 
                <span>{formatDate(devisData.dateCreation)}</span>
              </p>
              <p style={{ margin: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: '#0F172A' }}>Valide jusqu'au:</strong> 
                <span>{formatDate(devisData.dateExpiration)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION CLIENT - 15% de la page */}
      <div className="client-section" style={{
        backgroundColor: '#F8FAFC',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '15mm',
        borderLeft: '4px solid #0F172A',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)'
      }}>
        <h3 style={{
          fontSize: '13px',
          color: '#0F172A',
          margin: '0 0 10px 0',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          INFORMATIONS CLIENT
        </h3>
        <div style={{ 
          fontSize: '11px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px'
        }}>
          <div>
            <p style={{ margin: '2px 0', fontWeight: 'bold', color: '#0F172A', fontSize: '13px' }}>{clientData.name}</p>
            <p style={{ margin: '2px 0', color: '#334155', fontWeight: '500' }}>{clientData.company}</p>
            <p style={{ margin: '8px 0 2px 0', color: '#64748B' }}>{clientData.address}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '2px 0', color: '#64748B' }}>
              <span style={{ color: '#0F172A', fontWeight: '500' }}>Email:</span> {clientData.email}
            </p>
            <p style={{ margin: '2px 0', color: '#64748B' }}>
              <span style={{ color: '#0F172A', fontWeight: '500' }}>Tél:</span> {clientData.phone}
            </p>
          </div>
        </div>
      </div>

      {/* TABLEAU PRESTATIONS - 45% de la page */}
      <div className="prestations-section" style={{ marginBottom: '15mm' }}>
        <h3 style={{
          fontSize: '13px',
          color: '#0F172A',
          margin: '0 0 10px 0',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          borderBottom: '2px solid #E2E8F0',
          paddingBottom: '8px'
        }}>
          DÉTAIL DES PRESTATIONS
        </h3>

        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '10px',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#0F172A', color: 'white' }}>
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
                borderBottom: '1px solid #E2E8F0',
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#F8FAFC'
              }}>
                <td style={{ padding: '10px', color: '#334155', fontWeight: '500' }}>{article.designation}</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#0F172A' }}>{article.quantity}</td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#334155' }}>{formatCurrency(article.unitPrice, devisData.devise)}</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#64748B' }}>{article.vatRate}%</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#0F172A' }}>
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
          border: '2px solid #0F172A',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)'
        }}>
          <div style={{ backgroundColor: '#F8FAFC', padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
              <span style={{ color: '#64748B', fontWeight: '500' }}>Sous-total HT:</span>
              <span style={{ fontWeight: 'bold', color: '#0F172A' }}>{formatCurrency(calculateSubtotal(), devisData.devise)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748B', fontWeight: '500' }}>TVA:</span>
              <span style={{ fontWeight: 'bold', color: '#0F172A' }}>{formatCurrency(calculateVAT(), devisData.devise)}</span>
            </div>
          </div>
          <div style={{
            backgroundColor: '#0F172A',
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
          backgroundColor: '#F8FAFC',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '10mm',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)'
        }}>
          <h4 style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#0F172A',
            margin: '0 0 8px 0',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            borderBottom: '2px solid #E2E8F0',
            paddingBottom: '6px'
          }}>
            Notes et conditions
          </h4>
          <p style={{
            fontSize: '10px',
            color: '#334155',
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
          borderTop: '1px solid #E2E8F0',
          paddingTop: '12px'
        }}>
          <div style={{ fontSize: '9px', color: '#64748B' }}>
            <p style={{ margin: '2px 0' }}>Devis généré le {formatDate(new Date().toISOString().split('T')[0])}</p>
            <p style={{ margin: '2px 0' }}>Solvix - Génération de devis professionnels</p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontSize: '10px',
              margin: '0 0 8px 0',
              color: '#64748B',
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
      
      {/* Bande inférieure */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '10mm',
        background: 'linear-gradient(90deg, #0F172A 0%, #1E293B 100%)',
        zIndex: 0
      }}></div>
    </div>
  );
};

export default DevisModeleCorporate;