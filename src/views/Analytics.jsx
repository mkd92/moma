import React from 'react';
import { PageShell } from '../components/layout';
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, Line, ResponsiveContainer } from 'recharts';
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
  const PIE_COLORS = ['#3fff8b', '#6e9bff', '#ffe483', '#ff716c', '#acc3ff', '#fdd400'];
  
  const pct = (curr, prev) => {
    if (prev === undefined || prev === null || prev === 0) return null;
    const change = ((curr - prev) / Math.abs(prev)) * 100;
    return { label: `${Math.abs(change).toFixed(1)}%`, up: change >= 0 };
  };
  
  const netPct = pct(analyticsKPIs?.net || 0, prevPeriodKPIs?.net || 0);

  return (
    <PageShell {...shellProps}>
      <div className="page-inner space-y-8 pb-32">
        {/* Header & Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-[#3fff8b]">Insights</h2>
            <button 
              className={`p-2 rounded-xl transition-colors ${showAnalyticsFilters ? 'bg-[#3fff8b] text-[#005d2c]' : 'bg-surface-container text-[#3fff8b]'}`}
              onClick={() => setShowAnalyticsFilters(!showAnalyticsFilters)}
            >
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {['today', 'this_week', 'this_month', 'last_3m', 'this_year'].map(p => (
              <button 
                key={p} 
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${(analyticsFilters?.preset === p) ? 'bg-[#3fff8b] text-[#005d2c]' : 'bg-surface-container text-zinc-500'}`}
                onClick={() => applyAnalyticsPreset(p)}
              >
                {p.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {showAnalyticsFilters && (
          <div className="bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/10 slide-up">
            <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-4">Transaction Type</p>
            <div className="flex bg-surface-container-lowest p-1 rounded-xl gap-1">
              {['all', 'income', 'expense'].map(t => (
                <button 
                  key={t} 
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${(analyticsFilters?.type === t) ? 'bg-[#3fff8b] text-[#005d2c]' : 'text-zinc-500'}`}
                  onClick={() => updateAnalyticsFilter('type', t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button className="text-xs font-bold text-[#ff716c] uppercase tracking-widest" onClick={resetAnalyticsFilters}>Reset Filters</button>
            </div>
          </div>
        )}

        {/* Net Cash Flow Hero */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 font-bold">Net Cash Flow</span>
              <h2 className={`font-headline text-5xl font-extrabold tracking-tighter mt-1 ${(analyticsKPIs?.net >= 0) ? 'text-[#3fff8b]' : 'text-[#ff716c]'}`}>
                {(analyticsKPIs?.net >= 0) ? '+' : '-'}{currencySymbol}{Math.abs(analyticsKPIs?.net || 0).toLocaleString()}
              </h2>
            </div>
            {netPct && (
              <div className="bg-[#3fff8b]/10 px-3 py-1 rounded-full flex items-center gap-1 border border-[#3fff8b]/20">
                <span className={`material-symbols-outlined text-xs ${netPct.up ? 'text-[#3fff8b]' : 'text-[#ff716c]'}`}>
                  {netPct.up ? 'trending_up' : 'trending_down'}
                </span>
                <span className={`text-[10px] font-bold ${netPct.up ? 'text-[#3fff8b]' : 'text-[#ff716c]'}`}>{netPct.label}</span>
              </div>
            )}
          </div>
          
          <div className="h-64 bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/5">
            {composedData && composedData.length === 0 ? <EmptyChart h={200} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={composedData || []}>
                  <XAxis dataKey="label" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip content={<AnalyticsTooltip currencySymbol={currencySymbol} />} />
                  <Bar dataKey="income" fill="#3fff8b" radius={[4, 4, 0, 0]} opacity={0.2} barSize={20} />
                  <Bar dataKey="expense" fill="#ff716c" radius={[4, 4, 0, 0]} opacity={0.2} barSize={20} />
                  <Line type="monotone" dataKey="net" stroke="#3fff8b" strokeWidth={3} dot={false} strokeLinecap="round" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Savings Rate Bento */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container-low p-8 rounded-[2rem] flex flex-col justify-between border-l-4 border-[#3fff8b] shadow-xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-[10px] tracking-widest uppercase text-zinc-500 font-bold">Savings Rate</p>
                <p className="font-headline text-4xl font-extrabold mt-1 text-white">{savRate !== null ? `${savRate}%` : '—'}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#3fff8b]/10 flex items-center justify-center border border-[#3fff8b]/20">
                <span className="material-symbols-outlined text-[#3fff8b]">analytics</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="w-full h-2 bg-surface-container-lowest rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#3fff8b] to-[#13ea79] rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.max(0, Math.min(100, savRate || 0))}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-zinc-500 tracking-wider uppercase">
                <span>Efficiency</span>
                <span>Target: 40%</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-8 rounded-[2rem] border-l-4 border-[#6e9bff] shadow-xl">
            <p className="text-[10px] tracking-widest uppercase text-zinc-500 font-bold mb-4">Top Spending Category</p>
            {chartCategorical && chartCategorical.length > 0 ? (
              <div className="flex items-center gap-4 mt-2">
                <div className="w-16 h-16 rounded-2xl bg-[#6e9bff]/10 flex items-center justify-center border border-[#6e9bff]/20">
                  <span className="material-symbols-outlined text-[#6e9bff] text-3xl">
                    {getCategoryIcon(chartCategorical[0]?.name)}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-white">{chartCategorical[0]?.name}</h4>
                  <p className="text-[#6e9bff] font-bold font-headline">{currencySymbol}{(chartCategorical[0]?.value || 0).toLocaleString()}</p>
                </div>
              </div>
            ) : <p className="text-zinc-500 text-sm">No data</p>}
          </div>
        </section>

        {/* Distribution */}
        <section className="space-y-6">
          <div className="flex justify-between items-baseline">
            <h3 className="font-headline text-2xl font-bold tracking-tight text-white">Distribution</h3>
            <span className="text-[10px] text-[#3fff8b] font-bold tracking-widest uppercase cursor-pointer" onClick={() => setCatBreakdownType && setCatBreakdownType(catBreakdownType === 'expense' ? 'income' : 'expense')}>
              Switch to {catBreakdownType === 'expense' ? 'Income' : 'Expense'}
            </span>
          </div>
          <div className="bg-surface-container p-6 rounded-[2rem] border border-outline-variant/10 space-y-6">
            {(chartCategorical || []).slice(0, 5).map(({ name, id, value }, i) => {
              const pctOfTotal = totalCatVal > 0 ? Math.round((value / totalCatVal) * 100) : 0;
              const color = PIE_COLORS[i % PIE_COLORS.length];
              const icon = getCategoryIcon(name);
              return (
                <div key={id} className="flex items-center gap-4 group cursor-pointer" onClick={() => navToLedgerByCategory && navToLedgerByCategory(id, catBreakdownType)}>
                  <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center transition-transform group-active:scale-90" style={{ color }}>
                    <span className="material-symbols-outlined">{icon}</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">{name}</span>
                      <span className="text-sm font-extrabold font-headline" style={{ color }}>{currencySymbol}{(value || 0).toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctOfTotal}%`, background: color }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recurring Payees */}
        <section className="space-y-6">
          <h3 className="font-headline text-2xl font-bold tracking-tight text-white">Top Payees</h3>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-6 px-6">
            {(topPayees || []).map((p, i) => (
              <div key={i} className="flex-shrink-0 w-36 bg-surface-container-low p-6 rounded-[2.5rem] text-center space-y-4 border border-outline-variant/5 active:scale-95 transition-transform">
                <div className="w-16 h-16 mx-auto rounded-full bg-surface-container-lowest flex items-center justify-center ring-2 ring-[#3fff8b]/20 ring-offset-4 ring-offset-[#0e0e0e]">
                  <span className="text-xl font-bold text-[#3fff8b]">{p.name?.charAt(0) || '?'}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white truncate">{p.name}</p>
                  <p className="text-sm font-extrabold text-[#3fff8b] font-headline mt-1">{currencySymbol}{(p.value || 0).toLocaleString()}</p>
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
