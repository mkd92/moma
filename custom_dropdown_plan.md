# Custom Dropdown Migration Plan: "The Financial Architect" UI

## 1. Objective
Replace all native `<select>` and `<option>` elements with a high-fidelity, searchable, and keyboard-accessible `CustomDropdown` component. This aligns with the "Financial Architect" design system by eliminating browser-native chrome and ensuring editorial-grade typography and interactions.

## 2. Design Specifications
- **Container:** Borderless background shifts (`surface-container-low` #f6f3f2).
- **Trigger:**
  - Active/Open state: Subtle elevation or high-contrast text.
  - Chevron: Minimalist SVG, rotates 180deg on open.
- **Menu:**
  - Elevation: `shadow-ambient` (soft, diffuse).
  - Search: Integrated top-docked input with `Inter` typography.
  - Option States:
    - `hover`: `var(--surface-container-high)`.
    - `selected`: `var(--primary-light)` with bold text.
    - `focused`: (Keyboard navigation) subtle border or highlight.

## 3. Technical Requirements
- **Keyboard Support:**
  - `ArrowDown` / `ArrowUp`: Navigate list.
  - `Enter`: Select item.
  - `Escape`: Close menu.
  - `Tab`: Sequential navigation.
- **Searchability:** Real-time filtering of the `options` array via `useMemo`.
- **Portal/Z-Index:** Ensure dropdown menus appear above all other content (sticky headers, cards).
- **Accessibility:** `aria-haspopup`, `aria-expanded`, and `role="listbox"`.

## 4. Component Interface
```javascript
<CustomDropdown 
  label="Account"
  placeholder="Select Account"
  value={selectedAccount}
  onChange={setSelectedAccount}
  options={[
    { value: '1', label: 'Checkings', icon: '🏦' },
    { value: '2', label: 'Savings', icon: '💰' }
  ]}
  showSearch={true}
/>
```

## 5. Migration Map
- [x] **New Transaction View:** Category, Account, and Transfer selection.
- [x] **Category Management:** Parent Category selection.
- [x] **Budget Management:** Category and Period selection.
- [ ] **Ledger Filters:** (Partial) Replace remaining filter selects.
- [ ] **Settings:** Currency preference selection.

## 6. Implementation Checklist
1. [ ] **Extract Component:** Move `CustomDropdown` from `App.jsx` to a dedicated `src/components/CustomDropdown.jsx` file for reusability.
2. [ ] **Global CSS:** Move dropdown styles from `App.css` to a modular `CustomDropdown.css`.
3. [ ] **Ref Lock:** Implement `useRef` and `useEffect` listener to close dropdown on outside clicks (already implemented in prototype).
4. [ ] **Visual Polish:** Add micro-animations (0.2s fade/slide) for menu opening.
