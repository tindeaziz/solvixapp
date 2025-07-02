import DOMPurify from 'dompurify';

// Configuration sécurisée de DOMPurify
const purifyConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
  FORCE_BODY: false
};

// Nettoyer et valider les entrées utilisateur
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Nettoyer avec DOMPurify
  const cleaned = DOMPurify.sanitize(input.trim(), purifyConfig);
  
  // Limiter la longueur
  return cleaned.slice(0, 1000);
};

// Validation d'email sécurisée
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email) && 
         email.length >= 5 && 
         email.length <= 254 &&
         !email.includes('..') &&
         !email.startsWith('.') &&
         !email.endsWith('.');
};

// Validation de numéro de téléphone
export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  
  // Nettoyer le numéro (garder seulement les chiffres et le +)
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // Vérifier le format international
  const phoneRegex = /^\+?[1-9]\d{7,14}$/;
  
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 8 && cleanPhone.length <= 15;
};

// Validation de nom/prénom
export const validateName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  
  const cleanName = name.trim();
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;
  
  return nameRegex.test(cleanName) && 
         cleanName.length >= 2 && 
         cleanName.length <= 50 &&
         !cleanName.includes('  '); // Pas de doubles espaces
};

// Validation de mot de passe
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Le mot de passe est requis');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Au moins 8 caractères');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Au moins une minuscule');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Au moins une majuscule');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Au moins un chiffre');
  }
  
  if (password.length > 128) {
    errors.push('Maximum 128 caractères');
  }
  
  // Vérifier les caractères dangereux
  if (/[<>\"'&]/.test(password)) {
    errors.push('Caractères non autorisés détectés');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation de code d'activation
export const validateActivationCode = (code: string): boolean => {
  if (!code || typeof code !== 'string') return false;
  
  const cleanCode = code.trim().toUpperCase();
  
  // Format attendu: SOLVIX-XXXXXXXX
  const codeRegex = /^SOLVIX-[A-Z0-9]{8}$/;
  
  return codeRegex.test(cleanCode) && 
         cleanCode.length >= 10 && 
         cleanCode.length <= 20;
};

// Nettoyer les données de formulaire
export const sanitizeFormData = <T extends Record<string, any>>(data: T): T => {
  const sanitized = {} as T;
  
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeInput(value) as T[keyof T];
    } else if (Array.isArray(value)) {
      // Traiter les tableaux (comme les items de devis)
      sanitized[key as keyof T] = value.map(item => {
        if (typeof item === 'object' && item !== null) {
          return sanitizeFormData(item);
        }
        return item;
      }) as T[keyof T];
    } else if (typeof value === 'object' && value !== null) {
      // Traiter les objets imbriqués (comme client)
      sanitized[key as keyof T] = sanitizeFormData(value) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  });
  
  return sanitized;
};

// Validation générique avec règles personnalisées
export const validateWithRules = <T>(
  value: T, 
  rules: Array<(val: T) => string | null>
): { isValid: boolean; error: string | null } => {
  for (const rule of rules) {
    const error = rule(value);
    if (error) {
      return { isValid: false, error };
    }
  }
  
  return { isValid: true, error: null };
};

// Règles de validation communes
export const validationRules = {
  required: (value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'Ce champ est requis';
    }
    return null;
  },
  
  minLength: (min: number) => (value: string) => {
    if (value && value.length < min) {
      return `Minimum ${min} caractères requis`;
    }
    return null;
  },
  
  maxLength: (max: number) => (value: string) => {
    if (value && value.length > max) {
      return `Maximum ${max} caractères autorisés`;
    }
    return null;
  },
  
  email: (value: string) => {
    if (value && !validateEmail(value)) {
      return 'Format d\'email invalide';
    }
    return null;
  },
  
  phone: (value: string) => {
    if (value && !validatePhoneNumber(value)) {
      return 'Format de téléphone invalide';
    }
    return null;
  },
  
  name: (value: string) => {
    if (value && !validateName(value)) {
      return 'Nom invalide (2-50 caractères, lettres uniquement)';
    }
    return null;
  }
};