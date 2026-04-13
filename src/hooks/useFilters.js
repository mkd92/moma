import { useState, useCallback, useMemo } from 'react';

export function useFilters() {
  const [dashPeriod, setDashPeriod] = useState('this_month');
  
  const [analyticsFilters, setAnalyticsFilters] = useState(() => {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return {
      type: 'all',
      dateRange: {
        start: fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
        end: fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0))
      },
      categoryIds: [], tagIds: [], accountIds: [], searchTerm: '', preset: 'this_month'
    };
  });

  const [filterOptions, setFilterOptions] = useState({
    type: 'all', dateRange: { start: '', end: '' },
    categoryIds: [], tagIds: [], accountIds: [], searchTerm: '', preset: 'all'
  });

  const [ledgerSort, setLedgerSort] = useState('date_desc');
  const [drillCategory, setDrillCategory] = useState(null);
  const [catBreakdownType, setCatBreakdownType] = useState('expense');
  const [settingsType, setSettingsType] = useState('expense');

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAnalyticsFilters, setShowAnalyticsFilters] = useState(false);

  const dashDateRange = useMemo(() => {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (dashPeriod === 'this_month') return { start: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), end: fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)) };
    if (dashPeriod === 'last_month') return { start: fmt(new Date(today.getFullYear(), today.getMonth() - 1, 1)), end: fmt(new Date(today.getFullYear(), today.getMonth(), 0)) };
    if (dashPeriod === 'last_3m') return { start: fmt(new Date(today.getFullYear(), today.getMonth() - 2, 1)), end: fmt(today) };
    if (dashPeriod === 'this_year') return { start: `${today.getFullYear()}-01-01`, end: `${today.getFullYear()}-12-31` };
    return { start: null, end: null };
  }, [dashPeriod]);

  const updateFilter = useCallback((k, v) => setFilterOptions(p => ({ ...p, [k]: v })), []);
  
  const resetFilters = useCallback(() => setFilterOptions({ 
    type: 'all', dateRange: { start: '', end: '' }, 
    categoryIds: [], tagIds: [], accountIds: [], searchTerm: '', preset: 'all' 
  }), []);

  const applyDatePreset = useCallback((preset) => {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    let start = '', end = '';
    if (preset === 'today') { start = end = fmt(today); }
    else if (preset === 'this_week') { const day = today.getDay() || 7; const mon = new Date(today); mon.setDate(today.getDate() - day + 1); start = fmt(mon); end = fmt(today); }
    else if (preset === 'this_month') { start = fmt(new Date(today.getFullYear(), today.getMonth(), 1)); end = fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)); }
    else if (preset === 'last_month') { 
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      start = fmt(first); end = fmt(last); 
    }
    else if (preset === 'last_3m') { start = fmt(new Date(today.getFullYear(), today.getMonth() - 2, 1)); end = fmt(today); }
    setFilterOptions(prev => ({ ...prev, preset, dateRange: { start, end } }));
  }, []);

  const updateAnalyticsFilter = useCallback((key, value) => {
    setAnalyticsFilters(prev => ({ ...prev, [key]: value, preset: key === 'preset' ? value : 'custom' }));
  }, []);

  const resetAnalyticsFilters = useCallback(() => {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    setAnalyticsFilters({ type: 'all', dateRange: { start: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), end: fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)) }, categoryIds: [], tagIds: [], accountIds: [], searchTerm: '', preset: 'this_month' });
  }, []);

  const applyAnalyticsPreset = useCallback((preset) => {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    let start = '', end = '';
    if (preset === 'today') { start = end = fmt(today); }
    else if (preset === 'this_week') { const day = today.getDay() || 7; const mon = new Date(today); mon.setDate(today.getDate() - day + 1); start = fmt(mon); end = fmt(today); }
    else if (preset === 'this_month') { start = fmt(new Date(today.getFullYear(), today.getMonth(), 1)); end = fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)); }
    else if (preset === 'last_month') { 
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      start = fmt(first); end = fmt(last); 
    }
    else if (preset === 'last_3m') { start = fmt(new Date(today.getFullYear(), today.getMonth() - 2, 1)); end = fmt(today); }
    else if (preset === 'this_year') { start = `${today.getFullYear()}-01-01`; end = `${today.getFullYear()}-12-31`; }
    setAnalyticsFilters(prev => ({ ...prev, preset, dateRange: { start, end } }));
  }, []);

  return {
    dashPeriod, setDashPeriod,
    analyticsFilters, setAnalyticsFilters,
    filterOptions, setFilterOptions,
    ledgerSort, setLedgerSort,
    drillCategory, setDrillCategory,
    catBreakdownType, setCatBreakdownType,
    settingsType, setSettingsType,
    showAdvancedFilters, setShowAdvancedFilters,
    showAnalyticsFilters, setShowAnalyticsFilters,
    dashDateRange,
    updateFilter, resetFilters, applyDatePreset,
    updateAnalyticsFilter, resetAnalyticsFilters, applyAnalyticsPreset
  };
}
