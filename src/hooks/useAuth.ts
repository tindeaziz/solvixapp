import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authService } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer l'utilisateur actuel au chargement
    const getInitialUser = async () => {
      try {
        const { user } = await authService.getCurrentUser();
        setUser(user);
        
        // VÉRIFICATION CRITIQUE : Log de l'ID utilisateur dans le hook
        if (user) {
          console.log('🔐 HOOK AUTH - User ID récupéré:', user.id);
          console.log('📧 HOOK AUTH - Email:', user.email);
        } else {
          console.log('❌ HOOK AUTH - Aucun utilisateur connecté');
        }
      } catch (error) {
        console.error('❌ HOOK AUTH - Erreur lors de la récupération de l\'utilisateur:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 HOOK AUTH - Changement d\'état:', event);
        
        if (session?.user) {
          console.log('👤 HOOK AUTH - Nouvelle session User ID:', session.user.id);
          console.log('📧 HOOK AUTH - Email session:', session.user.email);
        } else {
          console.log('❌ HOOK AUTH - Session fermée');
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    console.log('🔐 HOOK AUTH - Tentative de connexion pour:', email);
    
    try {
      const { data, error } = await authService.signIn(email, password);
      if (error) {
        console.error('❌ HOOK AUTH - Erreur de connexion:', error.message);
        throw error;
      }
      
      if (data?.user) {
        console.log('✅ HOOK AUTH - Connexion réussie User ID:', data.user.id);
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('❌ HOOK AUTH - Exception lors de la connexion:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    setLoading(true);
    console.log('📝 HOOK AUTH - Tentative d\'inscription pour:', email);
    
    try {
      const { data, error } = await authService.signUp(email, password, metadata);
      if (error) {
        console.error('❌ HOOK AUTH - Erreur d\'inscription:', error.message);
        throw error;
      }
      
      if (data?.user) {
        console.log('✅ HOOK AUTH - Inscription réussie User ID:', data.user.id);
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('❌ HOOK AUTH - Exception lors de l\'inscription:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    console.log('🚪 HOOK AUTH - Déconnexion en cours...');
    
    try {
      const { error } = await authService.signOut();
      if (error) {
        console.error('❌ HOOK AUTH - Erreur de déconnexion:', error.message);
        throw error;
      }
      
      console.log('✅ HOOK AUTH - Déconnexion réussie');
      setUser(null);
      setSession(null);
      return { error: null };
    } catch (error) {
      console.error('❌ HOOK AUTH - Exception lors de la déconnexion:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    console.log('🔄 HOOK AUTH - Réinitialisation mot de passe pour:', email);
    
    try {
      const { data, error } = await authService.resetPassword(email);
      if (error) {
        console.error('❌ HOOK AUTH - Erreur réinitialisation:', error.message);
      } else {
        console.log('✅ HOOK AUTH - Email de réinitialisation envoyé');
      }
      return { data, error };
    } catch (error) {
      console.error('❌ HOOK AUTH - Exception réinitialisation:', error);
      return { data: null, error };
    }
  };

  // VÉRIFICATION CRITIQUE : Log de l'état actuel à chaque rendu
  useEffect(() => {
    if (user) {
      console.log('🔍 HOOK AUTH - État actuel User ID:', user.id, 'Loading:', loading);
    }
  }, [user, loading]);

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!user
  };
};