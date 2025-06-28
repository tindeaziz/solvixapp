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
    console.log('📄 PDF_GENERATOR - Début de génération pour devis:', devisData.numeroDevis);

    // Créer un élément temporaire avec le contenu du devis
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '0';
    element.style.width = '794px'; // Largeur A4 en pixels (210mm)
    element.style.backgroundColor = 'white';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.fontSize = '14px';
    element.style.lineHeight = '1.5';
    element.style.color = '#333';
    element.style.padding = '40px';
    element.style.boxSizing = 'border-box';

    // Générer le contenu HTML selon le template
    element.innerHTML = generateHTMLContent(devisData);

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
    const fileName = `devis-${devisData.numeroDevis}-${new Date().toISOString().split('T')[0]}.pdf`;
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

const generateHTMLContent = (devisData: DevisData): string => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

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
    <div style="width: 100%; max-width: 794px; margin: 0 auto; background: white; color: #333;">
      <!-- En-tête -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #1B4B8C; padding-bottom: 20px;">
        <div style="flex: 1;">
          ${logoHTML}
          <h1 style="font-size: 24px; font-weight: bold; color: #1B4B8C; margin: 0 0 10px 0;">${devisData.entreprise.name}</h1>
          <div style="font-size: 12px; color: #666; line-height: 1.4;">
            ${devisData.entreprise.address.replace(/\n/g, '<br>')}
          </div>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">
            ${devisData.entreprise.phone} | ${devisData.entreprise.email}
          </div>
        </div>
        
        <div style="text-align: right; background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
          <h2 style="font-size: 32px; font-weight: bold; color: #1B4B8C; margin: 0 0 10px 0;">DEVIS</h2>
          <div style="font-size: 18px; color: #FF6B35; font-weight: bold; margin-bottom: 15px;">${devisData.numeroDevis}</div>
          <div style="font-size: 12px; color: #666;">
            <div>Date: ${formatDate(devisData.dateCreation)}</div>
            <div>Valide jusqu'au: ${formatDate(devisData.dateExpiration)}</div>
          </div>
        </div>
      </div>

      <!-- Informations client -->
      <div style="margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-left: 4px solid #FF6B35; border-radius: 0 8px 8px 0;">
        <h3 style="font-size: 16px; font-weight: bold; color: #1B4B8C; margin: 0 0 15px 0;">Facturé à:</h3>
        <div style="font-size: 14px; line-height: 1.6;">
          <div style="font-weight: bold; color: #1B4B8C; margin-bottom: 5px;">${devisData.client.name}</div>
          ${devisData.client.company ? `<div style="color: #FF6B35; margin-bottom: 5px;">${devisData.client.company}</div>` : ''}
          ${devisData.client.email ? `<div style="color: #666; margin-bottom: 3px;">${devisData.client.email}</div>` : ''}
          ${devisData.client.phone ? `<div style="color: #666; margin-bottom: 3px;">${devisData.client.phone}</div>` : ''}
          ${devisData.client.address ? `<div style="color: #666;">${devisData.client.address.replace(/\n/g, '<br>')}</div>` : ''}
        </div>
      </div>

      <!-- Tableau des prestations -->
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 16px; font-weight: bold; color: #1B4B8C; margin-bottom: 15px;">Détail des prestations:</h3>
        
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #1B4B8C; color: white;">
              <th style="padding: 12px; text-align: left; font-weight: bold; font-size: 12px;">DESCRIPTION</th>
              <th style="padding: 12px; text-align: right; font-weight: bold; font-size: 12px; width: 80px;">QTÉ</th>
              <th style="padding: 12px; text-align: right; font-weight: bold; font-size: 12px; width: 100px;">PRIX UNIT.</th>
              <th style="padding: 12px; text-align: right; font-weight: bold; font-size: 12px; width: 60px;">TVA %</th>
              <th style="padding: 12px; text-align: right; font-weight: bold; font-size: 12px; width: 100px;">TOTAL HT</th>
            </tr>
          </thead>
          <tbody>
            ${devisData.articles.map((item, index) => `
              <tr style="background: ${index % 2 === 0 ? 'white' : '#f8f9fa'}; border-bottom: 1px solid #e9ecef;">
                <td style="padding: 10px 12px; font-size: 12px; color: #333;">${item.designation}</td>
                <td style="padding: 10px 12px; text-align: right; font-size: 12px; color: #333;">${item.quantity}</td>
                <td style="padding: 10px 12px; text-align: right; font-size: 12px; color: #333;">${formatCurrency(item.unitPrice, devisData.devise)}</td>
                <td style="padding: 10px 12px; text-align: right; font-size: 12px; color: #333;">${item.vatRate}%</td>
                <td style="padding: 10px 12px; text-align: right; font-size: 12px; font-weight: bold; color: #1B4B8C;">${formatCurrency(item.quantity * item.unitPrice, devisData.devise)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totaux -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
        <div style="width: 350px;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden;">
            <tbody>
              <tr style="background: #f8f9fa;">
                <td style="padding: 10px 15px; font-size: 14px; color: #666; font-weight: bold;">SOUS-TOTAL HT:</td>
                <td style="padding: 10px 15px; text-align: right; font-size: 14px; font-weight: bold; color: #333;">${formatCurrency(devisData.sousTotal, devisData.devise)}</td>
              </tr>
              <tr style="background: #f8f9fa; border-top: 1px solid #e9ecef;">
                <td style="padding: 10px 15px; font-size: 14px; color: #666; font-weight: bold;">TOTAL TVA:</td>
                <td style="padding: 10px 15px; text-align: right; font-size: 14px; font-weight: bold; color: #333;">${formatCurrency(devisData.totalTVA, devisData.devise)}</td>
              </tr>
              <tr style="background: #1B4B8C; color: white;">
                <td style="padding: 15px; font-size: 18px; font-weight: bold;">TOTAL TTC:</td>
                <td style="padding: 15px; text-align: right; font-size: 18px; font-weight: bold;">${formatCurrency(devisData.totalTTC, devisData.devise)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Notes -->
      ${devisData.notes ? `
        <div style="margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
          <h4 style="font-size: 14px; font-weight: bold; color: #1B4B8C; margin: 0 0 10px 0;">CONDITIONS & NOTES:</h4>
          <div style="font-size: 12px; color: #666; white-space: pre-line; line-height: 1.5;">${devisData.notes}</div>
        </div>
      ` : ''}

      ${signatureHTML}

      <!-- Footer -->
      <div style="margin-top: 50px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e9ecef; padding-top: 20px;">
        <div>Devis généré le ${formatDate(new Date().toISOString().split('T')[0])}</div>
        <div style="margin-top: 5px;">Solvix - Génération de devis professionnels</div>
      </div>
    </div>
  `;
};