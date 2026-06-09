import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { cacheSet } from '../cache';
import { useToast } from './useToast';

export function useTransactions() {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = useCallback(async (userId) => {
    setIsLoading(true);
    try {
      let { data, error } = await supabase
        .from('transactions')
        .select('id, user_id, amount, type, note, transaction_date, created_at, category_id, party_id, account_id, transfer_id, categories(name, icon), parties(name), accounts(name), transaction_tags(tag_id, tags(id, name))')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error && error.code === 'PGRST200') {
        ({ data, error } = await supabase
          .from('transactions')
          .select('id, user_id, amount, type, note, transaction_date, created_at, category_id, party_id, account_id, transfer_id, categories(name, icon), parties(name), accounts(name)')
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false }));
      }

      if (error) {
        console.error('Error fetching transactions:', error);
        showToast('Could not load transactions. Pull down to retry.', 'error');
        return;
      }
      const txData = data || [];
      setTransactions(txData);
      if (userId) cacheSet(userId, 'transactions', txData);
    } catch (err) {
      console.error('Unexpected error fetching transactions:', err);
      showToast('Could not load transactions. Check your connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const handleDeleteTransaction = useCallback(async (session, t, onRefresh) => {
    if (!session) return;
    let error;
    if (t.transfer_id) {
      ({ error } = await supabase.from('transactions').delete().eq('transfer_id', t.transfer_id));
    } else {
      await supabase.from('transaction_tags').delete().eq('transaction_id', t.id);
      ({ error } = await supabase.from('transactions').delete().eq('id', t.id));
    }
    
    if (!error) {
      showToast('Entry removed', 'info');
      if (onRefresh) onRefresh();
    } else {
      showToast('Failed to remove entry', 'error');
    }
  }, [showToast]);

  const handleBulkAssignCategory = useCallback(async (session, category_id, txIds, onRefresh) => {
    if (!session || !txIds || txIds.size === 0 || !category_id) return;
    const { error } = await Promise.all([...txIds].map(id =>
      supabase.from("transactions").update({ category_id }).eq("id", id)
    )).then(results => ({ error: results.find(r => r.error)?.error }));

    if (!error) {
      showToast(`${txIds.size} entries updated`, 'success');
      if (onRefresh) onRefresh();
    } else {
      showToast('Bulk update failed', 'error');
    }
  }, [showToast]);

  return {
    transactions, setTransactions,
    isLoading,
    fetchTransactions,
    handleDeleteTransaction,
    handleBulkAssignCategory
  };
}
