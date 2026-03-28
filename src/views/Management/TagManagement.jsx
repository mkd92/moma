import React from 'react';
import { PageShell } from '../../components/layout';

export default function TagManagement({
  tags,
  newTagName,
  setNewTagName,
  handleCreateTag,
  handleDeleteTag,
  setView,
  shellProps
}) {
  return (
    <PageShell {...shellProps}>
      <div className="page-inner slide-up">
        <div className="page-header">
          <button className="icon-btn-text" onClick={() => setView('settings')}>← Back</button>
          <h2 className="section-title-editorial">Tags</h2>
        </div>
        <div className="settings-controls fade-in">
          <div className="category-manager">
            {tags.map(t => (
              <div key={t.id} className="editorial-item">
                <div className="editorial-icon" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>#</div>
                <div className="editorial-info">
                  <div className="editorial-title">#{t.name}</div>
                </div>
                <button className="delete-btn" onClick={() => handleDeleteTag(t.id)}>✕</button>
              </div>
            ))}
          </div>
          <form onSubmit={handleCreateTag} className="add-category-form">
            <p className="label-sm">Add Tag</p>
            <input 
              type="text" 
              placeholder="tag name (e.g. work)" 
              value={newTagName} 
              onChange={(e) => setNewTagName(e.target.value)} 
              required 
            />
            <button type="submit" className="add-cat-btn">Add Tag</button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
