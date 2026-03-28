import React from 'react';
import { PageShell } from '../../components/layout';

export default function PartyManagement({
  parties,
  newPartyName,
  setNewPartyName,
  handleCreateParty,
  handleDeleteParty,
  setView,
  shellProps
}) {
  return (
    <PageShell {...shellProps}>
      <div className="page-inner slide-up">
        <div className="page-header">
          <button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button>
          <h2 className="section-title-editorial">Parties</h2>
        </div>
        <div className="settings-controls fade-in">
          <div className="category-manager">
            {parties.map(p => (
              <div key={p.id} className="editorial-item">
                <div className="editorial-icon">🏪</div>
                <div className="editorial-info">
                  <div className="editorial-title">{p.name}</div>
                </div>
                <button className="delete-btn" onClick={() => handleDeleteParty(p.id)}>✕</button>
              </div>
            ))}
          </div>
          <form onSubmit={handleCreateParty} className="add-category-form">
            <p className="label-sm">Add Party</p>
            <input 
              type="text" 
              placeholder="Party Name (e.g. Starbucks)" 
              value={newPartyName} 
              onChange={(e) => setNewPartyName(e.target.value)} 
              required 
            />
            <button type="submit" className="add-cat-btn">Add Party</button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
