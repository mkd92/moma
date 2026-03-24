# Budget Feature Plan: Proactive Money Control

## 1. Objective
Transform MOMA into a proactive financial tool by implementing a sophisticated Budgeting system. This feature will allow users to set spending limits, monitor progress in real-time, and receive predictive insights to prevent overspending.

---

## 2. Database Architecture (Supabase)

### New Table: `budgets`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key to `auth.users` |
| `category_id` | UUID | (Optional) Link to a specific category. Null = Global Budget. |
| `amount_limit` | NUMERIC | The maximum spending target. |
| `period` | TEXT | `monthly` (default), `weekly`, `quarterly`. |
| `start_date` | DATE | When the budget tracking begins. |
| `created_at` | TIMESTAMPTZ | Timestamp. |

---

## 3. UI / UX Design: The Budgeting Lens

### A. Budget Management View
- **Global Health Card**: A hero-style donut chart showing "Total Remaining" vs. "Total Spent" for the month.
- **Hierarchical Budget List**:
    - **Cards**: Each budget (Category or Global) represented as a `surface-container-lowest` card.
    - **Progress Bars**: Minimalist `cat-bar-track` style showing spend vs. limit.
    - **Status Indicators**:
        - `On Track` (Green/Secondary)
        - `Warning` (>80% used - Amber)
        - `Over Budget` (>100% used - Tertiary Fixed Variant)

### B. Intelligent Creation Flow
- **Auto-Suggestion**: When creating a budget, MOMA should suggest an amount based on the average spend of the last 3 months for that category.
- **Visual Feedback**: Real-time preview of how the new budget fits into the overall monthly income.

---

## 4. Logical Engine

### A. Real-time Aggregation
- Use `useMemo` to calculate current spend for each budget:
  ```javascript
  const currentSpend = transactions.filter(t => 
    t.type === 'expense' && 
    (!budget.category_id || t.category_id === budget.category_id) &&
    isWithinPeriod(t.transaction_date, budget)
  ).reduce((sum, t) => sum + t.amount, 0);
  ```

### B. Predictive Burn Rate
- Calculate `daysElapsed` vs `daysInPeriod`.
- Project end-of-month spend: `(currentSpend / daysElapsed) * daysInPeriod`.
- If projected spend > `amount_limit`, flag the budget with a "Predictive Overspend" insight.

---

## 5. Technical Implementation Steps

### Step 1: Migration
- Execute SQL to create the `budgets` table and enable RLS (Row Level Security).

### Step 2: State Integration
- Fetch budgets in `fetchInitialData`.
- Add `budgets` state to `App.jsx`.

### Step 3: UI Construction
- Build the `Budgets` view component.
- Implement the `Add/Edit Budget` slide-up modal.
- Add "Budget Progress" widgets to the main Dashboard hero or side stack.

---

## 6. Success Metrics
- [ ] Users can see their remaining daily allowance for each budget.
- [ ] Over-budget categories are visually distinct without being "alarmist".
- [ ] Budgeting logic respects the hierarchical category structure (Parent budgets include Sub-category spend).

---

**Plan Generated**: March 24, 2026
**File Path**: `/budget_feature_plan.md`
