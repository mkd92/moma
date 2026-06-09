import React from 'react';

const PILL_STYLE = {
  background: 'rgba(7, 16, 29, 0.88)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  boxShadow: '0 4px 28px rgba(7, 16, 29, 0.45), 0 1px 6px rgba(7, 16, 29, 0.3), inset 0 1px 0 rgba(138, 180, 212, 0.12)',
  border: '1px solid rgba(138, 180, 212, 0.18)',
};

const NavBtn = ({ icon, label, isActive, onClick, compact = false, className = '' }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-0.5 rounded-full transition-all duration-200 ${compact ? 'px-3 py-2' : 'px-2 py-2'} ${className}`}
    style={{
      background: isActive ? 'rgba(138, 180, 212, 0.2)' : 'transparent',
      color: isActive ? '#d6e8f7' : 'rgba(138, 180, 212, 0.6)',
    }}
  >
    <span
      className={`material-symbols-outlined ${compact ? 'text-[19px]' : 'text-[22px]'}`}
      style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
    >
      {icon}
    </span>
    <span className={`font-bold tracking-tight ${compact ? 'text-[8px]' : 'text-[10px]'}`}>{label}</span>
  </button>
);

const Divider = () => (
  <div
    className="w-px self-stretch my-2 mx-1 shrink-0"
    style={{ background: 'rgba(138, 180, 212, 0.18)' }}
  />
);

const managementViews = ['settings', 'account_management', 'category_management', 'party_management', 'tag_management'];

const BottomNav = ({ view, onDashboard, onLedger, onAnalytics, onSettings, onNewTx, onAccounts, onCategories, onPayees, onTags, onBulkImport }) => {
  const isSettingsActive = managementViews.includes(view);

  const coreItems = [
    { key: 'dashboard',       label: 'Sanctuary', icon: 'space_dashboard', onClick: onDashboard },
    { key: 'ledger',          label: 'Journal',   icon: 'auto_stories',    onClick: onLedger },
    { key: 'new_transaction', label: 'Entry',     icon: 'add_circle',      onClick: onNewTx },
    { key: 'analytics',       label: 'Analytics', icon: 'monitoring',      onClick: onAnalytics },
  ];

  const managementItems = [
    { key: 'account_management',  label: 'Accounts',   icon: 'account_balance', onClick: onAccounts },
    { key: 'category_management', label: 'Categories', icon: 'category',        onClick: onCategories },
    { key: 'party_management',    label: 'Payees',     icon: 'storefront',      onClick: onPayees },
    { key: 'tag_management',      label: 'Tags',       icon: 'label',           onClick: onTags },
  ];

  // Desktop-only items (not shown in mobile pill)
  const desktopOnlyItems = [
    { key: 'bulk_import', label: 'Bulk', icon: 'table_rows', onClick: onBulkImport },
  ];

  return (
    <nav
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
    >
      {/* ── Mobile pill: core + Settings ─────────────────────── */}
      <div className="flex md:hidden items-center justify-between gap-1 px-1 py-1.5 rounded-full w-[92vw] max-w-[400px]" style={PILL_STYLE}>
        {coreItems.map(({ key, label, icon, onClick }) => (
          <NavBtn key={key} icon={icon} label={label} isActive={view === key} onClick={onClick} className="flex-1" />
        ))}
        <NavBtn icon="settings" label="Settings" isActive={isSettingsActive} onClick={onSettings} className="flex-1" />
      </div>

      {/* ── Desktop pill: core | management ──────────────────── */}
      <div className="hidden md:flex items-center gap-0.5 px-2 py-2 rounded-full" style={PILL_STYLE}>
        {coreItems.map(({ key, label, icon, onClick }) => (
          <NavBtn key={key} icon={icon} label={label} isActive={view === key} onClick={onClick} />
        ))}

        <Divider />

        {desktopOnlyItems.map(({ key, label, icon, onClick }) => (
          <NavBtn key={key} icon={icon} label={label} isActive={view === key} onClick={onClick} compact />
        ))}

        <Divider />

        {managementItems.map(({ key, label, icon, onClick }) => (
          <NavBtn key={key} icon={icon} label={label} isActive={view === key} onClick={onClick} compact />
        ))}

        <Divider />

        <NavBtn icon="settings" label="Settings" isActive={view === 'settings'} onClick={onSettings} compact />

        <div className="w-2" />
      </div>
    </nav>
  );
};

export default BottomNav;
