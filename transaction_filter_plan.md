# Transaction Filter Plan: The Digital Ledger

## 1. Objective
Enhance the "Transactions" (Ledger) page with a multi-dimensional, hierarchical filtering system that maintains the **Financial Architect** aesthetic (editorial, breathable, no rigid lines).

---

## 2. UI / UX Design

### A. The Filter Header (Command Row)
- **Search Bar**: Integrated global search for notes and counterparties.
- **Quick Date Presets**: Horizontal scrolling pills for "Today", "This Week", "This Month", "Last 3 Months", "Custom".
- **Advanced Toggle**: A refined button to expand the "Deep Filter" panel.

### B. The Advanced Filter Panel (Slide-down or Slide-out)
- **Layout**: Organized columns following the physical paper stack metaphor.
- **Dimensional Sections**:
    - **Transaction Type**: Segmented toggle (All, Income, Expense, Transfer).
    - **Hierarchical Categories**: 
        - Visual grouping of Parent Categories.
        - Indented sub-categories with smaller micro-icons.
        - "Select All Subcategories" functionality.
    - **Multi-select Tags**: A dense chip grid for quick multi-selection.
    - **Date Range Picker**: Clean, minimalist inputs for Start and End dates (only visible when "Custom" is selected).

### C. Active Feedback (Filter Breadcrumbs)
- **Persistence**: A row of removable chips showing active filters (e.g., `Type: Expense ✕`, `Category: Food ✕`).
- **Clear All**: A "Reset" action that appears only when filters are active.

---

## 3. Data & Logic Strategy

### A. State Architecture
- Use a single `filterOptions` object to manage all dimensions:
  ```javascript
  {
    type: 'all' | 'income' | 'expense' | 'transfer',
    dateRange: { start: Date, end: Date },
    categoryIds: string[],
    tagIds: string[],
    searchTerm: string
  }
  ```

### B. Client-side vs. Server-side Filtering
- **Primary Method**: Client-side filtering using `useMemo` for instant feedback on the currently loaded transaction set.
- **Server-side Fallback**: If the date range exceeds the locally cached data, trigger a new Supabase fetch with specific `.eq()`, `.in()`, and `.gte()/.lte()` filters.

---

## 4. Technical Implementation Steps

### Step 1: Component Refactoring
- Extract `FilterPanel` into a dedicated functional component to keep `App.jsx` lean.
- Implement `HierarchicalCheckbox` for category selection.

### Step 2: Styling (App.css)
- Adhere to the **No-Line Rule**: Use `surface-container-low` background for the panel to separate it from the list.
- Use `spacing.4` (1rem) for internal panel padding.

### Step 3: Integration
- Connect `FilterPanel` state back to the `filteredLedger` memoized variable in `App.jsx`.
- Ensure real-time updates: when a transaction is edited/deleted, the filters should automatically re-evaluate.

---

## 5. Success Criteria
- [ ] Users can find any transaction within 3 clicks.
- [ ] The UI remains clean and does not feel like a "spreadsheet".
- [ ] Transition between filter states is smooth (using the `fade-in` and `slide-up` animations).

**Plan Generated**: March 24, 2026
**File Path**: `/transaction_filter_plan.md`
