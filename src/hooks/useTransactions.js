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
      // PostgREST caps every response at ~1000 rows. We MUST paginate, or
      // accounts with many transactions compute balances on partial data
      // (the newest 1000 only), silently dropping older rows. We also order
      // by `id` as the final tiebreaker: many rows share an identical
      // created_at (e.g. a bulk-imported batch), and range pagination over a
      // non-unique sort key can skip or duplicate rows across page boundaries.
      const PAGE = 1000;
      const SELECT_FULL = 'id, user_id, amount, type, note, transaction_date, created_at, category_id, party_id, account_id, transfer_id, categories(name, icon), parties(name), accounts(name), transaction_tags(tag_id, tags(id, name))';
      const SELECT_FALLBACK = 'id, user_id, amount, type, note, transaction_date, created_at, category_id, party_id, account_id, transfer_id, categories(name, icon), parties(name), accounts(name)';

      let select = SELECT_FULL;
      let from = 0;
      const all = [];

      while (true) {
        let { data, error } = await supabase
          .from('transactions')
          .select(select)
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(from, from + PAGE - 1);

        // Older schemas without the transaction_tags relation: retry this page
        // with the reduced select, then continue paginating normally.
        if (error && error.code === 'PGRST200' && select === SELECT_FULL) {
          select = SELECT_FALLBACK;
          continue;
        }

        if (error) {
          console.error('Error fetching transactions:', error);
          showToast('Could not load transactions. Pull down to retry.', 'error');
          return;
        }

        const batch = data || [];
        all.push(...batch);
        if (batch.length < PAGE) break;   // last (partial) page reached
        from += PAGE;
      }

      setTransactions(all);
      if (userId) cacheSet(userId, 'transactions', all);
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
