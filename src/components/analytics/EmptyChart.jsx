import React from 'react';

const EmptyChart = ({ h = 280, msg = 'No data available' }) => (
  <div className="flex flex-col items-center justify-center space-y-4" style={{ height: h }}>
    <div className="w-12 h-12 rounded-2xl bg-surface-low flex items-center justify-center text-zinc-700 border border-white/5">
      <span className="material-symbols-outlined">analytics</span>
    </div>
    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic">{msg}</p>
  </div>
);

export default EmptyChart;
