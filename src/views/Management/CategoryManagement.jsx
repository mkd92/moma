import React, { useState } from 'react';
import { PageShell } from '../../components/layout';
import CustomDropdown from '../../components/CustomDropdown';

import { useAppDataContext } from '../../hooks';

export default function CategoryManagement() {
  const { 
    categories, 
    isLoading,
    settingsType, 
    setSettingsType, 
    handleCreateCategory, 
    handleDeleteCategory,
    setView,
    refreshData
  } = useAppDataContext();

  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🔖');
  const [newCatParent, setNewCatParent] = useState('');
  const [editingCat, setEditingCat] = useState(null);

  const parents = categories.filter(c => !c.parent_id && c.type === settingsType);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: newCatName,
      icon: newCatIcon,
      parent_id: newCatParent || null,
      type: settingsType
    };
    const error = await handleCreateCategory(payload, editingCat?.id);
    if (!error) {
      setNewCatName('');
      setNewCatIcon('🔖');
      setNewCatParent('');
      setEditingCat(null);
    }
  };

  const handleEdit = (cat) => {
    setEditingCat(cat);
    setNewCatName(cat.name);
    setNewCatIcon(cat.icon);
    setNewCatParent(cat.parent_id || '');
  };

  const handleAbort = () => {
    setEditingCat(null);
    setNewCatName('');
    setNewCatParent('');
    setNewCatIcon('🔖');
  };

  return (
    <PageShell view="category_management" onRefresh={refreshData} isLoading={isLoading}>
      <div className="page-inner max-w-2xl mx-auto space-y-12 pb-32 pt-4 md:pt-0 px-6">
        <div className="flex items-center gap-5 px-2">
          <button className="w-12 h-12 rounded-2xl bg-surface-low border border-outline-variant/10 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.05] transition-all" onClick={() => setView('settings')}>
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h2 className="font-headline text-4xl font-black tracking-tight text-on-surface uppercase">Categories</h2>
        </div>

        <div className="flex bg-surface-low p-1.5 rounded-2xl gap-1 border border-outline-variant/10 shadow-xl max-w-xs mx-auto">
          <button 
            className={`flex-1 py-3 rounded-xl text-xs font-semibold transition-all ${settingsType === 'expense' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}
            onClick={() => setSettingsType('expense')}
          >
            Expense
          </button>
          <button
            className={`flex-1 py-3 rounded-xl text-xs font-semibold transition-all ${settingsType === 'income' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}
            onClick={() => setSettingsType('income')}
          >
            Income
          </button>
        </div>

        <div className="space-y-12 fade-in">
          <div className="bg-surface-low rounded-[2.5rem] border border-outline-variant/10 overflow-hidden divide-y divide-outline-variant/5 shadow-xl">
            {parents.map(p => (
              <div key={p.id} className="group">
                <div className="p-8 flex items-center justify-between hover:bg-on-surface/[0.02] transition-colors">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-on-surface/[0.03] flex items-center justify-center text-primary border border-outline-variant/5 shadow-inner">
                      <span className="text-xl">{p.icon}</span>
                    </div>
                    <p className="text-sm font-bold text-on-surface tracking-tight">{p.name}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-colors" onClick={() => handleEdit(p)}><span className="material-symbols-outlined text-sm">edit</span></button>
                    <button className="p-2 text-on-surface-variant hover:text-error transition-colors" onClick={() => handleDeleteCategory(p.id)}><span className="material-symbols-outlined text-sm">delete</span></button>
                  </div>
                </div>
                {/* Subcategories */}
                <div className="pl-14 pr-8 pb-4 space-y-2">
                  {categories.filter(c => c.parent_id === p.id).map(s => (
                    <div key={s.id} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-on-surface/[0.02] group/sub">
                      <div className="flex items-center gap-4">
                        <span className="text-lg opacity-40">{s.icon}</span>
                        <p className="text-xs font-bold text-on-surface-variant">{s.name}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-sub/sub:opacity-100 transition-opacity">
                        <button className="p-1.5 text-on-surface-variant hover:text-primary" onClick={() => handleEdit(s)}><span className="material-symbols-outlined text-xs">edit</span></button>
                        <button className="p-1.5 text-on-surface-variant hover:text-error" onClick={() => handleDeleteCategory(s.id)}><span className="material-symbols-outlined text-xs">delete</span></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <section className="space-y-6 pt-10">
            <p className="text-[10px] font-black tracking-[0.4em] text-on-surface-variant uppercase px-4 opacity-60">{editingCat ? 'Modify Category' : 'Create New Category'}</p>
            <form onSubmit={handleSubmit} className="bg-surface-low p-10 rounded-[3rem] border border-outline-variant/10 shadow-2xl space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Icon</p>
                  <input type="text" className="w-full bg-on-surface/[0.03] border border-outline-variant rounded-2xl p-5 text-on-surface focus:ring-2 focus:ring-on-surface/10 transition-all text-center text-2xl outline-none" value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} required />
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Hierarchy</p>
                  <CustomDropdown 
                    label="" 
                    options={[{ value: '', label: 'Root Category', icon: 'layers' }, ...parents.filter(p => p.id !== editingCat?.id).map(p => ({ value: p.id, label: p.name, icon: p.icon } ))]} 
                    value={newCatParent} 
                    onChange={setNewCatParent} 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase ml-1 opacity-60">Category Name</p>
                <input type="text" className="w-full bg-on-surface/[0.03] border border-outline-variant rounded-2xl p-5 text-on-surface focus:ring-2 focus:ring-on-surface/10 transition-all font-bold outline-none" value={newCatName} onChange={e => setNewCatName(e.target.value)} required />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-primary text-on-primary py-5 rounded-full font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">
                  {editingCat ? 'Save Changes' : 'Initialize Category'}
                </button>
                {editingCat && (
                  <button type="button" className="px-8 text-on-surface-variant font-bold uppercase text-[10px] tracking-widest" onClick={handleAbort}>Cancel</button>
                )}
              </div>
            </form>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
