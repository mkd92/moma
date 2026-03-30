import React, { useState } from 'react';
import { PageShell } from '../../components/layout';

export default function PartyManagement({
  parties,
  handleCreateParty,
  handleDeleteParty,
  setView,
  shellProps
}) {
  const [newPartyName, setNewPartyName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = await handleCreateParty(newPartyName);
    if (!error) setNewPartyName('');
  };
  return (
    <PageShell {...shellProps}>
      <div className="page-inner max-w-2xl mx-auto space-y-12 pb-32 pt-4 md:pt-0 px-6">
        <div className="flex items-center gap-5 px-2">
          <button className="w-12 h-12 rounded-2xl bg-surface-low border border-outline-variant/10 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.05] transition-all" onClick={() => setView('settings')}>
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h2 className="font-headline text-4xl font-black tracking-tight text-on-surface uppercase">Nodes</h2>
        </div>

        <div className="space-y-12 fade-in">
          <div className="bg-surface-low rounded-[2.5rem] border border-outline-variant/10 overflow-hidden divide-y divide-outline-variant/5 shadow-xl">
            {parties.map(p => (
              <div key={p.id} className="p-8 flex items-center justify-between group hover:bg-on-surface/[0.02] transition-colors">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-on-surface/[0.03] flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors border border-outline-variant/5 shadow-inner">
                    <span className="material-symbols-outlined text-[22px]">storefront</span>
                  </div>
                  <p className="text-sm font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors">{p.name}</p>
                </div>
                <button className="p-2 text-on-surface-variant hover:text-error transition-colors opacity-0 group-hover:opacity-100" onClick={() => handleDeleteParty(p.id)}>
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
            {parties.length === 0 && (
              <div className="p-20 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-on-surface/[0.03] flex items-center justify-center text-on-surface-variant opacity-20">
                  <span className="material-symbols-outlined text-3xl font-light">storefront</span>
                </div>
                <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-[0.3em] opacity-40">No Nodes Registered</p>
              </div>
            )}
          </div>

          <section className="space-y-6 pt-10">
            <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase px-4 opacity-60">Register New Node</p>
            <form onSubmit={handleSubmit} className="bg-surface-low p-10 rounded-[3rem] border border-outline-variant/10 shadow-2xl space-y-8">
              <div className="space-y-3">
                <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Label</p>
                <input type="text" placeholder="e.g. Amazon, Starbucks" className="w-full bg-surface-lowest border border-outline-variant/10 rounded-2xl p-5 text-on-surface focus:ring-2 focus:ring-on-surface/10 transition-all text-sm font-bold outline-none placeholder:text-on-surface-variant/20" value={newPartyName} onChange={(e) => setNewPartyName(e.target.value)} required />
              </div>
              <button type="submit" className="w-full bg-on-surface text-surface py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-xl active:scale-[0.98] transition-all hover:brightness-110">Initialize Node</button>
            </form>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
