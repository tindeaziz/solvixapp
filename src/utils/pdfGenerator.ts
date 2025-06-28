import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
    console.log('📄 Génération du PDF pour le devis:', devisData.numeroDevis);
    
    // Créer un élément div temporaire pour le rendu
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '210mm'; // Format A4
    tempDiv.style.height = 'auto';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '0';
    tempDiv.style.margin = '0';
    
    // Ajouter le contenu HTML en fonction du modèle
    switch (devisData.template) {
      case 'creatif':
        tempDiv.innerHTML = generateCreatifTemplate(devisData);
        break;
      case 'corporate':
        tempDiv.innerHTML = generateCorporateTemplate(devisData);
        break;
      case 'artisan':
        tempDiv.innerHTML = generateArtisanTemplate(devisData);
        break;
      case 'elegant':
        tempDiv.innerHTML = generateElegantTemplate(devisData);
        break;
      case 'professionnel':
        tempDiv.innerHTML = generateProfessionnelTemplate(devisData);
        break;
      case 'minimaliste':
        tempDiv.innerHTML = generateMinimalisteTemplate(devisData);
        break;
      default:
        tempDiv.innerHTML = generateCreatifTemplate(devisData);
    }
    
    document.body.appendChild(tempDiv);
    
    // Utiliser html2canvas pour convertir le HTML en canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2, // Meilleure qualité
      useCORS: true, // Pour permettre le chargement d'images externes
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: tempDiv.scrollWidth,
      windowHeight: tempDiv.scrollHeight
    });
    
    // Supprimer l'élément temporaire
    document.body.removeChild(tempDiv);
    
    // Créer un PDF au format A4
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Calculer les dimensions pour ajuster l'image au format A4
    const imgWidth = 210; // Largeur A4 en mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Ajouter l'image au PDF
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Télécharger le PDF
    pdf.save(`Devis-${devisData.numeroDevis}.pdf`);
    
    console.log('✅ PDF généré avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF:', error);
    throw error;
  }
};

// Fonctions pour générer les templates HTML
const generateCreatifTemplate = (devisData: DevisData): string => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: devisData.devise 
    }).format(amount);
  };
  
  return `
    <div style="font-family: 'Poppins', sans-serif; font-size: 12px; line-height: 1.5; color: #2D3748; background-color: white; padding: 20px; max-width: 210mm; margin: 0 auto; position: relative; box-sizing: border-box;">
      <!-- Header Créatif - Design moderne avec gradient -->
      <div style="background: linear-gradient(135deg, #FF6B35 0%, #6F42C1 100%); border-radius: 10px; padding: 20px; margin-bottom: 20px; color: white; position: relative; overflow: hidden;">
        <!-- Éléments décoratifs -->
        <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
        <div style="position: absolute; bottom: -30px; left: -30px; width: 80px; height: 80px; background: rgba(255, 255, 255, 0.08); border-radius: 50%;"></div>

        <div style="display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 2;">
          <!-- Logo et entreprise -->
          <div style="display: flex; align-items: flex-start; gap: 15px;">
            ${devisData.entreprise.logo ? `
              <div style="background-color: rgba(255, 255, 255, 0.15); padding: 8px; border-radius: 8px; backdrop-filter: blur(10px);">
                <img src="${devisData.entreprise.logo}" alt="Logo" style="max-height: 40px; width: auto; filter: brightness(0) invert(1);" />
              </div>
            ` : ''}
            <div>
              <div style="font-size: 18px; font-weight: 700; margin-bottom: 5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                ${devisData.entreprise.name}
              </div>
              <div style="font-size: 10px; opacity: 0.9; line-height: 1.3; white-space: pre-line;">
                ${devisData.entreprise.address}
              </div>
              <div style="font-size: 10px; opacity: 0.9; margin-top: 3px;">
                ${devisData.entreprise.phone} | ${devisData.entreprise.email}
              </div>
            </div>
          </div>

          <!-- Section DEVIS -->
          <div style="text-align: right;">
            <div style="font-size: 24px; font-weight: 800; margin-bottom: 5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2); letter-spacing: 2px;">
              DEVIS
            </div>
            <div style="background-color: rgba(255, 255, 255, 0.2); padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; backdrop-filter: blur(10px); margin-bottom: 10px; display: inline-block;">
              ${devisData.numeroDevis}
            </div>
            <div style="font-size: 10px; opacity: 0.9;">
              Date: ${formatDate(devisData.dateCreation)}
            </div>
            <div style="font-size: 10px; opacity: 0.9;">
              Valide jusqu'au: ${formatDate(devisData.dateExpiration)}
            </div>
          </div>
        </div>
      </div>

      <!-- Section Client -->
      <div style="max-height: 80px; font-size: 10px; line-height: 1.2; padding: 10px; margin: 15px 0; background: linear-gradient(135deg, #F7FAFC 0%, #E2E8F0 100%); border-left: 4px solid #FF6B35; border-radius: 0 6px 6px 0; overflow: hidden;">
        <div style="font-weight: bold; color: #6F42C1; margin-bottom: 6px; font-size: 11px;">
          Facturé à:
        </div>
        <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px; color: #2D3748;">
          ${devisData.client.name}
        </div>
        <div style="font-size: 10px; margin-bottom: 2px; color: #FF6B35;">
          ${devisData.client.company}
        </div>
        <div style="font-size: 9px; color: #718096; margin-bottom: 1px;">
          ${devisData.client.email} | ${devisData.client.phone}
        </div>
        <div style="font-size: 9px; color: #718096; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${devisData.client.address.replace(/\n/g, ', ')}
        </div>
      </div>

      <!-- Tableau des prestations -->
      <div style="margin: 15px 0;">
        <div style="font-weight: bold; color: #2D3748; margin-bottom: 10px; font-size: 14px;">
          🎨 Prestations Créatives:
        </div>
        
        <table style="width: 100%; border-collapse: collapse; border-radius: 6px; overflow: hidden; font-size: 11px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <thead>
            <tr style="background: linear-gradient(135deg, #FF6B35 0%, #6F42C1 100%);">
              <th style="color: white; padding: 8px; text-align: left; font-weight: bold; font-size: 11px;">
                Description
              </th>
              <th style="color: white; padding: 8px; text-align: right; font-weight: bold; font-size: 11px; width: 60px;">
                Qté
              </th>
              <th style="color: white; padding: 8px; text-align: right; font-weight: bold; font-size: 11px; width: 90px;">
                Prix unitaire
              </th>
              <th style="color: white; padding: 8px; text-align: right; font-weight: bold; font-size: 11px; width: 50px;">
                TVA %
              </th>
              <th style="color: white; padding: 8px; text-align: right; font-weight: bold; font-size: 11px; width: 90px;">
                Total HT
              </th>
            </tr>
          </thead>
          <tbody>
            ${devisData.articles.map((item, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#F7FAFC'}; border-left: ${index % 2 === 0 ? '3px solid #FF6B35' : '3px solid #6F42C1'};">
                <td style="padding: 8px; font-size: 10px; line-height: 1.3; color: #2D3748;">
                  ${item.designation}
                </td>
                <td style="padding: 8px; text-align: right; font-weight: bold; color: #FF6B35; font-size: 10px;">
                  ${item.quantity}
                </td>
                <td style="padding: 8px; text-align: right; font-weight: bold; color: #2D3748; font-size: 10px;">
                  ${formatCurrency(item.unitPrice)}
                </td>
                <td style="padding: 8px; text-align: right; font-weight: bold; color: #6F42C1; font-size: 10px;">
                  ${item.vatRate}%
                </td>
                <td style="padding: 8px; text-align: right; font-weight: bold; color: #FF6B35; font-size: 10px;">
                  ${formatCurrency(item.quantity * item.unitPrice)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Section Totaux -->
      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <div style="width: 280px;">
          <table style="width: 100%; border-collapse: collapse; border-radius: 6px; overflow: hidden; font-size: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <tbody>
              <tr>
                <td style="padding: 8px 15px; font-size: 12px; color: #718096; background-color: #F7FAFC;">
                  Sous-total HT:
                </td>
                <td style="padding: 8px 15px; text-align: right; font-size: 12px; font-weight: bold; color: #2D3748; background-color: #F7FAFC;">
                  ${formatCurrency(devisData.sousTotal)}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 15px; font-size: 12px; color: #718096; background-color: #F7FAFC;">
                  Total TVA:
                </td>
                <td style="padding: 8px 15px; text-align: right; font-size: 12px; font-weight: bold; color: #2D3748; background-color: #F7FAFC;">
                  ${formatCurrency(devisData.totalTVA)}
                </td>
              </tr>
              <tr style="background: linear-gradient(135deg, #FF6B35 0%, #6F42C1 100%);">
                <td style="padding: 12px 15px; font-size: 16px; font-weight: bold; color: white;">
                  TOTAL TTC:
                </td>
                <td style="padding: 12px 15px; text-align: right; font-size: 16px; font-weight: bold; color: white;">
                  ${formatCurrency(devisData.totalTTC)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Notes -->
      ${devisData.notes ? `
        <div style="font-size: 9px; max-height: 60px; padding: 8px; overflow: hidden; margin-top: 20px; background: linear-gradient(135deg, #F7FAFC 0%, #E2E8F0 100%); border-radius: 6px; border: 2px solid #E2E8F0;">
          <div style="font-weight: bold; color: #6F42C1; margin-bottom: 4px; font-size: 10px;">
            📝 Notes et conditions:
          </div>
          <div style="white-space: pre-line; color: #4A5568; font-size: 9px; line-height: 1.2; overflow: hidden; text-overflow: ellipsis;">
            ${devisData.notes}
          </div>
        </div>
      ` : ''}

      <!-- SECTION SIGNATURE AUTOMATIQUE -->
      <div style="position: absolute; bottom: 60px; right: 30px; text-align: center; font-size: 10px; font-style: italic; color: #718096;">
        <div style="margin-bottom: 5px;">
          Fait le ${new Date().toLocaleDateString('fr-FR')}, ${devisData.entreprise.name}
        </div>
        ${devisData.entreprise.signature ? `
          <img src="${devisData.entreprise.signature}" alt="Signature" style="max-height: 60px; max-width: 150px; margin-top: 5px;" />
        ` : ''}
      </div>

      <!-- Footer -->
      <div style="position: absolute; bottom: 20px; left: 30px; right: 30px; text-align: center; color: #718096; font-size: 10px; border-top: 1px solid #E2E8F0; padding-top: 12px;">
        <div>Devis généré le ${new Date().toLocaleDateString('fr-FR')}</div>
        <div style="margin-top: 3px;">
          Solvix - Génération de devis professionnels
        </div>
      </div>
    </div>
  `;
};

const generateCorporateTemplate = (devisData: DevisData): string => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: devisData.devise 
    }).format(amount);
  };
  
  return `
    <div style="font-family: 'Inter', sans-serif; font-size: 12px; line-height: 1.5; color: #1B4B8C; background-color: white; padding: 20px; max-width: 210mm; margin: 0 auto; position: relative; box-sizing: border-box;">
      <!-- Header Corporate - Très structuré -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 3px solid #1B4B8C; padding-bottom: 15px;">
        <!-- Logo et infos entreprise - Alignement gauche -->
        <div style="display: flex; align-items: flex-start; gap: 15px;">
          ${devisData.entreprise.logo ? `
            <img src="${devisData.entreprise.logo}" alt="Logo" style="max-height: 50px; width: auto;" />
          ` : ''}
          <div>
            <div style="font-size: 20px; font-weight: 700; color: #1B4B8C; margin-bottom: 5px; letter-spacing: 0.5px;">
              ${devisData.entreprise.name}
            </div>
            <div style="color: #6C757D; font-size: 10px; line-height: 1.3; white-space: pre-line;">
              ${devisData.entreprise.address}
            </div>
            <div style="color: #6C757D; font-size: 10px; margin-top: 3px;">
              ${devisData.entreprise.phone} | ${devisData.entreprise.email}
            </div>
          </div>
        </div>
        
        <!-- Section devis - Alignement droite -->
        <div style="text-align: right; min-width: 180px;">
          <div style="font-size: 24px; font-weight: 700; color: #1B4B8C; margin-bottom: 5px; letter-spacing: 1px;">
            DEVIS
          </div>
          <div style="font-size: 16px; color: #6C757D; font-weight: 600; margin-bottom: 10px;">
            ${devisData.numeroDevis}
          </div>
          <div style="color: #6C757D; font-size: 10px;">
            Date: ${formatDate(devisData.dateCreation)}
          </div>
          <div style="color: #6C757D; font-size: 10px;">
            Valide jusqu'au: ${formatDate(devisData.dateExpiration)}
          </div>
        </div>
      </div>

      <!-- Section Client -->
      <div style="max-height: 80px; font-size: 10px; line-height: 1.2; padding: 10px; margin: 15px 0; background-color: #F8F9FA; border: 1px solid #E9ECEF; border-radius: 4px; overflow: hidden;">
        <div style="font-weight: bold; color: #1B4B8C; margin-bottom: 6px; font-size: 11px;">
          Facturé à:
        </div>
        <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px; color: #1B4B8C;">
          ${devisData.client.name}
        </div>
        <div style="font-size: 10px; margin-bottom: 2px; color: #6C757D;">
          ${devisData.client.company}
        </div>
        <div style="font-size: 9px; color: #6C757D; margin-bottom: 1px;">
          ${devisData.client.email} | ${devisData.client.phone}
        </div>
        <div style="font-size: 9px; color: #6C757D; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${devisData.client.address.replace(/\n/g, ', ')}
        </div>
      </div>

      <!-- Tableau des prestations -->
      <div style="margin: 15px 0;">
        <div style="font-weight: bold; color: #1B4B8C; margin-bottom: 10px; font-size: 14px;">
          Détail des prestations:
        </div>
        
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #E9ECEF; border-radius: 6px; overflow: hidden; font-size: 11px;">
          <thead>
            <tr style="background-color: #F8F9FA;">
              <th style="color: #1B4B8C; padding: 8px; text-align: left; font-weight: bold; font-size: 11px;">
                Description
              </th>
              <th style="color: #1B4B8C; padding: 8px; text-align: right; font-weight: bold; font-size: 11px; width: 60px;">
                Qté
              </th>
              <th style="color: #1B4B8C; padding: 8px; text-align: right; font-weight: bold; font-size: 11px; width: 90px;">
                Prix unitaire
              </th>
              <th style="color: #1B4B8C; padding: 8px; text-align: right; font-weight: bold; font-size: 11px; width: 50px;">
                TVA %
              </th>
              <th style="color: #1B4B8C; padding: 8px; text-align: right; font-weight: bold; font-size: 11px; width: 90px;">
                Total HT
              </th>
            </tr>
          </thead>
          <tbody>
            ${devisData.articles.map((item, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#FAFBFC'};">
                <td style="padding: 8px; border-bottom: 1px solid #E9ECEF; font-size: 10px; line-height: 1.3; color: #374151;">
                  ${item.designation}
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #E9ECEF; text-align: right; font-weight: bold; font-size: 10px; color: #374151;">
                  ${item.quantity}
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #E9ECEF; text-align: right; font-weight: bold; font-size: 10px; color: #374151;">
                  ${formatCurrency(item.unitPrice)}
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #E9ECEF; text-align: right; font-weight: bold; font-size: 10px; color: #374151;">
                  ${item.vatRate}%
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #E9ECEF; text-align: right; font-weight: bold; font-size: 10px; color: #1B4B8C;">
                  ${formatCurrency(item.quantity * item.unitPrice)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Section Totaux -->
      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <div style="width: 280px;">
          <table style="width: 100%; background-color: #F8F9FA; border: 2px solid #1B4B8C; border-radius: 6px; overflow: hidden; font-size: 12px;">
            <tbody>
              <tr>
                <td style="padding: 8px 15px; border-bottom: 1px solid #E9ECEF; font-size: 12px; color: #6C757D;">
                  Sous-total HT:
                </td>
                <td style="padding: 8px 15px; border-bottom: 1px solid #E9ECEF; text-align: right; font-size: 12px; font-weight: bold; color: #1B4B8C;">
                  ${formatCurrency(devisData.sousTotal)}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 15px; border-bottom: 1px solid #E9ECEF; font-size: 12px; color: #6C757D;">
                  Total TVA:
                </td>
                <td style="padding: 8px 15px; border-bottom: 1px solid #E9ECEF; text-align: right; font-size: 12px; font-weight: bold; color: #1B4B8C;">
                  ${formatCurrency(devisData.totalTVA)}
                </td>
              </tr>
              <tr style="background-color: #1B4B8C;">
                <td style="padding: 12px 15px; font-size: 16px; font-weight: bold; color: white;">
                  TOTAL TTC:
                </td>
                <td style="padding: 12px 15px; text-align: right; font-size: 16px; font-weight: bold; color: white;">
                  ${formatCurrency(devisData.totalTTC)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Notes -->
      ${devisData.notes ? `
        <div style="font-size: 9px; max-height: 60px; padding: 8px; overflow: hidden; margin-top: 20px; background-color: #F8F9FA; border-radius: 6px; border: 1px solid #E9ECEF;">
          <div style="font-weight: bold; color: #1B4B8C; margin-bottom: 4px; font-size: 10px;">
            Notes et conditions:
          </div>
          <div style="white-space: pre-line; color: #6C757D; font-size: 9px; line-height: 1.2; overflow: hidden; text-overflow: ellipsis;">
            ${devisData.notes}
          </div>
        </div>
      ` : ''}

      <!-- SECTION SIGNATURE AUTOMATIQUE -->
      <div style="position: absolute; bottom: 60px; right: 30px; text-align: center; font-size: 10px; font-style: italic; color: #6C757D;">
        <div style="margin-bottom: 5px;">
          Fait le ${new Date().toLocaleDateString('fr-FR')}, ${devisData.entreprise.name}
        </div>
        ${devisData.entreprise.signature ? `
          <img src="${devisData.entreprise.signature}" alt="Signature" style="max-height: 60px; max-width: 150px; margin-top: 5px;" />
        ` : ''}
      </div>

      <!-- Footer -->
      <div style="position: absolute; bottom: 20px; left: 30px; right: 30px; text-align: center; color: #6C757D; font-size: 10px; border-top: 1px solid #E9ECEF; padding-top: 12px;">
        <div>Devis généré le ${new Date().toLocaleDateString('fr-FR')}</div>
        <div style="margin-top: 3px;">
          Solvix - Génération de devis professionnels
        </div>
      </div>
    </div>
  `;
};

const generateArtisanTemplate = (devisData: DevisData): string => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: devisData.devise 
    }).format(amount);
  };
  
  return `
    <div style="font-family: 'Georgia', serif; font-size: 12px; line-height: 1.5; color: #3C2415; background-color: #FEFCF8; padding: 20px; max-width: 210mm; margin: 0 auto; position: relative; border: 8px solid #8B4513; border-radius: 15px; box-sizing: border-box;">
      <!-- Bordure décorative intérieure -->
      <div style="position: absolute; top: 15px; left: 15px; right: 15px; bottom: 15px; border: 2px solid #D2B48C; border-radius: 8px; pointer-events: none;"></div>

      <!-- Motifs décoratifs dans les coins -->
      <div style="position: absolute; top: 25px; left: 25px; width: 30px; height: 30px; background: radial-gradient(circle, #8B4513 2px, transparent 2px); background-size: 8px 8px;"></div>
      <div style="position: absolute; top: 25px; right: 25px; width: 30px; height: 30px; background: radial-gradient(circle, #8B4513 2px, transparent 2px); background-size: 8px 8px;"></div>

      <!-- Contenu principal avec marge pour les bordures -->
      <div style="margin: 25px; position: relative; z-index: 1;">
        
        <!-- Header Artisan - Style traditionnel -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 3px double #8B4513; padding-bottom: 15px;">
          <div>
            ${devisData.entreprise.logo ? `
              <img src="${devisData.entreprise.logo}" alt="Logo" style="max-height: 50px; width: auto; margin-bottom: 10px;" />
            ` : ''}
            <div style="font-size: 20px; font-weight: bold; color: #8B4513; margin-bottom: 5px; text-shadow: 1px 1px 2px rgba(139, 69, 19, 0.3); font-family: 'Georgia', serif;">
              ${devisData.entreprise.name}
            </div>
            <div style="font-size: 10px; color: #8B4513; line-height: 1.4; white-space: pre-line;">
              ${devisData.entreprise.address}
            </div>
            <div style="color: #8B4513; font-size: 10px; margin-top: 3px;">
              ${devisData.entreprise.phone} | ${devisData.entreprise.email}
            </div>
          </div>
          
          <div style="text-align: right;">
            <div style="font-size: 24px; font-weight: bold; color: #8B4513; margin-bottom: 5px; text-shadow: 2px 2px 4px rgba(139, 69, 19, 0.2); letter-spacing: 3px;">
              DEVIS
            </div>
            <div style="font-size: 16px; color: #6B8E23; font-weight: bold; margin-bottom: 10px;">
              ${devisData.numeroDevis}
            </div>
            <div style="color: #8B4513; font-size: 10px;">
              Date: ${formatDate(devisData.dateCreation)}
            </div>
            <div style="color: #8B4513; font-size: 10px;">
              Valide jusqu'au: ${formatDate(devisData.dateExpiration)}
            </div>
          </div>
        </div>

        <!-- Section Client -->
        <div style="max-height: 80px; font-size: 10px; line-height: 1.2; padding: 10px; margin: 15px 0; background-color: #F5F5DC; border-left: 4px solid #8B4513; border-radius: 0 6px 6px 0; overflow: hidden;">
          <div style="font-weight: bold; color: #8B4513; margin-bottom: 6px; font-size: 11px;">
            Facturé à:
          </div>
          <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px; color: #8B4513;">
            ${devisData.client.name}
          </div>
          <div style="font-size: 10px; margin-bottom: 2px; color: #6B8E23;">
            ${devisData.client.company}
          </div>
          <div style="font-size: 9px; color: #8B4513; margin-bottom: 1px;">
            ${devisData.client.email} | ${devisData.client.phone}
          </div>
          <div style="font-size: 9px; color: #8B4513; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${devisData.client.address.replace(/\n/g, ', ')}
          </div>
        </div>

        <!-- Tableau des prestations -->
        <div style="margin: 15px 0;">
          <div style="font-weight: bold; color: #8B4513; margin-bottom: 10px; font-size: 14px;">
            🔨 Détail des Travaux Artisanaux:
          </div>
          
          <table style="width: 100%; border-collapse: collapse; border: 3px solid #8B4513; border-radius: 6px; overflow: hidden; font-size: 11px; box-shadow: 0 4px 8px rgba(139, 69, 19, 0.2);">
            <thead>
              <tr style="background-color: #DEB887;">
                <th style="padding: 8px; text-align: left; font-weight: bold; font-size: 11px; color: #8B4513;">
                  Description des Travaux
                </th>
                <th style="padding: 8px; text-align: right; font-weight: bold; font-size: 11px; color: #8B4513; width: 60px;">
                  Qté
                </th>
                <th style="padding: 8px; text-align: right; font-weight: bold; font-size: 11px; color: #8B4513; width: 90px;">
                  Prix Unit.
                </th>
                <th style="padding: 8px; text-align: right; font-weight: bold; font-size: 11px; color: #8B4513; width: 50px;">
                  TVA %
                </th>
                <th style="padding: 8px; text-align: right; font-weight: bold; font-size: 11px; color: #8B4513; width: 90px;">
                  Total HT
                </th>
              </tr>
            </thead>
            <tbody>
              ${devisData.articles.map((item, index) => `
                <tr style="background-color: ${index % 2 === 0 ? '#FEFCF8' : '#F5F5DC'}; border-left: 4px solid ${index % 2 === 0 ? '#8B4513' : '#6B8E23'};">
                  <td style="padding: 8px; font-size: 10px; line-height: 1.3; color: #3C2415; border-bottom: 1px solid #D2B48C;">
                    ${item.designation}
                  </td>
                  <td style="padding: 8px; text-align: right; font-weight: bold; color: #8B4513; border-bottom: 1px solid #D2B48C; font-size: 10px;">
                    ${item.quantity}
                  </td>
                  <td style="padding: 8px; text-align: right; font-weight: bold; color: #3C2415; border-bottom: 1px solid #D2B48C; font-size: 10px;">
                    ${formatCurrency(item.unitPrice)}
                  </td>
                  <td style="padding: 8px; text-align: right; font-weight: bold; color: #6B8E23; border-bottom: 1px solid #D2B48C; font-size: 10px;">
                    ${item.vatRate}%
                  </td>
                  <td style="padding: 8px; text-align: right; font-weight: bold; color: #8B4513; font-size: 10px; border-bottom: 1px solid #D2B48C;">
                    ${formatCurrency(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Section Totaux -->
        <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <div style="width: 280px;">
            <table style="width: 100%; background-color: #F5F5DC; border: 3px solid #8B4513; border-radius: 6px; overflow: hidden; font-size: 12px; box-shadow: 0 4px 8px rgba(139, 69, 19, 0.2);">
              <tbody>
                <tr>
                  <td style="padding: 8px 15px; border-bottom: 2px solid #D2B48C; font-size: 12px; color: #6B8E23; font-weight: bold;">
                    Sous-total HT:
                  </td>
                  <td style="padding: 8px 15px; border-bottom: 2px solid #D2B48C; text-align: right; font-size: 12px; font-weight: bold; color: #3C2415;">
                    ${formatCurrency(devisData.sousTotal)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 15px; border-bottom: 2px solid #D2B48C; font-size: 12px; color: #6B8E23; font-weight: bold;">
                    Total TVA:
                  </td>
                  <td style="padding: 8px 15px; border-bottom: 2px solid #D2B48C; text-align: right; font-size: 12px; font-weight: bold; color: #3C2415;">
                    ${formatCurrency(devisData.totalTVA)}
                  </td>
                </tr>
                <tr style="background-color: #8B4513;">
                  <td style="padding: 12px 15px; font-size: 16px; font-weight: bold; color: #F5F5DC;">
                    TOTAL TTC:
                  </td>
                  <td style="padding: 12px 15px; text-align: right; font-size: 16px; font-weight: bold; color: #F5F5DC;">
                    ${formatCurrency(devisData.totalTTC)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Notes -->
        ${devisData.notes ? `
          <div style="font-size: 9px; max-height: 60px; padding: 8px; overflow: hidden; margin-top: 20px; background-color: #F5F5DC; border-radius: 6px; border: 2px solid #D2B48C;">
            <div style="font-weight: bold; color: #8B4513; margin-bottom: 4px; font-size: 10px;">
              📜 Conditions Artisanales:
            </div>
            <div style="white-space: pre-line; color: #3C2415; font-size: 9px; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; font-style: italic;">
              ${devisData.notes}
            </div>
          </div>
        ` : ''}

        <!-- SECTION SIGNATURE AUTOMATIQUE -->
        <div style="position: absolute; bottom: 60px; right: 30px; text-align: center; font-size: 10px; font-style: italic; color: #6B8E23;">
          <div style="margin-bottom: 5px;">
            Fait le ${new Date().toLocaleDateString('fr-FR')}, ${devisData.entreprise.name}
          </div>
          ${devisData.entreprise.signature ? `
            <img src="${devisData.entreprise.signature}" alt="Signature" style="max-height: 60px; max-width: 150px; margin-top: 5px;" />
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="position: absolute; bottom: 20px; left: 30px; right: 30px; text-align: center; color: #6B8E23; font-size: 10px; border-top: 3px double #8B4513; padding-top: 12px;">
          <div>Devis généré le ${formatDate(new Date().toISOString().split('T')[0])}</div>
          <div style="margin-top: 3px;">
            Solvix - Génération de devis professionnels
          </div>
        </div>
      </div>
    </div>
  `;
};

const generateElegantTemplate = (devisData: DevisData): string => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: devisData.devise 
    }).format(amount);
  };
  
  return `
    <div style="font-family: 'Garamond', serif; font-size: 12px; line-height: 1.5; color: #333333; background-color: #FFFCF7; padding: 20px; max-width: 210mm; margin: 0 auto; position: relative; border: 1px solid #E8E0D0; box-sizing: border-box;">
      <!-- En-tête élégant -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 3px solid #D4B78F; padding-bottom: 15px;">
        <div style="display: flex; align-items: flex-start; gap: 15px;">
          ${devisData.entreprise.logo ? `
            <img src="${devisData.entreprise.logo}" alt="Logo" style="max-height: 50px; width: auto;" />
          ` : ''}
          <div>
            <div style="font-size: 20px; font-weight: bold; color: #8A6D3B; margin-bottom: 5px; font-family: 'Garamond', serif;">
              ${devisData.entreprise.name}
            </div>
            <div style="color: #8A6D3B; font-size: 10px; line-height: 1.4; font-style: italic; white-space: pre-line;">
              ${devisData.entreprise.address}
            </div>
            <div style="color: #8A6D3B; font-size: 10px; margin-top: 3px;">
              ${devisData.entreprise.phone} | ${devisData.entreprise.email}
            </div>
          </div>
        </div>
        
        <div style="text-align: right;">
          <div style="font-size: 24px; font-weight: normal; color: #8A6D3B; margin-bottom: 5px; font-family: 'Garamond', serif; letter-spacing: 2px;">
            DEVIS
          </div>
          <div style="font-size: 16px; color: #8A6D3B; font-style: italic; margin-bottom: 10px;">
            ${devisData.numeroDevis}
          </div>
          <div style="font-size: 10px; color: #8A6D3B;">
            Date: ${formatDate(devisData.dateCreation)}
          </div>
          <div style="font-size: 10px; color: #8A6D3B;">
            Valide jusqu'au: ${formatDate(devisData.dateExpiration)}
          </div>
        </div>
      </div>

      <!-- Section client -->
      <div style="max-height: 80px; font-size: 10px; line-height: 1.2; padding: 10px; margin: 15px 0; background-color: #F9F5ED; border: 1px solid #E8E0D0; border-radius: 0 6px 6px 0; overflow: hidden;">
        <div style="font-weight: bold; color: #8A6D3B; margin-bottom: 6px; font-size: 11px; font-style: italic;">
          À l'attention de:
        </div>
        <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px; color: #8A6D3B; font-family: 'Garamond', serif;">
          ${devisData.client.name}
        </div>
        <div style="font-size: 10px; margin-bottom: 2px; color: #8A6D3B; font-style: italic;">
          ${devisData.client.company}
        </div>
        <div style="font-size: 9px; color: #666; margin-bottom: 1px;">
          ${devisData.client.email} | ${devisData.client.phone}
        </div>
        <div style="font-size: 9px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${devisData.client.address.replace(/\n/g, ', ')}
        </div>
      </div>

      <!-- Tableau des prestations -->
      <div style="margin: 15px 0;">
        <div style="font-weight: bold; color: #8A6D3B; margin-bottom: 10px; font-size: 14px; font-family: 'Garamond', serif; text-align: center; font-style: italic;">
          Détail des prestations:
        </div>
        
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #E8E0D0; border-radius: 6px; overflow: hidden; font-size: 11px;">
          <thead>
            <tr style="background-color: #F9F5ED;">
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #D4B78F; color: #8A6D3B; font-weight: normal; font-size: 11px; font-style: italic;">
                Description
              </th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #D4B78F; color: #8A6D3B; font-weight: normal; font-size: 11px; font-style: italic; width: 60px;">
                Qté
              </th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #D4B78F; color: #8A6D3B; font-weight: normal; font-size: 11px; font-style: italic; width: 90px;">
                Prix unitaire
              </th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #D4B78F; color: #8A6D3B; font-weight: normal; font-size: 11px; font-style: italic; width: 50px;">
                TVA %
              </th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #D4B78F; color: #8A6D3B; font-weight: normal; font-size: 11px; font-style: italic; width: 90px;">
                Total HT
              </th>
            </tr>
          </thead>
          <tbody>
            ${devisData.articles.map((item, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#FFFCF7' : '#F9F5ED'}; border-bottom: 1px solid #E8E0D0;">
                <td style="padding: 8px; font-size: 10px; line-height: 1.3; color: #333;">
                  ${item.designation}
                </td>
                <td style="padding: 8px; text-align: right; font-size: 10px; color: #333;">
                  ${item.quantity}
                </td>
                <td style="padding: 8px; text-align: right; font-size: 10px; color: #333;">
                  ${formatCurrency(item.unitPrice)}
                </td>
                <td style="padding: 8px; text-align: right; font-size: 10px; color: #333;">
                  ${item.vatRate}%
                </td>
                <td style="padding: 8px; text-align: right; font-size: 10px; font-weight: bold; color: #8A6D3B;">
                  ${formatCurrency(item.quantity * item.unitPrice)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Section Totaux -->
      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <div style="width: 280px;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #E8E0D0; border-radius: 6px; overflow: hidden; font-size: 12px;">
            <tbody>
              <tr style="background-color: #F9F5ED;">
                <td style="padding: 8px 15px; font-size: 12px; color: #8A6D3B; font-style: italic;">
                  Sous-total HT:
                </td>
                <td style="padding: 8px 15px; text-align: right; font-size: 12px; font-weight: bold; color: #333;">
                  ${formatCurrency(devisData.sousTotal)}
                </td>
              </tr>
              <tr style="background-color: #F9F5ED;">
                <td style="padding: 8px 15px; font-size: 12px; color: #8A6D3B; font-style: italic; border-top: 1px solid #E8E0D0;">
                  Total TVA:
                </td>
                <td style="padding: 8px 15px; text-align: right; font-size: 12px; font-weight: bold; color: #333; border-top: 1px solid #E8E0D0;">
                  ${formatCurrency(devisData.totalTVA)}
                </td>
              </tr>
              <tr style="background-color: #8A6D3B;">
                <td style="padding: 12px 15px; font-size: 16px; color: #FFFCF7; font-family: 'Garamond', serif;">
                  TOTAL TTC:
                </td>
                <td style="padding: 12px 15px; text-align: right; font-size: 16px; font-weight: bold; color: #FFFCF7; font-family: 'Garamond', serif;">
                  ${formatCurrency(devisData.totalTTC)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Notes -->
      ${devisData.notes ? `
        <div style="font-size: 9px; max-height: 60px; padding: 8px; overflow: hidden; margin-top: 20px; background-color: #F9F5ED; border-radius: 6px; border: 1px solid #E8E0D0;">
          <div style="font-weight: bold; color: #8A6D3B; margin-bottom: 4px; font-size: 10px; font-style: italic;">
            Conditions & Notes:
          </div>
          <div style="white-space: pre-line; color: #333; font-size: 9px; line-height: 1.2; overflow: hidden; text-overflow: ellipsis;">
            ${devisData.notes}
          </div>
        </div>
      ` : ''}

      <!-- SECTION SIGNATURE AUTOMATIQUE -->
      <div style="position: absolute; bottom: 60px; right: 30px; text-align: center; font-size: 10px; font-style: italic; color: #8A6D3B;">
        <div style="margin-bottom: 5px;">
          Fait le ${new Date().toLocaleDateString('fr-FR')}, ${devisData.entreprise.name}
        </div>
        ${devisData.entreprise.signature ? `
          <img src="${devisData.entreprise.signature}" alt="Signature" style="max-height: 60px; max-width: 150px; margin-top: 5px;" />
        ` : ''}
      </div>

      <!-- Footer -->
      <div style="position: absolute; bottom: 20px; left: 30px; right: 30px; text-align: center; color: #8A6D3B; font-size: 10px; border-top: 1px solid #E8E0D0; padding-top: 12px; font-style: italic;">
        <div>Devis généré le ${formatDate(new Date().toISOString().split('T')[0])}</div>
        <div style="margin-top: 3px;">
          Solvix - Génération de devis professionnels
        </div>
      </div>
    </div>
  `;
};

const generateProfessionnelTemplate = (devisData: DevisData): string => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: devisData.devise 
    }).format(amount);
  };
  
  return `
    <div style="font-family: 'Helvetica', Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #333333; background-color: white; padding: 20px; max-width: 210mm; margin: 0 auto; position: relative; box-sizing: border-box;">
      <!-- Bande colorée en haut -->
      <div style="position: absolute; top: 0; left: 0; right: 0; height: 15px; background-color: #2C3E50;"></div>

      <!-- Header professionnel avec bande colorée -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; padding-top: 20px; border-bottom: 3px solid #2C3E50; padding-bottom: 15px;">
        <div>
          ${devisData.entreprise.logo ? `
            <img src="${devisData.entreprise.logo}" alt="Logo" style="max-height: 50px; width: auto; margin-bottom: 10px;" />
          ` : ''}
          <div style="font-size: 20px; font-weight: bold; color: #2C3E50; margin-bottom: 5px;">
            ${devisData.entreprise.name}
          </div>
          <div style="color: #7F8C8D; font-size: 10px; line-height: 1.4; white-space: pre-line;">
            ${devisData.entreprise.address}
          </div>
          <div style="color: #7F8C8D; font-size: 10px; margin-top: 3px;">
            ${devisData.entreprise.phone} | ${devisData.entreprise.email}
          </div>
        </div>
        
        <div style="text-align: right; background-color: #F8F9FA; padding: 15px; border-radius: 5px; border: 1px solid #E9ECEF;">
          <div style="font-size: 24px; font-weight: bold; color: #2C3E50; margin-bottom: 5px;">
            DEVIS
          </div>
          <div style="font-size: 16px; color: #3498DB; font-weight: bold; margin-bottom: 10px;">
            ${devisData.numeroDevis}
          </div>
          <div style="font-size: 10px; color: #7F8C8D;">
            Date: ${formatDate(devisData.dateCreation)}
          </div>
          <div style="font-size: 10px; color: #7F8C8D;">
            Valide jusqu'au: ${formatDate(devisData.dateExpiration)}
          </div>
        </div>
      </div>

      <!-- Section Client -->
      <div style="max-height: 80px; font-size: 10px; line-height: 1.2; padding: 10px; margin: 15px 0; background-color: #F8F9FA; border-left: 4px solid #3498DB; border-radius: 0 6px 6px 0; overflow: hidden;">
        <div style="font-weight: bold; color: #2C3E50; margin-bottom: 6px; font-size: 11px;">
          Facturé à:
        </div>
        <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px; color: #2C3E50;">
          ${devisData.client.name}
        </div>
        <div style="font-size: 10px; margin-bottom: 2px; color: #3498DB;">
          ${devisData.client.company}
        </div>
        <div style="font-size: 9px; color: #7F8C8D; margin-bottom: 1px;">
          ${devisData.client.email} | ${devisData.client.phone}
        </div>
        <div style="font-size: 9px; color: #7F8C8D; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${devisData.client.address.replace(/\n/g, ', ')}
        </div>
      </div>

      <!-- Tableau des prestations -->
      <div style="margin: 15px 0;">
        <div style="font-weight: bold; color: #2C3E50; margin-bottom: 10px; font-size: 14px;">
          DÉTAIL DES PRESTATIONS:
        </div>
        
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #E9ECEF; border-radius: 6px; overflow: hidden; font-size: 11px;">
          <thead>
            <tr style="background-color: #F8F9FA;">
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #3498DB; color: #2C3E50; font-weight: bold; font-size: 11px;">
                DESCRIPTION
              </th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #3498DB; color: #2C3E50; font-weight: bold; font-size: 11px; width: 60px;">
                QTÉ
              </th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #3498DB; color: #2C3E50; font-weight: bold; font-size: 11px; width: 90px;">
                PRIX UNIT.
              </th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #3498DB; color: #2C3E50; font-weight: bold; font-size: 11px; width: 50px;">
                TVA %
              </th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #3498DB; color: #2C3E50; font-weight: bold; font-size: 11px; width: 90px;">
                TOTAL HT
              </th>
            </tr>
          </thead>
          <tbody>
            ${devisData.articles.map((item, index) => `
              <tr style="background-color: ${index % 2 === 0 ? 'white' : '#F8F9FA'}; border-bottom: 1px solid #E9ECEF;">
                <td style="padding: 8px; font-size: 10px; line-height: 1.3; color: #2C3E50;">
                  ${item.designation}
                </td>
                <td style="padding: 8px; text-align: right; font-size: 10px; color: #2C3E50;">
                  ${item.quantity}
                </td>
                <td style="padding: 8px; text-align: right; font-size: 10px; color: #2C3E50;">
                  ${formatCurrency(item.unitPrice)}
                </td>
                <td style="padding: 8px; text-align: right; font-size: 10px; color: #2C3E50;">
                  ${item.vatRate}%
                </td>
                <td style="padding: 8px; text-align: right; font-size: 10px; font-weight: bold; color: #3498DB;">
                  ${formatCurrency(item.quantity * item.unitPrice)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Section Totaux -->
      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <div style="width: 280px;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #E9ECEF; border-radius: 6px; overflow: hidden; font-size: 12px;">
            <tbody>
              <tr>
                <td style="padding: 8px 15px; background-color: #F8F9FA; color: #7F8C8D; font-size: 12px; font-weight: bold;">
                  SOUS-TOTAL HT:
                </td>
                <td style="padding: 8px 15px; background-color: #F8F9FA; text-align: right; font-size: 12px; font-weight: bold; color: #2C3E50;">
                  ${formatCurrency(devisData.sousTotal)}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 15px; background-color: #F8F9FA; color: #7F8C8D; font-size: 12px; font-weight: bold; border-top: 1px solid #E9ECEF;">
                  TOTAL TVA:
                </td>
                <td style="padding: 8px 15px; background-color: #F8F9FA; text-align: right; font-size: 12px; font-weight: bold; color: #2C3E50; border-top: 1px solid #E9ECEF;">
                  ${formatCurrency(devisData.totalTVA)}
                </td>
              </tr>
              <tr style="background-color: #2C3E50;">
                <td style="padding: 12px 15px; font-size: 16px; font-weight: bold; color: white;">
                  TOTAL TTC:
                </td>
                <td style="padding: 12px 15px; text-align: right; font-size: 16px; font-weight: bold; color: white;">
                  ${formatCurrency(devisData.totalTTC)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Notes -->
      ${devisData.notes ? `
        <div style="font-size: 9px; max-height: 60px; padding: 8px; overflow: hidden; margin-top: 20px; background-color: #F8F9FA; border-radius: 6px; border: 1px solid #E9ECEF;">
          <div style="font-weight: bold; color: #2C3E50; margin-bottom: 4px; font-size: 10px;">
            CONDITIONS & NOTES:
          </div>
          <div style="white-space: pre-line; color: #7F8C8D; font-size: 9px; line-height: 1.2; overflow: hidden; text-overflow: ellipsis;">
            ${devisData.notes}
          </div>
        </div>
      ` : ''}

      <!-- SECTION SIGNATURE AUTOMATIQUE -->
      <div style="position: absolute; bottom: 60px; right: 30px; text-align: center; font-size: 10px; font-style: italic; color: #7F8C8D;">
        <div style="margin-bottom: 5px;">
          Fait le ${new Date().toLocaleDateString('fr-FR')}, ${devisData.entreprise.name}
        </div>
        ${devisData.entreprise.signature ? `
          <img src="${devisData.entreprise.signature}" alt="Signature" style="max-height: 60px; max-width: 150px; margin-top: 5px;" />
        ` : ''}
      </div>

      <!-- Footer -->
      <div style="position: absolute; bottom: 20px; left: 30px; right: 30px; text-align: center; color: #7F8C8D; font-size: 10px; border-top: 1px solid #E9ECEF; padding-top: 12px;">
        <div>Devis généré le ${formatDate(new Date().toISOString().split('T')[0])}</div>
        <div style="margin-top: 3px;">
          Solvix - Génération de devis professionnels
        </div>
      </div>

      <!-- Bande colorée en bas -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 15px; background-color: #3498DB;"></div>
    </div>
  `;
};

const generateMinimalisteTemplate = (devisData: DevisData): string => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: devisData.devise 
    }).format(amount);
  };
  
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #333333; background-color: white; padding: 20px; max-width: 210mm; margin: 0 auto; position: relative; box-sizing: border-box;">
      <!-- En-tête ultra minimaliste -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 3px solid #eee; padding-bottom: 15px;">
        <div>
          ${devisData.entreprise.logo ? `
            <img src="${devisData.entreprise.logo}" alt="Logo" style="max-height: 50px; width: auto; margin-bottom: 10px;" />
          ` : ''}
          <div style="font-size: 20px; font-weight: 500; color: #333; margin-bottom: 5px; letter-spacing: 0.5px;">
            ${devisData.entreprise.name}
          </div>
          <div style="color: #888; font-size: 10px; line-height: 1.4; white-space: pre-line;">
            ${devisData.entreprise.address}
          </div>
          <div style="color: #888; font-size: 10px; margin-top: 3px;">
            ${devisData.entreprise.phone} | ${devisData.entreprise.email}
          </div>
        </div>
        
        <div style="text-align: right;">
          <div style="font-size: 24px; font-weight: 300; color: #333; margin-bottom: 5px; letter-spacing: 1px;">
            DEVIS
          </div>
          <div style="font-size: 16px; color: #888; margin-bottom: 10px;">
            ${devisData.numeroDevis}
          </div>
          <div style="font-size: 10px; color: #888;">
            Date: ${formatDate(devisData.dateCreation)}
          </div>
          <div style="font-size: 10px; color: #888;">
            Valide jusqu'au: ${formatDate(devisData.dateExpiration)}
          </div>
        </div>
      </div>

      <!-- Section client -->
      <div style="max-height: 80px; font-size: 10px; line-height: 1.2; padding: 10px; margin: 15px 0; background-color: #f9f9f9; border-left: 4px solid #eee; border-radius: 0 6px 6px 0; overflow: hidden;">
        <div style="font-weight: bold; color: #888; margin-bottom: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
          Client:
        </div>
        <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px; color: #333;">
          ${devisData.client.name}
        </div>
        <div style="font-size: 10px; margin-bottom: 2px; color: #555;">
          ${devisData.client.company}
        </div>
        <div style="font-size: 9px; color: #888; margin-bottom: 1px;">
          ${devisData.client.email} | ${devisData.client.phone}
        </div>
        <div style="font-size: 9px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${devisData.client.address.replace(/\n/g, ', ')}
        </div>
      </div>

      <!-- Tableau des prestations -->
      <div style="margin: 15px 0;">
        <div style="font-weight: bold; color: #333; margin-bottom: 10px; font-size: 14px;">
          Prestations:
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr>
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #eee; color: #888; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                Description
              </th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #eee; color: #888; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; width: 60px;">
                Qté
              </th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #eee; color: #888; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; width: 90px;">
                Prix
              </th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #eee; color: #888; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; width: 50px;">
                TVA
              </th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #eee; color: #888; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; width: 90px;">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            ${devisData.articles.map((item, index) => `
              <tr>
                <td style="padding: 8px; font-size: 10px; line-height: 1.3; color: #333; border-bottom: 1px solid #f5f5f5;">
                  ${item.designation}
                </td>
                <td style="padding: 8px; text-align: right; font-size: 10px; color: #333; border-bottom: 1px solid #f5f5f5;">
                  ${item.quantity}
                </td>
                <td style="padding: 8px; text-align: right; font-size: 10px; color: #333; border-bottom: 1px solid #f5f5f5;">
                  ${formatCurrency(item.unitPrice)}
                </td>
                <td style="padding: 8px; text-align: right; font-size: 10px; color: #333; border-bottom: 1px solid #f5f5f5;">
                  ${item.vatRate}%
                </td>
                <td style="padding: 8px; text-align: right; font-size: 10px; font-weight: 500; color: #333; border-bottom: 1px solid #f5f5f5;">
                  ${formatCurrency(item.quantity * item.unitPrice)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Section Totaux -->
      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <div style="width: 280px;">
          <table style="width: 100%; font-size: 12px;">
            <tbody>
              <tr>
                <td style="padding: 8px 15px; border-bottom: 1px solid #f5f5f5; font-size: 12px; color: #888;">
                  Sous-total HT:
                </td>
                <td style="padding: 8px 15px; border-bottom: 1px solid #f5f5f5; text-align: right; font-size: 12px; color: #333;">
                  ${formatCurrency(devisData.sousTotal)}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 15px; border-bottom: 1px solid #f5f5f5; font-size: 12px; color: #888;">
                  TVA:
                </td>
                <td style="padding: 8px 15px; border-bottom: 1px solid #f5f5f5; text-align: right; font-size: 12px; color: #333;">
                  ${formatCurrency(devisData.totalTVA)}
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; font-size: 16px; font-weight: 500; color: #333; border-top: 2px solid #333;">
                  TOTAL TTC:
                </td>
                <td style="padding: 12px 15px; text-align: right; font-size: 16px; font-weight: 500; color: #333; border-top: 2px solid #333;">
                  ${formatCurrency(devisData.totalTTC)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Notes -->
      ${devisData.notes ? `
        <div style="font-size: 9px; max-height: 60px; padding: 8px; overflow: hidden; margin-top: 20px; background-color: #f9f9f9; border-radius: 6px; border-left: 2px solid #eee;">
          <div style="font-weight: bold; color: #888; margin-bottom: 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">
            Notes:
          </div>
          <div style="white-space: pre-line; color: #555; font-size: 9px; line-height: 1.2; overflow: hidden; text-overflow: ellipsis;">
            ${devisData.notes}
          </div>
        </div>
      ` : ''}

      <!-- SECTION SIGNATURE AUTOMATIQUE -->
      <div style="position: absolute; bottom: 60px; right: 30px; text-align: center; font-size: 10px; font-style: italic; color: #888;">
        <div style="margin-bottom: 5px;">
          Fait le ${new Date().toLocaleDateString('fr-FR')}, ${devisData.entreprise.name}
        </div>
        ${devisData.entreprise.signature ? `
          <img src="${devisData.entreprise.signature}" alt="Signature" style="max-height: 60px; max-width: 150px; margin-top: 5px;" />
        ` : ''}
      </div>

      <!-- Footer -->
      <div style="position: absolute; bottom: 20px; left: 30px; right: 30px; text-align: center; color: #888; font-size: 10px; border-top: 1px solid #eee; padding-top: 12px;">
        <div>Devis généré le ${formatDate(new Date().toISOString().split('T')[0])}</div>
        <div style="margin-top: 3px;">
          Solvix - Génération de devis professionnels
        </div>
      </div>
    </div>
  `;
};