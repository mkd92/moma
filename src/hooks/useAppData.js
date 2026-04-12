import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { cacheGet } from '../cache';
import { useProfile } from './useProfile';
import { useBaseData } from './useBaseData';
import { useTransactions } from './useTransactions';
import { useBudgets } from './useBudgets';
import { useFilters } from './useFilters';
import { useAnalyticsData } from './useAnalyticsData';

export function useAppData(session, navigate, pathname, authIsLoading) {
  const userIdRef = useRef(null);
  
  // 1. Compose child hooks
  const profile = useProfile();
  const baseData = useBaseData();
  const transactionsData = useTransactions();
  const budgetsData = useBudgets(transactionsData.transactions, baseData.categories);
  const filters = useFilters();
  
  // 2. Derive analytics from composed states
  const analytics = useAnalyticsData({
    transactions: transactionsData.transactions,
    categories: baseData.categories,
    accounts: baseData.accounts,
    dashPeriod: filters.dashPeriod,
    dashDateRange: filters.dashDateRange,
    analyticsFilters: filters.analyticsFilters,
    catBreakdownType: filters.catBreakdownType,
    drillCategory: filters.drillCategory,
    filterOptions: filters.filterOptions,
    ledgerSort: filters.ledgerSort,
    currencySymbol: profile.currencySymbol
  });

  // 3. UI-specific state still managed here for now
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState(new Set());
  const [bulkCategory, setBulkCategory] = useState(null);

  // STABILIZE actions by pulling out only the stable functions needed
  const { fetchProfile, setCurrencyCode, setCurrencySymbol, setDefaultAccountId } = profile;
  const { fetchAllBaseData, setCategories, setParties, setTags, setAccounts } = baseData;
  const { fetchTransactions, setTransactions } = transactionsData;
  const { fetchBudgets, setBudgets } = budgetsData;
  const { resetFilters, resetAnalyticsFilters } = filters;

  const clearAppData = useCallback(() => {
    setCategories([]);
    setParties([]);
    setTags([]);
    setAccounts([]);
    setTransactions([]);
    setBudgets([]);
    resetFilters();
    resetAnalyticsFilters();
    setCurrencyCode('USD');
    setCurrencySymbol('$');
    setDefaultAccountId(null);
    setBulkSelectMode(false);
    setSelectedTxIds(new Set());
    setBulkCategory(null);
  }, [setCategories, setParties, setTags, setAccounts, setTransactions, setBudgets, resetFilters, resetAnalyticsFilters, setCurrencyCode, setCurrencySymbol, setDefaultAccountId]);

  const fetchInitialData = useCallback(async (activeSession) => {
    const uid = activeSession?.user?.id;
    userIdRef.current = uid;

    if (uid) {
      const cached = {
        categories: cacheGet(uid, 'categories'),
        parties: cacheGet(uid, 'parties'),
        tags: cacheGet(uid, 'tags'),
        accounts: cacheGet(uid, 'accounts'),
        transactions: cacheGet(uid, 'transactions'),
      };
      if (cached.categories) setCategories(cached.categories);
      if (cached.parties) setParties(cached.parties);
      if (cached.tags) setTags(cached.tags);
      if (cached.accounts) setAccounts(cached.accounts);
      if (cached.transactions) setTransactions(cached.transactions);
    }

    await fetchProfile(activeSession);
    await Promise.all([
      fetchAllBaseData(uid),
      fetchTransactions(uid), 
      fetchBudgets()
    ]);
  }, [fetchProfile, fetchAllBaseData, fetchTransactions, fetchBudgets, setCategories, setParties, setTags, setAccounts, setTransactions]);

  const refreshData = useCallback(() => {
    if (session) fetchInitialData(session);
  }, [session, fetchInitialData]);

  // Unified Session Monitor
  useEffect(() => {
    if (authIsLoading) return;

    if (session) {
      // Logic for logged in user
      if (pathname === '/' || pathname === '/auth') {
        navigate('/dashboard');
      }
      fetchInitialData(session);
    } else {
      // Logic for logged out user
      clearAppData();
      userIdRef.current = null;
      if (pathname !== '/' && pathname !== '/auth') {
        navigate('/');
      }
    }
  }, [session, authIsLoading, pathname, navigate, fetchInitialData, clearAppData]);

  const navToLedgerByCategory = useCallback((catId, type) => {
    filters.resetFilters();
    filters.updateFilter('categoryIds', [catId]);
    filters.updateFilter('type', type);
    navigate('/ledger');
  }, [filters, navigate]);

  const isLoading = baseData.isLoading || transactionsData.isLoading || budgetsData.isLoading;

  // Memoize the return object to stop downstream re-renders
  return useMemo(() => ({
    // State
    transactions: transactionsData.transactions,
    categories: baseData.categories,
    parties: baseData.parties,
    accounts: baseData.accounts,
    tags: baseData.tags,
    budgets: budgetsData.budgets,
    
    isLoading,
    isBaseDataLoading: baseData.isLoading,
    isTransactionsLoading: transactionsData.isLoading,
    isBudgetsLoading: budgetsData.isLoading,

    currencySymbol: profile.currencySymbol,
    setCurrencySymbol: profile.setCurrencySymbol,
    currencyCode: profile.currencyCode,
    setCurrencyCode: profile.setCurrencyCode,
    defaultAccountId: profile.defaultAccountId,
    setDefaultAccountId: profile.setDefaultAccountId,
    
    dashPeriod: filters.dashPeriod,
    setDashPeriod: filters.setDashPeriod,
    analyticsFilters: filters.analyticsFilters,
    setAnalyticsFilters: filters.setAnalyticsFilters,
    filterOptions: filters.filterOptions,
    setFilterOptions: filters.setFilterOptions,
    ledgerSort: filters.ledgerSort,
    setLedgerSort: filters.setLedgerSort,
    drillCategory: filters.drillCategory,
    setDrillCategory: filters.setDrillCategory,
    catBreakdownType: filters.catBreakdownType,
    setCatBreakdownType: filters.setCatBreakdownType,
    settingsType: filters.settingsType,
    setSettingsType: filters.setSettingsType,
    
    bulkSelectMode, setBulkSelectMode,
    selectedTxIds, setSelectedTxIds,
    bulkCategory, setBulkCategory,
    
    showAdvancedFilters: filters.showAdvancedFilters,
    setShowAdvancedFilters: filters.setShowAdvancedFilters,
    showAnalyticsFilters: filters.showAnalyticsFilters,
    setShowAnalyticsFilters: filters.setShowAnalyticsFilters,
    
    // Derived Analytics
    ...analytics,
    budgetProgress: budgetsData.budgetProgress,
    
    // Fetchers
    fetchCategories: () => baseData.fetchCategories(userIdRef.current),
    fetchParties: () => baseData.fetchParties(userIdRef.current),
    fetchTags: () => baseData.fetchTags(userIdRef.current),
    fetchAccounts: () => baseData.fetchAccounts(userIdRef.current),
    fetchBudgets: budgetsData.fetchBudgets,
    fetchTransactions: () => transactionsData.fetchTransactions(userIdRef.current),
    fetchInitialData,
    refreshData,
    
    // Handlers (mapping session argument)
    handleCreateCategory: (p, id) => baseData.handleCreateCategory(session, p, id),
    handleDeleteCategory: (id) => baseData.handleDeleteCategory(session, id),
    handleCreateParty: (n) => baseData.handleCreateParty(session, n),
    handleDeleteParty: (id) => baseData.handleDeleteParty(session, id),
    handleDeleteTransaction: (t) => transactionsData.handleDeleteTransaction(session, t, refreshData),
    handleCreateTag: (n) => baseData.handleCreateTag(session, n),
    handleDeleteTag: (id) => baseData.handleDeleteTag(session, id),
    handleCreateAccount: (p) => baseData.handleCreateAccount(session, p),
    handleDeleteAccount: (id) => baseData.handleDeleteAccount(session, id),
    handleUpdateAccount: (id, p) => baseData.handleUpdateAccount(session, id, p),
    handleSetDefaultAccount: (id) => profile.handleSetDefaultAccount(session, id),
    handleBulkAssignCategory: (cid, ids) => transactionsData.handleBulkAssignCategory(session, cid, ids, refreshData),
    handleSaveBudget: (p, id) => budgetsData.handleSaveBudget(session, p, id),
    
    // Filter Actions
    updateFilter: filters.updateFilter,
    resetFilters: filters.resetFilters,
    applyDatePreset: filters.applyDatePreset,
    updateAnalyticsFilter: filters.updateAnalyticsFilter,
    resetAnalyticsFilters: filters.resetAnalyticsFilters,
    applyAnalyticsPreset: filters.applyAnalyticsPreset,
    navToLedgerByCategory
  }), [
    session, isLoading, bulkSelectMode, selectedTxIds, bulkCategory, fetchInitialData, refreshData, navToLedgerByCategory, clearAppData,
    transactionsData, baseData, budgetsData, profile, filters, analytics
  ]);
}
