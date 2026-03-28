import React from 'react';

const AnalyticsTooltip = ({ active, payload, label, currencySymbol }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-high p-5 rounded-2xl border border-outline-variant shadow-2xl space-y-4 min-w-[180px] backdrop-blur-md">
      <p className="text-[10px] font-black text-on-surface uppercase tracking-[0.3em] border-b border-outline-variant pb-3 mb-1">{label}</p>
      <div className="space-y-2.5">
        {payload.filter(e => e.dataKey !== 'expenseMA').map((e, i) => (
          <div key={i} className="flex justify-between items-center gap-6">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{e.name}</span>
            <span className="text-xs font-black font-headline text-on-surface">
              <span className="text-[10px] opacity-40 mr-0.5">{currencySymbol}</span>
              {Number(e.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsTooltip;
