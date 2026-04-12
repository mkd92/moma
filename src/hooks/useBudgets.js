import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from './useToast';

export function useBudgets(transactions, categories) {
  const { showToast } = useToast();
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.from('budgets').select('*').order('created_at');
      if (data) setBudgets(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSaveBudget = useCallback(async (session, payload, budgetId = null) => {
    if (!session) return;
    let error;
    if (budgetId) {
      ({ error } = await supabase.from('budgets').update(payload).eq('id', budgetId));
    } else {
      ({ error } = await supabase.from('budgets').insert([{ ...payload, user_id: session.user.id }]));
    }
    
    if (!error) {
      showToast('Budget configured', 'success');
      fetchBudgets();
    } else {
      showToast('Failed to save budget', 'error');
    }
    return error;
  }, [fetchBudgets, showToast]);

  const isWithinBudgetPeriod = (dateStr, period) => {
    const today = new Date();
    const d = new Date(dateStr + 'T12:00:00');
    if (period === 'monthly') return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
    if (period === 'weekly') {
      const dayN = today.getDay() || 7;
      const mon = new Date(today); mon.setDate(today.getDate() - dayN + 1); mon.setHours(0, 0, 0, 0);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59, 999);
      return d >= mon && d <= sun;
    }
    return false;
  };

  const budgetProgress = useMemo(() => {
    return budgets.map(b => {
      const spent = transactions
        .filter(t => t.type === 'expense' && !t.transfer_id && isWithinBudgetPeriod(t.transaction_date, b.period) &&
          (!b.category_id || t.category_id === b.category_id || categories.find(c => c.id === t.category_id)?.parent_id === b.category_id))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const rawPct = b.limit_amount > 0 ? (spent / b.limit_amount) * 100 : 0;
      return { ...b, spent, rawPct, pct: Math.min(rawPct, 100), remaining: Math.max(0, b.limit_amount - spent), status: rawPct >= 100 ? 'over' : rawPct >= 80 ? 'warning' : 'ok' };
    });
  }, [budgets, transactions, categories]);

  return {
    budgets, setBudgets,
    isLoading,
    fetchBudgets,
    handleSaveBudget,
    budgetProgress
  };
}
