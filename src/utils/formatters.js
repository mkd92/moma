import { CATEGORY_ICONS } from '../constants';

// Module-level date formatter for transaction grouping
export const formatGroupDate = (dateStr) => {
  if (!dateStr || dateStr === 'Unknown') return 'Unknown Date';
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

export const getCategoryIcon = (catName) => CATEGORY_ICONS[catName] || 'label';
