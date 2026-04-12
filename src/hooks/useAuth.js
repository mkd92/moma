import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { cacheClear } from '../cache';
import { useToast } from './useToast';

export function useAuth() {
  const { showToast } = useToast();
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const userIdRef = useRef(null);

  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession) userIdRef.current = initialSession.user.id;
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        userIdRef.current = currentSession.user.id;
      } else {
        userIdRef.current = null;
      }
      setIsLoading(false);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const { error } = authMode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    
    if (error) {
      setAuthError(error.message);
      showToast(error.message, 'error');
    } else if (authMode === 'signup') {
      showToast('Verification email sent!', 'success');
      setAuthError('Check your email to verify your account.');
    } else {
      showToast('Welcome back', 'success');
    }
    setAuthLoading(false);
  };

  const handleGoogleSignIn = useCallback(async () => {
    await supabase.auth.signInWithOAuth({ 
      provider: 'google', 
      options: { redirectTo: window.location.origin } 
    });
  }, []);

  const handleLogout = useCallback(async () => {
    if (userIdRef.current) {
      cacheClear(userIdRef.current);
      userIdRef.current = null;
    }
    const { error } = await supabase.auth.signOut();
    if (!error) {
      showToast('Signed out successfully', 'info');
    } else {
      showToast('Sign out failed', 'error');
    }
  }, [showToast]);

  return {
    session,
    setSession,
    isLoading,
    userIdRef,
    authMode,
    setAuthMode,
    email,
    setEmail,
    password,
    setPassword,
    authLoading,
    authError,
    setAuthError,
    handleAuth,
    handleGoogleSignIn,
    handleLogout
  };
}
