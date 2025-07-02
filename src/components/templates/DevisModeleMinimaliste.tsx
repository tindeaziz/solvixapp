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

  // Vérifier si l'utilisateur est premium
  const isPremium = isPremiumActive();

  return (
    <div className="devis-container" style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '25mm',
      fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
      fontSize: '11px',
      lineHeight: '1.5',
      color: '#171717',
      backgroundColor: 'white',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      
      {/* HEADER - 25% de la page */}
      <div className="header-section" style={{
        height: '60mm',
        marginBottom: '20mm',
        borderBottom: '1px solid #E5E5E5',
        paddingBottom: '15mm',
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
          <div className="entreprise-info" style={{ width: '45%' }}>
            {entrepriseData.logo && (
              <img 
                src={entrepriseData.logo} 
                style={{ maxHeight: '40px', marginBottom: '16px' }} 
              />
            )}
            <h2 style={{
              fontSize: '16px',
              color: '#171717',
              margin: '0 0 12px 0',
              fontWeight: '500',
              letterSpacing: '0.5px'
            }}>
              {entrepriseData.name}
            </h2>
            <div style={{ fontSize: '10px', lineHeight: '1.6', color: '#737373' }}>
              <p style={{ margin: '3px 0' }}>{entrepriseData.address}</p>
              <p style={{ margin: '3px 0' }}>{entrepriseData.phone} | {entrepriseData.email}</p>
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
              color: '#171717',
              fontWeight: '300',
              margin: '0 0 16px 0',
              letterSpacing: '3px',
              textTransform: 'uppercase'
            }}>
              DEVIS
            </h1>
            <div style={{
              fontSize: '14px',
              color: '#171717',
              fontWeight: '400',
              border: '1px solid #E5E5E5',
              padding: '8px 16px',
              borderRadius: '2px'
            }}>
              {devisData.numeroDevis}
            </div>
            
            <div style={{ 
              fontSize: '10px', 
              color: '#737373',
              marginTop: '16px',
              textAlign: 'right'
            }}>
              <p style={{ margin: '4px 0' }}><strong>Date:</strong> {formatDate(devisData.dateCreation)}</p>
              <p style={{ margin: '4px 0' }}><strong>Valide jusqu'au:</strong> {formatDate(devisData.dateExpiration)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION CLIENT - 15% de la page */}
      <div className="client-section" style={{
        backgroundColor: '#FAFAFA',
        padding: '20px',
        marginBottom: '20mm',
        borderLeft: '2px solid #171717'
      }}>
        <h3 style={{
          fontSize: '12px',
          color: '#171717',
          margin: '0 0 12px 0',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          CLIENT
        </h3>
        <div style={{ 
          fontSize: '11px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }}>
          <div>
            <p style={{ margin: '3px 0', fontWeight: 'bold', color: '#171717', fontSize: '14px' }}>{clientData.name}</p>
            <p style={{ margin: '3px 0', color: '#404040', fontWeight: '400' }}>{clientData.company}</p>
            <p style={{ margin: '10px 0 3px 0', color: '#737373' }}>{clientData.address}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '3px 0', color: '#737373' }}>
              <span style={{ color: '#404040' }}>Email:</span> {clientData.email}
            </p>
            <p style={{ margin: '3px 0', color: '#737373' }}>
              <span style={{ color: '#404040' }}>Tél:</span> {clientData.phone}
            </p>
          </div>
        </div>
      </div>

      {/* TABLEAU PRESTATIONS - 45% de la page */}
      <div className="prestations-section" style={{ marginBottom: '20mm' }}>
        <h3 style={{
          fontSize: '12px',
          color: '#171717',
          margin: '0 0 16px 0',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          borderBottom: '1px solid #E5E5E5',
          paddingBottom: '8px'
        }}>
          Prestations
        </h3>

        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '11px'
        }}>
          <thead>
            <tr>
              <th style={{
                padding: '12px 8px',
                textAlign: 'left',
                width: '45%',
                borderBottom: '2px solid #171717',
                color: '#171717',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>DESCRIPTION</th>
              <th style={{
                padding: '12px 8px',
                textAlign: 'center',
                width: '10%',
                borderBottom: '2px solid #171717',
                color: '#171717',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>QTÉ</th>
              <th style={{
                padding: '12px 8px',
                textAlign: 'right',
                width: '15%',
                borderBottom: '2px solid #171717',
                color: '#171717',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>PRIX</th>
              <th style={{
                padding: '12px 8px',
                textAlign: 'center',
                width: '10%',
                borderBottom: '2px solid #171717',
                color: '#171717',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>TVA</th>
              <th style={{
                padding: '12px 8px',
                textAlign: 'right',
                width: '20%',
                borderBottom: '2px solid #171717',
                color: '#171717',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article, index) => (
              <tr key={article.id}>
                <td style={{ padding: '12px 8px', borderBottom: '1px solid #E5E5E5', color: '#171717', fontWeight: '400' }}>{article.designation}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E5E5', color: '#171717' }}>{article.quantity}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '1px solid #E5E5E5', color: '#171717' }}>{formatCurrency(article.unitPrice, devisData.devise)}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #E5E5E5', color: '#171717' }}>{article.vatRate}%</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #E5E5E5', color: '#171717' }}>
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
        marginBottom: '20mm'
      }}>
        <div style={{ width: '40%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #E5E5E5' }}>
            <span style={{ color: '#737373', fontWeight: '400' }}>Sous-total HT:</span>
            <span style={{ color: '#171717', fontWeight: '500' }}>{formatCurrency(calculateSubtotal(), devisData.devise)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #E5E5E5' }}>
            <span style={{ color: '#737373', fontWeight: '400' }}>TVA:</span>
            <span style={{ color: '#171717', fontWeight: '500' }}>{formatCurrency(calculateVAT(), devisData.devise)}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '2px solid #171717',
            marginTop: '4px'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#171717', letterSpacing: '1px' }}>TOTAL TTC:</span>
            <span style={{ fontSize: '16px', fontWeight: '500', color: '#171717' }}>
              {formatCurrency(calculateTotal(), devisData.devise)}
            </span>
          </div>
        </div>
      </div>

      {/* NOTES */}
      {devisData.notes && (
        <div style={{
          backgroundColor: '#FAFAFA',
          padding: '20px',
          marginBottom: '20mm',
          borderLeft: '2px solid #171717'
        }}>
          <h4 style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#171717',
            margin: '0 0 12px 0',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            Notes
          </h4>
          <p style={{
            fontSize: '10px',
            color: '#404040',
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
        marginBottom: '20mm'
      }}>
        <p style={{
          fontSize: '10px',
          margin: '0 0 8px 0',
          color: '#737373',
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

      {/* FOOTER - 5% de la page - Supprimé pour les utilisateurs premium */}
      {!isPremium && (
        <div className="footer-section" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: 'auto',
          borderTop: '1px solid #E5E5E5',
          paddingTop: '15px'
        }}>
          <div style={{ fontSize: '9px', color: '#737373' }}>
            <p style={{ margin: '2px 0' }}>Devis généré le {formatDate(new Date().toISOString().split('T')[0])}</p>
            <p style={{ margin: '2px 0' }}>Solvix - Génération de devis professionnels</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevisModeleMinimaliste;