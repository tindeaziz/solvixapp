import React, { useState, useRef, useEffect } from 'react';
import { Save, Upload, Building, MapPin, Phone, Mail, FileText, DollarSign, Check, AlertCircle, Loader2, PenTool, Image, Trash2, Download } from 'lucide-react';
import { CURRENCIES, type Currency } from '../types/currency';
import { profileService } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const CompanySettings: React.FC = () => {
  const { user } = useAuth();
  const [companyData, setCompanyData] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_rccm: '',
    company_ncc: '',
    vat_enabled: true,
    vat_rate: 20,
    default_currency: 'EUR',
    company_logo: '',
    company_signature: '',
    signature_type: 'drawn' as 'drawn' | 'uploaded'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Signature states
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 200 });

  // Responsive canvas sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const container = canvas.parentElement;
        if (container) {
          const containerWidth = container.clientWidth;
          const newWidth = Math.min(600, containerWidth - 20); // 20px for padding
          setCanvasSize({
            width: newWidth,
            height: Math.floor(newWidth / 3)
          });
        }
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Charger les données du profil au montage du composant
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        console.log('⏳ COMPANY_SETTINGS - En attente de l\'utilisateur...');
        return;
      }

      setIsLoading(true);
      console.log('🏢 COMPANY_SETTINGS - Chargement du profil pour User ID:', user.id);

      try {
        const { data, error } = await profileService.getProfile();
        if (error && error.code !== 'PGRST116') {
          console.error('❌ COMPANY_SETTINGS - Erreur lors du chargement du profil:', error);
          setErrors({ general: 'Erreur lors du chargement du profil' });
          return;
        }

        if (data) {
          console.log('✅ COMPANY_SETTINGS - Profil chargé depuis Supabase');
          
          setCompanyData({
            company_name: data.company_name || '',
            company_address: data.company_address || '',
            company_phone: data.company_phone || '',
            company_email: data.company_email || '',
            company_rccm: data.company_rccm || '',
            company_ncc: data.company_ncc || '',
            vat_enabled: data.vat_enabled ?? true,
            vat_rate: data.vat_rate || 20,
            default_currency: data.default_currency || 'EUR',
            company_logo: data.company_logo || '',
            company_signature: data.company_signature || '',
            signature_type: data.signature_type || 'drawn'
          });

          // Définir les aperçus
          if (data.company_logo) {
            setLogoPreview(data.company_logo);
          }
          if (data.company_signature) {
            setSignaturePreview(data.company_signature);
          }
        } else {
          console.log('📝 COMPANY_SETTINGS - Aucun profil trouvé, utilisation des valeurs par défaut');
          // Utiliser les données par défaut avec l'email de l'utilisateur
          setCompanyData({
            company_name: 'Mon Entreprise',
            company_address: '',
            company_phone: '',
            company_email: user.email || '',
            company_rccm: '',
            company_ncc: '',
            vat_enabled: true,
            vat_rate: 20,
            default_currency: 'EUR',
            company_logo: '',
            company_signature: '',
            signature_type: 'drawn'
          });
        }
      } catch (error) {
        console.error('❌ COMPANY_SETTINGS - Exception lors du chargement du profil:', error);
        setErrors({ general: 'Une erreur est survenue lors du chargement du profil' });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [canvasSize]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!companyData.company_name.trim()) {
      newErrors.company_name = 'Le nom de l\'entreprise est requis';
    }

    if (!companyData.company_email) {
      newErrors.company_email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyData.company_email)) {
      newErrors.company_email = 'Format d\'email invalide';
    }

    if (!companyData.company_phone.trim()) {
      newErrors.company_phone = 'Le téléphone est requis';
    }

    if (!companyData.company_address.trim()) {
      newErrors.company_address = 'L\'adresse est requise';
    }

    if (companyData.vat_enabled && (companyData.vat_rate < 0 || companyData.vat_rate > 100)) {
      newErrors.vat_rate = 'Le taux de TVA doit être entre 0 et 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validation du fichier
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, logo: 'Veuillez sélectionner un fichier image' }));
        return;
      }

      if (file.size > 2 * 1024 * 1024) { // 2MB
        setErrors(prev => ({ ...prev, logo: 'La taille du fichier ne doit pas dépasser 2MB' }));
        return;
      }

      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setCompanyData(prev => ({ ...prev, company_logo: result }));
        setErrors(prev => ({ ...prev, logo: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Signature Canvas Functions
  const getCanvasCoordinates = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in event) {
      // Touch event
      const touch = event.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      // Mouse event
      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
      };
    }
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    setIsDrawing(true);
    const coords = getCanvasCoordinates(event);
    setLastPoint(coords);
    setSignatureError('');
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (!isDrawing || !lastPoint) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoordinates(event);

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    setLastPoint(coords);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignaturePreview(null);
    setCompanyData(prev => ({ ...prev, company_signature: '', signature_type: 'drawn' }));
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Vérifier si le canvas n'est pas vide
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const isEmpty = imageData.data.every((value, index) => index % 4 === 3 ? value === 0 : true);

    if (isEmpty) {
      setSignatureError('Veuillez dessiner votre signature avant de la sauvegarder');
      return;
    }

    const signatureDataUrl = canvas.toDataURL('image/png');
    setSignaturePreview(signatureDataUrl);
    setCompanyData(prev => ({ 
      ...prev, 
      company_signature: signatureDataUrl, 
      signature_type: 'drawn' 
    }));
    setSignatureError('');
  };

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSignatureError('');

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      setSignatureError('Veuillez sélectionner un fichier image (JPG, PNG, GIF)');
      return;
    }

    if (file.size > 1 * 1024 * 1024) { // 1MB pour les signatures
      setSignatureError('La taille du fichier ne doit pas dépasser 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSignaturePreview(result);
      setCompanyData(prev => ({ 
        ...prev, 
        company_signature: result, 
        signature_type: 'uploaded' 
      }));
    };
    reader.readAsDataURL(file);
    
    // Reset input
    event.target.value = '';
  };

  const removeSignature = () => {
    setSignaturePreview(null);
    setCompanyData(prev => ({ ...prev, company_signature: '', signature_type: 'drawn' }));
    clearCanvas();
    setSignatureError('');
  };

  const downloadSignature = () => {
    if (!companyData.company_signature) return;

    const link = document.createElement('a');
    link.download = 'signature.png';
    link.href = companyData.company_signature;
    link.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setShowSuccess(false);
    setErrors({});

    try {
      console.log('💾 COMPANY_SETTINGS - Sauvegarde du profil pour User ID:', user?.id);
      
      const { data, error } = await profileService.updateProfile(companyData);
      
      if (error) {
        console.error('❌ COMPANY_SETTINGS - Erreur lors de la sauvegarde:', error);
        setErrors({ general: 'Une erreur est survenue lors de la sauvegarde: ' + error.message });
        return;
      }

      console.log('✅ COMPANY_SETTINGS - Profil mis à jour:', data ? 'Succès' : 'Aucune donnée retournée');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('❌ COMPANY_SETTINGS - Exception lors de la sauvegarde:', error);
      setErrors({ general: 'Une erreur est survenue lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === companyData.default_currency);

  // Affichage de chargement
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-solvix-blue border-t-transparent mx-auto mb-4"></div>
            <p className="text-solvix-dark font-inter">Chargement des paramètres entreprise...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Building className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Paramètres de l'entreprise</h1>
              <p className="text-gray-600 text-sm sm:text-base">Configurez les informations de votre entreprise</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mx-4 sm:mx-6 mt-4 sm:mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <Check className="h-5 w-5 text-green-600 mr-3" />
            <p className="text-green-800 font-medium">Paramètres sauvegardés avec succès dans la base de données !</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-red-800">{errors.general}</p>
            </div>
          )}

          {/* Logo Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Logo de l'entreprise
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                  ) : (
                    <Building className="h-8 w-8 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choisir un fichier
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  JPG, PNG ou GIF. Taille maximale : 2MB
                </p>
                {errors.logo && (
                  <p className="mt-1 text-sm text-red-600">{errors.logo}</p>
                )}
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Informations générales
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise *
                </label>
                <input
                  type="text"
                  value={companyData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                    errors.company_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Nom de votre entreprise"
                />
                {errors.company_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.company_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de contact *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={companyData.company_email}
                    onChange={(e) => handleInputChange('company_email', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      errors.company_email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="contact@entreprise.com"
                  />
                </div>
                {errors.company_email && (
                  <p className="mt-1 text-sm text-red-600">{errors.company_email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={companyData.company_phone}
                    onChange={(e) => handleInputChange('company_phone', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      errors.company_phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
                {errors.company_phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.company_phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Devise par défaut *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    value={companyData.default_currency}
                    onChange={(e) => handleInputChange('default_currency', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.name} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedCurrency && (
                  <p className="text-sm text-gray-500 mt-1">
                    Exemple de formatage : {selectedCurrency.position === 'before' ? selectedCurrency.symbol : ''}1{selectedCurrency.thousandsSeparator}234{selectedCurrency.decimals > 0 ? selectedCurrency.decimalSeparator + '56' : ''}{selectedCurrency.position === 'after' ? ' ' + selectedCurrency.symbol : ''}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse complète *
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
                <textarea
                  value={companyData.company_address}
                  onChange={(e) => handleInputChange('company_address', e.target.value)}
                  rows={3}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                    errors.company_address ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Adresse complète de l'entreprise"
                />
              </div>
              {errors.company_address && (
                <p className="mt-1 text-sm text-red-600">{errors.company_address}</p>
              )}
            </div>
          </div>

          {/* Legal Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Informations légales
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro RCCM
                </label>
                <input
                  type="text"
                  value={companyData.company_rccm}
                  onChange={(e) => handleInputChange('company_rccm', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="RCCM/XX-X-XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro NCC
                </label>
                <input
                  type="text"
                  value={companyData.company_ncc}
                  onChange={(e) => handleInputChange('company_ncc', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="NCCXXXXXXXXX"
                />
              </div>
            </div>
          </div>

          {/* Signature Section - Responsive */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <PenTool className="h-5 w-5 mr-2" />
              Signature (ajoutée automatiquement aux devis)
            </h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Signature automatique :</strong> Une fois enregistrée, votre signature sera automatiquement ajoutée à tous les nouveaux devis avec la date du jour.
              </p>
            </div>

            {/* Signature Mode Selection */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                type="button"
                onClick={() => setSignatureMode('draw')}
                className={`flex items-center px-3 sm:px-4 py-2 rounded-lg border transition-colors duration-200 ${
                  signatureMode === 'draw'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <PenTool className="h-4 w-4 mr-2" />
                Dessiner
              </button>
              <button
                type="button"
                onClick={() => setSignatureMode('upload')}
                className={`flex items-center px-3 sm:px-4 py-2 rounded-lg border transition-colors duration-200 ${
                  signatureMode === 'upload'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Image className="h-4 w-4 mr-2" />
                Importer image
              </button>
            </div>

            {/* Draw Mode - Responsive */}
            {signatureMode === 'draw' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    className="w-full h-auto bg-white border border-gray-200 rounded cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Dessinez votre signature dans la zone ci-dessus
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Effacer
                  </button>
                  <button
                    type="button"
                    onClick={saveSignature}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder la signature
                  </button>
                </div>

                {signatureError && (
                  <div className="flex items-center text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {signatureError}
                  </div>
                )}
              </div>
            )}

            {/* Upload Mode - Responsive */}
            {signatureMode === 'upload' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center bg-gray-50">
                  <input
                    type="file"
                    id="signature-upload"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="signature-upload"
                    className="cursor-pointer inline-flex flex-col items-center"
                  >
                    <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-4" />
                    <span className="text-sm font-medium text-gray-700 mb-2">
                      Cliquez pour importer une image de signature
                    </span>
                    <span className="text-xs text-gray-500">
                      JPG, PNG ou GIF. Taille maximale : 1MB
                    </span>
                  </label>
                </div>

                {signatureError && (
                  <div className="flex items-center text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {signatureError}
                  </div>
                )}
              </div>
            )}

            {/* Signature Preview - Responsive */}
            {(signaturePreview || companyData.company_signature) && (
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Aperçu de la signature</h4>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <img
                    src={signaturePreview || companyData.company_signature || ''}
                    alt="Signature"
                    className="max-h-32 mx-auto"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={downloadSignature}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </button>
                  <button
                    type="button"
                    onClick={removeSignature}
                    className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* VAT Settings - Responsive */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Configuration TVA</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Activer la TVA</h4>
                  <p className="text-sm text-gray-500">Inclure la TVA dans vos devis et factures</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={companyData.vat_enabled}
                    onChange={(e) => handleInputChange('vat_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {companyData.vat_enabled && (
                <div className="ml-0 sm:ml-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taux de TVA (%)
                  </label>
                  <div className="relative w-full sm:w-32">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={companyData.vat_rate}
                      onChange={(e) => handleInputChange('vat_rate', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.vat_rate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">%</span>
                    </div>
                  </div>
                  {errors.vat_rate && (
                    <p className="mt-1 text-sm text-red-600">{errors.vat_rate}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Sauvegarde en cours...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Sauvegarder les paramètres
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanySettings;