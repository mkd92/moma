# Analytics Dashboard Plan: Recharts Integration

## 1. Objective
Transform the placeholder "Analytics" view into a high-fidelity, interactive data visualization dashboard. This page will leverage the **Recharts** library to provide deep insights into spending habits, income trends, and category distribution, all governed by the powerful multi-dimensional filtering system built for the Ledger.

---

## 2. Library Selection: Recharts
- **Why Recharts?** It is a composable, React-native charting library built on D3. It offers excellent performance, declarative syntax, and is easily styled to match our "Financial Architect" (No-Line, Minimalist) design system.
- **Dependency**: `npm install recharts`

---

## 3. UI / UX Layout Architecture

### A. The Control Center (Top)
- **Universal Filter Bar**: We will reuse the `FilterPanel` logic and UI from the Ledger page.
- **Available Filters**: 
    - Date Range (Presets + Custom)
    - Transaction Type (Income vs. Expense)
    - Hierarchical Categories (Parent & Sub-categories)
    - Tags (Multi-select)
- **Behavior**: Adjusting these filters immediately re-calculates all charts below.

### B. KPI Ribbon (Secondary Row)
Quick-glance metrics based strictly on the filtered dataset:
- Total Filtered Spend / Income
- Average Daily Spend (Burn Rate for the selected period)
- Top Category (by volume)

### C. Visualization Grid (The Charts)
The dashboard will be divided into specific analytical "lenses":

1.  **Cash Flow Velocity (Time-Series Lens)**
    - **Chart Type**: `ComposedChart` or `AreaChart`.
    - **Data**: Daily or weekly aggregation of income vs. expenses.
    - **Aesthetic**: Smooth curves (`type="monotone"`), gradient fills under the curves (Green for income, Red/Blue for expenses), no grid lines, minimal axes.

2.  **Wealth Distribution (Categorical Lens)**
    - **Chart Type**: `Treemap` or `PieChart` (Donut variant).
    - **Data**: Spending breakdown by Parent Categories. Clicking a parent could drill down into sub-categories (if supported, or just show sub-categories in the tooltip).
    - **Aesthetic**: Uses the MOMA semantic color palette. Inner radius set to 60-80% for an elegant donut look.

3.  **Tag Density (Behavioral Lens)**
    - **Chart Type**: `BarChart` (Horizontal).
    - **Data**: Top 5-10 tags associated with the filtered transactions.
    - **Aesthetic**: Thin bars, rounded corners (`radius={[0, 4, 4, 0]}`), sorted descending.

---

## 4. Technical Implementation Strategy

### Step 1: Install & Setup
```bash
npm install recharts
```

### Step 2: Data Transformation Engine (useMemo)
The core challenge is translating flat transaction data into shape arrays required by Recharts. We will need specific useMemo hooks:
- `chartDataTimeSeries`: Groups filtered transactions by day/week/month (handling missing dates by filling with zeros to maintain chart continuity).
- `chartDataCategorical`: Aggregates amounts by `category_id`, mapping to category names and colors.
- `chartDataTags`: Aggregates amounts or counts by `tag_id`.

### Step 3: Component Architecture
Create modular chart components within the `Analytics` view to keep the file clean:
- `<CashFlowChart data={chartDataTimeSeries} />`
- `<CategoryDonutChart data={chartDataCategorical} />`
- `<TagBarChart data={chartDataTags} />`

### Step 4: Filter Integration
- Lift the `filterOptions` state from the `Ledger` view to a higher level (or replicate the structure in the `Analytics` view).
- Ensure the `filteredLedger` array is passed through the Data Transformation Engine before rendering charts.

---

## 5. Design System Adherence (The MOMA Rules)
- **Tooltips**: Custom Recharts `<Tooltip />` components must be created to use `surface-container-lowest` backgrounds, `shadow-ambient`, and Inter typography.
- **Axes**: Remove standard black axes lines (`axisLine={false}` and `tickLine={false}`). Use `on-surface-variant` for tick text.
- **Loading States**: Implement elegant skeleton loaders for the charts while Supabase fetches data.

---

**Plan Generated**: March 24, 2026
**File Path**: `/analytics_dashboard_plan.md`