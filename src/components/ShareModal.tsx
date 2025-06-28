import React, { useState } from 'react';
import { X, Mail, MessageCircle, Download, Send, Copy, Check, AlertCircle, Printer } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteNumber: string;
  clientEmail: string;
  onEmailShare: (email: string, message: string) => Promise<void>;
  onWhatsAppShare: () => void;
  onDownload: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  quoteNumber,
  clientEmail,
  onEmailShare,
  onWhatsAppShare,
  onDownload
}) => {
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp' | 'print'>('email');
  const [emailData, setEmailData] = useState({
    to: clientEmail,
    subject: `Devis ${quoteNumber}`,
    message: `Bonjour,

Veuillez trouver ci-joint le devis ${quoteNumber} que vous avez demandé.

N'hésitez pas à me contacter si vous avez des questions.

Cordialement,`
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleEmailSend = async () => {
    if (!emailData.to.trim()) {
      setError('L\'adresse email est requise');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailData.to)) {
      setError('Format d\'email invalide');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onEmailShare(emailData.to, emailData.message);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError('Erreur lors de l\'envoi de l\'email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppShare = () => {
    onWhatsAppShare();
    onClose();
  };

  const handlePrint = () => {
    onDownload();
    onClose();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  const whatsappMessage = `Bonjour,

Voici le devis ${quoteNumber} que vous avez demandé.

N'hésitez pas à me contacter si vous avez des questions.

Cordialement`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg sm:rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full mx-4">
          {/* Header */}
          <div className="bg-white px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Partager le devis {quoteNumber}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="mx-4 sm:mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <Check className="h-5 w-5 text-green-600 mr-3" />
              <p className="text-green-800 font-medium">Email envoyé avec succès !</p>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-gray-50 px-4 sm:px-6 py-3 overflow-x-auto">
            <div className="flex space-x-1 min-w-max">
              <button
                onClick={() => setActiveTab('email')}
                className={`flex items-center px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'email'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </button>
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`flex items-center px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'whatsapp'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">WhatsApp</span>
                <span className="sm:hidden">WA</span>
              </button>
              <button
                onClick={() => setActiveTab('print')}
                className={`flex items-center px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'print'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Printer className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Imprimer / PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            {/* Email Tab */}
            {activeTab === 'email' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destinataire *
                  </label>
                  <input
                    type="email"
                    value={emailData.to}
                    onChange={(e) => {
                      setEmailData(prev => ({ ...prev, to: e.target.value }));
                      setError('');
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="client@email.com"
                  />
                  {error && (
                    <div className="mt-1 flex items-center text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {error}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objet
                  </label>
                  <input
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={emailData.message}
                    onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre message..."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note :</strong> Le devis sera automatiquement joint au format PDF.
                  </p>
                </div>
              </div>
            )}

            {/* WhatsApp Tab */}
            {activeTab === 'whatsapp' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Partager via WhatsApp</h4>
                  <p className="text-gray-600 mb-6 text-sm sm:text-base">
                    Un message pré-rempli sera ouvert dans WhatsApp avec le lien vers le devis.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message qui sera envoyé :
                  </label>
                  <div className="relative">
                    <textarea
                      value={whatsappMessage}
                      readOnly
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(whatsappMessage)}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      title="Copier le message"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-sm text-green-600 mt-1">Message copié !</p>
                  )}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>Astuce :</strong> Vous pouvez modifier le message directement dans WhatsApp avant de l'envoyer.
                  </p>
                </div>
              </div>
            )}

            {/* Print Tab */}
            {activeTab === 'print' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <Printer className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Imprimer ou sauvegarder en PDF</h4>
                  <p className="text-gray-600 mb-6 text-sm sm:text-base">
                    Ouvrez l'aperçu d'impression pour imprimer le devis ou le sauvegarder en PDF via votre navigateur.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">{quoteNumber}</h5>
                      <p className="text-sm text-gray-500">Devis formaté pour impression</p>
                    </div>
                    <Printer className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h5 className="font-medium text-purple-900 mb-2">Avantages de l'impression navigateur :</h5>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Sauvegarde directe en PDF via Ctrl+P</li>
                    <li>• Aperçu avant impression</li>
                    <li>• Choix du format et de l'orientation</li>
                    <li>• Compatible avec tous les navigateurs</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
            >
              Annuler
            </button>
            
            {activeTab === 'email' && (
              <button
                onClick={handleEmailSend}
                disabled={isLoading}
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer l'email
                  </>
                )}
              </button>
            )}
            
            {activeTab === 'whatsapp' && (
              <button
                onClick={handleWhatsAppShare}
                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Ouvrir WhatsApp
              </button>
            )}
            
            {activeTab === 'print' && (
              <button
                onClick={handlePrint}
                className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors duration-200"
              >
                <Printer className="h-4 w-4 mr-2" />
                Ouvrir l'aperçu d'impression
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;