import React from 'react';
import { PageShell } from '../../components/layout';
import CustomDropdown from '../../components/CustomDropdown';
import { getCategoryIcon } from '../../utils/formatters';

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
      <div className="page-inner max-w-2xl mx-auto space-y-10 pb-32">
        <div className="flex items-center gap-4 px-2">
          <button className="w-10 h-10 rounded-xl bg-surface-low flex items-center justify-center text-zinc-500 hover:text-white transition-colors" onClick={() => setView('settings')}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-[#3fff8b]">Categories</h2>
        </div>

        <div className="flex bg-surface-low p-1.5 rounded-2xl gap-1 border border-outline-variant/10 shadow-xl max-w-xs mx-auto">
          <button className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${settingsType === 'expense' ? 'bg-[#3fff8b] text-[#005d2c] shadow-lg' : 'text-zinc-500'}`} onClick={() => setSettingsType('expense')}>Expense</button>
          <button className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${settingsType === 'income' ? 'bg-[#3fff8b] text-[#005d2c] shadow-lg' : 'text-zinc-500'}`} onClick={() => setSettingsType('income')}>Income</button>
        </div>

        <div className="space-y-4 fade-in">
          {parents.map(parent => {
            const subs = categories.filter(c => c.parent_id === parent.id);
            return (
              <div key={parent.id} className="bg-surface-low rounded-[2rem] border border-outline-variant/10 overflow-hidden shadow-xl group">
                {/* Parent row */}
                <div className={`p-6 flex items-center justify-between transition-colors ${editingCat?.id === parent.id ? 'bg-[#3fff8b]/5' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-[#3fff8b] border border-white/5">
                      <span className="text-xl">{parent.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white tracking-tight">{parent.name}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{subs.length} subcategories</p>
                    </div>
                  </div>
                  {!parent.is_system && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-zinc-500 hover:text-[#3fff8b] transition-colors" onClick={() => { setEditingCat(parent); setNewCatName(parent.name); setNewCatIcon(parent.icon); setNewCatParent(''); }}>
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button className="p-2 text-zinc-500 hover:text-[#ff716c] transition-colors" onClick={() => handleDeleteCategory(parent.id)}>
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  )}
                </div>
                {/* Subcategory rows */}
                {subs.map((sub) => (
                  <div key={sub.id} className={`flex items-center justify-between py-4 pl-16 pr-6 border-t border-white/5 transition-colors ${editingCat?.id === sub.id ? 'bg-[#3fff8b]/5' : 'bg-[#0e0e0e]/30'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg opacity-80">{sub.icon}</span>
                      <span className="text-xs font-bold text-zinc-400">{sub.name}</span>
                    </div>
                    {!sub.is_system && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-zinc-500 hover:text-[#3fff8b] transition-colors" onClick={() => { setEditingCat(sub); setNewCatName(sub.name); setNewCatIcon(sub.icon); setNewCatParent(sub.parent_id || ''); }}>
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button className="p-2 text-zinc-500 hover:text-[#ff716c] transition-colors" onClick={() => handleDeleteCategory(sub.id)}>
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <section className="space-y-4 pt-6">
          <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase px-2">{editingCat ? 'Modify' : 'Create New'} Category</p>
          <form onSubmit={handleCreateCategory} className="bg-surface-low p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-2xl space-y-6">
            <div className="flex gap-6">
              <div className="space-y-2">
                <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Icon</p>
                <input type="text" maxLength="2" placeholder="🔖" className="w-20 bg-[#1a1a1a] border-none rounded-xl p-4 text-white text-center focus:ring-2 focus:ring-[#3fff8b]/30 transition-all text-lg" value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} required />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Category Name</p>
                <input type="text" placeholder="e.g. Subscriptions" className="w-full bg-[#1a1a1a] border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-[#3fff8b]/30 transition-all text-sm font-medium" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required />
              </div>
            </div>
            
            <CustomDropdown 
              label="Parent (Keep root for main category)" 
              options={[{ value: '', label: '-- Root Category --', icon: 'account_tree' }, ...parents.map(p => ({ value: p.id, label: p.name, icon: p.icon }))]} 
              value={newCatParent} 
              onChange={setNewCatParent} 
            />

            <div className="flex gap-4 pt-2">
              <button type="submit" className="flex-1 bg-[#1a1a1a] text-[#3fff8b] py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs border border-[#3fff8b]/20 hover:bg-[#3fff8b]/5 transition-all shadow-lg active:scale-[0.98]">
                {editingCat ? 'Update Hierarchy' : 'Register Category'}
              </button>
              {editingCat && (
                <button type="button" className="px-6 text-zinc-500 font-bold text-xs uppercase tracking-widest" onClick={() => { setEditingCat(null); setNewCatName(''); setNewCatParent(''); setNewCatIcon('🔖'); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </PageShell>
  );
}
