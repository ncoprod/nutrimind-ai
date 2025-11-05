import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from '../services/authService';
import { useLanguage } from '../App';
import { supabase } from '../services/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userId: string) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        // Validation
        if (!firstName.trim() || !lastName.trim()) {
          setError(t('auth.errors.nameRequired'));
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError(t('auth.errors.passwordTooShort'));
          setIsLoading(false);
          return;
        }

        console.log('🔄 [AuthModal] Starting signup...');
        const { user, error: signUpError } = await signUpWithEmail(email, password, firstName, lastName);
        
        if (signUpError) {
          console.error('❌ [AuthModal] Signup error:', signUpError);
          setError(signUpError.message);
          setIsLoading(false);
          return;
        }

        if (user) {
          console.log('✅ [AuthModal] Signup successful, userId:', user.id);
          
          // Vérifier si l'utilisateur a une session active
          // Si pas de session, c'est que la confirmation email est requise
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            // Pas de session = email confirmation requise
            console.warn('⚠️ [AuthModal] Email confirmation required');
            setError(
              language === 'fr' 
                ? '✅ Compte créé ! Veuillez vérifier votre email et confirmer votre inscription, puis reconnectez-vous.'
                : '✅ Account created! Please check your email and confirm your registration, then sign in.'
            );
            setIsLoading(false);
            
            // Basculer automatiquement vers le mode connexion après 3 secondes
            setTimeout(() => {
              setMode('signin');
              setError(null);
            }, 3000);
          } else {
            // Session active = on peut continuer
            onAuthSuccess(user.id);
          }
        } else {
          console.error('❌ [AuthModal] No user returned from signup');
          setError(t('auth.errors.generic'));
          setIsLoading(false);
        }
      } else {
        console.log('🔄 [AuthModal] Starting signin...');
        const { user, error: signInError } = await signInWithEmail(email, password);
        
        if (signInError) {
          console.error('❌ [AuthModal] Signin error:', signInError);
          setError(signInError.message);
          setIsLoading(false);
          return;
        }

        if (user) {
          console.log('✅ [AuthModal] Signin successful, userId:', user.id);
          onAuthSuccess(user.id);
        } else {
          console.error('❌ [AuthModal] No user returned from signin');
          setError(t('auth.errors.generic'));
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error('❌ [AuthModal] Unexpected error:', err);
      setError(t('auth.errors.generic'));
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const { error: googleError } = await signInWithGoogle();
      
      if (googleError) {
        setError(googleError.message);
        setIsLoading(false);
      }
      // La redirection se fait automatiquement avec Google OAuth
    } catch (err) {
      setError(t('auth.errors.generic'));
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-8 relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Icon icon="solar:close-circle-bold" className="size-6" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold font-heading text-primary">
            {mode === 'signup' ? t('auth.signUp') : t('auth.signIn')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'signup' ? t('auth.signUpSubtitle') : t('auth.signInSubtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            <Icon icon="solar:danger-circle-bold" className="inline size-5 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t('auth.firstName')}
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-slate-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t('auth.lastName')}
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-slate-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-slate-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-slate-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              required
              minLength={6}
            />
            {mode === 'signup' && (
              <p className="text-xs text-muted-foreground mt-1">{t('auth.passwordHint')}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Icon icon="solar:loading-bold" className="size-5 animate-spin" />
                {t('auth.loading')}
              </>
            ) : (
              <>
                <Icon icon="solar:user-check-rounded-bold" className="size-5" />
                {mode === 'signup' ? t('auth.signUpButton') : t('auth.signInButton')}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">
            {mode === 'signup' ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
          </span>
          <button
            onClick={toggleMode}
            className="ml-2 text-primary font-semibold hover:underline"
          >
            {mode === 'signup' ? t('auth.signInLink') : t('auth.signUpLink')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

