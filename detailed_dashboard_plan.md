# Detailed Dashboard Plan: The Digital Ledger (MOMA)

## 1. Vision & Objective
The dashboard serves as the central "command center" for the user's financial life. It moves beyond simple tracking to providing **Architectural Clarity** and **Actionable Insights**. The goal is to provide a high-end, editorial experience that feels authoritative and breathable.

---

## 2. Core Metrics & Data Points

### A. Consolidated Portfolio Value (The Hero)
- **Primary Metric:** Total Net Worth (Sum of all account balances + net transactions).
- **Secondary Metric:** Percentage change vs. previous month.
- **Visual:** Momentum Sparkline (minimalist trend chart showing last 30 days).
- **Interactivity:** Toggle between "Consolidated" and "Single Account" views via top-header search or dropdown.

### B. Liquidity Snapshots (Summary Cards)
- **Monthly Income:** Total credited amount in the current billing cycle.
- **Monthly Expenses:** Total debited amount in the current billing cycle.
- **Savings Rate:** (Income - Expenses) / Income (Calculated dynamically).
- **Burn Rate:** Average daily spend over the last 30 days.

---

## 3. Interactive Components & Widgets

### A. Smart Insights (Proactive Advice)
- **Algorithmically Generated:**
    - **Budget Opportunity:** Detecting categories where spend is significantly lower than average.
    - **Subscription Alert:** Identifying recurring payments and potential consolidation opportunities.
    - **Vault Suggestion:** Recommending transfers to "Vault" (High-Yield) when liquidity exceeds a 30-day buffer.
- **Editorial Tone:** Phrased as helpful suggestions rather than rigid alerts.

### B. Recent Activity (Editorial Feed)
- **Style:** List items using tonal highlights (Green for Income, Red for Expense).
- **Metadata:** Show Category, Counterparty, Date, and Account.
- **Interactivity:** Click to open the "Edit Transaction" slide-up modal.

### C. Asset Allocation (Visual Density)
- **Donut Chart:** Break down of wealth across Equities, Cash, Crypto, etc.
- **Top Categories:** Horizontal progress bars showing the highest spend categories for the current month.
- **Portfolio Protection:** Status indicator for security features (2FA, Encryption).

---

## 4. Technical Implementation Strategy

### A. Data Fetching & State Management
- **Supabase Real-time:** Enable real-time listeners for the `transactions` and `accounts` tables to ensure the dashboard updates instantly upon modification.
- **Memoized Derived State:** Continue using `useMemo` for heavy financial calculations (Balance, Income/Expense totals) to prevent unnecessary re-renders.
- **Pagination:** Implement a "View All" link that leads to the Ledger, while the dashboard only fetches the top 5-8 most recent transactions for performance.

### B. Responsive Grid System
- **Layout:** 2-column grid on Desktop (Main Stack + Side Stack).
- **Mobile optimization:** Collapse to a single column stack with the Portfolio Hero at the top.
- **Spacing:** Rigid adherence to `spacing.8` (2rem) and `spacing.10` (2.5rem) margins to maintain the "luxurious" feel.

### C. Visual Polish (CSS Tokens)
- **Gradients:** Use `linear-gradient(135deg, var(--primary), var(--primary-container))` for hero elements.
- **Glassmorphism:** Apply to floating action buttons and navigation overlays.
- **No-Line Rule:** Ensure all depth is created via background color shifts (`surface` vs `surface-container-low`).

---

## 5. Future Roadmap Items
- [ ] **Predictive Forecasting:** Projecting end-of-month balance based on historical burn rate.
- [ ] **Custom Widgets:** Allow users to pin specific categories or accounts to the dashboard.
- [ ] **Multi-Currency Support:** Automatic conversion of non-primary currency accounts into the user's preferred currency code.
- [ ] **Dark Mode Strategy:** High-contrast midnight-blue theme for low-light financial reviews.

---

**Plan Generated:** March 24, 2026
**File Path:** `/detailed_dashboard_plan.md`
