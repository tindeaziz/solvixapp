import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour TypeScript
export interface Profile {
  id: string;
  user_id: string;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_rccm: string;
  company_ncc: string;
  company_logo: string;
  company_signature: string;
  signature_type: 'drawn' | 'uploaded';
  vat_enabled: boolean;
  vat_rate: number;
  default_currency: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface Devis {
  id: string;
  user_id: string;
  client_id: string | null;
  quote_number: string;
  date_creation: string;
  date_expiration: string;
  currency: string;
  template: string;
  notes: string;
  status: 'Brouillon' | 'Envoyé' | 'En attente' | 'Accepté' | 'Refusé';
  subtotal_ht: number;
  total_vat: number;
  total_ttc: number;
  created_at: string;
  updated_at: string;
  client?: Client;
  articles?: ArticleDevis[];
}

export interface ArticleDevis {
  id: string;
  devis_id: string;
  designation: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  total_ht: number;
  order_index: number;
  created_at: string;
}

// Services d'authentification
export const authService = {
  // Connexion
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // VÉRIFICATION CRITIQUE : Log de l'ID utilisateur
    if (data?.user) {
      console.log('🔐 CONNEXION RÉUSSIE - User ID:', data.user.id);
      console.log('📧 Email utilisateur:', data.user.email);
    }
    
    return { data, error };
  },

  // Inscription
  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    
    // VÉRIFICATION CRITIQUE : Log de l'ID utilisateur
    if (data?.user) {
      console.log('✅ INSCRIPTION RÉUSSIE - User ID:', data.user.id);
      console.log('📧 Email utilisateur:', data.user.email);
    }
    
    return { data, error };
  },

  // Déconnexion
  async signOut() {
    console.log('🚪 DÉCONNEXION UTILISATEUR');
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Récupérer l'utilisateur actuel
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // VÉRIFICATION CRITIQUE : Log de l'ID utilisateur
    if (user) {
      console.log('👤 UTILISATEUR ACTUEL - User ID:', user.id);
      console.log('📧 Email utilisateur:', user.email);
    } else {
      console.log('❌ AUCUN UTILISATEUR CONNECTÉ');
    }
    
    return { user, error };
  },

  // Écouter les changements d'authentification
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 CHANGEMENT AUTH STATE:', event);
      if (session?.user) {
        console.log('👤 Session User ID:', session.user.id);
      }
      callback(event, session);
    });
  },

  // Réinitialiser le mot de passe
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    console.log('📧 RESET_PASSWORD - Email envoyé à:', email);
    console.log('🔗 RESET_PASSWORD - URL de redirection:', `${window.location.origin}/reset-password`);
    
    return { data, error };
  }
};

// Services pour les profils entreprise
export const profileService = {
  // Récupérer le profil de l'utilisateur connecté
  async getProfile() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { data: null, error: userError };
    }
    
    if (!user) {
      console.log('❌ AUCUN UTILISATEUR CONNECTÉ pour récupérer le profil');
      return { data: null, error: new Error('Utilisateur non connecté') };
    }
    
    console.log('🔍 RÉCUPÉRATION PROFIL pour User ID:', user.id);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id) // FILTRAGE OBLIGATOIRE PAR USER_ID
      .single();
    
    console.log('📊 PROFIL RÉCUPÉRÉ:', data ? 'Trouvé' : 'Non trouvé');
    if (error) console.error('❌ ERREUR PROFIL:', error);
    
    return { data, error };
  },

  // Mettre à jour le profil
  async updateProfile(updates: Partial<Profile>) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { data: null, error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour mettre à jour le profil');
      return { data: null, error: new Error('Utilisateur non connecté') };
    }
    
    console.log('💾 MISE À JOUR PROFIL pour User ID:', user.id);
    console.log('📝 Données à mettre à jour:', Object.keys(updates));
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        user_id: user.id, // SÉCURITÉ: Forcer le user_id
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id) // FILTRAGE OBLIGATOIRE PAR USER_ID
      .select()
      .single();
    
    if (error) console.error('❌ ERREUR MISE À JOUR PROFIL:', error);
    else console.log('✅ PROFIL MIS À JOUR AVEC SUCCÈS');
    
    return { data, error };
  },

  // Créer un profil (normalement fait automatiquement)
  async createProfile(profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { data: null, error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour créer le profil');
      return { data: null, error: new Error('Utilisateur non connecté') };
    }
    
    console.log('🆕 CRÉATION PROFIL pour User ID:', user.id);
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        ...profile,
        user_id: user.id // SÉCURITÉ: Forcer le user_id
      })
      .select()
      .single();
    
    if (error) console.error('❌ ERREUR CRÉATION PROFIL:', error);
    else console.log('✅ PROFIL CRÉÉ AVEC SUCCÈS');
    
    return { data, error };
  }
};

// Services pour les clients
export const clientService = {
  // Récupérer tous les clients de l'utilisateur
  async getClients() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { data: null, error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour récupérer les clients');
      return { data: null, error: new Error('Utilisateur non connecté') };
    }
    
    console.log('🔍 RÉCUPÉRATION CLIENTS pour User ID:', user.id);
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id) // FILTRAGE OBLIGATOIRE PAR USER_ID
      .order('name');
    
    console.log('👥 CLIENTS RÉCUPÉRÉS:', data?.length || 0, 'clients trouvés');
    if (error) console.error('❌ ERREUR CLIENTS:', error);
    
    return { data, error };
  },

  // Récupérer un client par ID
  async getClient(id: string) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { data: null, error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour récupérer le client');
      return { data: null, error: new Error('Utilisateur non connecté') };
    }
    
    console.log('🔍 RÉCUPÉRATION CLIENT ID:', id, 'pour User ID:', user.id);
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // SÉCURITÉ: Double filtrage
      .single();
    
    if (error) console.error('❌ ERREUR CLIENT:', error);
    else console.log('👤 CLIENT RÉCUPÉRÉ:', data ? 'Trouvé' : 'Non trouvé');
    
    return { data, error };
  },

  // Créer un nouveau client
  async createClient(client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { data: null, error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour créer le client');
      return { data: null, error: new Error('Utilisateur non connecté') };
    }
    
    console.log('🆕 CRÉATION CLIENT pour User ID:', user.id);
    console.log('📝 Données client:', client.name, client.company);
    
    const { data, error } = await supabase
      .from('clients')
      .insert({ 
        ...client, 
        user_id: user.id // SÉCURITÉ: Forcer le user_id
      })
      .select()
      .single();
    
    if (error) console.error('❌ ERREUR CRÉATION CLIENT:', error);
    else console.log('✅ CLIENT CRÉÉ AVEC SUCCÈS');
    
    return { data, error };
  },

  // Mettre à jour un client
  async updateClient(id: string, updates: Partial<Client>) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { data: null, error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour mettre à jour le client');
      return { data: null, error: new Error('Utilisateur non connecté') };
    }
    
    console.log('💾 MISE À JOUR CLIENT ID:', id, 'pour User ID:', user.id);
    
    const { data, error } = await supabase
      .from('clients')
      .update({
        ...updates,
        user_id: user.id, // SÉCURITÉ: Forcer le user_id
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // SÉCURITÉ: Double filtrage
      .select()
      .single();
    
    if (error) console.error('❌ ERREUR MISE À JOUR CLIENT:', error);
    else console.log('✅ CLIENT MIS À JOUR AVEC SUCCÈS');
    
    return { data, error };
  },

  // Supprimer un client
  async deleteClient(id: string) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour supprimer le client');
      return { error: new Error('Utilisateur non connecté') };
    }
    
    console.log('🗑️ SUPPRESSION CLIENT ID:', id, 'pour User ID:', user.id);
    
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // SÉCURITÉ: Double filtrage
    
    if (error) console.error('❌ ERREUR SUPPRESSION CLIENT:', error);
    else console.log('✅ CLIENT SUPPRIMÉ AVEC SUCCÈS');
    
    return { error };
  },

  // Rechercher des clients
  async searchClients(query: string) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { data: null, error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour rechercher les clients');
      return { data: null, error: new Error('Utilisateur non connecté') };
    }
    
    console.log('🔍 RECHERCHE CLIENTS:', query, 'pour User ID:', user.id);
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id) // FILTRAGE OBLIGATOIRE PAR USER_ID
      .or(`name.ilike.%${query}%,company.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name');
    
    console.log('🔍 RÉSULTATS RECHERCHE:', data?.length || 0, 'clients trouvés');
    if (error) console.error('❌ ERREUR RECHERCHE:', error);
    
    return { data, error };
  }
};

// Services pour les devis
export const devisService = {
  // Récupérer tous les devis de l'utilisateur
  async getDevis() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { data: null, error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour récupérer les devis');
      return { data: null, error: new Error('Utilisateur non connecté') };
    }
    
    console.log('🔍 RÉCUPÉRATION DEVIS pour User ID:', user.id);
    
    const { data, error } = await supabase
      .from('devis')
      .select(`
        *,
        client:clients(*),
        articles:articles_devis(*)
      `)
      .eq('user_id', user.id) // FILTRAGE OBLIGATOIRE PAR USER_ID
      .order('created_at', { ascending: false });
    
    console.log('📄 DEVIS RÉCUPÉRÉS:', data?.length || 0, 'devis trouvés');
    if (error) console.error('❌ ERREUR DEVIS:', error);
    
    return { data, error };
  },

  // Récupérer un devis par ID
  async getDevisById(id: string) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { data: null, error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour récupérer le devis');
      return { data: null, error: new Error('Utilisateur non connecté') };
    }
    
    console.log('🔍 RÉCUPÉRATION DEVIS ID:', id, 'pour User ID:', user.id);
    
    const { data, error } = await supabase
      .from('devis')
      .select(`
        *,
        client:clients(*),
        articles:articles_devis(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id) // SÉCURITÉ: Double filtrage
      .single();
    
    if (error) console.error('❌ ERREUR DEVIS:', error);
    else console.log('📄 DEVIS RÉCUPÉRÉ:', data ? 'Trouvé' : 'Non trouvé');
    
    return { data, error };
  },

  // Créer un nouveau devis
  async createDevis(devis: Omit<Devis, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { data: null, error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour créer le devis');
      return { data: null, error: new Error('Utilisateur non connecté') };
    }
    
    console.log('🆕 CRÉATION DEVIS pour User ID:', user.id);
    console.log('📝 Numéro devis:', devis.quote_number);
    
    const { data, error } = await supabase
      .from('devis')
      .insert({ 
        ...devis, 
        user_id: user.id // SÉCURITÉ: Forcer le user_id
      })
      .select()
      .single();
    
    if (error) console.error('❌ ERREUR CRÉATION DEVIS:', error);
    else console.log('✅ DEVIS CRÉÉ AVEC SUCCÈS');
    
    return { data, error };
  },

  // Mettre à jour un devis
  async updateDevis(id: string, updates: Partial<Devis>) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { data: null, error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour mettre à jour le devis');
      return { data: null, error: new Error('Utilisateur non connecté') };
    }
    
    console.log('💾 MISE À JOUR DEVIS ID:', id, 'pour User ID:', user.id);
    
    const { data, error } = await supabase
      .from('devis')
      .update({
        ...updates,
        user_id: user.id, // SÉCURITÉ: Forcer le user_id
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // SÉCURITÉ: Double filtrage
      .select()
      .single();
    
    if (error) console.error('❌ ERREUR MISE À JOUR DEVIS:', error);
    else console.log('✅ DEVIS MIS À JOUR AVEC SUCCÈS');
    
    return { data, error };
  },

  // Supprimer un devis
  async deleteDevis(id: string) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour supprimer le devis');
      return { error: new Error('Utilisateur non connecté') };
    }
    
    console.log('🗑️ SUPPRESSION DEVIS ID:', id, 'pour User ID:', user.id);
    
    const { error } = await supabase
      .from('devis')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // SÉCURITÉ: Double filtrage
    
    if (error) console.error('❌ ERREUR SUPPRESSION DEVIS:', error);
    else console.log('✅ DEVIS SUPPRIMÉ AVEC SUCCÈS');
    
    return { error };
  },

  // Générer un numéro de devis unique
  async generateQuoteNumber() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      throw new Error('Utilisateur non connecté');
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour générer le numéro');
      throw new Error('Utilisateur non connecté');
    }
    
    const year = new Date().getFullYear();
    console.log('🔢 GÉNÉRATION NUMÉRO DEVIS pour User ID:', user.id, 'Année:', year);
    
    const { data, error } = await supabase
      .from('devis')
      .select('quote_number')
      .eq('user_id', user.id) // FILTRAGE OBLIGATOIRE PAR USER_ID
      .like('quote_number', `DEV-${year}-%`)
      .order('quote_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ ERREUR GÉNÉRATION NUMÉRO:', error);
      return `DEV-${year}-001`;
    }

    if (!data || data.length === 0) {
      console.log('🆕 PREMIER DEVIS DE L\'ANNÉE');
      return `DEV-${year}-001`;
    }

    const lastNumber = data[0].quote_number;
    const match = lastNumber.match(/DEV-\d{4}-(\d+)/);
    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      const newNumber = `DEV-${year}-${nextNumber.toString().padStart(3, '0')}`;
      console.log('🔢 NOUVEAU NUMÉRO GÉNÉRÉ:', newNumber);
      return newNumber;
    }

    return `DEV-${year}-001`;
  }
};

// Services pour les articles de devis
export const articleService = {
  // Récupérer les articles d'un devis
  async getArticlesByDevis(devisId: string) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { data: null, error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour récupérer les articles');
      return { data: null, error: new Error('Utilisateur non connecté') };
    }
    
    console.log('🔍 RÉCUPÉRATION ARTICLES pour Devis ID:', devisId, 'User ID:', user.id);
    
    // Vérifier d'abord que le devis appartient à l'utilisateur
    const { data: devisCheck } = await supabase
      .from('devis')
      .select('id')
      .eq('id', devisId)
      .eq('user_id', user.id)
      .single();
    
    if (!devisCheck) {
      console.error('❌ SÉCURITÉ: Tentative d\'accès à un devis non autorisé');
      return { data: null, error: new Error('Accès non autorisé à ce devis') };
    }
    
    const { data, error } = await supabase
      .from('articles_devis')
      .select('*')
      .eq('devis_id', devisId)
      .order('order_index');
    
    console.log('📦 ARTICLES RÉCUPÉRÉS:', data?.length || 0, 'articles trouvés');
    if (error) console.error('❌ ERREUR ARTICLES:', error);
    
    return { data, error };
  },

  // Créer un nouvel article
  async createArticle(article: Omit<ArticleDevis, 'id' | 'created_at'>) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { data: null, error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour créer l\'article');
      return { data: null, error: new Error('Utilisateur non connecté') };
    }
    
    console.log('🆕 CRÉATION ARTICLE pour Devis ID:', article.devis_id, 'User ID:', user.id);
    
    // Vérifier d'abord que le devis appartient à l'utilisateur
    const { data: devisCheck } = await supabase
      .from('devis')
      .select('id')
      .eq('id', article.devis_id)
      .eq('user_id', user.id)
      .single();
    
    if (!devisCheck) {
      console.error('❌ SÉCURITÉ: Tentative de création d\'article sur un devis non autorisé');
      return { data: null, error: new Error('Accès non autorisé à ce devis') };
    }
    
    const { data, error } = await supabase
      .from('articles_devis')
      .insert(article)
      .select()
      .single();
    
    if (error) console.error('❌ ERREUR CRÉATION ARTICLE:', error);
    else console.log('✅ ARTICLE CRÉÉ AVEC SUCCÈS');
    
    return { data, error };
  },

  // Mettre à jour un article
  async updateArticle(id: string, updates: Partial<ArticleDevis>) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { data: null, error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour mettre à jour l\'article');
      return { data: null, error: new Error('Utilisateur non connecté') };
    }
    
    console.log('💾 MISE À JOUR ARTICLE ID:', id, 'User ID:', user.id);
    
    // Vérifier d'abord que l'article appartient à un devis de l'utilisateur
    const { data: articleCheck } = await supabase
      .from('articles_devis')
      .select(`
        id,
        devis:devis!inner(user_id)
      `)
      .eq('id', id)
      .single();
    
    if (!articleCheck || articleCheck.devis.user_id !== user.id) {
      console.error('❌ SÉCURITÉ: Tentative de modification d\'article non autorisé');
      return { data: null, error: new Error('Accès non autorisé à cet article') };
    }
    
    const { data, error } = await supabase
      .from('articles_devis')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) console.error('❌ ERREUR MISE À JOUR ARTICLE:', error);
    else console.log('✅ ARTICLE MIS À JOUR AVEC SUCCÈS');
    
    return { data, error };
  },

  // Supprimer un article
  async deleteArticle(id: string) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour supprimer l\'article');
      return { error: new Error('Utilisateur non connecté') };
    }
    
    console.log('🗑️ SUPPRESSION ARTICLE ID:', id, 'User ID:', user.id);
    
    // Vérifier d'abord que l'article appartient à un devis de l'utilisateur
    const { data: articleCheck } = await supabase
      .from('articles_devis')
      .select(`
        id,
        devis:devis!inner(user_id)
      `)
      .eq('id', id)
      .single();
    
    if (!articleCheck || articleCheck.devis.user_id !== user.id) {
      console.error('❌ SÉCURITÉ: Tentative de suppression d\'article non autorisé');
      return { error: new Error('Accès non autorisé à cet article') };
    }
    
    const { error } = await supabase
      .from('articles_devis')
      .delete()
      .eq('id', id);
    
    if (error) console.error('❌ ERREUR SUPPRESSION ARTICLE:', error);
    else console.log('✅ ARTICLE SUPPRIMÉ AVEC SUCCÈS');
    
    return { error };
  },

  // FONCTION CORRIGÉE : Créer plusieurs articles en une fois
  async createMultipleArticles(articles: Omit<ArticleDevis, 'id' | 'created_at'>[]) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { data: null, error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour créer les articles');
      return { data: null, error: new Error('Utilisateur non connecté') };
    }
    
    console.log('🆕 CRÉATION MULTIPLE ARTICLES:', articles.length, 'articles pour User ID:', user.id);
    
    // Vérifier que tous les devis appartiennent à l'utilisateur
    const devisIds = [...new Set(articles.map(a => a.devis_id))];
    const { data: devisCheck } = await supabase
      .from('devis')
      .select('id')
      .in('id', devisIds)
      .eq('user_id', user.id);
    
    if (!devisCheck || devisCheck.length !== devisIds.length) {
      console.error('❌ SÉCURITÉ: Tentative de création d\'articles sur des devis non autorisés');
      return { data: null, error: new Error('Accès non autorisé à certains devis') };
    }
    
    // CORRECTION : Utiliser une insertion simple sans colonnes ambiguës
    try {
      console.log('📝 INSERTION ARTICLES - Données à insérer:', articles);
      
      // Insérer les articles un par un pour éviter les problèmes d'ambiguïté
      const insertedArticles = [];
      
      for (const article of articles) {
        const { data: insertedArticle, error: insertError } = await supabase
          .from('articles_devis')
          .insert({
            devis_id: article.devis_id,
            designation: article.designation,
            quantity: article.quantity,
            unit_price: article.unit_price,
            vat_rate: article.vat_rate,
            total_ht: article.total_ht,
            order_index: article.order_index
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('❌ ERREUR INSERTION ARTICLE:', insertError);
          throw insertError;
        }
        
        if (insertedArticle) {
          insertedArticles.push(insertedArticle);
        }
      }
      
      console.log('✅ ARTICLES CRÉÉS AVEC SUCCÈS:', insertedArticles.length, 'articles');
      return { data: insertedArticles, error: null };
      
    } catch (error) {
      console.error('❌ ERREUR CRÉATION MULTIPLE ARTICLES:', error);
      return { data: null, error };
    }
  },

  // Supprimer tous les articles d'un devis
  async deleteArticlesByDevis(devisId: string) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ ERREUR RÉCUPÉRATION UTILISATEUR:', userError);
      return { error: userError };
    }
    
    if (!user) {
      console.error('❌ ERREUR CRITIQUE: Aucun utilisateur connecté pour supprimer les articles');
      return { error: new Error('Utilisateur non connecté') };
    }
    
    console.log('🗑️ SUPPRESSION TOUS ARTICLES pour Devis ID:', devisId, 'User ID:', user.id);
    
    // Vérifier d'abord que le devis appartient à l'utilisateur
    const { data: devisCheck } = await supabase
      .from('devis')
      .select('id')
      .eq('id', devisId)
      .eq('user_id', user.id)
      .single();
    
    if (!devisCheck) {
      console.error('❌ SÉCURITÉ: Tentative de suppression d\'articles sur un devis non autorisé');
      return { error: new Error('Accès non autorisé à ce devis') };
    }
    
    const { error } = await supabase
      .from('articles_devis')
      .delete()
      .eq('devis_id', devisId);
    
    if (error) console.error('❌ ERREUR SUPPRESSION ARTICLES:', error);
    else console.log('✅ TOUS LES ARTICLES SUPPRIMÉS AVEC SUCCÈS');
    
    return { error };
  }
};