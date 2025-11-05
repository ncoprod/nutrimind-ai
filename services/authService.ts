import { supabase } from './supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

// Inscription avec email et mot de passe
export const signUpWithEmail = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<{ user: User | null; error: Error | null }> => {
  try {
    console.log('🔄 [signUpWithEmail] Starting signup for:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      console.error('❌ [signUpWithEmail] Signup error:', error);
      throw error;
    }
    
    console.log('✅ [signUpWithEmail] Signup successful, user:', data.user?.id);
    
    // Vérifier si une session a été créée (email confirmation désactivée)
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.warn('⚠️ [signUpWithEmail] No session after signup - email confirmation may be enabled');
      // Si pas de session, l'utilisateur doit confirmer son email
      // On retourne l'utilisateur mais signalera qu'il faut confirmer l'email
    }

    return { user: data.user, error: null };
  } catch (error) {
    console.error('❌ [signUpWithEmail] Error signing up:', error);
    return { user: null, error: error as Error };
  }
};

// Connexion avec email et mot de passe
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<{ user: User | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Error signing in:', error);
    return { user: null, error: error as Error };
  }
};

// Connexion avec Google
export const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return { error: error as Error };
  }
};

// Déconnexion
export const signOut = async (): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error: error as Error };
  }
};

// Récupérer l'utilisateur actuel
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Récupérer la session actuelle
export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

// Écouter les changements d'authentification
export const onAuthStateChange = (
  callback: (event: string, session: Session | null) => void
) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};

// Réinitialiser le mot de passe
export const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { error: error as Error };
  }
};

