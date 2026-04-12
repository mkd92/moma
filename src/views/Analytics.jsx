import React from 'react';
import { PageShell } from '../components/layout';
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, Line, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import EmptyChart from '../components/analytics/EmptyChart';
import AnalyticsTooltip from '../components/analytics/AnalyticsTooltip';

import { useAppDataContext } from '../hooks';

const CategoryRow = ({ name, id, value, subs, totalCatVal, currencySymbol, catBreakdownType, navToLedgerByCategory }) => {
  const [expanded, setExpanded] = React.useState(false);
  const hasSubs = subs && subs.length > 0;
  const pct = totalCatVal > 0 ? (value / totalCatVal) * 100 : 0;

  return (
    <div className="flex flex-col gap-4 py-6 border-b border-outline-variant/10 group last:border-none">
      <div className="flex items-center gap-6">
        <div className="flex-1 flex items-center gap-4 cursor-pointer" onClick={() => navToLedgerByCategory && navToLedgerByCategory(id, catBreakdownType)}>
          <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
            <span className="text-xs font-black uppercase">{name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-2">
              <p className="text-sm font-bold text-on-surface truncate tracking-tight">{name}</p>
              <p className="text-sm font-black text-on-surface font-headline">{currencySymbol}{value.toLocaleString()}</p>
            </div>
            <div className="h-1 w-full bg-on-surface/[0.03] rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-1000 origin-left" style={{ width: `${pct}%`, opacity: 0.15 + (pct/200) }}></div>
            </div>
          </div>
        </div>
        {hasSubs && (
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-on-surface/[0.05] transition-all" onClick={() => setExpanded(!expanded)}>
            <span className={`material-symbols-outlined transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>expand_more</span>
          </button>
        )}
      </div>

      {expanded && hasSubs && (
        <div className="pl-14 space-y-6 fade-in">
          {subs.map(sub => {
            const subPct = value > 0 ? (sub.value / value) * 100 : 0;
            return (
              <div key={sub.id} className="flex items-center gap-4 group/sub cursor-pointer" onClick={() => navToLedgerByCategory && navToLedgerByCategory(sub.id, catBreakdownType)}>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-2">
                    <p className="text-xs font-bold text-on-surface-variant group-hover/sub:text-on-surface transition-colors">{sub.name}</p>
                    <p className="text-xs font-bold text-on-surface-variant group-hover/sub:text-on-surface transition-colors">{currencySymbol}{sub.value.toLocaleString()}</p>
                  </div>
                  <div className="h-0.5 w-full bg-on-surface/[0.02] rounded-full overflow-hidden">
                    <div className="h-full bg-on-surface transition-all duration-700 origin-left" style={{ width: `${subPct}%`, opacity: 0.1 }}></div>
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

  return (
    <PageShell view="analytics" onRefresh={refreshData} isLoading={isLoading}>
      <div className="page-inner space-y-12 pb-32 pt-4 md:pt-0 px-6 max-w-7xl mx-auto">
        {/* Header & Filter Engine */}
        <div className="space-y-10">
          <div className="flex justify-between items-center px-2">
            <h2 className="font-headline text-4xl font-black tracking-tight text-on-surface uppercase">Financial Analytics</h2>
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
              <div className="flex flex-wrap gap-2">
                {['today', 'this_week', 'this_month', 'last_3m', 'this_year'].map(t => (
                  <button 
                    key={t}
                    className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${analyticsFilters.preset === t ? 'bg-primary-fixed text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                    onClick={() => applyAnalyticsPreset(t)}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <button className="text-[10px] font-black text-error uppercase tracking-[0.3em]" onClick={resetAnalyticsFilters}>Reset Analytics</button>
              </div>
            </div>
          )}
        </div>

        {/* Net Cash Flow - Hero */}
        <section className="space-y-10">
          <div className="bg-surface-low p-10 rounded-[3rem] border border-outline-variant shadow-sm overflow-hidden relative group">
            <div className="flex flex-col md:flex-row justify-between gap-10 relative z-10">
              <div className="space-y-4">
                <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase opacity-60">Net Cash Flow</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-on-surface opacity-30">{currencySymbol}</span>
                  <h3 className="text-6xl font-black font-headline text-on-surface tracking-tighter">
                    {(analyticsKPIs?.net || 0).toLocaleString()}
                  </h3>
                </div>
                {netPct && (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold ${netPct.up ? 'bg-primary-fixed text-primary' : 'bg-error/10 text-error'}`}>
                    <span className="material-symbols-outlined text-[14px]">{netPct.up ? 'trending_up' : 'trending_down'}</span>
                    {netPct.label} vs Previous
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-h-[300px] -mx-4 md:mx-0">
                <ResponsiveContainer width="100%" height="100%">
                  {composedData && composedData.length > 0 ? (
                    <ComposedChart data={composedData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--on-surface)" vertical={false} opacity={0.03} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: 'var(--on-surface-variant)', opacity: 0.4 }} dy={10} />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip content={<AnalyticsTooltip currencySymbol={currencySymbol} />} cursor={{ stroke: 'var(--outline-variant)', strokeWidth: 1 }} />
                      <ReferenceLine y={0} stroke="var(--outline-variant)" opacity={0.5} />
                      <Bar dataKey="income" fill="var(--primary)" radius={[4, 4, 0, 0]} opacity={0.1} barSize={20} />
                      <Line type="monotone" dataKey="net" stroke="var(--primary)" strokeWidth={3} dot={false} animationDuration={1500} />
                    </ComposedChart>
                  ) : (
                    <div className="h-full flex items-center justify-center"><EmptyChart /></div>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-transparent to-on-surface/[0.02] pointer-events-none"></div>
          </div>
        </section>

        {/* Analytics Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
          <div className="bg-surface-low p-10 rounded-[3rem] flex flex-col justify-between border border-outline-variant shadow-sm min-h-[280px]">
            <div className="flex justify-between items-start mb-10">
              <div>
                <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase opacity-60">Efficiency Rate</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <h4 className="text-5xl font-black font-headline text-on-surface tracking-tighter">{savRate !== null ? `${savRate}%` : '--'}</h4>
                </div>
              </div>
              <div className="w-14 h-14 rounded-3xl bg-on-surface/[0.03] flex items-center justify-center text-primary border border-outline-variant shadow-inner">
                <span className="material-symbols-outlined text-2xl font-light">account_balance_wallet</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-2 w-full bg-on-surface/[0.03] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-on-surface rounded-full transition-all duration-1000 origin-left" 
                  style={{ width: `${Math.max(0, Math.min(100, savRate || 0))}%`, opacity: 0.2 + (Math.max(0, savRate || 0)/150) }}
                ></div>
              </div>
              <div className="flex justify-between text-[9px] font-black text-on-surface-variant tracking-[0.2em] uppercase opacity-40">
                <span>Efficiency Index</span>
                <span>Optimum: 40%</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-low p-10 rounded-[3rem] flex flex-col justify-between border border-outline-variant shadow-sm min-h-[280px]">
            <div className="flex justify-between items-start mb-10">
              <div>
                <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase opacity-60">Entry Density</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <h4 className="text-5xl font-black font-headline text-on-surface tracking-tighter">{(analyticsKPIs?.txCount || 0).toLocaleString()}</h4>
                  <span className="text-xs font-bold text-on-surface-variant uppercase opacity-40 tracking-widest">Entries</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-3xl bg-on-surface/[0.03] flex items-center justify-center text-primary border border-outline-variant shadow-inner">
                <span className="material-symbols-outlined text-2xl font-light">receipt_long</span>
              </div>
            </div>
            <p className="text-xs font-medium text-on-surface-variant leading-relaxed">
              Volume across selected parameters. Average velocity is <span className="text-on-surface font-black">{(analyticsKPIs?.txCount / 30).toFixed(1)}</span> units / day.
            </p>
          </div>
        </section>

        {/* Categories Analysis */}
        <section className="space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
            <h3 className="font-headline text-xs font-black tracking-[0.4em] text-on-surface uppercase opacity-60">Categorical Breakdown</h3>
            <div className="flex bg-on-surface/[0.03] p-1.5 rounded-2xl gap-1 border border-outline-variant/10">
              {['expense', 'income'].map(t => (
                <button 
                  key={t}
                  className={`px-6 py-2.5 rounded-xl text-xs font-semibold transition-all ${catBreakdownType === t ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-primary'}`}
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
