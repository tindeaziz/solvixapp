import React, { useEffect, useState } from 'react';
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

interface DevisModeleClassiqueProps {
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

const DevisModeleClassique: React.FC<DevisModeleClassiqueProps> = ({
  devisData,
  entrepriseData,
  clientData,
  articles
}) => {
  const [isPremium, setIsPremium] = useState(false);
  
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const premiumStatus = await isPremiumActive();
        setIsPremium(premiumStatus);
      } catch (error) {
        console.error('Erreur lors de la vérification du statut premium:', error);
        setIsPremium(false);
      }
    };
    
    checkPremiumStatus();
  }, []);

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
      fontFamily: 'Arial, sans-serif',
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
        borderBottom: '2px solid #2C5282',
        paddingBottom: '15mm',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        {/* Logo et entreprise - Gauche */}
        <div className="entreprise-info" style={{ width: '45%' }}>
          {entrepriseData.logo && (
            <img 
              src={entrepriseData.logo} 
              style={{ maxHeight: '45px', marginBottom: '12px' }} 
            />
          )}
          <h2 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#2C5282',
            margin: '0 0 10px 0'
          }}>
            {entrepriseData.name}
          </h2>
          <div style={{ fontSize: '10px', lineHeight: '1.5', color: '#4A5568' }}>
            <p style={{ margin: '2px 0' }}>{entrepriseData.address}</p>
            <p style={{ margin: '2px 0' }}>{entrepriseData.phone} | {entrepriseData.email}</p>
          </div>
        </div>

        {/* Titre DEVIS - Droite */}
        <div className="devis-title" style={{ width: '45%', textAlign: 'right' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#2C5282',
            margin: '0 0 12px 0'
          }}>
            DEVIS
          </h1>
          <div style={{
            fontSize: '16px',
            color: '#2C5282',
            fontWeight: 'bold',
            marginBottom: '15px'
          }}>
            {devisData.numeroDevis}
          </div>
          
          <div style={{ fontSize: '11px', color: '#4A5568' }}>
            <p style={{ margin: '4px 0' }}><strong>Date:</strong> {formatDate(devisData.dateCreation)}</p>
            <p style={{ margin: '4px 0' }}><strong>Valide jusqu'au:</strong> {formatDate(devisData.dateExpiration)}</p>
          </div>
        </div>
      </div>

      {/* SECTION CLIENT - 15% de la page */}
      <div className="client-section" style={{
        backgroundColor: '#EBF4FF',
        padding: '15px',
        borderRadius: '5px',
        marginBottom: '15mm',
        borderLeft: '5px solid #2C5282'
      }}>
        <h3 style={{
          fontSize: '14px',
          color: '#2C5282',
          margin: '0 0 10px 0',
          fontWeight: 'bold'
        }}>
          FACTURÉ À:
        </h3>
        <div style={{ fontSize: '11px' }}>
          <p style={{ margin: '3px 0', fontWeight: 'bold', color: '#2D3748', fontSize: '14px' }}>{clientData.name}</p>
          <p style={{ margin: '3px 0', color: '#2C5282' }}>{clientData.company}</p>
          <p style={{ margin: '3px 0', color: '#4A5568' }}>{clientData.address}</p>
          <p style={{ margin: '3px 0', color: '#4A5568' }}>{clientData.phone} | {clientData.email}</p>
        </div>
      </div>

      {/* TABLEAU PRESTATIONS - 45% de la page */}
      <div className="prestations-section" style={{ marginBottom: '15mm' }}>
        <h3 style={{
          fontSize: '14px',
          color: '#2C5282',
          margin: '0 0 10px 0',
          fontWeight: 'bold'
        }}>
          DÉTAIL DES PRESTATIONS:
        </h3>

        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '11px',
          border: '1px solid #CBD5E0',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#2C5282', color: 'white' }}>
              <th style={{ padding: '10px', textAlign: 'left', width: '45%', fontWeight: 'bold' }}>DESCRIPTION</th>
              <th style={{ padding: '10px', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>QTÉ</th>
              <th style={{ padding: '10px', textAlign: 'right', width: '15%', fontWeight: 'bold' }}>PRIX UNIT.</th>
              <th style={{ padding: '10px', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>TVA %</th>
              <th style={{ padding: '10px', textAlign: 'right', width: '20%', fontWeight: 'bold' }}>TOTAL HT</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article, index) => (
              <tr key={article.id} style={{
                backgroundColor: index % 2 === 0 ? 'white' : '#F7FAFC',
                borderBottom: '1px solid #CBD5E0'
              }}>
                <td style={{ padding: '10px', color: '#2D3748' }}>{article.designation}</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#2D3748' }}>{article.quantity}</td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#2D3748' }}>{formatCurrency(article.unitPrice, devisData.devise)}</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#2D3748' }}>{article.vatRate}%</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#2C5282' }}>
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
          border: '1px solid #CBD5E0',
          borderRadius: '5px',
          overflow: 'hidden',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
        }}>
          <div style={{ backgroundColor: '#F7FAFC', padding: '10px 15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
              <span style={{ color: '#4A5568' }}>Sous-total HT:</span>
              <span style={{ fontWeight: 'bold', color: '#2D3748' }}>{formatCurrency(calculateSubtotal(), devisData.devise)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#4A5568' }}>TVA:</span>
              <span style={{ fontWeight: 'bold', color: '#2D3748' }}>{formatCurrency(calculateVAT(), devisData.devise)}</span>
            </div>
          </div>
          <div style={{
            backgroundColor: '#2C5282',
            padding: '12px 15px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>TOTAL TTC:</span>
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
          backgroundColor: '#F7FAFC',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '15mm',
          border: '1px solid #CBD5E0'
        }}>
          <h4 style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#2C5282',
            margin: '0 0 8px 0'
          }}>
            CONDITIONS & NOTES:
          </h4>
          <p style={{
            fontSize: '10px',
            color: '#4A5568',
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
        marginBottom: '15mm'
      }}>
        <p style={{
          fontSize: '11px',
          margin: '0 0 8px 0',
          color: '#4A5568',
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
          borderTop: '1px solid #CBD5E0',
          paddingTop: '12px'
        }}>
          <div style={{ fontSize: '9px', color: '#718096' }}>
            <p style={{ margin: '2px 0' }}>Devis généré le {formatDate(new Date().toISOString().split('T')[0])}</p>
            <p style={{ margin: '2px 0' }}>Solvix - Génération de devis professionnels</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevisModeleClassique;