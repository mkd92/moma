import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { CURRENCY_SYMBOLS } from '../constants';
import { useToast } from './useToast';

export function useProfile() {
  const { showToast } = useToast();
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [defaultAccountId, setDefaultAccountId] = useState(null);

  const fetchProfile = useCallback(async (activeSession) => {
    if (!activeSession) return;
    const { data } = await supabase.from('profiles').select('currency_preference, default_account_id').eq('id', activeSession.user.id).maybeSingle();
    if (data?.currency_preference) {
      setCurrencyCode(data.currency_preference);
      setCurrencySymbol(CURRENCY_SYMBOLS[data.currency_preference] || '$');
    }
    if (data?.default_account_id) setDefaultAccountId(data.default_account_id);
  }, []);

  const handleSetDefaultAccount = useCallback(async (session, accountId) => {
    if (!session) return;
    const { error } = await supabase.from('profiles')
      .update({ default_account_id: accountId }).eq('id', session.user.id);
    if (!error) {
      setDefaultAccountId(accountId);
      showToast('Default account updated', 'success');
    } else {
      showToast('Failed to set default account', 'error');
    }
    return error;
  }, [showToast]);

  return {
    currencySymbol, setCurrencySymbol,
    currencyCode, setCurrencyCode,
    defaultAccountId, setDefaultAccountId,
    fetchProfile,
    handleSetDefaultAccount
  };
}
