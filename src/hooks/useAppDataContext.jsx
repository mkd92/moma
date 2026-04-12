import React, { createContext, useContext, useMemo } from 'react';

const AppDataContext = createContext(null);
const AppActionContext = createContext(null);

export function AppDataProvider({ value, children }) {
  // Separate Data from Actions to minimize re-renders
  const {
    // Actions
    fetchCategories, fetchParties, fetchTags, fetchAccounts, fetchBudgets, fetchTransactions,
    fetchInitialData, refreshData, setView, navToLedger, navToAnalytics, navToDashboard,
    handleCreateCategory, handleDeleteCategory, handleCreateParty, handleDeleteParty,
    handleDeleteTransaction, handleCreateTag, handleDeleteTag, handleCreateAccount,
    handleDeleteAccount, handleUpdateAccount, handleSetDefaultAccount, handleBulkAssignCategory,
    handleSaveBudget, updateFilter, resetFilters, applyDatePreset, updateAnalyticsFilter,
    resetAnalyticsFilters, applyAnalyticsPreset, navToLedgerByCategory,
    setCurrencyCode, setCurrencySymbol, setDefaultAccountId, setDashPeriod, setAnalyticsFilters,
    setFilterOptions, setLedgerSort, setDrillCategory, setCatBreakdownType, setSettingsType,
    setShowAdvancedFilters, setShowAnalyticsFilters, setBulkSelectMode, setSelectedTxIds, setBulkCategory,
    openEditTransaction, resetForm, handleTransaction, shellProps,
    
    // Data (volatile)
    ...data
  } = value;

  const actions = useMemo(() => ({
    fetchCategories, fetchParties, fetchTags, fetchAccounts, fetchBudgets, fetchTransactions,
    fetchInitialData, refreshData, setView, navToLedger, navToAnalytics, navToDashboard,
    handleCreateCategory, handleDeleteCategory, handleCreateParty, handleDeleteParty,
    handleDeleteTransaction, handleCreateTag, handleDeleteTag, handleCreateAccount,
    handleDeleteAccount, handleUpdateAccount, handleSetDefaultAccount, handleBulkAssignCategory,
    handleSaveBudget, updateFilter, resetFilters, applyDatePreset, updateAnalyticsFilter,
    resetAnalyticsFilters, applyAnalyticsPreset, navToLedgerByCategory,
    setCurrencyCode, setCurrencySymbol, setDefaultAccountId, setDashPeriod, setAnalyticsFilters,
    setFilterOptions, setLedgerSort, setDrillCategory, setCatBreakdownType, setSettingsType,
    setShowAdvancedFilters, setShowAnalyticsFilters, setBulkSelectMode, setSelectedTxIds, setBulkCategory,
    openEditTransaction, resetForm, handleTransaction, shellProps
  }), [
    fetchCategories, fetchParties, fetchTags, fetchAccounts, fetchBudgets, fetchTransactions,
    fetchInitialData, refreshData, setView, navToLedger, navToAnalytics, navToDashboard,
    handleCreateCategory, handleDeleteCategory, handleCreateParty, handleDeleteParty,
    handleDeleteTransaction, handleCreateTag, handleDeleteTag, handleCreateAccount,
    handleDeleteAccount, handleUpdateAccount, handleSetDefaultAccount, handleBulkAssignCategory,
    handleSaveBudget, updateFilter, resetFilters, applyDatePreset, updateAnalyticsFilter,
    resetAnalyticsFilters, applyAnalyticsPreset, navToLedgerByCategory,
    setCurrencyCode, setCurrencySymbol, setDefaultAccountId, setDashPeriod, setAnalyticsFilters,
    setFilterOptions, setLedgerSort, setDrillCategory, setCatBreakdownType, setSettingsType,
    setShowAdvancedFilters, setShowAnalyticsFilters, setBulkSelectMode, setSelectedTxIds, setBulkCategory,
    openEditTransaction, resetForm, handleTransaction, shellProps
  ]);

  return (
    <AppDataContext.Provider value={data}>
      <AppActionContext.Provider value={actions}>
        {children}
      </AppActionContext.Provider>
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within an AppDataProvider');
  return context;
}

export function useAppActions() {
  const context = useContext(AppActionContext);
  if (!context) throw new Error('useAppActions must be used within an AppDataProvider');
  return context;
}

// Legacy helper for mixed usage (prevents massive refactor if needed)
export function useAppDataContext() {
  const data = useAppData();
  const actions = useAppActions();
  return { ...data, ...actions };
}
