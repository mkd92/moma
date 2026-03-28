import React from 'react';
import { PageShell } from '../../components/layout';
import CustomDropdown from '../../components/CustomDropdown';

export default function CategoryManagement({
  categories,
  settingsType,
  setSettingsType,
  newCatName,
  setNewCatName,
  newCatIcon,
  setNewCatIcon,
  newCatParent,
  setNewCatParent,
  editingCat,
  setEditingCat,
  handleCreateCategory,
  handleDeleteCategory,
  setView,
  shellProps
}) {
  const parents = categories.filter(c => !c.parent_id && c.type === settingsType);

  return (
    <PageShell {...shellProps}>
      <div className="page-inner max-w-2xl mx-auto space-y-12 pb-32 pt-4 md:pt-0 px-6">
        <div className="flex items-center gap-5 px-2">
          <button className="w-12 h-12 rounded-2xl bg-surface-low border border-outline-variant/10 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.05] transition-all" onClick={() => setView('settings')}>
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h2 className="font-headline text-4xl font-black tracking-tight text-on-surface uppercase">Taxonomy</h2>
        </div>

        <div className="flex bg-surface-low p-1.5 rounded-2xl gap-1 border border-outline-variant/10 shadow-xl max-w-xs mx-auto">
          <button 
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settingsType === 'expense' ? 'bg-on-surface text-surface shadow-lg scale-[1.02]' : 'text-on-surface-variant'}`} 
            onClick={() => setSettingsType('expense')}
          >
            Outflow
          </button>
          <button 
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settingsType === 'income' ? 'bg-on-surface text-surface shadow-lg scale-[1.02]' : 'text-on-surface-variant'}`} 
            onClick={() => setSettingsType('income')}
          >
            Inflow
          </button>
        </div>

        <div className="space-y-6 fade-in">
          {parents.map(parent => {
            const subs = categories.filter(c => c.parent_id === parent.id);
            const isEditingParent = editingCat?.id === parent.id;
            return (
              <div key={parent.id} className={`bg-surface-low rounded-[2.5rem] border border-outline-variant/10 overflow-hidden shadow-xl group transition-all ${isEditingParent ? 'ring-2 ring-on-surface/10' : ''}`}>
                {/* Parent row */}
                <div className={`p-8 flex items-center justify-between transition-colors ${isEditingParent ? 'bg-on-surface/[0.03]' : 'hover:bg-on-surface/[0.01]'}`}>
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-on-surface/[0.03] flex items-center justify-center text-on-surface border border-outline-variant/5 shadow-inner">
                      <span className="text-[22px]">{parent.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface tracking-tight">{parent.name}</p>
                      <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mt-1 opacity-60">{subs.length} sub-vectors</p>
                    </div>
                  </div>
                  {!parent.is_system && (
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-on-surface-variant hover:text-on-surface transition-colors" onClick={() => { setEditingCat(parent); setNewCatName(parent.name); setNewCatIcon(parent.icon); setNewCatParent(''); }}>
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button className="p-2 text-on-surface-variant hover:text-error transition-colors" onClick={() => handleDeleteCategory(parent.id)}>
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  )}
                </div>
                {/* Subcategory rows */}
                {subs.length > 0 && (
                  <div className="bg-on-surface/[0.02] divide-y divide-outline-variant/5">
                    {subs.map((sub) => {
                      const isEditingSub = editingCat?.id === sub.id;
                      return (
                        <div key={sub.id} className={`flex items-center justify-between py-5 pl-20 pr-8 transition-colors ${isEditingSub ? 'bg-on-surface/[0.05]' : 'hover:bg-on-surface/[0.03]'}`}>
                          <div className="flex items-center gap-4">
                            <span className="text-lg opacity-60">{sub.icon}</span>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{sub.name}</span>
                          </div>
                          {!sub.is_system && (
                            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-2 text-on-surface-variant hover:text-on-surface transition-colors" onClick={() => { setEditingCat(sub); setNewCatName(sub.name); setNewCatIcon(sub.icon); setNewCatParent(sub.parent_id || ''); }}>
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>
                              <button className="p-2 text-on-surface-variant hover:text-error transition-colors" onClick={() => handleDeleteCategory(sub.id)}>
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <section className="space-y-6 pt-10">
          <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase px-4 opacity-60">{editingCat ? 'Modify Taxonomy' : 'Create New Vector'}</p>
          <form onSubmit={handleCreateCategory} className="bg-surface-low p-10 rounded-[3rem] border border-outline-variant/10 shadow-2xl space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
              <div className="space-y-3">
                <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Symbol</p>
                <input type="text" maxLength="2" placeholder="🔖" className="w-full bg-surface-lowest border border-outline-variant/10 rounded-2xl p-5 text-on-surface text-center focus:ring-2 focus:ring-on-surface/10 transition-all text-xl outline-none" value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} required />
              </div>
              <div className="sm:col-span-3 space-y-3">
                <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Vector Name</p>
                <input type="text" placeholder="e.g. Subscriptions" className="w-full bg-surface-lowest border border-outline-variant/10 rounded-2xl p-5 text-on-surface focus:ring-2 focus:ring-on-surface/10 transition-all text-sm font-bold outline-none placeholder:text-on-surface-variant/20" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required />
              </div>
            </div>
            
            <CustomDropdown 
              label="Structural Parent (optional)" 
              options={[{ value: '', label: '-- Root Vector --', icon: 'account_tree' }, ...parents.map(p => ({ value: p.id, label: p.name, icon: p.icon }))]} 
              value={newCatParent} 
              onChange={setNewCatParent} 
            />

            <div className="flex gap-4 pt-4">
              <button type="submit" className="flex-1 bg-on-surface text-surface py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-xl active:scale-[0.98] transition-all hover:brightness-110">
                {editingCat ? 'Commit Hierarchy' : 'Initialize Vector'}
              </button>
              {editingCat && (
                <button type="button" className="px-8 text-on-surface-variant font-black text-[11px] uppercase tracking-[0.2em] hover:text-on-surface transition-colors" onClick={() => { setEditingCat(null); setNewCatName(''); setNewCatParent(''); setNewCatIcon('🔖'); }}>
                  Abort
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </PageShell>
  );
}
