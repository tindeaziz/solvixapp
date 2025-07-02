import { useState, useCallback } from 'react';
import { sanitizeInput, sanitizeFormData } from '../utils/sanitizer';

// Type pour les règles de validation
type ValidationRule<T> = (value: T) => string | null;
type ValidationRules<T> = Partial<Record<keyof T, ValidationRule<T[keyof T]>>>;

// Hook pour la gestion sécurisée des formulaires
export const useSecureForm = <T extends Record<string, any>>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mettre à jour une valeur avec nettoyage automatique
  const setValue = useCallback((key: keyof T, value: any) => {
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
    
    setValues(prev => ({ ...prev, [key]: sanitizedValue }));
    
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  }, [errors]);

  // Marquer un champ comme touché
  const setFieldTouched = useCallback((key: keyof T, isTouched = true) => {
    setTouched(prev => ({ ...prev, [key]: isTouched }));
  }, []);

  // Valider un champ spécifique
  const validateField = useCallback((
    key: keyof T, 
    rules: ValidationRule<T[keyof T]>[]
  ): boolean => {
    const value = values[key];
    
    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        setErrors(prev => ({ ...prev, [key]: error }));
        return false;
      }
    }
    
    setErrors(prev => ({ ...prev, [key]: undefined }));
    return true;
  }, [values]);

  // Valider tout le formulaire
  const validateForm = useCallback((validationRules: ValidationRules<T>): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    // Nettoyer d'abord toutes les données
    const sanitizedValues = sanitizeFormData(values);
    setValues(sanitizedValues);

    // Valider chaque champ
    Object.entries(validationRules).forEach(([key, validator]) => {
      if (validator) {
        const error = validator(sanitizedValues[key as keyof T]);
        if (error) {
          newErrors[key as keyof T] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    
    // Marquer tous les champs comme touchés
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as Partial<Record<keyof T, boolean>>);
    setTouched(allTouched);

    return isValid;
  }, [values]);

  // Réinitialiser le formulaire
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Gérer la soumission du formulaire
  const handleSubmit = useCallback(async (
    validationRules: ValidationRules<T>,
    onSubmit: (values: T) => Promise<void> | void
  ) => {
    setIsSubmitting(true);
    
    try {
      if (validateForm(validationRules)) {
        await onSubmit(values);
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, values]);

  // Obtenir les propriétés d'un champ pour l'input
  const getFieldProps = useCallback((key: keyof T) => ({
    value: values[key] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValue(key, e.target.value);
    },
    onBlur: () => setFieldTouched(key),
    error: touched[key] ? errors[key] : undefined,
    hasError: Boolean(touched[key] && errors[key])
  }), [values, errors, touched, setValue, setFieldTouched]);

  // Vérifier si le formulaire est valide
  const isValid = useCallback(() => {
    return Object.keys(errors).length === 0 && Object.keys(touched).length > 0;
  }, [errors, touched]);

  // Vérifier si le formulaire a été modifié
  const isDirty = useCallback(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setFieldTouched,
    validateField,
    validateForm,
    resetForm,
    handleSubmit,
    getFieldProps,
    isValid,
    isDirty,
    setValues,
    setErrors,
    setIsSubmitting
  };
};

// Hook spécialisé pour les formulaires de devis
export const useQuoteForm = () => {
  const initialValues = {
    clientName: '',
    clientCompany: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    items: [{
      designation: '',
      quantity: 1,
      unitPrice: 0,
      vatRate: 20
    }],
    notes: '',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };

  return useSecureForm(initialValues);
};

// Hook pour les formulaires d'authentification
export const useAuthForm = () => {
  const initialValues = {
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    companyName: ''
  };

  return useSecureForm(initialValues);
};