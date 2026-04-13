import React from 'react';
import { PageShell } from '../components/layout';
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, Line, ResponsiveContainer, CartesianGrid, ReferenceLine, Area } from 'recharts';
import EmptyChart from '../components/analytics/EmptyChart';
import AnalyticsTooltip from '../components/analytics/AnalyticsTooltip';
import FilterPanel from '../components/filters/FilterPanel';

import { useAppDataContext } from '../hooks';

const VarianceWidget = ({ label, current, previous, currencySymbol, isInverse = false }) => {
  const diff = current - previous;
  const pct = previous !== 0 ? (diff / Math.abs(previous)) * 100 : 0;
  const isPositive = diff >= 0;
  const colorClass = isInverse 
    ? (isPositive ? 'text-error' : 'text-primary') 
    : (isPositive ? 'text-primary' : 'text-error');
  const icon = isPositive ? 'trending_up' : 'trending_down';

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <p className="text-[9px] font-black tracking-[0.2em] text-on-surface-variant uppercase opacity-40 truncate">{label}</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <p className="text-lg sm:text-xl font-black text-on-surface whitespace-nowrap">{currencySymbol}{current.toLocaleString()}</p>
        <div className={`flex items-center gap-0.5 text-[9px] font-bold ${colorClass} shrink-0`}>
          <span className="material-symbols-outlined text-[11px]">{icon}</span>
          {Math.abs(pct).toFixed(1)}%
        </div>
      </div>
    </div>
  );
};

const CategoryRow = ({ name, id, value, subs, totalCatVal, currencySymbol, catBreakdownType, navToLedgerByCategory }) => {
  const [expanded, setExpanded] = React.useState(false);
  const hasSubs = subs && subs.length > 0;
  const pct = totalCatVal > 0 ? (value / totalCatVal) * 100 : 0;

  return (
    <div className="flex flex-col border-b border-outline-variant/10 last:border-none">
      <div 
        className="flex items-start sm:items-center gap-4 sm:gap-6 py-6 group cursor-pointer hover:bg-on-surface/[0.02] px-4 -mx-4 rounded-2xl transition-all"
        onClick={() => hasSubs ? setExpanded(!expanded) : navToLedgerByCategory?.(id, catBreakdownType)}
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-surface-highest flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary transition-all shadow-sm shrink-0">
          <span className="text-xs sm:text-sm font-black uppercase">{name.charAt(0)}</span>
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-sm font-bold text-on-surface truncate tracking-tight">{name}</p>
              {hasSubs && (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-on-surface/[0.05] text-on-surface-variant/60 uppercase tracking-widest shrink-0">
                  {subs.length} units
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-[10px] sm:text-xs font-bold text-on-surface-variant/40 tabular-nums">{pct.toFixed(1)}%</p>
              <p className="text-sm font-black text-on-surface font-headline whitespace-nowrap">{currencySymbol}{value.toLocaleString()}</p>
            </div>
          </div>
          <div className="h-1.5 w-full bg-on-surface/[0.03] rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000 origin-left" 
              style={{ width: `${pct}%`, opacity: 0.2 + (pct/150) }}
            ></div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0 self-center sm:self-auto">
          {hasSubs && (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant/30 group-hover:text-on-surface transition-all">
              <span className={`material-symbols-outlined text-[18px] sm:text-[20px] transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>expand_more</span>
            </div>
          )}
          <button 
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant/20 hover:text-primary hover:bg-primary/10 transition-all"
            onClick={(e) => { e.stopPropagation(); navToLedgerByCategory?.(id, catBreakdownType); }}
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {expanded && hasSubs && (
        <div className="pl-10 sm:pl-16 pr-4 pb-6 space-y-6 fade-in border-l-2 border-primary/10 ml-4 sm:ml-6">
          {subs.map(sub => {
            const subPct = value > 0 ? (sub.value / value) * 100 : 0;
            return (
              <div 
                key={sub.id} 
                className="flex items-center gap-4 group/sub cursor-pointer hover:bg-on-surface/[0.01] p-2 -m-2 rounded-xl transition-all" 
                onClick={() => navToLedgerByCategory?.(sub.id, catBreakdownType)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-2 gap-2">
                    <p className="text-xs font-bold text-on-surface-variant/70 group-hover/sub:text-on-surface transition-colors truncate">{sub.name}</p>
                    <div className="flex items-baseline gap-2 shrink-0">
                      <p className="text-[9px] sm:text-[10px] font-bold text-on-surface-variant/30 tabular-nums">{subPct.toFixed(1)}%</p>
                      <p className="text-xs font-black text-on-surface group-hover/sub:text-primary transition-colors whitespace-nowrap">{currencySymbol}{sub.value.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-on-surface/[0.02] rounded-full overflow-hidden">
                    <div className="h-full bg-on-surface/20 transition-all duration-700 origin-left" style={{ width: `${subPct}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Analytics = () => {
  const { 
    analyticsKPIs, 
    prevPeriodKPIs, 
    currencySymbol, 
    chartTimeSeries: composedData, 
    savingsRate: savRate, 
    chartCategorical, 
    totalCatVal, 
    isLoading,
    showAnalyticsFilters, 
    setShowAnalyticsFilters, 
    analyticsFilters, 
    applyAnalyticsPreset, 
    updateAnalyticsFilter, 
    resetAnalyticsFilters, 
    catBreakdownType, 
    setCatBreakdownType, 
    navToLedgerByCategory, 
    topPayees,
    refreshData
  } = useAppDataContext();

  
  const pct = (curr, prev) => {
    if (prev === undefined || prev === null || prev === 0) return null;
    const change = ((curr - prev) / Math.abs(prev)) * 100;
    return { label: `${Math.abs(change).toFixed(1)}%`, up: change >= 0 };
  };
  
  const netPct = pct(analyticsKPIs?.net || 0, prevPeriodKPIs?.net || 0);

  const hasChartData = React.useMemo(() => 
    composedData && composedData.some(d => d.income !== 0 || d.expense !== 0 || d.net !== 0),
  [composedData]);

  return (
    <PageShell view="analytics" onRefresh={refreshData} isLoading={isLoading}>
      <div className="page-inner space-y-12 pt-4 md:pt-0 px-6 max-w-7xl mx-auto">
        {/* Header & Filter Engine */}
        <div className="space-y-10">
          <div className="flex justify-between items-center px-2">
            <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-on-surface uppercase">Financial Analytics</h2>
            <button 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${showAnalyticsFilters ? 'bg-on-surface text-surface border-on-surface shadow-xl' : 'bg-surface-low text-on-surface-variant border-outline-variant hover:text-on-surface'}`}
              onClick={() => setShowAnalyticsFilters(!showAnalyticsFilters)}
            >
              <span className="material-symbols-outlined text-[14px]">tune</span>
              <span className="hidden sm:inline">{showAnalyticsFilters ? 'Collapse' : 'Parameters'}</span>
            </button>
          </div>

          {showAnalyticsFilters && (
            <div className="bg-surface-low p-8 rounded-[3rem] border border-outline-variant/10 shadow-2xl space-y-10 fade-in">
              <FilterPanel 
                categories={useAppDataContext().categories}
                tags={useAppDataContext().tags}
                accounts={useAppDataContext().accounts}
                filterOptions={analyticsFilters}
                onUpdateFilter={updateAnalyticsFilter}
                onResetFilters={resetAnalyticsFilters}
                onApplyPreset={applyAnalyticsPreset}
              />
            </div>
          )}
        </div>

        {/* Net Cash Flow - Hero */}
        <section className="space-y-10">
          <div className="bg-surface-low p-6 md:p-12 rounded-[3rem] border border-outline-variant shadow-sm overflow-hidden relative group h-fit">
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 relative z-10 h-fit">
              
              {/* Trend & Variance Sidebar */}
              <div className="flex flex-col gap-6 lg:gap-8 lg:justify-between lg:min-w-[240px] h-fit">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase opacity-60">Net Surplus</p>
                    <h3 className="text-4xl sm:text-5xl md:text-6xl font-black font-headline text-on-surface tracking-tighter leading-tight">
                      {currencySymbol}{(analyticsKPIs?.net || 0).toLocaleString()}
                    </h3>
                  </div>
                  
                  {/* MoM Variance Table / Widget Group */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6 pt-2">
                    <VarianceWidget 
                      label="Cash Inflow" 
                      current={analyticsKPIs?.totalIncome || 0} 
                      previous={prevPeriodKPIs?.income || 0} 
                      currencySymbol={currencySymbol} 
                    />
                    <VarianceWidget 
                      label="Burn Rate" 
                      current={analyticsKPIs?.totalExpense || 0} 
                      previous={prevPeriodKPIs?.expense || 0} 
                      currencySymbol={currencySymbol} 
                      isInverse={true}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                  <div className="bg-primary/5 rounded-3xl p-4 sm:p-6 border border-primary/10">
                    <p className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1 sm:mb-2">Capital</p>
                    <p className="text-xl sm:text-2xl font-black text-on-surface">{savRate !== null ? `${savRate}%` : '--'}</p>
                    <p className="hidden sm:block text-[10px] font-medium text-on-surface-variant/60 mt-1">Efficiency rate</p>
                  </div>
                  
                  <div className="bg-surface-high/40 rounded-3xl p-4 sm:p-6 border border-outline-variant/10">
                    <p className="text-[9px] sm:text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1 sm:mb-2 opacity-60">Density</p>
                    <p className="text-xl sm:text-2xl font-black text-on-surface">{(analyticsKPIs?.txCount || 0).toLocaleString()}</p>
                    <p className="hidden sm:block text-[10px] font-medium text-on-surface-variant/60 mt-1">Total movements</p>
                  </div>
                </div>
              </div>
              
              {/* Dual-Axis Trend Chart */}
              <div className={`flex-1 ${hasChartData ? 'min-h-[260px] sm:min-h-[400px]' : 'min-h-[140px] sm:min-h-[400px]'} -mx-4 md:mx-0 transition-all duration-500`}>
                <ResponsiveContainer width="100%" height="100%">
                  {hasChartData ? (
                    <ComposedChart data={composedData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <defs>
                        <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--on-surface)" vertical={false} opacity={0.03} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: 'var(--on-surface-variant)', opacity: 0.4 }} dy={10} />
                      <YAxis yAxisId="left" hide domain={['auto', 'auto']} />
                      <YAxis yAxisId="right" hide domain={['auto', 'auto']} orientation="right" />
                      <Tooltip content={<AnalyticsTooltip currencySymbol={currencySymbol} />} cursor={{ stroke: 'var(--outline-variant)', strokeWidth: 1 }} />
                      <ReferenceLine yAxisId="left" y={0} stroke="var(--outline-variant)" opacity={0.5} />
                      
                      {/* Burn Rate & Inflow (Left Axis) */}
                      <Bar yAxisId="left" dataKey="income" fill="var(--primary)" radius={[4, 4, 0, 0]} opacity={0.15} barSize={24} />
                      <Bar yAxisId="left" dataKey="expense" fill="var(--secondary)" radius={[4, 4, 0, 0]} opacity={0.1} barSize={24} />
                      
                      {/* Net Trend (Right Axis) */}
                      <Area yAxisId="right" type="monotone" dataKey="net" stroke="transparent" fill="url(#netGradient)" />
                      <Line yAxisId="right" type="monotone" dataKey="net" stroke="var(--primary)" strokeWidth={4} dot={false} animationDuration={1500} />
                    </ComposedChart>
                  ) : (
                    <EmptyChart h={140} />
                  )}
                </ResponsiveContainer>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-transparent to-on-surface/[0.02] pointer-events-none"></div>
          </div>
        </section>

        {/* Categories Analysis */}
        <section className="space-y-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 px-2">
            <h3 className="font-headline text-xs font-black tracking-[0.4em] text-on-surface uppercase opacity-60">Categorical Breakdown</h3>
            <div className="flex bg-on-surface/[0.03] p-1.5 rounded-2xl gap-1 border border-outline-variant/10 w-full sm:w-auto">
              {['expense', 'income'].map(t => (
                <button 
                  key={t}
                  className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-semibold transition-all ${catBreakdownType === t ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                  onClick={() => setCatBreakdownType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface-low rounded-[3rem] border border-outline-variant/10 p-10 shadow-2xl">
            {chartCategorical.length > 0 ? chartCategorical.map(p => (
              <CategoryRow 
                key={p.id} 
                {...p} 
                totalCatVal={totalCatVal} 
                currencySymbol={currencySymbol} 
                catBreakdownType={catBreakdownType}
                navToLedgerByCategory={navToLedgerByCategory}
              />
            )) : (
              <div className="py-20 text-center space-y-4 opacity-40">
                <span className="material-symbols-outlined text-5xl font-light">category</span>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Categorical Data Available</p>
              </div>
            )}
          </div>
        </section>

        {/* Top Payees */}
        <section className="space-y-10">
          <h3 className="font-headline text-xs font-black tracking-[0.4em] text-on-surface uppercase opacity-60 px-4">Top Payees</h3>
          <div className="flex gap-6 overflow-x-auto py-4 -my-4 hide-scrollbar px-2">
            {(topPayees || []).map((p, i) => (
              <div key={i} className="flex-shrink-0 w-44 bg-surface-low p-8 rounded-[3rem] text-center space-y-6 border border-outline-variant transition-all hover:bg-surface-high cursor-default group">
                <div className="w-20 h-20 mx-auto rounded-full bg-on-surface/[0.03] flex items-center justify-center border border-outline-variant shadow-inner transition-all duration-500 group-hover:scale-105 group-hover:border-on-surface/20">
                  <span className="text-2xl font-black text-on-surface opacity-40 group-hover:opacity-100">{p.name?.charAt(0) || '?'}</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black text-on-surface truncate px-2">{p.name}</p>
                  <p className="text-[10px] font-black font-headline text-primary">
                    {currencySymbol}{(p.value || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
};

export default Analytics;
