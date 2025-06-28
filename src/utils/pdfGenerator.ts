import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency } from '../types/currency';

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

interface DevisData {
  numeroDevis: string;
  dateCreation: string;
  dateExpiration: string;
  devise: string;
  notes: string;
  template: string;
  articles: QuoteItem[];
  client: ClientInfo;
  entreprise: CompanyInfo;
  sousTotal: number;
  totalTVA: number;
  totalTTC: number;
}

export const generateDevisPDF = async (devisData: DevisData): Promise<void> => {
  try {
    console.log('📄 PDF_GENERATOR - Début de génération pour devis:', devisData.numeroDevis, 'Template:', devisData.template);

    // Créer un élément temporaire avec le contenu du devis
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '0';
    element.style.width = '794px'; // Largeur A4 en pixels (210mm)
    element.style.backgroundColor = 'white';
    element.style.padding = '40px';
    element.style.boxSizing = 'border-box';

    // Générer le contenu HTML selon le template sélectionné
    element.innerHTML = generateTemplateHTML(devisData);

    // Ajouter temporairement à la page
    document.body.appendChild(element);

    // Attendre que les images se chargent
    await waitForImages(element);

    console.log('🖼️ PDF_GENERATOR - Génération du canvas...');

    // Générer le canvas avec des options optimisées
    const canvas = await html2canvas(element, {
      scale: 2, // Haute résolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 794,
      height: element.scrollHeight,
      windowWidth: 794,
      windowHeight: element.scrollHeight
    });

    console.log('📋 PDF_GENERATOR - Création du PDF...');

    // Créer le PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const imgWidth = 210; // Largeur A4 en mm
    const pageHeight = 297; // Hauteur A4 en mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Ajouter la première page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Ajouter des pages supplémentaires si nécessaire
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // Sauvegarder le PDF
    const fileName = `devis-${devisData.numeroDevis}-${devisData.template}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    console.log('✅ PDF_GENERATOR - PDF généré avec succès:', fileName);

    // Nettoyer
    document.body.removeChild(element);

  } catch (error) {
    console.error('❌ PDF_GENERATOR - Erreur lors de la génération:', error);
    throw new Error('Erreur lors de la génération du PDF. Veuillez réessayer.');
  }
};

const waitForImages = (element: HTMLElement): Promise<void> => {
  return new Promise((resolve) => {
    const images = element.querySelectorAll('img');
    if (images.length === 0) {
      resolve();
      return;
    }

    let loadedCount = 0;
    const totalImages = images.length;

    const checkComplete = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        resolve();
      }
    };

    images.forEach((img) => {
      if (img.complete) {
        checkComplete();
      } else {
        img.onload = checkComplete;
        img.onerror = checkComplete; // Continue même si l'image ne charge pas
      }
    });

    // Timeout de sécurité
    setTimeout(resolve, 3000);
  });
};

const generateTemplateHTML = (devisData: DevisData): string => {
  console.log('🎨 PDF_GENERATOR - Génération template:', devisData.template);
  
  switch (devisData.template) {
    case 'creatif':
      return generateCreatifTemplate(devisData);
    case 'corporate':
      return generateCorporateTemplate(devisData);
    case 'artisan':
      return generateArtisanTemplate(devisData);
    case 'elegant':
      return generateElegantTemplate(devisData);
    case 'professionnel':
      return generateProfessionnelTemplate(devisData);
    case 'minimaliste':
      return generateMinimalisteTemplate(devisData);
    case 'modern':
      return generateModernTemplate(devisData);
    case 'minimal':
      return generateMinimalTemplate(devisData);
    case 'classic':
    default:
      return generateClassicTemplate(devisData);
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR');
};

const generateClassicTemplate = (devisData: DevisData): string => {
  const logoHTML = devisData.entreprise.logo 
    ? `<img src="${devisData.entreprise.logo}" alt="Logo" style="max-height: 60px; width: auto; margin-bottom: 15px;" />`
    : '';

  const signatureHTML = devisData.entreprise.signature
    ? `
      <div style="margin-top: 40px; text-align: right;">
        <p style="margin-bottom: 10px; font-size: 12px; color: #666;">
          Fait le ${formatDate(new Date().toISOString().split('T')[0])}, ${devisData.entreprise.name}
        </p>
        <img src="${devisData.entreprise.signature}" alt="Signature" style="max-height: 60px; max-width: 200px;" />
      </div>
    `
    : '';

  return `
    <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #333;">
      <!-- En-tête Classique -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #8b5cf6; padding-bottom: 20px;">
        <div style="flex: 1;">
          ${logoHTML}
          <h1 style="font-size: 24px; font-weight: bold; color: #1e293b; margin: 0 0 10px 0;">${devisData.entreprise.name}</h1>
          <div style="font-size: 12px; color: #64748b; line-height: 1.4;">
            ${devisData.entreprise.address.replace(/\n/g, '<br>')}
          </div>
          <div style="font-size: 12px; color: #64748b; margin-top: 5px;">
            ${devisData.entreprise.phone} | ${devisData.entreprise.email}
          </div>
        </div>
        
        <div style="text-align: right;">
          <h2 style="font-size: 32px; font-weight: bold; color: #1e293b; margin: 0 0 10px 0;">DEVIS</h2>
          <div style="font-size: 18px; color: #8b5cf6; font-weight: bold; margin-bottom: 15px;">${devisData.numeroDevis}</div>
          <div style="font-size: 12px; color: #64748b;">
            <div>Date: ${formatDate(devisData.dateCreation)}</div>
            <div>Valide jusqu'au: ${formatDate(devisData.dateExpiration)}</div>
          </div>
        </div>
      </div>

      <!-- Client -->
      <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-left: 4px solid #8b5cf6;">
        <h3 style="font-size: 14px; font-weight: bold; color: #1e293b; margin: 0 0 10px 0;">Facturé à:</h3>
        <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${devisData.client.name}</div>
        ${devisData.client.company ? `<div style="font-size: 14px; margin-bottom: 5px;">${devisData.client.company}</div>` : ''}
        ${devisData.client.email ? `<div style="font-size: 12px; color: #64748b; margin-bottom: 3px;">${devisData.client.email}</div>` : ''}
        ${devisData.client.phone ? `<div style="font-size: 12px; color: #64748b; margin-bottom: 3px;">${devisData.client.phone}</div>` : ''}
        ${devisData.client.address ? `<div style="font-size: 12px; color: #64748b;">${devisData.client.address.replace(/\n/g, '<br>')}</div>` : ''}
      </div>

      <!-- Tableau -->
      <table style="width: 100%; border-collapse: collapse; margin: 30px 0;">
        <thead>
          <tr style="background: rgba(139, 92, 246, 0.1); color: #1e293b;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #8b5cf6; font-weight: bold; font-size: 12px;">Désignation</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #8b5cf6; font-weight: bold; font-size: 12px;">Quantité</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #8b5cf6; font-weight: bold; font-size: 12px;">Prix unitaire</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #8b5cf6; font-weight: bold; font-size: 12px;">TVA %</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #8b5cf6; font-weight: bold; font-size: 12px;">Total HT</th>
          </tr>
        </thead>
        <tbody>
          ${devisData.articles.map((item, index) => `
            <tr style="background: ${index % 2 === 0 ? 'white' : '#f9fafb'};">
              <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${item.designation}</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; font-size: 12px;">${item.quantity}</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; font-size: 12px;">${formatCurrency(item.unitPrice, devisData.devise)}</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; font-size: 12px;">${item.vatRate}%</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; font-size: 12px;">${formatCurrency(item.quantity * item.unitPrice, devisData.devise)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Totaux -->
      <div style="display: flex; justify-content: flex-end; margin-top: 30px;">
        <table style="width: 300px;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px;">Sous-total HT:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; font-size: 14px;">${formatCurrency(devisData.sousTotal, devisData.devise)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px;">Total TVA:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; font-size: 14px;">${formatCurrency(devisData.totalTVA, devisData.devise)}</td>
          </tr>
          <tr style="font-size: 18px; font-weight: bold; color: #8b5cf6; border-top: 2px solid #8b5cf6; padding-top: 10px;">
            <td style="padding: 10px 0;">TOTAL TTC:</td>
            <td style="padding: 10px 0; text-align: right;">${formatCurrency(devisData.totalTTC, devisData.devise)}</td>
          </tr>
        </table>
      </div>

      ${devisData.notes ? `
        <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <h4 style="font-weight: bold; color: #1e293b; margin-bottom: 10px; font-size: 14px;">Notes et conditions:</h4>
          <div style="white-space: pre-line; color: #64748b; font-size: 12px;">${devisData.notes}</div>
        </div>
      ` : ''}

      ${signatureHTML}

      <div style="margin-top: 50px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <div>Devis généré le ${formatDate(new Date().toISOString().split('T')[0])}</div>
        <div style="margin-top: 3px;">Solvix - Génération de devis professionnels</div>
      </div>
    </div>
  `;
};

const generateCreatifTemplate = (devisData: DevisData): string => {
  const logoHTML = devisData.entreprise.logo 
    ? `<img src="${devisData.entreprise.logo}" alt="Logo" style="max-height: 50px; width: auto; filter: brightness(0) invert(1);" />`
    : '';

  const signatureHTML = devisData.entreprise.signature
    ? `
      <div style="margin-top: 40px; text-align: right;">
        <p style="margin-bottom: 10px; font-size: 12px; color: #718096;">
          Fait le ${formatDate(new Date().toISOString().split('T')[0])}, ${devisData.entreprise.name}
        </p>
        <img src="${devisData.entreprise.signature}" alt="Signature" style="max-height: 60px; max-width: 200px;" />
      </div>
    `
    : '';

  return `
    <div style="font-family: 'Poppins', sans-serif; font-size: 14px; line-height: 1.5; color: #2D3748;">
      <!-- Header Créatif avec gradient -->
      <div style="background: linear-gradient(135deg, #FF6B35 0%, #6F42C1 100%); border-radius: 15px; padding: 25px; margin-bottom: 25px; color: white; position: relative; overflow: hidden;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 2;">
          <div style="display: flex; align-items: flex-start; gap: 20px;">
            ${logoHTML ? `<div style="background: rgba(255, 255, 255, 0.15); padding: 10px; border-radius: 12px;">${logoHTML}</div>` : ''}
            <div>
              <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${devisData.entreprise.name}</h1>
              <div style="font-size: 11px; opacity: 0.9; line-height: 1.3;">
                ${devisData.entreprise.address.replace(/\n/g, '<br>')}
              </div>
              <div style="font-size: 11px; opacity: 0.9; margin-top: 3px;">
                ${devisData.entreprise.phone} | ${devisData.entreprise.email}
              </div>
            </div>
          </div>
          
          <div style="text-align: right;">
            <h2 style="font-size: 28px; font-weight: 800; margin: 0 0 8px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2); letter-spacing: 2px;">DEVIS</h2>
            <div style="background: rgba(255, 255, 255, 0.2); padding: 8px 15px; border-radius: 20px; font-size: 16px; font-weight: 600; margin-bottom: 12px;">${devisData.numeroDevis}</div>
            <div style="font-size: 11px; opacity: 0.9;">
              <div>Date: ${formatDate(devisData.dateCreation)}</div>
              <div>Valide jusqu'au: ${formatDate(devisData.dateExpiration)}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Client -->
      <div style="margin-bottom: 25px; background: linear-gradient(135deg, #F7FAFC 0%, #E2E8F0 100%); border-left: 4px solid #FF6B35; border-radius: 0 6px 6px 0; padding: 15px;">
        <h3 style="font-weight: bold; color: #6F42C1; margin: 0 0 10px 0; font-size: 14px;">Facturé à:</h3>
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px; color: #2D3748;">${devisData.client.name}</div>
        ${devisData.client.company ? `<div style="font-size: 12px; margin-bottom: 5px; color: #FF6B35;">${devisData.client.company}</div>` : ''}
        ${devisData.client.email ? `<div style="font-size: 11px; color: #718096; margin-bottom: 3px;">${devisData.client.email}</div>` : ''}
        ${devisData.client.phone ? `<div style="font-size: 11px; color: #718096; margin-bottom: 3px;">${devisData.client.phone}</div>` : ''}
        ${devisData.client.address ? `<div style="font-size: 11px; color: #718096;">${devisData.client.address.replace(/\n/g, '<br>')}</div>` : ''}
      </div>

      <!-- Tableau -->
      <div style="margin-bottom: 25px;">
        <h3 style="font-weight: bold; color: #2D3748; margin-bottom: 12px; font-size: 14px;">🎨 Prestations Créatives:</h3>
        
        <table style="width: 100%; border-collapse: collapse; border-radius: 6px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
          <thead>
            <tr style="background: linear-gradient(135deg, #FF6B35 0%, #6F42C1 100%);">
              <th style="color: white; padding: 10px 8px; text-align: left; font-weight: bold; font-size: 11px;">Description</th>
              <th style="color: white; padding: 10px 8px; text-align: right; font-weight: bold; font-size: 11px;">Qté</th>
              <th style="color: white; padding: 10px 8px; text-align: right; font-weight: bold; font-size: 11px;">Prix unitaire</th>
              <th style="color: white; padding: 10px 8px; text-align: right; font-weight: bold; font-size: 11px;">TVA %</th>
              <th style="color: white; padding: 10px 8px; text-align: right; font-weight: bold; font-size: 11px;">Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${devisData.articles.map((item, index) => `
              <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#F7FAFC'}; border-left: ${index % 2 === 0 ? '3px solid #FF6B35' : '3px solid #6F42C1'};">
                <td style="padding: 8px; font-size: 10px; line-height: 1.3; color: #2D3748;">${item.designation}</td>
                <td style="padding: 8px; text-align: right; font-weight: bold; color: #FF6B35; font-size: 10px;">${item.quantity}</td>
                <td style="padding: 8px; text-align: right; font-weight: bold; color: #2D3748; font-size: 10px;">${formatCurrency(item.unitPrice, devisData.devise)}</td>
                <td style="padding: 8px; text-align: right; font-weight: bold; color: #6F42C1; font-size: 10px;">${item.vatRate}%</td>
                <td style="padding: 8px; text-align: right; font-weight: bold; color: #FF6B35; font-size: 10px;">${formatCurrency(item.quantity * item.unitPrice, devisData.devise)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totaux -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 25px;">
        <table style="width: 280px; border-collapse: collapse; border-radius: 6px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 8px 15px; font-size: 12px; color: #718096; background: #F7FAFC;">Sous-total HT:</td>
            <td style="padding: 8px 15px; text-align: right; font-size: 12px; font-weight: bold; color: #2D3748; background: #F7FAFC;">${formatCurrency(devisData.sousTotal, devisData.devise)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 15px; font-size: 12px; color: #718096; background: #F7FAFC;">Total TVA:</td>
            <td style="padding: 8px 15px; text-align: right; font-size: 12px; font-weight: bold; color: #2D3748; background: #F7FAFC;">${formatCurrency(devisData.totalTVA, devisData.devise)}</td>
          </tr>
          <tr style="background: linear-gradient(135deg, #FF6B35 0%, #6F42C1 100%);">
            <td style="padding: 12px 15px; font-size: 16px; font-weight: bold; color: white;">TOTAL TTC:</td>
            <td style="padding: 12px 15px; text-align: right; font-size: 16px; font-weight: bold; color: white;">${formatCurrency(devisData.totalTTC, devisData.devise)}</td>
          </tr>
        </table>
      </div>

      ${devisData.notes ? `
        <div style="margin-bottom: 25px; background: linear-gradient(135deg, #F7FAFC 0%, #E2E8F0 100%); border-radius: 6px; border: 2px solid #E2E8F0; padding: 15px;">
          <h4 style="font-weight: bold; color: #6F42C1; margin-bottom: 8px; font-size: 12px;">📝 Notes et conditions:</h4>
          <div style="white-space: pre-line; color: #4A5568; font-size: 11px; line-height: 1.2;">${devisData.notes}</div>
        </div>
      ` : ''}

      ${signatureHTML}

      <div style="margin-top: 40px; text-align: center; color: #718096; font-size: 12px; border-top: 1px solid #E2E8F0; padding-top: 20px;">
        <div>Devis généré le ${formatDate(new Date().toISOString().split('T')[0])}</div>
        <div style="margin-top: 3px;">Solvix - Génération de devis professionnels</div>
      </div>
    </div>
  `;
};

const generateCorporateTemplate = (devisData: DevisData): string => {
  const logoHTML = devisData.entreprise.logo 
    ? `<img src="${devisData.entreprise.logo}" alt="Logo" style="max-height: 50px; width: auto;" />`
    : '';

  const signatureHTML = devisData.entreprise.signature
    ? `
      <div style="margin-top: 40px; text-align: right;">
        <p style="margin-bottom: 10px; font-size: 12px; color: #6C757D;">
          Fait le ${formatDate(new Date().toISOString().split('T')[0])}, ${devisData.entreprise.name}
        </p>
        <img src="${devisData.entreprise.signature}" alt="Signature" style="max-height: 60px; max-width: 200px;" />
      </div>
    `
    : '';

  return `
    <div style="font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.5; color: #1B4B8C;">
      <!-- Header Corporate -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 3px solid #1B4B8C; padding-bottom: 15px;">
        <div style="display: flex; align-items: flex-start; gap: 20px;">
          ${logoHTML}
          <div>
            <h1 style="font-size: 22px; font-weight: 700; color: #1B4B8C; margin: 0 0 8px 0; letter-spacing: 0.5px;">${devisData.entreprise.name}</h1>
            <div style="color: #6C757D; font-size: 11px; line-height: 1.3;">
              ${devisData.entreprise.address.replace(/\n/g, '<br>')}
            </div>
            <div style="color: #6C757D; font-size: 11px; margin-top: 3px;">
              ${devisData.entreprise.phone} | ${devisData.entreprise.email}
            </div>
          </div>
        </div>
        
        <div style="text-align: right; min-width: 200px;">
          <h2 style="font-size: 28px; font-weight: 700; color: #1B4B8C; margin: 0 0 8px 0; letter-spacing: 1px;">DEVIS</h2>
          <div style="font-size: 16px; color: #6C757D; font-weight: 600; margin-bottom: 12px;">${devisData.numeroDevis}</div>
          <div style="color: #6C757D; font-size: 11px;">
            <div>Date: ${formatDate(devisData.dateCreation)}</div>
            <div>Valide jusqu'au: ${formatDate(devisData.dateExpiration)}</div>
          </div>
        </div>
      </div>

      <!-- Client -->
      <div style="margin-bottom: 25px; background: #F8F9FA; border: 1px solid #E9ECEF; border-radius: 4px; padding: 15px;">
        <h3 style="font-weight: bold; color: #1B4B8C; margin: 0 0 10px 0; font-size: 14px;">Facturé à:</h3>
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px; color: #1B4B8C;">${devisData.client.name}</div>
        ${devisData.client.company ? `<div style="font-size: 12px; margin-bottom: 5px; color: #6C757D;">${devisData.client.company}</div>` : ''}
        ${devisData.client.email ? `<div style="font-size: 11px; color: #6C757D; margin-bottom: 3px;">${devisData.client.email}</div>` : ''}
        ${devisData.client.phone ? `<div style="font-size: 11px; color: #6C757D; margin-bottom: 3px;">${devisData.client.phone}</div>` : ''}
        ${devisData.client.address ? `<div style="font-size: 11px; color: #6C757D;">${devisData.client.address.replace(/\n/g, '<br>')}</div>` : ''}
      </div>

      <!-- Tableau -->
      <div style="margin-bottom: 25px;">
        <h3 style="font-weight: bold; color: #1B4B8C; margin-bottom: 12px; font-size: 14px;">Détail des prestations:</h3>
        
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #E9ECEF; border-radius: 6px; overflow: hidden;">
          <thead>
            <tr style="background: #F8F9FA;">
              <th style="color: #1B4B8C; padding: 10px 8px; text-align: left; font-weight: bold; font-size: 11px;">Description</th>
              <th style="color: #1B4B8C; padding: 10px 8px; text-align: right; font-weight: bold; font-size: 11px;">Qté</th>
              <th style="color: #1B4B8C; padding: 10px 8px; text-align: right; font-weight: bold; font-size: 11px;">Prix unitaire</th>
              <th style="color: #1B4B8C; padding: 10px 8px; text-align: right; font-weight: bold; font-size: 11px;">TVA %</th>
              <th style="color: #1B4B8C; padding: 10px 8px; text-align: right; font-weight: bold; font-size: 11px;">Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${devisData.articles.map((item, index) => `
              <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#FAFBFC'};">
                <td style="padding: 8px; border-bottom: 1px solid #E9ECEF; font-size: 10px; line-height: 1.3; color: #374151;">${item.designation}</td>
                <td style="padding: 8px; border-bottom: 1px solid #E9ECEF; text-align: right; font-weight: bold; font-size: 10px; color: #374151;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #E9ECEF; text-align: right; font-weight: bold; font-size: 10px; color: #374151;">${formatCurrency(item.unitPrice, devisData.devise)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #E9ECEF; text-align: right; font-weight: bold; font-size: 10px; color: #374151;">${item.vatRate}%</td>
                <td style="padding: 8px; border-bottom: 1px solid #E9ECEF; text-align: right; font-weight: bold; font-size: 10px; color: #1B4B8C;">${formatCurrency(item.quantity * item.unitPrice, devisData.devise)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totaux -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 25px;">
        <table style="width: 280px; background: #F8F9FA; border: 2px solid #1B4B8C; border-radius: 6px; overflow: hidden;">
          <tr>
            <td style="padding: 8px 15px; border-bottom: 1px solid #E9ECEF; font-size: 12px; color: #6C757D;">Sous-total HT:</td>
            <td style="padding: 8px 15px; border-bottom: 1px solid #E9ECEF; text-align: right; font-size: 12px; font-weight: bold; color: #1B4B8C;">${formatCurrency(devisData.sousTotal, devisData.devise)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 15px; border-bottom: 1px solid #E9ECEF; font-size: 12px; color: #6C757D;">Total TVA:</td>
            <td style="padding: 8px 15px; border-bottom: 1px solid #E9ECEF; text-align: right; font-size: 12px; font-weight: bold; color: #1B4B8C;">${formatCurrency(devisData.totalTVA, devisData.devise)}</td>
          </tr>
          <tr style="background: #1B4B8C;">
            <td style="padding: 12px 15px; font-size: 16px; font-weight: bold; color: white;">TOTAL TTC:</td>
            <td style="padding: 12px 15px; text-align: right; font-size: 16px; font-weight: bold; color: white;">${formatCurrency(devisData.totalTTC, devisData.devise)}</td>
          </tr>
        </table>
      </div>

      ${devisData.notes ? `
        <div style="margin-bottom: 25px; background: #F8F9FA; border-radius: 6px; border: 1px solid #E9ECEF; padding: 15px;">
          <h4 style="font-weight: bold; color: #1B4B8C; margin-bottom: 8px; font-size: 12px;">Notes et conditions:</h4>
          <div style="white-space: pre-line; color: #6C757D; font-size: 11px; line-height: 1.2;">${devisData.notes}</div>
        </div>
      ` : ''}

      ${signatureHTML}

      <div style="margin-top: 40px; text-align: center; color: #6C757D; font-size: 12px; border-top: 1px solid #E9ECEF; padding-top: 20px;">
        <div>Devis généré le ${formatDate(new Date().toISOString().split('T')[0])}</div>
        <div style="margin-top: 3px;">Solvix - Génération de devis professionnels</div>
      </div>
    </div>
  `;
};

const generateArtisanTemplate = (devisData: DevisData): string => {
  const logoHTML = devisData.entreprise.logo 
    ? `<img src="${devisData.entreprise.logo}" alt="Logo" style="max-height: 50px; width: auto; margin-bottom: 10px;" />`
    : '';

  const signatureHTML = devisData.entreprise.signature
    ? `
      <div style="margin-top: 40px; text-align: right;">
        <p style="margin-bottom: 10px; font-size: 12px; color: #6B8E23;">
          Fait le ${formatDate(new Date().toISOString().split('T')[0])}, ${devisData.entreprise.name}
        </p>
        <img src="${devisData.entreprise.signature}" alt="Signature" style="max-height: 60px; max-width: 200px;" />
      </div>
    `
    : '';

  return `
    <div style="font-family: 'Georgia', serif; font-size: 14px; line-height: 1.5; color: #3C2415; background: #FEFCF8; border: 8px solid #8B4513; border-radius: 15px; padding: 30px; position: relative;">
      <!-- Bordure décorative -->
      <div style="position: absolute; top: 15px; left: 15px; right: 15px; bottom: 15px; border: 2px solid #D2B48C; border-radius: 8px; pointer-events: none;"></div>
      
      <!-- Contenu avec marge -->
      <div style="margin: 25px; position: relative; z-index: 1;">
        <!-- Header Artisan -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 3px double #8B4513; padding-bottom: 15px;">
          <div>
            ${logoHTML}
            <h1 style="font-size: 22px; font-weight: bold; color: #8B4513; margin: 0 0 8px 0; text-shadow: 1px 1px 2px rgba(139, 69, 19, 0.3);">${devisData.entreprise.name}</h1>
            <div style="font-size: 11px; color: #8B4513; line-height: 1.4; font-style: italic;">
              ${devisData.entreprise.address.replace(/\n/g, '<br>')}
            </div>
            <div style="color: #8B4513; font-size: 11px; margin-top: 3px;">
              ${devisData.entreprise.phone} | ${devisData.entreprise.email}
            </div>
          </div>
          
          <div style="text-align: right;">
            <h2 style="font-size: 28px; font-weight: normal; color: #8B4513; margin: 0 0 8px 0; letter-spacing: 3px;">DEVIS</h2>
            <div style="font-size: 16px; color: #6B8E23; font-weight: bold; margin-bottom: 12px;">${devisData.numeroDevis}</div>
            <div style="color: #8B4513; font-size: 11px;">
              <div>Date: ${formatDate(devisData.dateCreation)}</div>
              <div>Valide jusqu'au: ${formatDate(devisData.dateExpiration)}</div>
            </div>
          </div>
        </div>

        <!-- Client -->
        <div style="margin-bottom: 25px; background: #F5F5DC; border-left: 4px solid #8B4513; border-radius: 0 6px 6px 0; padding: 15px;">
          <h3 style="font-weight: bold; color: #8B4513; margin: 0 0 10px 0; font-size: 14px; font-style: italic;">Facturé à:</h3>
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px; color: #8B4513;">${devisData.client.name}</div>
          ${devisData.client.company ? `<div style="font-size: 12px; margin-bottom: 5px; color: #6B8E23; font-style: italic;">${devisData.client.company}</div>` : ''}
          ${devisData.client.email ? `<div style="font-size: 11px; color: #666; margin-bottom: 3px;">${devisData.client.email}</div>` : ''}
          ${devisData.client.phone ? `<div style="font-size: 11px; color: #666; margin-bottom: 3px;">${devisData.client.phone}</div>` : ''}
          ${devisData.client.address ? `<div style="font-size: 11px; color: #666;">${devisData.client.address.replace(/\n/g, '<br>')}</div>` : ''}
        </div>

        <!-- Tableau -->
        <div style="margin-bottom: 25px;">
          <h3 style="font-weight: bold; color: #8B4513; margin-bottom: 12px; font-size: 14px;">🔨 Détail des Travaux Artisanaux:</h3>
          
          <table style="width: 100%; border-collapse: collapse; border: 3px solid #8B4513; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 8px rgba(139, 69, 19, 0.2);">
            <thead>
              <tr style="background: #DEB887;">
                <th style="padding: 10px 8px; text-align: left; font-weight: bold; font-size: 11px; color: #8B4513;">Description des Travaux</th>
                <th style="padding: 10px 8px; text-align: right; font-weight: bold; font-size: 11px; color: #8B4513;">Qté</th>
                <th style="padding: 10px 8px; text-align: right; font-weight: bold; font-size: 11px; color: #8B4513;">Prix Unit.</th>
                <th style="padding: 10px 8px; text-align: right; font-weight: bold; font-size: 11px; color: #8B4513;">TVA %</th>
                <th style="padding: 10px 8px; text-align: right; font-weight: bold; font-size: 11px; color: #8B4513;">Total HT</th>
              </tr>
            </thead>
            <tbody>
              ${devisData.articles.map((item, index) => `
                <tr style="background: ${index % 2 === 0 ? '#FEFCF8' : '#F5F5DC'}; border-left: 4px solid ${index % 2 === 0 ? '#8B4513' : '#6B8E23'};">
                  <td style="padding: 8px; font-size: 10px; line-height: 1.3; color: #3C2415; border-bottom: 1px solid #D2B48C;">${item.designation}</td>
                  <td style="padding: 8px; text-align: right; font-weight: bold; color: #8B4513; border-bottom: 1px solid #D2B48C; font-size: 10px;">${item.quantity}</td>
                  <td style="padding: 8px; text-align: right; font-weight: bold; color: #3C2415; border-bottom: 1px solid #D2B48C; font-size: 10px;">${formatCurrency(item.unitPrice, devisData.devise)}</td>
                  <td style="padding: 8px; text-align: right; font-weight: bold; color: #6B8E23; border-bottom: 1px solid #D2B48C; font-size: 10px;">${item.vatRate}%</td>
                  <td style="padding: 8px; text-align: right; font-weight: bold; color: #8B4513; font-size: 10px; border-bottom: 1px solid #D2B48C;">${formatCurrency(item.quantity * item.unitPrice, devisData.devise)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Totaux -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 25px;">
          <table style="width: 280px; background: #F5F5DC; border: 3px solid #8B4513; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 8px rgba(139, 69, 19, 0.2);">
            <tr>
              <td style="padding: 8px 15px; border-bottom: 2px solid #D2B48C; font-size: 12px; color: #6B8E23; font-weight: bold;">Sous-total HT:</td>
              <td style="padding: 8px 15px; border-bottom: 2px solid #D2B48C; text-align: right; font-size: 12px; font-weight: bold; color: #3C2415;">${formatCurrency(devisData.sousTotal, devisData.devise)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 15px; border-bottom: 2px solid #D2B48C; font-size: 12px; color: #6B8E23; font-weight: bold;">Total TVA:</td>
              <td style="padding: 8px 15px; border-bottom: 2px solid #D2B48C; text-align: right; font-size: 12px; font-weight: bold; color: #3C2415;">${formatCurrency(devisData.totalTVA, devisData.devise)}</td>
            </tr>
            <tr style="background: #8B4513;">
              <td style="padding: 12px 15px; font-size: 16px; font-weight: bold; color: #F5F5DC;">TOTAL TTC:</td>
              <td style="padding: 12px 15px; text-align: right; font-size: 16px; font-weight: bold; color: #F5F5DC;">${formatCurrency(devisData.totalTTC, devisData.devise)}</td>
            </tr>
          </table>
        </div>

        ${devisData.notes ? `
          <div style="margin-bottom: 25px; background: #F5F5DC; border-radius: 6px; border: 2px solid #D2B48C; padding: 15px;">
            <h4 style="font-weight: bold; color: #8B4513; margin-bottom: 8px; font-size: 12px; font-style: italic;">📜 Conditions Artisanales:</h4>
            <div style="white-space: pre-line; color: #3C2415; font-size: 11px; line-height: 1.2; font-style: italic;">${devisData.notes}</div>
          </div>
        ` : ''}

        ${signatureHTML}

        <div style="margin-top: 40px; text-align: center; color: #6B8E23; font-size: 12px; border-top: 3px double #8B4513; padding-top: 20px;">
          <div>Devis généré le ${formatDate(new Date().toISOString().split('T')[0])}</div>
          <div style="margin-top: 3px;">Solvix - Génération de devis professionnels</div>
        </div>
      </div>
    </div>
  `;
};

const generateElegantTemplate = (devisData: DevisData): string => {
  const logoHTML = devisData.entreprise.logo 
    ? `<img src="${devisData.entreprise.logo}" alt="Logo" style="max-height: 50px; width: auto;" />`
    : '';

  const signatureHTML = devisData.entreprise.signature
    ? `
      <div style="margin-top: 40px; text-align: right;">
        <p style="margin-bottom: 10px; font-size: 12px; color: #8A6D3B; font-style: italic;">
          Fait le ${formatDate(new Date().toISOString().split('T')[0])}, ${devisData.entreprise.name}
        </p>
        <img src="${devisData.entreprise.signature}" alt="Signature" style="max-height: 60px; max-width: 200px;" />
      </div>
    `
    : '';

  return `
    <div style="font-family: 'Garamond', serif; font-size: 14px; line-height: 1.5; color: #333333; background: #FFFCF7; border: 1px solid #E8E0D0; padding: 30px;">
      <!-- Header Élégant -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 3px solid #D4B78F; padding-bottom: 15px;">
        <div style="display: flex; align-items: flex-start; gap: 20px;">
          ${logoHTML}
          <div>
            <h1 style="font-size: 22px; font-weight: bold; color: #8A6D3B; margin: 0 0 8px 0;">${devisData.entreprise.name}</h1>
            <div style="color: #8A6D3B; font-size: 11px; line-height: 1.4; font-style: italic;">
              ${devisData.entreprise.address.replace(/\n/g, '<br>')}
            </div>
            <div style="color: #8A6D3B; font-size: 11px; margin-top: 3px;">
              ${devisData.entreprise.phone} | ${devisData.entreprise.email}
            </div>
          </div>
        </div>
        
        <div style="text-align: right;">
          <h2 style="font-size: 28px; font-weight: normal; color: #8A6D3B; margin: 0 0 8px 0; letter-spacing: 2px;">DEVIS</h2>
          <div style="font-size: 16px; color: #8A6D3B; font-style: italic; margin-bottom: 12px;">${devisData.numeroDevis}</div>
          <div style="font-size: 11px; color: #8A6D3B;">
            <div>Date: ${formatDate(devisData.dateCreation)}</div>
            <div>Valide jusqu'au: ${formatDate(devisData.dateExpiration)}</div>
          </div>
        </div>
      </div>

      <!-- Client -->
      <div style="margin-bottom: 25px; background: #F9F5ED; border: 1px solid #E8E0D0; border-radius: 0 6px 6px 0; padding: 15px;">
        <h3 style="font-weight: bold; color: #8A6D3B; margin: 0 0 10px 0; font-size: 14px; font-style: italic;">À l'attention de:</h3>
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px; color: #8A6D3B;">${devisData.client.name}</div>
        ${devisData.client.company ? `<div style="font-size: 12px; margin-bottom: 5px; color: #8A6D3B; font-style: italic;">${devisData.client.company}</div>` : ''}
        ${devisData.client.email ? `<div style="font-size: 11px; color: #666; margin-bottom: 3px;">${devisData.client.email}</div>` : ''}
        ${devisData.client.phone ? `<div style="font-size: 11px; color: #666; margin-bottom: 3px;">${devisData.client.phone}</div>` : ''}
        ${devisData.client.address ? `<div style="font-size: 11px; color: #666;">${devisData.client.address.replace(/\n/g, '<br>')}</div>` : ''}
      </div>

      <!-- Tableau -->
      <div style="margin-bottom: 25px;">
        <h3 style="font-weight: bold; color: #8A6D3B; margin-bottom: 12px; font-size: 14px; text-align: center; font-style: italic;">Détail des prestations:</h3>
        
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #E8E0D0; border-radius: 6px; overflow: hidden;">
          <thead>
            <tr style="background: #F9F5ED;">
              <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #D4B78F; color: #8A6D3B; font-weight: normal; font-size: 11px; font-style: italic;">Description</th>
              <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #D4B78F; color: #8A6D3B; font-weight: normal; font-size: 11px; font-style: italic;">Qté</th>
              <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #D4B78F; color: #8A6D3B; font-weight: normal; font-size: 11px; font-style: italic;">Prix unitaire</th>
              <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #D4B78F; color: #8A6D3B; font-weight: normal; font-size: 11px; font-style: italic;">TVA %</th>
              <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #D4B78F; color: #8A6D3B; font-weight: normal; font-size: 11px; font-style: italic;">Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${devisData.articles.map((item, index) => `
              <tr style="background: ${index % 2 === 0 ? '#FFFCF7' : '#F9F5ED'}; border-bottom: 1px solid #E8E0D0;">
                <td style="padding: 8px; font-size: 10px; line-height: 1.3; color: #333;">${item.designation}</td>
                <td style="padding: 8px; text-align: right; font-size: 10px; color: #333;">${item.quantity}</td>
                <td style="padding: 8px; text-align: right; font-size: 10px; color: #333;">${formatCurrency(item.unitPrice, devisData.devise)}</td>
                <td style="padding: 8px; text-align: right; font-size: 10px; color: #333;">${item.vatRate}%</td>
                <td style="padding: 8px; text-align: right; font-size: 10px; font-weight: bold; color: #8A6D3B;">${formatCurrency(item.quantity * item.unitPrice, devisData.devise)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totaux -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 25px;">
        <table style="width: 280px; border-collapse: collapse; border: 1px solid #E8E0D0; border-radius: 6px; overflow: hidden;">
          <tr style="background: #F9F5ED;">
            <td style="padding: 8px 15px; font-size: 12px; color: #8A6D3B; font-style: italic;">Sous-total HT:</td>
            <td style="padding: 8px 15px; text-align: right; font-size: 12px; font-weight: bold; color: #333;">${formatCurrency(devisData.sousTotal, devisData.devise)}</td>
          </tr>
          <tr style="background: #F9F5ED;">
            <td style="padding: 8px 15px; font-size: 12px; color: #8A6D3B; font-style: italic; border-top: 1px solid #E8E0D0;">Total TVA:</td>
            <td style="padding: 8px 15px; text-align: right; font-size: 12px; font-weight: bold; color: #333; border-top: 1px solid #E8E0D0;">${formatCurrency(devisData.totalTVA, devisData.devise)}</td>
          </tr>
          <tr style="background: #8A6D3B;">
            <td style="padding: 12px 15px; font-size: 16px; color: #FFFCF7;">TOTAL TTC:</td>
            <td style="padding: 12px 15px; text-align: right; font-size: 16px; font-weight: bold; color: #FFFCF7;">${formatCurrency(devisData.totalTTC, devisData.devise)}</td>
          </tr>
        </table>
      </div>

      ${devisData.notes ? `
        <div style="margin-bottom: 25px; background: #F9F5ED; border-radius: 6px; border: 1px solid #E8E0D0; padding: 15px;">
          <h4 style="font-weight: bold; color: #8A6D3B; margin-bottom: 8px; font-size: 12px; font-style: italic;">Conditions & Notes:</h4>
          <div style="white-space: pre-line; color: #333; font-size: 11px; line-height: 1.2;">${devisData.notes}</div>
        </div>
      ` : ''}

      ${signatureHTML}

      <div style="margin-top: 40px; text-align: center; color: #8A6D3B; font-size: 12px; border-top: 1px solid #E8E0D0; padding-top: 20px; font-style: italic;">
        <div>Devis généré le ${formatDate(new Date().toISOString().split('T')[0])}</div>
        <div style="margin-top: 3px;">Solvix - Génération de devis professionnels</div>
      </div>
    </div>
  `;
};

const generateProfessionnelTemplate = (devisData: DevisData): string => {
  const logoHTML = devisData.entreprise.logo 
    ? `<img src="${devisData.entreprise.logo}" alt="Logo" style="max-height: 50px; width: auto; margin-bottom: 10px;" />`
    : '';

  const signatureHTML = devisData.entreprise.signature
    ? `
      <div style="margin-top: 40px; text-align: right;">
        <p style="margin-bottom: 10px; font-size: 12px; color: #7F8C8D;">
          Fait le ${formatDate(new Date().toISOString().split('T')[0])}, ${devisData.entreprise.name}
        </p>
        <img src="${devisData.entreprise.signature}" alt="Signature" style="max-height: 60px; max-width: 200px;" />
      </div>
    `
    : '';

  return `
    <div style="font-family: 'Helvetica', Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #333333; background: white; position: relative;">
      <!-- Bande colorée en haut -->
      <div style="position: absolute; top: 0; left: 0; right: 0; height: 15px; background: #2C3E50;"></div>
      
      <!-- Header Professionnel -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; padding-top: 20px; border-bottom: 3px solid #2C3E50; padding-bottom: 15px;">
        <div>
          ${logoHTML}
          <h1 style="font-size: 22px; font-weight: bold; color: #2C3E50; margin: 0 0 8px 0;">${devisData.entreprise.name}</h1>
          <div style="color: #7F8C8D; font-size: 11px; line-height: 1.4;">
            ${devisData.entreprise.address.replace(/\n/g, '<br>')}
          </div>
          <div style="color: #7F8C8D; font-size: 11px; margin-top: 3px;">
            ${devisData.entreprise.phone} | ${devisData.entreprise.email}
          </div>
        </div>
        
        <div style="text-align: right; background: #F8F9FA; padding: 15px; border-radius: 5px; border: 1px solid #E9ECEF;">
          <h2 style="font-size: 28px; font-weight: bold; color: #2C3E50; margin: 0 0 8px 0;">DEVIS</h2>
          <div style="font-size: 16px; color: #3498DB; font-weight: bold; margin-bottom: 12px;">${devisData.numeroDevis}</div>
          <div style="font-size: 11px; color: #7F8C8D;">
            <div>Date: ${formatDate(devisData.dateCreation)}</div>
            <div>Valide jusqu'au: ${formatDate(devisData.dateExpiration)}</div>
          </div>
        </div>
      </div>

      <!-- Client -->
      <div style="margin-bottom: 25px; background: #F8F9FA; border-left: 4px solid #3498DB; border-radius: 0 6px 6px 0; padding: 15px;">
        <h3 style="font-weight: bold; color: #2C3E50; margin: 0 0 10px 0; font-size: 14px;">Facturé à:</h3>
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px; color: #2C3E50;">${devisData.client.name}</div>
        ${devisData.client.company ? `<div style="font-size: 12px; margin-bottom: 5px; color: #3498DB;">${devisData.client.company}</div>` : ''}
        ${devisData.client.email ? `<div style="font-size: 11px; color: #7F8C8D; margin-bottom: 3px;">${devisData.client.email}</div>` : ''}
        ${devisData.client.phone ? `<div style="font-size: 11px; color: #7F8C8D; margin-bottom: 3px;">${devisData.client.phone}</div>` : ''}
        ${devisData.client.address ? `<div style="font-size: 11px; color: #7F8C8D;">${devisData.client.address.replace(/\n/g, '<br>')}</div>` : ''}
      </div>

      <!-- Tableau -->
      <div style="margin-bottom: 25px;">
        <h3 style="font-weight: bold; color: #2C3E50; margin-bottom: 12px; font-size: 14px;">DÉTAIL DES PRESTATIONS:</h3>
        
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #E9ECEF; border-radius: 6px; overflow: hidden;">
          <thead>
            <tr style="background: #F8F9FA;">
              <th style="color: #2C3E50; padding: 10px 8px; text-align: left; border-bottom: 2px solid #3498DB; font-weight: bold; font-size: 11px;">DESCRIPTION</th>
              <th style="color: #2C3E50; padding: 10px 8px; text-align: right; border-bottom: 2px solid #3498DB; font-weight: bold; font-size: 11px;">QTÉ</th>
              <th style="color: #2C3E50; padding: 10px 8px; text-align: right; border-bottom: 2px solid #3498DB; font-weight: bold; font-size: 11px;">PRIX UNIT.</th>
              <th style="color: #2C3E50; padding: 10px 8px; text-align: right; border-bottom: 2px solid #3498DB; font-weight: bold; font-size: 11px;">TVA %</th>
              <th style="color: #2C3E50; padding: 10px 8px; text-align: right; border-bottom: 2px solid #3498DB; font-weight: bold; font-size: 11px;">TOTAL HT</th>
            </tr>
          </thead>
          <tbody>
            ${devisData.articles.map((item, index) => `
              <tr style="background: ${index % 2 === 0 ? 'white' : '#F8F9FA'}; border-bottom: 1px solid #E9ECEF;">
                <td style="padding: 8px; font-size: 10px; line-height: 1.3; color: #2C3E50;">${item.designation}</td>
                <td style="padding: 8px; text-align: right; font-size: 10px; color: #2C3E50;">${item.quantity}</td>
                <td style="padding: 8px; text-align: right; font-size: 10px; color: #2C3E50;">${formatCurrency(item.unitPrice, devisData.devise)}</td>
                <td style="padding: 8px; text-align: right; font-size: 10px; color: #2C3E50;">${item.vatRate}%</td>
                <td style="padding: 8px; text-align: right; font-size: 10px; font-weight: bold; color: #3498DB;">${formatCurrency(item.quantity * item.unitPrice, devisData.devise)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totaux -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 25px;">
        <table style="width: 280px; border-collapse: collapse; border: 1px solid #E9ECEF; border-radius: 6px; overflow: hidden;">
          <tr>
            <td style="padding: 8px 15px; background: #F8F9FA; color: #7F8C8D; font-size: 12px; font-weight: bold;">SOUS-TOTAL HT:</td>
            <td style="padding: 8px 15px; background: #F8F9FA; text-align: right; font-size: 12px; font-weight: bold; color: #2C3E50;">${formatCurrency(devisData.sousTotal, devisData.devise)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 15px; background: #F8F9FA; color: #7F8C8D; font-size: 12px; font-weight: bold; border-top: 1px solid #E9ECEF;">TOTAL TVA:</td>
            <td style="padding: 8px 15px; background: #F8F9FA; text-align: right; font-size: 12px; font-weight: bold; color: #2C3E50; border-top: 1px solid #E9ECEF;">${formatCurrency(devisData.totalTVA, devisData.devise)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 15px; background: #2C3E50; color: white; font-size: 16px; font-weight: bold;">TOTAL TTC:</td>
            <td style="padding: 12px 15px; background: #2C3E50; text-align: right; font-size: 16px; font-weight: bold; color: white;">${formatCurrency(devisData.totalTTC, devisData.devise)}</td>
          </tr>
        </table>
      </div>

      ${devisData.notes ? `
        <div style="margin-bottom: 25px; background: #F8F9FA; border-radius: 6px; border: 1px solid #E9ECEF; padding: 15px;">
          <h4 style="font-weight: bold; color: #2C3E50; margin-bottom: 8px; font-size: 12px;">CONDITIONS & NOTES:</h4>
          <div style="white-space: pre-line; color: #7F8C8D; font-size: 11px; line-height: 1.2;">${devisData.notes}</div>
        </div>
      ` : ''}

      ${signatureHTML}

      <div style="margin-top: 40px; text-align: center; color: #7F8C8D; font-size: 12px; border-top: 1px solid #E9ECEF; padding-top: 20px;">
        <div>Devis généré le ${formatDate(new Date().toISOString().split('T')[0])}</div>
        <div style="margin-top: 3px;">Solvix - Génération de devis professionnels</div>
      </div>

      <!-- Bande colorée en bas -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 15px; background: #3498DB;"></div>
    </div>
  `;
};

const generateMinimalisteTemplate = (devisData: DevisData): string => {
  const logoHTML = devisData.entreprise.logo 
    ? `<img src="${devisData.entreprise.logo}" alt="Logo" style="max-height: 50px; width: auto; margin-bottom: 10px;" />`
    : '';

  const signatureHTML = devisData.entreprise.signature
    ? `
      <div style="margin-top: 40px; text-align: right;">
        <p style="margin-bottom: 10px; font-size: 12px; color: #888; font-style: italic;">
          Fait le ${formatDate(new Date().toISOString().split('T')[0])}, ${devisData.entreprise.name}
        </p>
        <img src="${devisData.entreprise.signature}" alt="Signature" style="max-height: 60px; max-width: 200px;" />
      </div>
    `
    : '';

  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #333333; background: white; padding: 30px;">
      <!-- Header Ultra Minimaliste -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 3px solid #eee; padding-bottom: 15px;">
        <div>
          ${logoHTML}
          <h1 style="font-size: 22px; font-weight: 500; color: #333; margin: 0 0 8px 0; letter-spacing: 0.5px;">${devisData.entreprise.name}</h1>
          <div style="color: #888; font-size: 11px; line-height: 1.4;">
            ${devisData.entreprise.address.replace(/\n/g, '<br>')}
          </div>
          <div style="color: #888; font-size: 11px; margin-top: 3px;">
            ${devisData.entreprise.phone} | ${devisData.entreprise.email}
          </div>
        </div>
        
        <div style="text-align: right;">
          <h2 style="font-size: 28px; font-weight: 300; color: #333; margin: 0 0 8px 0; letter-spacing: 1px;">DEVIS</h2>
          <div style="font-size: 16px; color: #888; margin-bottom: 12px;">${devisData.numeroDevis}</div>
          <div style="font-size: 11px; color: #888;">
            <div>Date: ${formatDate(devisData.dateCreation)}</div>
            <div>Valide jusqu'au: ${formatDate(devisData.dateExpiration)}</div>
          </div>
        </div>
      </div>

      <!-- Client -->
      <div style="margin-bottom: 25px; background: #f9f9f9; border-left: 4px solid #eee; border-radius: 0 6px 6px 0; padding: 15px;">
        <h3 style="font-weight: bold; color: #888; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Client:</h3>
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px; color: #333;">${devisData.client.name}</div>
        ${devisData.client.company ? `<div style="font-size: 12px; margin-bottom: 5px; color: #555;">${devisData.client.company}</div>` : ''}
        ${devisData.client.email ? `<div style="font-size: 11px; color: #888; margin-bottom: 3px;">${devisData.client.email}</div>` : ''}
        ${devisData.client.phone ? `<div style="font-size: 11px; color: #888; margin-bottom: 3px;">${devisData.client.phone}</div>` : ''}
        ${devisData.client.address ? `<div style="font-size: 11px; color: #888;">${devisData.client.address.replace(/\n/g, '<br>')}</div>` : ''}
      </div>

      <!-- Tableau -->
      <div style="margin-bottom: 25px;">
        <h3 style="font-weight: bold; color: #333; margin-bottom: 12px; font-size: 14px;">Prestations:</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #eee; color: #888; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Description</th>
              <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #eee; color: #888; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Qté</th>
              <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #eee; color: #888; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Prix</th>
              <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #eee; color: #888; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">TVA</th>
              <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #eee; color: #888; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${devisData.articles.map((item, index) => `
              <tr>
                <td style="padding: 8px; font-size: 10px; line-height: 1.3; color: #333; border-bottom: 1px solid #f5f5f5;">${item.designation}</td>
                <td style="padding: 8px; text-align: right; font-size: 10px; color: #333; border-bottom: 1px solid #f5f5f5;">${item.quantity}</td>
                <td style="padding: 8px; text-align: right; font-size: 10px; color: #333; border-bottom: 1px solid #f5f5f5;">${formatCurrency(item.unitPrice, devisData.devise)}</td>
                <td style="padding: 8px; text-align: right; font-size: 10px; color: #333; border-bottom: 1px solid #f5f5f5;">${item.vatRate}%</td>
                <td style="padding: 8px; text-align: right; font-size: 10px; font-weight: 500; color: #333; border-bottom: 1px solid #f5f5f5;">${formatCurrency(item.quantity * item.unitPrice, devisData.devise)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totaux -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 25px;">
        <table style="width: 280px;">
          <tr>
            <td style="padding: 8px 15px; border-bottom: 1px solid #f5f5f5; font-size: 12px; color: #888;">Sous-total HT:</td>
            <td style="padding: 8px 15px; border-bottom: 1px solid #f5f5f5; text-align: right; font-size: 12px; color: #333;">${formatCurrency(devisData.sousTotal, devisData.devise)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 15px; border-bottom: 1px solid #f5f5f5; font-size: 12px; color: #888;">TVA:</td>
            <td style="padding: 8px 15px; border-bottom: 1px solid #f5f5f5; text-align: right; font-size: 12px; color: #333;">${formatCurrency(devisData.totalTVA, devisData.devise)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 15px; font-size: 16px; font-weight: 500; color: #333; border-top: 2px solid #333;">TOTAL TTC:</td>
            <td style="padding: 12px 15px; text-align: right; font-size: 16px; font-weight: 500; color: #333; border-top: 2px solid #333;">${formatCurrency(devisData.totalTTC, devisData.devise)}</td>
          </tr>
        </table>
      </div>

      ${devisData.notes ? `
        <div style="margin-bottom: 25px; background: #f9f9f9; border-radius: 6px; border-left: 2px solid #eee; padding: 15px;">
          <h4 style="font-weight: bold; color: #888; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Notes:</h4>
          <div style="white-space: pre-line; color: #555; font-size: 11px; line-height: 1.2;">${devisData.notes}</div>
        </div>
      ` : ''}

      ${signatureHTML}

      <div style="margin-top: 40px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
        <div>Devis généré le ${formatDate(new Date().toISOString().split('T')[0])}</div>
        <div style="margin-top: 3px;">Solvix - Génération de devis professionnels</div>
      </div>
    </div>
  `;
};

const generateModernTemplate = (devisData: DevisData): string => {
  const logoHTML = devisData.entreprise.logo 
    ? `<img src="${devisData.entreprise.logo}" alt="Logo" style="max-height: 50px; width: auto; filter: brightness(0) invert(1);" />`
    : '';

  const signatureHTML = devisData.entreprise.signature
    ? `
      <div style="margin-top: 40px; text-align: right;">
        <p style="margin-bottom: 10px; font-size: 12px; color: #64748b;">
          Fait le ${formatDate(new Date().toISOString().split('T')[0])}, ${devisData.entreprise.name}
        </p>
        <img src="${devisData.entreprise.signature}" alt="Signature" style="max-height: 60px; max-width: 200px;" />
      </div>
    `
    : '';

  return `
    <div style="font-family: 'Poppins', sans-serif; font-size: 14px; line-height: 1.5; color: #1e293b;">
      <!-- Header avec gradient -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; margin: -40px -40px 30px -40px; border-radius: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 20px;">
            ${logoHTML ? `<div style="background: rgba(255, 255, 255, 0.15); padding: 10px; border-radius: 12px; backdrop-filter: blur(10px);">${logoHTML}</div>` : ''}
            <div>
              <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px 0;">${devisData.entreprise.name}</h1>
              <div style="font-size: 11px; opacity: 0.9; line-height: 1.3;">
                ${devisData.entreprise.address.replace(/\n/g, '<br>')}
              </div>
              <div style="font-size: 11px; opacity: 0.9; margin-top: 3px;">
                ${devisData.entreprise.phone} | ${devisData.entreprise.email}
              </div>
            </div>
          </div>
          
          <div style="text-align: right;">
            <h2 style="font-size: 28px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: 2px;">DEVIS</h2>
            <div style="background: rgba(255, 255, 255, 0.2); padding: 8px 15px; border-radius: 20px; font-size: 16px; font-weight: 600; backdrop-filter: blur(10px);">${devisData.numeroDevis}</div>
          </div>
        </div>
      </div>

      <!-- Date et Client -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
          <div style="font-size: 12px; color: #64748b; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Date de création</div>
          <div style="font-size: 16px; font-weight: 600; color: #1e293b;">${formatDate(devisData.dateCreation)}</div>
        </div>
        <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
          <div style="font-size: 12px; color: #64748b; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Date d'expiration</div>
          <div style="font-size: 16px; font-weight: 600; color: #1e293b;">${formatDate(devisData.dateExpiration)}</div>
        </div>
      </div>

      <!-- Client -->
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 16px; font-weight: 600; color: #667eea; margin: 0 0 15px 0; padding-bottom: 5px; border-bottom: 2px solid #667eea;">Client</h3>
        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
          <div style="font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 5px;">${devisData.client.name}</div>
          ${devisData.client.company ? `<div style="font-size: 14px; color: #667eea; margin-bottom: 8px;">${devisData.client.company}</div>` : ''}
          <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">
            ${devisData.client.email ? `<span>${devisData.client.email}</span>` : ''}
            ${devisData.client.phone ? `<span> | ${devisData.client.phone}</span>` : ''}
          </div>
          ${devisData.client.address ? `<div style="font-size: 12px; color: #64748b;">${devisData.client.address.replace(/\n/g, '<br>')}</div>` : ''}
        </div>
      </div>

      <!-- Tableau -->
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 16px; font-weight: 600; color: #667eea; margin: 0 0 15px 0; padding-bottom: 5px; border-bottom: 2px solid #667eea;">Prestations</h3>
        
        <table style="width: 100%; border-collapse: collapse; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #667eea; color: white;">
              <th style="padding: 15px 12px; text-align: left; font-weight: 600; font-size: 12px;">Description</th>
              <th style="padding: 15px 12px; text-align: right; font-weight: 600; font-size: 12px;">Qté</th>
              <th style="padding: 15px 12px; text-align: right; font-weight: 600; font-size: 12px;">Prix unitaire</th>
              <th style="padding: 15px 12px; text-align: right; font-weight: 600; font-size: 12px;">TVA</th>
              <th style="padding: 15px 12px; text-align: right; font-weight: 600; font-size: 12px;">Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${devisData.articles.map((item, index) => `
              <tr style="background: ${index % 2 === 0 ? '#f8f9ff' : 'white'};">
                <td style="padding: 12px; font-size: 12px; border-bottom: 1px solid #e0e0e0;">${item.designation}</td>
                <td style="padding: 12px; text-align: right; font-weight: 600; font-size: 12px; border-bottom: 1px solid #e0e0e0;">${item.quantity}</td>
                <td style="padding: 12px; text-align: right; font-weight: 600; font-size: 12px; border-bottom: 1px solid #e0e0e0;">${formatCurrency(item.unitPrice, devisData.devise)}</td>
                <td style="padding: 12px; text-align: right; font-weight: 600; font-size: 12px; border-bottom: 1px solid #e0e0e0;">${item.vatRate}%</td>
                <td style="padding: 12px; text-align: right; font-weight: 600; font-size: 12px; border-bottom: 1px solid #e0e0e0;">${formatCurrency(item.quantity * item.unitPrice, devisData.devise)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totaux -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
        <div style="width: 350px; background: #f8f9ff; border: 2px solid #667eea; border-radius: 8px; padding: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; color: #64748b;">
            <span>Sous-total HT</span>
            <span>${formatCurrency(devisData.sousTotal, devisData.devise)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; color: #64748b;">
            <span>TVA</span>
            <span>${formatCurrency(devisData.totalTVA, devisData.devise)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; background: #667eea; color: white; margin: 15px -20px -20px -20px; padding: 15px 20px; border-radius: 0 0 6px 6px; font-size: 18px; font-weight: bold;">
            <span>TOTAL TTC</span>
            <span>${formatCurrency(devisData.totalTTC, devisData.devise)}</span>
          </div>
        </div>
      </div>

      ${devisData.notes ? `
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 16px; font-weight: 600; color: #667eea; margin: 0 0 15px 0; padding-bottom: 5px; border-bottom: 2px solid #667eea;">Notes</h3>
          <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; white-space: pre-line; font-size: 12px; color: #64748b;">${devisData.notes}</div>
        </div>
      ` : ''}

      ${signatureHTML}

      <div style="margin-top: 40px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <div>Généré le ${formatDate(new Date().toISOString().split('T')[0])} avec Solvix</div>
      </div>
    </div>
  `;
};

const generateMinimalTemplate = (devisData: DevisData): string => {
  const logoHTML = devisData.entreprise.logo 
    ? `<img src="${devisData.entreprise.logo}" alt="Logo" style="max-height: 40px; width: auto; margin-bottom: 10px;" />`
    : '';

  const signatureHTML = devisData.entreprise.signature
    ? `
      <div style="margin-top: 40px; text-align: right;">
        <p style="margin-bottom: 10px; font-size: 12px; color: #888;">
          ${formatDate(new Date().toISOString().split('T')[0])}
        </p>
        <img src="${devisData.entreprise.signature}" alt="Signature" style="max-height: 60px; max-width: 200px;" />
      </div>
    `
    : '';

  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #333333; background: white; padding: 30px;">
      <!-- Header Minimal -->
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px;">
        ${logoHTML}
        <h1 style="font-size: 20px; font-weight: 300; color: #1e293b; margin: 0 0 5px 0;">${devisData.entreprise.name}</h1>
        <div style="font-size: 12px; color: #64748b;">${devisData.entreprise.email} | ${devisData.entreprise.phone}</div>
      </div>

      <!-- Quote Info -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="font-size: 28px; font-weight: 300; color: #1e293b; margin: 0 0 10px 0; letter-spacing: 1px;">DEVIS ${devisData.numeroDevis}</h2>
        <div style="font-size: 12px; color: #64748b;">${formatDate(devisData.dateCreation)} - Valide jusqu'au ${formatDate(devisData.dateExpiration)}</div>
      </div>

      <!-- Client -->
      <div style="margin-bottom: 30px;">
        <div style="font-weight: bold; color: #1e293b; margin-bottom: 5px;">Pour: ${devisData.client.name}</div>
        ${devisData.client.company ? `<div style="color: #64748b; margin-bottom: 5px;">(${devisData.client.company})</div>` : ''}
      </div>

      <!-- Items -->
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 14px; font-weight: normal; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 20px;">PRESTATIONS:</h3>
        
        ${devisData.articles.map((item, index) => `
          <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0;">
            <div style="font-size: 14px; color: #1e293b; margin-bottom: 5px;">${index + 1}. ${item.designation}</div>
            <div style="font-size: 12px; color: #64748b; margin-left: 20px;">${item.quantity} × ${formatCurrency(item.unitPrice, devisData.devise)} = ${formatCurrency(item.quantity * item.unitPrice, devisData.devise)}</div>
          </div>
        `).join('')}
      </div>

      <!-- Totaux -->
      <div style="margin: 30px 0; text-align: right; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">TOTAL HT: ${formatCurrency(devisData.sousTotal, devisData.devise)}</div>
        <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">TVA: ${formatCurrency(devisData.totalTVA, devisData.devise)}</div>
        <div style="font-size: 18px; font-weight: bold; color: #1e293b; border-top: 2px solid #1e293b; padding-top: 10px; margin-top: 10px;">TOTAL TTC: ${formatCurrency(devisData.totalTTC, devisData.devise)}</div>
      </div>

      ${devisData.notes ? `
        <div style="margin: 30px 0; padding: 20px 0; border-top: 1px solid #e5e7eb; font-size: 12px; color: #64748b; white-space: pre-line;">
          ${devisData.notes}
        </div>
      ` : ''}

      ${signatureHTML}

      <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        Solvix - ${formatDate(new Date().toISOString().split('T')[0])}
      </div>
    </div>
  `;
};