import React from 'react';
import { X, Printer } from 'lucide-react';
import { formatCurrency } from '../types/currency';

interface PrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  quoteData: {
    number: string;
    date: string;
    validUntil: string;
    client: {
      name: string;
      company: string;
      email: string;
      phone: string;
      address: string;
    };
    items: Array<{
      id: string;
      designation: string;
      quantity: number;
      unitPrice: number;
      vatRate: number;
      total: number;
    }>;
    currency: string;
    notes: string;
    template: 'classic' | 'modern' | 'minimal';
  };
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
    signature?: string;
  };
}

const PrintPreview: React.FC<PrintPreviewProps> = ({
  isOpen,
  onClose,
  quoteData,
  companyInfo
}) => {
  if (!isOpen) return null;

  const calculateItemTotal = (item: any) => item.quantity * item.unitPrice;
  
  const calculateSubtotal = () => {
    return quoteData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const calculateVAT = () => {
    return quoteData.items.reduce((sum, item) => {
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

  const handlePrint = () => {
    window.print();
  };

  const renderClassicTemplate = () => (
    <div className="print-content classic-template">
      {/* Header */}
      <div className="header">
        <div className="company-section">
          {companyInfo.logo && (
            <div className="company-logo">
              <img src={companyInfo.logo} alt="Logo" />
            </div>
          )}
          <div className="company-details">
            <h1 className="company-name">{companyInfo.name}</h1>
            <div className="company-info">
              <div>{companyInfo.address}</div>
              <div>{companyInfo.phone}</div>
              <div>{companyInfo.email}</div>
            </div>
          </div>
        </div>
        
        <div className="quote-section">
          <div className="quote-title">DEVIS</div>
          <div className="quote-ref">{quoteData.number}</div>
          <div className="quote-dates">
            <div>Date: {formatDate(quoteData.date)}</div>
            <div>Valide jusqu'au: {formatDate(quoteData.validUntil)}</div>
          </div>
        </div>
      </div>

      {/* Client Section */}
      <div className="client-section">
        <div className="section-title">Facturé à:</div>
        <div className="client-details">
          <div className="client-name">{quoteData.client.name}</div>
          <div className="client-company">{quoteData.client.company}</div>
          <div className="client-contact">{quoteData.client.email}</div>
          <div className="client-phone">{quoteData.client.phone}</div>
          <div className="client-address">{quoteData.client.address}</div>
        </div>
      </div>

      {/* Items Table */}
      <table className="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantité</th>
            <th>Prix unitaire</th>
            <th>TVA %</th>
            <th>Total HT</th>
          </tr>
        </thead>
        <tbody>
          {quoteData.items.map((item) => (
            <tr key={item.id}>
              <td className="item-description">{item.designation}</td>
              <td className="item-quantity">{item.quantity}</td>
              <td className="item-price">{formatCurrency(item.unitPrice, quoteData.currency)}</td>
              <td className="item-vat">{item.vatRate}%</td>
              <td className="item-total">{formatCurrency(calculateItemTotal(item), quoteData.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="totals-section">
        <table className="totals-table">
          <tr>
            <td>Total HT:</td>
            <td className="total-value">{formatCurrency(calculateSubtotal(), quoteData.currency)}</td>
          </tr>
          <tr>
            <td>Total TVA:</td>
            <td className="total-value">{formatCurrency(calculateVAT(), quoteData.currency)}</td>
          </tr>
          <tr className="total-final">
            <td>Total TTC:</td>
            <td className="total-value">{formatCurrency(calculateTotal(), quoteData.currency)}</td>
          </tr>
        </table>
      </div>

      {/* Notes */}
      {quoteData.notes && (
        <div className="notes-section">
          <div className="section-title">Notes et conditions:</div>
          <div className="notes-content">{quoteData.notes}</div>
        </div>
      )}

      {/* Signature */}
      {companyInfo.signature && (
        <div className="signature-section">
          <div className="signature-label">Signature:</div>
          <img src={companyInfo.signature} alt="Signature" className="signature-image" />
        </div>
      )}

      {/* Footer */}
      <div className="footer">
        <div>Document généré le {formatDate(new Date().toISOString().split('T')[0])}</div>
        <div>{companyInfo.name} - Génération de devis professionnelle</div>
      </div>
    </div>
  );

  const renderModernTemplate = () => (
    <div className="print-content modern-template">
      {/* Header with gradient */}
      <div className="header-modern">
        <div className="header-content">
          <div className="company-section">
            {companyInfo.logo && (
              <img src={companyInfo.logo} alt="Logo" className="company-logo" />
            )}
            <div className="company-info">
              <h1 className="company-name">{companyInfo.name}</h1>
              <div className="company-details">
                <div>{companyInfo.address}</div>
                <div>{companyInfo.phone} | {companyInfo.email}</div>
              </div>
            </div>
          </div>
          
          <div className="quote-section">
            <div className="quote-title">DEVIS</div>
            <div className="quote-ref">{quoteData.number}</div>
          </div>
        </div>
      </div>

      {/* Date and Client Info */}
      <div className="info-grid">
        <div className="date-section">
          <div className="info-card">
            <div className="card-title">Date de création</div>
            <div className="card-value">{formatDate(quoteData.date)}</div>
          </div>
        </div>
        <div className="expiry-section">
          <div className="info-card">
            <div className="card-title">Date d'expiration</div>
            <div className="card-value">{formatDate(quoteData.validUntil)}</div>
          </div>
        </div>
      </div>

      {/* Client Section */}
      <div className="client-section-modern">
        <div className="section-title">Client</div>
        <div className="client-card">
          <div className="client-name">{quoteData.client.name}</div>
          <div className="client-company">{quoteData.client.company}</div>
          <div className="client-contact">
            <span>{quoteData.client.email}</span>
            {quoteData.client.phone && <span> | {quoteData.client.phone}</span>}
          </div>
          {quoteData.client.address && (
            <div className="client-address">{quoteData.client.address}</div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="items-section">
        <div className="section-title">Prestations</div>
        <table className="items-table-modern">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qté</th>
              <th>Prix unitaire</th>
              <th>TVA</th>
              <th>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {quoteData.items.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                <td className="item-description">{item.designation}</td>
                <td className="item-quantity">{item.quantity}</td>
                <td className="item-price">{formatCurrency(item.unitPrice, quoteData.currency)}</td>
                <td className="item-vat">{item.vatRate}%</td>
                <td className="item-total">{formatCurrency(calculateItemTotal(item), quoteData.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="totals-section-modern">
        <div className="totals-card">
          <div className="total-row">
            <span>Sous-total HT</span>
            <span>{formatCurrency(calculateSubtotal(), quoteData.currency)}</span>
          </div>
          <div className="total-row">
            <span>TVA</span>
            <span>{formatCurrency(calculateVAT(), quoteData.currency)}</span>
          </div>
          <div className="total-final">
            <span>TOTAL TTC</span>
            <span>{formatCurrency(calculateTotal(), quoteData.currency)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quoteData.notes && (
        <div className="notes-section-modern">
          <div className="section-title">Notes</div>
          <div className="notes-content">{quoteData.notes}</div>
        </div>
      )}

      {/* Footer */}
      <div className="footer-modern">
        <div>Généré le {formatDate(new Date().toISOString().split('T')[0])} avec Solvix</div>
      </div>
    </div>
  );

  const renderMinimalTemplate = () => (
    <div className="print-content minimal-template">
      {/* Header */}
      <div className="header-minimal">
        <div className="company-info">
          <h1 className="company-name">{companyInfo.name}</h1>
          <div className="company-contact">{companyInfo.email} | {companyInfo.phone}</div>
        </div>
      </div>

      {/* Quote Info */}
      <div className="quote-info-minimal">
        <h2 className="quote-title">DEVIS {quoteData.number}</h2>
        <div className="quote-dates">
          {formatDate(quoteData.date)} - Valide jusqu'au {formatDate(quoteData.validUntil)}
        </div>
      </div>

      {/* Client */}
      <div className="client-minimal">
        <strong>Pour: {quoteData.client.name}</strong>
        {quoteData.client.company && <span> ({quoteData.client.company})</span>}
      </div>

      {/* Items */}
      <div className="items-minimal">
        <h3>PRESTATIONS:</h3>
        {quoteData.items.map((item, index) => (
          <div key={item.id} className="item-row">
            <div className="item-description">
              {index + 1}. {item.designation}
            </div>
            <div className="item-calculation">
              {item.quantity} × {formatCurrency(item.unitPrice, quoteData.currency)} = {formatCurrency(calculateItemTotal(item), quoteData.currency)}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="totals-minimal">
        <div className="total-line">TOTAL HT: {formatCurrency(calculateSubtotal(), quoteData.currency)}</div>
        <div className="total-line">TVA: {formatCurrency(calculateVAT(), quoteData.currency)}</div>
        <div className="total-final">TOTAL TTC: {formatCurrency(calculateTotal(), quoteData.currency)}</div>
      </div>

      {/* Notes */}
      {quoteData.notes && (
        <div className="notes-minimal">
          <div>{quoteData.notes}</div>
        </div>
      )}

      {/* Footer */}
      <div className="footer-minimal">
        Solvix - {formatDate(new Date().toISOString().split('T')[0])}
      </div>
    </div>
  );

  const renderTemplate = () => {
    switch (quoteData.template) {
      case 'modern':
        return renderModernTemplate();
      case 'minimal':
        return renderMinimalTemplate();
      default:
        return renderClassicTemplate();
    }
  };

  return (
    <>
      {/* Modal Overlay - Hidden in print */}
      <div className="fixed inset-0 z-50 overflow-y-auto print:hidden">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
          
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
            {/* Modal Header */}
            <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Aperçu d'impression - {quoteData.number}
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimer / Sauvegarder PDF
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Preview Content */}
            <div className="max-h-96 overflow-y-auto p-6 bg-gray-50">
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-8">
                  {renderTemplate()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          /* Hide everything except print content */
          body * {
            visibility: hidden;
          }
          
          .print-content,
          .print-content * {
            visibility: visible;
          }
          
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: #1e293b !important;
            font-family: 'Arial', sans-serif;
            font-size: 14px;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
          }

          /* CLASSIC TEMPLATE STYLES */
          .classic-template .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            border-bottom: 3px solid #8b5cf6;
            padding-bottom: 20px;
          }

          .classic-template .company-logo img {
            max-height: 60px;
            width: auto;
            margin-bottom: 10px;
          }

          .classic-template .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
          }

          .classic-template .company-info {
            color: #64748b;
            font-size: 12px;
            line-height: 1.4;
          }

          .classic-template .quote-section {
            text-align: right;
          }

          .classic-template .quote-title {
            font-size: 32px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
          }

          .classic-template .quote-ref {
            font-size: 18px;
            color: #8b5cf6;
            font-weight: bold;
            margin-bottom: 15px;
          }

          .classic-template .quote-dates {
            color: #64748b;
            font-size: 12px;
          }

          .classic-template .client-section {
            margin: 30px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-left: 4px solid #8b5cf6;
          }

          .classic-template .section-title {
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
            font-size: 14px;
          }

          .classic-template .client-name {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
          }

          .classic-template .client-company {
            font-size: 14px;
            margin-bottom: 5px;
          }

          .classic-template .client-contact,
          .classic-template .client-phone,
          .classic-template .client-address {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 3px;
          }

          .classic-template .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
          }

          .classic-template .items-table th {
            background-color: rgba(139, 92, 246, 0.1);
            color: #1e293b;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #8b5cf6;
            font-weight: bold;
            font-size: 12px;
          }

          .classic-template .items-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
            color: #64748b;
            font-size: 12px;
          }

          .classic-template .items-table tr:nth-child(even) {
            background-color: #f9fafb;
          }

          .classic-template .item-quantity,
          .classic-template .item-price,
          .classic-template .item-vat,
          .classic-template .item-total {
            text-align: right;
            font-weight: bold;
          }

          .classic-template .totals-section {
            margin-top: 30px;
            text-align: right;
          }

          .classic-template .totals-table {
            margin-left: auto;
            width: 300px;
          }

          .classic-template .totals-table td {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }

          .classic-template .total-value {
            text-align: right;
            font-weight: bold;
          }

          .classic-template .total-final {
            font-size: 18px;
            font-weight: bold;
            color: #8b5cf6;
            border-top: 2px solid #8b5cf6;
            padding-top: 10px;
          }

          .classic-template .notes-section {
            margin-top: 40px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
          }

          .classic-template .notes-content {
            white-space: pre-line;
            color: #64748b;
            font-size: 12px;
          }

          .classic-template .signature-section {
            margin-top: 30px;
            text-align: right;
          }

          .classic-template .signature-image {
            max-height: 60px;
            width: auto;
            margin-top: 10px;
          }

          .classic-template .footer {
            margin-top: 50px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }

          /* MODERN TEMPLATE STYLES */
          .modern-template .header-modern {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            margin: -20px -20px 30px -20px;
            border-radius: 0;
          }

          .modern-template .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .modern-template .company-logo {
            max-height: 50px;
            width: auto;
            margin-right: 20px;
          }

          .modern-template .company-section {
            display: flex;
            align-items: center;
          }

          .modern-template .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }

          .modern-template .company-details {
            font-size: 12px;
            opacity: 0.9;
          }

          .modern-template .quote-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
          }

          .modern-template .quote-ref {
            font-size: 16px;
            opacity: 0.9;
          }

          .modern-template .info-grid {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
          }

          .modern-template .info-card {
            flex: 1;
            padding: 15px;
            background: #f8f9ff;
            border-left: 4px solid #667eea;
            border-radius: 4px;
          }

          .modern-template .card-title {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .modern-template .card-value {
            font-size: 16px;
            font-weight: bold;
            color: #1e293b;
          }

          .modern-template .client-section-modern {
            margin-bottom: 30px;
          }

          .modern-template .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 2px solid #667eea;
          }

          .modern-template .client-card {
            background: #f8f9ff;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
          }

          .modern-template .client-name {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 5px;
          }

          .modern-template .client-company {
            font-size: 14px;
            color: #667eea;
            margin-bottom: 8px;
          }

          .modern-template .client-contact {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 5px;
          }

          .modern-template .client-address {
            font-size: 12px;
            color: #64748b;
          }

          .modern-template .items-table-modern {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }

          .modern-template .items-table-modern th {
            background: #667eea;
            color: white;
            padding: 15px 12px;
            font-weight: bold;
            font-size: 12px;
            text-align: left;
          }

          .modern-template .items-table-modern td {
            padding: 12px;
            font-size: 12px;
            border-bottom: 1px solid #e0e0e0;
          }

          .modern-template .items-table-modern tr.even {
            background: #f8f9ff;
          }

          .modern-template .item-quantity,
          .modern-template .item-price,
          .modern-template .item-vat,
          .modern-template .item-total {
            text-align: right;
            font-weight: bold;
          }

          .modern-template .totals-section-modern {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }

          .modern-template .totals-card {
            width: 350px;
            background: #f8f9ff;
            border: 2px solid #667eea;
            border-radius: 8px;
            padding: 20px;
          }

          .modern-template .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
            color: #64748b;
          }

          .modern-template .total-final {
            display: flex;
            justify-content: space-between;
            background: #667eea;
            color: white;
            margin: 15px -20px -20px -20px;
            padding: 15px 20px;
            border-radius: 0 0 6px 6px;
            font-size: 18px;
            font-weight: bold;
          }

          .modern-template .notes-section-modern {
            margin-bottom: 30px;
          }

          .modern-template .notes-content {
            background: #f8f9ff;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            white-space: pre-line;
            font-size: 12px;
            color: #64748b;
          }

          .modern-template .footer-modern {
            text-align: center;
            color: #64748b;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }

          /* MINIMAL TEMPLATE STYLES */
          .minimal-template .header-minimal {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 20px;
          }

          .minimal-template .company-name {
            font-size: 20px;
            font-weight: 300;
            color: #1e293b;
            margin-bottom: 5px;
          }

          .minimal-template .company-contact {
            font-size: 12px;
            color: #64748b;
          }

          .minimal-template .quote-info-minimal {
            text-align: center;
            margin-bottom: 30px;
          }

          .minimal-template .quote-title {
            font-size: 28px;
            font-weight: 300;
            color: #1e293b;
            margin-bottom: 10px;
            letter-spacing: 1px;
          }

          .minimal-template .quote-dates {
            font-size: 12px;
            color: #64748b;
          }

          .minimal-template .client-minimal {
            margin-bottom: 30px;
            font-size: 14px;
            color: #1e293b;
          }

          .minimal-template .items-minimal h3 {
            font-size: 14px;
            font-weight: normal;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            margin-bottom: 20px;
          }

          .minimal-template .item-row {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #f0f0f0;
          }

          .minimal-template .item-description {
            font-size: 14px;
            color: #1e293b;
            margin-bottom: 5px;
          }

          .minimal-template .item-calculation {
            font-size: 12px;
            color: #64748b;
            margin-left: 20px;
          }

          .minimal-template .totals-minimal {
            margin: 30px 0;
            text-align: right;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }

          .minimal-template .total-line {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 8px;
          }

          .minimal-template .total-final {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
            border-top: 2px solid #1e293b;
            padding-top: 10px;
            margin-top: 10px;
          }

          .minimal-template .notes-minimal {
            margin: 30px 0;
            padding: 20px 0;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #64748b;
            white-space: pre-line;
          }

          .minimal-template .footer-minimal {
            text-align: center;
            font-size: 10px;
            color: #64748b;
            margin-top: 40px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }

          /* Page break controls */
          .header,
          .header-modern,
          .header-minimal {
            page-break-inside: avoid;
          }

          .items-section,
          .items-table,
          .items-table-modern {
            page-break-inside: avoid;
          }

          .totals-section,
          .totals-section-modern,
          .totals-minimal {
            page-break-inside: avoid;
          }

          /* Hide print button and modal elements */
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default PrintPreview;