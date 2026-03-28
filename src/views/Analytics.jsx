import React from 'react';
import { PageShell } from '../components/layout';
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, Line, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import EmptyChart from '../components/analytics/EmptyChart';
import AnalyticsTooltip from '../components/analytics/AnalyticsTooltip';
import { getCategoryIcon } from '../utils/formatters';

const Analytics = ({ 
  shellProps, 
  showAnalyticsFilters, 
  setShowAnalyticsFilters, 
  analyticsFilters, 
  applyAnalyticsPreset, 
  updateAnalyticsFilter, 
  resetAnalyticsFilters, 
  analyticsKPIs = { net: 0, totalIncome: 0, totalExpense: 0 }, 
  prevPeriodKPIs = { net: 0, income: 0, expense: 0 }, 
  currencySymbol, 
  chartTimeSeries: composedData = [], 
  savingsRate: savRate = null, 
  chartCategorical = [], 
  totalCatVal = 0, 
  catBreakdownType, 
  setCatBreakdownType, 
  navToLedgerByCategory, 
  topPayees = [] 
}) => {
  
  const pct = (curr, prev) => {
    if (prev === undefined || prev === null || prev === 0) return null;
    const change = ((curr - prev) / Math.abs(prev)) * 100;
    return { label: `${Math.abs(change).toFixed(1)}%`, up: change >= 0 };
  };
  
  const netPct = pct(analyticsKPIs?.net || 0, prevPeriodKPIs?.net || 0);

  return (
    <PageShell {...shellProps}>
      <div className="page-inner space-y-12 pb-32 pt-4 md:pt-0 px-6 max-w-7xl mx-auto">
        {/* Header & Filter Engine */}
        <div className="space-y-10">
          <div className="flex justify-between items-center px-2">
            <h2 className="font-headline text-4xl font-black tracking-tight text-on-surface uppercase">Vault Insights</h2>
            <button 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${showAnalyticsFilters ? 'bg-on-surface text-surface border-on-surface shadow-xl' : 'bg-surface-low text-on-surface-variant border-outline-variant hover:text-on-surface'}`}
              onClick={() => setShowAnalyticsFilters(!showAnalyticsFilters)}
            >
              <span className="material-symbols-outlined text-[14px]">tune</span>
              Engine
            </button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto py-4 -my-4 hide-scrollbar px-2">
            {['today', 'this_week', 'this_month', 'last_3m', 'this_year'].map(p => (
              <button 
                key={p} 
                className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all ${(analyticsFilters?.preset === p) ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
                onClick={() => applyAnalyticsPreset(p)}
              >
                {p.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {showAnalyticsFilters && (
          <div className="bg-surface-low p-10 rounded-[3rem] border border-outline-variant/10 shadow-2xl space-y-8 fade-in">
            <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase ml-1 opacity-60">Classification</p>
            <div className="flex bg-on-surface/[0.03] p-1.5 rounded-2xl gap-1 border border-outline-variant/5 max-w-md">
              {['all', 'income', 'expense'].map(t => (
                <button 
                  key={t} 
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${(analyticsFilters?.type === t) ? 'bg-on-surface text-surface shadow-xl scale-[1.02]' : 'text-on-surface-variant hover:text-on-surface'}`}
                  onClick={() => updateAnalyticsFilter('type', t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button className="text-[10px] font-black text-error uppercase tracking-[0.3em]" onClick={resetAnalyticsFilters}>Reset Intelligence</button>
            </div>
          </div>
        )}

        {/* Net Cash Flow - Architectural Hero */}
        <section className="space-y-10">
          <div className="flex justify-between items-end px-4">
            <div>
              <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase mb-4 opacity-60">Net Flow</p>
              <h2 className={`font-headline text-6xl md:text-8xl font-black tracking-tight mt-1 ${(analyticsKPIs?.net >= 0) ? 'text-on-surface' : 'text-on-surface'}`}>
                <span className="opacity-30 text-3xl font-extrabold mr-2">{(analyticsKPIs?.net >= 0) ? '+' : '-'}</span>
                <span className="opacity-40 text-3xl font-extrabold mr-1">{currencySymbol}</span>
                {Math.abs(analyticsKPIs?.net || 0).toLocaleString()}
              </h2>
            </div>
            {netPct && (
              <div className="bg-on-surface/[0.03] px-5 py-2.5 rounded-2xl flex items-center gap-2 border border-outline-variant/10">
                <span className={`material-symbols-outlined text-[14px] ${netPct.up ? 'text-accent' : 'text-error'}`}>
                  {netPct.up ? 'trending_up' : 'trending_down'}
                </span>
                <span className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest">{netPct.label} vs last</span>
              </div>
            )}
          </div>
          
          <div className="h-80 bg-surface-low p-10 rounded-[3rem] border border-outline-variant/10 shadow-sm relative group overflow-hidden">
            {composedData && composedData.length === 0 ? <EmptyChart h={200} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={composedData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="currentColor" className="text-on-surface opacity-[0.03]" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 700, fill: 'var(--on-surface-variant)', opacity: 0.4 }}
                    interval="preserveStartEnd"
                    minTickGap={30}
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip content={<AnalyticsTooltip currencySymbol={currencySymbol} />} />
                  <ReferenceLine y={0} stroke="currentColor" className="text-on-surface opacity-10" strokeWidth={1} />
                  <Bar dataKey="income" name="Inflow" fill="currentColor" className="text-on-surface opacity-20" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="expense" name="Outflow" fill="currentColor" className="text-on-surface opacity-5" radius={[4, 4, 0, 0]} barSize={24} />
                  <Line type="monotone" dataKey="net" name="Net" stroke="currentColor" className="text-on-surface" strokeWidth={2} dot={false} strokeLinecap="round" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-transparent to-on-surface/[0.02] pointer-events-none"></div>
          </div>
        </section>

        {/* Intelligence Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
          <div className="bg-surface-low p-10 rounded-[3rem] flex flex-col justify-between border border-outline-variant shadow-sm min-h-[280px]">
            <div className="flex justify-between items-start mb-10">
              <div>
                <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase opacity-60">Efficiency Rate</p>
                <p className="font-headline text-5xl font-black mt-4 text-on-surface tracking-tighter">{savRate !== null ? `${savRate}%` : '—'}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-on-surface/[0.03] flex items-center justify-center border border-outline-variant/10 text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px]">analytics</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="w-full h-1.5 bg-on-surface/[0.03] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-on-surface rounded-full transition-all duration-1000 origin-left" 
                  style={{ width: `${Math.max(0, Math.min(100, savRate || 0))}%`, opacity: 0.2 + (Math.max(0, savRate || 0)/150) }}
                ></div>
              </div>
              <div className="flex justify-between text-[9px] font-black text-on-surface-variant tracking-[0.2em] uppercase opacity-40">
                <span>Vault Index</span>
                <span>Optimum: 40%</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-low p-10 rounded-[3rem] border border-outline-variant shadow-sm min-h-[280px]">
            <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase opacity-60 mb-10">Top Node</p>
            {chartCategorical && chartCategorical.length > 0 ? (
              <div className="flex items-center gap-6 mt-2">
                <div className="w-20 h-20 rounded-3xl bg-on-surface/[0.03] flex items-center justify-center border border-outline-variant/10 text-on-surface group hover:bg-on-surface transition-all duration-500">
                  <span className="material-symbols-outlined text-[32px] group-hover:text-surface transition-colors">
                    {getCategoryIcon(chartCategorical[0]?.name)}
                  </span>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-on-surface tracking-tight uppercase leading-none">{chartCategorical[0]?.name}</h4>
                  <p className="text-on-surface-variant font-black font-headline text-lg mt-3 opacity-60 tracking-tight">
                    <span className="text-sm font-bold mr-1 opacity-40">{currencySymbol}</span>
                    {(chartCategorical[0]?.value || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest py-12">No vector data</p>}
          </div>
        </section>

        {/* Distribution Matrix */}
        <section className="space-y-10">
          <div className="flex justify-between items-center px-4">
            <h3 className="font-headline text-xs font-black tracking-[0.4em] text-on-surface uppercase opacity-60">Distribution Matrix</h3>
            <button className="text-[9px] font-black text-primary uppercase tracking-[0.3em] cursor-pointer hover:brightness-125 transition-all" onClick={() => setCatBreakdownType && setCatBreakdownType(catBreakdownType === 'expense' ? 'income' : 'expense')}>
              Switch Logic
            </button>
          </div>
          <div className="bg-surface-low p-10 rounded-[3rem] border border-outline-variant shadow-sm space-y-4">
            {(chartCategorical || []).slice(0, 6).map(({ name, id, value }, i) => {
              const pctOfTotal = totalCatVal > 0 ? Math.round((value / totalCatVal) * 100) : 0;
              const icon = getCategoryIcon(name);
              return (
                <div key={id} className="flex items-center gap-6 group py-6 border-b border-outline-variant/10 last:border-0 cursor-pointer" onClick={() => navToLedgerByCategory && navToLedgerByCategory(id, catBreakdownType)}>
                  <div className="w-12 h-12 rounded-2xl bg-on-surface/[0.03] flex items-center justify-center transition-all group-hover:bg-on-surface group-hover:text-surface text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px] font-light">{icon}</span>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-widest text-on-surface group-hover:text-primary transition-colors">{name}</span>
                      <span className="text-sm font-black font-headline text-on-surface">
                        <span className="text-[10px] font-bold opacity-30 mr-1">{currencySymbol}</span>
                        {(value || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-on-surface/[0.03] rounded-full overflow-hidden">
                      <div className="h-full bg-on-surface transition-all duration-1000 origin-left" style={{ width: `${pctOfTotal}%`, opacity: 0.1 + (pctOfTotal/150) }}></div>
                    </div>
                  </div>
                  <div className="w-12 text-right">
                    <span className="text-[10px] font-black text-on-surface-variant opacity-40 group-hover:opacity-100 transition-opacity">{pctOfTotal}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Global Payee Nodes */}
        <section className="space-y-10">
          <h3 className="font-headline text-xs font-black tracking-[0.4em] text-on-surface uppercase opacity-60 px-4">Global Nodes</h3>
          <div className="flex gap-6 overflow-x-auto py-4 -my-4 hide-scrollbar px-2">
            {(topPayees || []).map((p, i) => (
              <div key={i} className="flex-shrink-0 w-44 bg-surface-low p-8 rounded-[3rem] text-center space-y-6 border border-outline-variant transition-all hover:bg-surface-high cursor-default group">
                <div className="w-20 h-20 mx-auto rounded-full bg-on-surface/[0.03] flex items-center justify-center border border-outline-variant shadow-inner transition-all duration-500 group-hover:scale-105 group-hover:border-on-surface/20">
                  <span className="text-2xl font-black text-on-surface opacity-40 group-hover:opacity-100">{p.name?.charAt(0) || '?'}</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-on-surface uppercase truncate tracking-widest group-hover:text-primary transition-colors px-2">{p.name}</p>
                  <p className="text-sm font-black text-on-surface font-headline mt-2 tracking-tight">
                    <span className="text-[10px] font-bold opacity-30 mr-0.5">{currencySymbol}</span>
                    {(p.value || 0).toLocaleString()}
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
