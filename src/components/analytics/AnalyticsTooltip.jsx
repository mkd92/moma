import React from 'react';

const AnalyticsTooltip = ({ active, payload, label, currencySymbol }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-outline-variant/20 shadow-2xl space-y-3 min-w-[160px]">
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] border-b border-white/5 pb-2">{label}</p>
      <div className="space-y-2">
        {payload.filter(e => e.dataKey !== 'expenseMA').map((e, i) => (
          <div key={i} className="flex justify-between items-center gap-4">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">{e.name}</span>
            <span className="text-xs font-black font-headline" style={{ color: e.color }}>
              {currencySymbol}{Number(e.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsTooltip;
