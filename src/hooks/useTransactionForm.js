import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from './useToast';

export function useTransactionForm(session, accounts, categories, transactions, defaultAccountId, fetchTransactions, setView, resetFilters) {
  const { showToast } = useToast();
  const [txToEdit, setTxToEdit] = useState(null);
  const [txType, setTxType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [note, setNote] = useState('');
  const [txDate, setTxDate] = useState(() => localStorage.getItem('moma_last_tx_date') || new Date().toISOString().split('T')[0]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [transferFromAccount, setTransferFromAccount] = useState(null);
  const [transferToAccount, setTransferToAccount] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setTxToEdit(null);
    setAmount('');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedParty(null);
    setSelectedAccount(defaultAccountId || (accounts.length > 0 ? accounts[0].id : null));
    setNote('');
    setTxDate(localStorage.getItem('moma_last_tx_date') || new Date().toISOString().split('T')[0]);
    setSelectedTags([]);
    setTransferFromAccount(null);
    setTransferToAccount(null);
  }, [defaultAccountId, accounts]);

  const openEditTransaction = useCallback((t) => {
    setTxToEdit(t);
    setAmount(t.amount ? t.amount.toString() : '');
    setNote(t.note || '');
    setTxDate(t.transaction_date || (t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0]));

    if (t.transfer_id) {
      const pair = transactions.find(tx => tx.transfer_id === t.transfer_id && tx.id !== t.id);
      const expenseLeg = t.type === 'expense' ? t : pair;
      const incomeLeg = t.type === 'income' ? t : pair;
      setTxType('transfer');
      setTransferFromAccount(expenseLeg?.account_id || null);
      setTransferToAccount(incomeLeg?.account_id || null);
    } else {
      setTxType(t.type || 'expense');
      setSelectedCategory(t.category_id || null);
      setSelectedParty(t.party_id || null);
      setSelectedAccount(t.account_id || (accounts.length > 0 ? accounts[0].id : null));
      setSelectedTags((t.transaction_tags || []).map(tt => tt.tag_id));
    }
    setView('new_transaction');
  }, [transactions, accounts, setView]);

  const handleTransaction = useCallback(async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0 || !session) return;

    setIsSubmitting(true);
    try {
      if (txType === 'transfer') {
        if (!transferFromAccount || !transferToAccount || transferFromAccount === transferToAccount) {
          showToast('Invalid transfer accounts', 'error');
          setIsSubmitting(false);
          return;
        }
        const base = { amount: val, note: note.trim() || null, transaction_date: txDate, category_id: null, party_id: null };
        if (txToEdit?.transfer_id) {
          await supabase.from('transactions').update({ ...base, account_id: transferFromAccount }).eq('transfer_id', txToEdit.transfer_id).eq('type', 'expense');
          await supabase.from('transactions').update({ ...base, account_id: transferToAccount }).eq('transfer_id', txToEdit.transfer_id).eq('type', 'income');
        } else {
          if (txToEdit?.id && !txToEdit?.transfer_id) {
            await supabase.from('transaction_tags').delete().eq('transaction_id', txToEdit.id);
            await supabase.from('transactions').delete().eq('id', txToEdit.id);
          }
          const transferId = crypto.randomUUID();
          await supabase.from('transactions').insert([
            { ...base, type: 'expense', account_id: transferFromAccount, user_id: session.user.id, transfer_id: transferId },
            { ...base, type: 'income', account_id: transferToAccount, user_id: session.user.id, transfer_id: transferId },
          ]);
        }
      } else {
        const payload = {
          amount: val,
          type: txType,
          category_id: selectedSubcategory || selectedCategory || null,
          party_id: selectedParty || null,
          account_id: selectedAccount || (accounts.length > 0 ? accounts[0].id : null),
          note: note.trim() || null,
          transaction_date: txDate
        };

        let transactionId;
        if (txToEdit && txToEdit.id) {
          const { error } = await supabase.from('transactions').update(payload).eq('id', txToEdit.id);
          if (error) throw error;
          transactionId = txToEdit.id;
        } else {
          payload.user_id = session.user.id;
          const { data, error } = await supabase.from('transactions').insert([payload]).select('id').single();
          if (error) throw error;
          transactionId = data.id;
        }

        if (transactionId) {
          await supabase.from('transaction_tags').delete().eq('transaction_id', transactionId);
          if (selectedTags.length > 0) {
            await supabase.from('transaction_tags').insert(selectedTags.map(tagId => ({ transaction_id: transactionId, tag_id: tagId })));
          }
        }
      }
      showToast(txToEdit ? 'Entry updated' : 'Entry recorded', 'success');
      localStorage.setItem('moma_last_tx_date', txDate);
      await fetchTransactions();
      if (!txToEdit) resetFilters?.();
      resetForm();
      setView('ledger');
    } catch (err) {
      console.error('Transaction error:', err);
      showToast(err.message || 'Failed to save entry', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [amount, selectedSubcategory, selectedCategory, txType, selectedParty, selectedAccount, note, txDate, session, txToEdit, selectedTags, transferFromAccount, transferToAccount, resetForm, accounts, fetchTransactions, setView, resetFilters, showToast]);

  const currentParents = useMemo(() => 
    categories.filter(c => !c.parent_id && (txType === 'transfer' ? true : c.type === txType)),
  [categories, txType]);

  const applicableSubs = useMemo(() => 
    categories.filter(c => c.parent_id),
  [categories]);

  return useMemo(() => ({
    txToEdit, setTxToEdit,
    txType, setTxType,
    amount, setAmount,
    selectedCategory, setSelectedCategory,
    selectedSubcategory, setSelectedSubcategory,
    selectedParty, setSelectedParty,
    selectedAccount, setSelectedAccount,
    note, setNote,
    txDate, setTxDate,
    selectedTags, setSelectedTags,
    transferFromAccount, setTransferFromAccount,
    transferToAccount, setTransferToAccount,
    isSubmitting,
    resetForm,
    openEditTransaction,
    handleTransaction,
    currentParents,
    applicableSubs
  }), [
    txToEdit, txType, amount, selectedCategory, selectedSubcategory, selectedParty, selectedAccount, 
    note, txDate, selectedTags, transferFromAccount, transferToAccount, isSubmitting,
    resetForm, openEditTransaction, handleTransaction, currentParents, applicableSubs
  ]);
}
