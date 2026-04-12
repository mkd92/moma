import React, { useState } from 'react';
import { PageShell } from '../../components/layout';

import { useAppDataContext } from '../../hooks';

export default function TagManagement() {
  const { 
    tags, 
    isLoading,
    handleCreateTag, 
    handleDeleteTag, 
    setView,
    refreshData
  } = useAppDataContext();

  const [newTagName, setNewTagName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = await handleCreateTag(newTagName);
    if (!error) setNewTagName('');
  };
  return (
    <PageShell view="tag_management" onRefresh={refreshData} isLoading={isLoading}>
      <div className="page-inner max-w-2xl mx-auto space-y-12 pb-32 pt-4 md:pt-0 px-6">
        <div className="flex items-center gap-5 px-2">
          <button className="w-12 h-12 rounded-2xl bg-surface-low border border-outline-variant/10 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.05] transition-all" onClick={() => setView('settings')}>
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h2 className="font-headline text-4xl font-black tracking-tight text-on-surface uppercase">Tags</h2>
        </div>

        <div className="space-y-12 fade-in">
          <div className="flex flex-wrap gap-4 px-2">
            {tags.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-6 py-3 bg-surface-low rounded-full border border-outline-variant group transition-all hover:border-on-surface/30">
                <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface transition-colors">#{t.name}</span>
                <button className="w-5 h-5 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors" onClick={() => handleDeleteTag(t.id)}>
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ))}
            {tags.length === 0 && (
              <div className="w-full py-20 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-on-surface/[0.03] flex items-center justify-center text-on-surface-variant opacity-20">
                  <span className="material-symbols-outlined text-3xl font-light">label</span>
                </div>
                <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-[0.3em] opacity-40">No Tags Found</p>
              </div>
            )}
          </div>

          <section className="space-y-6 pt-10">
            <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase px-4 opacity-60">Register New Tag</p>
            <form onSubmit={handleSubmit} className="bg-surface-low p-10 rounded-[3rem] border border-outline-variant/10 shadow-2xl space-y-8">
              <div className="space-y-3">
                <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Identifier</p>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 font-black text-lg">#</span>
                  <input type="text" className="w-full bg-on-surface/[0.03] border border-outline-variant rounded-2xl p-5 pl-10 text-on-surface focus:ring-2 focus:ring-on-surface/10 transition-all font-bold outline-none uppercase tracking-widest" value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="METADATA" required />
                </div>
              </div>
              <button type="submit" className="w-full bg-primary text-on-primary py-5 rounded-full font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">
                Seal Metadata
              </button>
            </form>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
