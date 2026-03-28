export const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥' };

export const ACCT_META = {
  asset: { icon: '🏦', label: 'Asset', color: 'var(--secondary)' },
  liability: { icon: '💳', label: 'Liability', color: 'var(--tertiary-fixed-variant)' },
  temp: { icon: '⏳', label: 'Temp', color: 'var(--on-surface-variant)' },
};

// Route ↔ view name maps
export const VIEW_PATHS = {
  landing: '/', auth: '/auth', dashboard: '/dashboard', ledger: '/ledger',
  new_transaction: '/transaction/new', analytics: '/analytics', budgets: '/budgets',
  settings: '/settings', account_management: '/settings/accounts',
  category_management: '/settings/categories', party_management: '/settings/parties',
  tag_management: '/settings/tags',
};

export const PATH_VIEWS = Object.fromEntries(Object.entries(VIEW_PATHS).map(([k, v]) => [v, k]));

export const CATEGORY_ICONS = {
  'Food': 'restaurant',
  'Dining': 'restaurant',
  'Grocery': 'shopping_cart',
  'Shopping': 'shopping_bag',
  'Transport': 'directions_car',
  'Travel': 'flight',
  'Entertainment': 'movie',
  'Health': 'medical_services',
  'Insurance': 'shield',
  'Utilities': 'bolt',
  'Rent': 'home',
  'Salary': 'payments',
  'Income': 'add_card',
  'Investment': 'trending_up',
  'Gift': 'redeem',
  'Education': 'school',
  'Personal': 'person',
  'Family': 'family_restroom',
  'Other': 'more_horiz',
  'Transfer': 'sync_alt'
};

export const SUB_VIEWS = new Set(['new_transaction', 'account_management', 'category_management', 'party_management', 'tag_management']);
