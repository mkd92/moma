import { CATEGORY_ICONS } from '../constants';

// Module-level date formatter for transaction grouping
export const formatGroupDate = (dateStr) => {
  if (!dateStr || dateStr === 'Unknown') return 'Unknown Date';
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const localDateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = localDateStr(now);
  const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterday = localDateStr(yest);
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

export const getCategoryIcon = (catName) => CATEGORY_ICONS[catName] || 'label';
