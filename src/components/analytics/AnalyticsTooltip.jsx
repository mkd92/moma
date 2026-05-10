import React from 'react';

const AnalyticsTooltip = ({ active, payload, label, currencySymbol }) => {
  if (!active || !payload?.length) return null;

  const pointData = payload[0]?.payload;
  const accountBreakdown = pointData?.accounts;
  const hasBreakdown = accountBreakdown && Object.keys(accountBreakdown).length > 0;

  return (
    <div className="bg-surface-high p-5 rounded-2xl border border-outline-variant shadow-2xl space-y-4 min-w-[200px] backdrop-blur-md">
      <p className="text-[10px] font-black text-on-surface uppercase tracking-[0.3em] border-b border-outline-variant pb-3">{label}</p>

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

      {hasBreakdown && (
        <div className="border-t border-outline-variant/30 pt-3 space-y-2">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 mb-2">By Account</p>
          {Object.entries(accountBreakdown).map(([name, bal]) => (
            <div key={name} className="flex justify-between items-center gap-4">
              <span className="text-[9px] font-semibold text-on-surface-variant truncate max-w-[110px]">{name}</span>
              <span className={`text-[10px] font-black tabular-nums ${bal < 0 ? 'text-error' : 'text-on-surface'}`}>
                <span className="opacity-40 mr-0.5">{currencySymbol}</span>
                {Math.abs(bal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalyticsTooltip;
