import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

// Import des templates
import DevisModeleCreatif from '../components/templates/DevisModeleCreatif';
import DevisModeleCorporate from '../components/templates/DevisModeleCorporate';
import DevisModeleArtisan from '../components/templates/DevisModeleArtisan';
import DevisModeleElegant from '../components/templates/DevisModeleElegant';
import DevisModeleProfessionnel from '../components/templates/DevisModeleProfessionnel';
import DevisModeleMinimaliste from '../components/templates/DevisModeleMinimaliste';

export const generateDevisPDF = async (devisData: DevisData) => {
  try {
    console.log('🔄 PDF_GENERATOR - Début de la génération PDF pour devis:', devisData.numeroDevis);
    
    // Créer un élément temporaire pour le rendu
    const container = document.createElement('div');
    container.style.width = '210mm';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.backgroundColor = 'white';
    
    // Ajouter au DOM pour le rendu
    document.body.appendChild(container);
    
    // Créer un élément React pour le rendu
    const ReactDOM = await import('react-dom/client');
    const React = await import('react');
    
    // Créer une racine React
    const root = ReactDOM.createRoot(container);
    
    // Déterminer quel template utiliser
    const templateProps = {
      devisData: {
        numeroDevis: devisData.numeroDevis,
        dateCreation: devisData.dateCreation,
        dateExpiration: devisData.dateExpiration,
        devise: devisData.devise,
        notes: devisData.notes
      },
      entrepriseData: devisData.entreprise,
      clientData: devisData.client,
      articles: devisData.articles
    };
    
    // Rendre le template approprié
    let TemplateComponent;
    switch (devisData.template) {
      case 'creatif':
        TemplateComponent = DevisModeleCreatif;
        break;
      case 'corporate':
        TemplateComponent = DevisModeleCorporate;
        break;
      case 'artisan':
        TemplateComponent = DevisModeleArtisan;
        break;
      case 'elegant':
        TemplateComponent = DevisModeleElegant;
        break;
      case 'professionnel':
        TemplateComponent = DevisModeleProfessionnel;
        break;
      case 'minimaliste':
        TemplateComponent = DevisModeleMinimaliste;
        break;
      default:
        TemplateComponent = DevisModeleCreatif;
    }
    
    // Rendre le composant
    root.render(React.createElement(TemplateComponent, templateProps));
    
    // Attendre que le rendu soit terminé
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🎨 PDF_GENERATOR - Rendu du template terminé, capture en cours...');
    
    // Configurer html2canvas pour une meilleure qualité
    const canvas = await html2canvas(container, {
      scale: 2, // Augmenter la résolution
      useCORS: true, // Permettre le chargement d'images cross-origin
      allowTaint: true, // Permettre le rendu d'images potentiellement non sécurisées
      backgroundColor: '#FFFFFF', // Fond blanc
      logging: false, // Désactiver les logs
      windowWidth: 210 * 3.78, // Largeur A4 en pixels (210mm * 3.78px/mm)
      windowHeight: 297 * 3.78, // Hauteur A4 en pixels (297mm * 3.78px/mm)
      x: 0,
      y: 0,
      width: container.scrollWidth,
      height: container.scrollHeight
    });
    
    console.log('📸 PDF_GENERATOR - Capture terminée, création du PDF...');
    
    // Créer le PDF au format A4
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Calculer les dimensions pour ajuster l'image au format A4
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculer le ratio pour s'assurer que l'image s'adapte correctement
    const canvasRatio = canvas.height / canvas.width;
    const pdfRatio = pdfHeight / pdfWidth;
    
    let imgWidth, imgHeight;
    
    if (canvasRatio > pdfRatio) {
      // L'image est plus haute proportionnellement que le PDF
      imgHeight = pdfHeight;
      imgWidth = imgHeight / canvasRatio;
    } else {
      // L'image est plus large proportionnellement que le PDF
      imgWidth = pdfWidth;
      imgHeight = imgWidth * canvasRatio;
    }
    
    // Centrer l'image si nécessaire
    const xOffset = (pdfWidth - imgWidth) / 2;
    const yOffset = (pdfHeight - imgHeight) / 2;
    
    // Ajouter l'image au PDF
    pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
    
    // Sauvegarder le PDF
    pdf.save(`devis-${devisData.numeroDevis}.pdf`);
    
    // Nettoyer
    root.unmount();
    document.body.removeChild(container);
    
    console.log('✅ PDF_GENERATOR - PDF généré avec succès');
    
  } catch (error) {
    console.error('❌ PDF_GENERATOR - Erreur lors de la génération du PDF:', error);
    throw error;
  }
};