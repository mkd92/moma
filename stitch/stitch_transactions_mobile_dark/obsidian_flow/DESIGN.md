# Design System Strategy: Editorial Finance PWA

## 1. Overview & Creative North Star
The "Creative North Star" for this design system is **"The Digital Ledger."** 

Wealth management is often cluttered and anxiety-inducing. This system rejects the "dashboard fatigue" of traditional fintech in favor of a high-end editorial experience. We treat financial data as a curated story, utilizing intentional asymmetry, expansive white space (breathing room), and a hierarchy that feels more like a premium architectural magazine than a banking app. By breaking the rigid, boxy grid with floating glass layers and varying typographic scales, we establish a sense of effortless authority and calm.

## 2. Colors
Our palette is anchored in high-contrast sophistication. The electric primary emerald green provides a "vibrant pulse" against a deep, obsidian backdrop, ensuring the UI feels alive yet grounded.

### Color Tokens (Dark Mode Reference)
*   **Primary (Emerald):** `#3fff8b` – Used for growth indicators and primary actions.
*   **Secondary (Electric Blue):** `#6e9bff` – Used for neutral data visualizations and secondary actions.
*   **Surface:** `#0e0e0e` – The foundation layer.
*   **Surface Container (Low to Highest):** `#131313` to `#262626` – Used for layering.

### The "No-Line" Rule
Traditional 1px solid borders are strictly prohibited for sectioning. They create visual "noise" that cheapens the interface. Instead, define boundaries through:
*   **Background Shifts:** Place a `surface-container-lowest` card on a `surface-container-low` section.
*   **Tonal Transitions:** Use slight color shifts to indicate grouping.

### Surface Hierarchy & Nesting
Think of the UI as physical layers of obsidian and frosted glass. 
*   **Base:** `surface`
*   **Sectioning:** `surface-container-low`
*   **Interactive Cards:** `surface-container` or `surface-container-high`
This nesting creates "soft depth" that guides the eye without requiring harsh structural lines.

### The "Glass & Gradient" Rule
To elevate beyond standard flat design:
*   **CTAs:** Use a subtle linear gradient from `primary` (`#3fff8b`) to `primary-container` (`#13ea79`) at a 135° angle.
*   **Overlays:** Use `surface-variant` with a `backdrop-blur` of 20px and 60% opacity to create a "frosted" effect for floating navigation or modals.

## 3. Typography
We utilize a dual-typeface system to balance editorial personality with functional clarity.

*   **Display & Headlines (Manrope):** A geometric sans-serif with a modern, high-fashion feel. Use `display-lg` (3.5rem) for net worth and `headline-md` (1.75rem) for section titles.
*   **Body & Labels (Inter/Geist):** These are our "workhorse" fonts. They provide exceptional legibility for dense financial data. Use `body-md` (0.875rem) for transaction details and `label-sm` (0.6875rem) for micro-data.

**Hierarchy Tip:** Always pair a large, bold Manrope headline with a significantly smaller, tracking-increased (`letter-spacing: 0.05em`) Inter label to create that "premium editorial" contrast.

## 4. Elevation & Depth
We eschew traditional drop shadows in favor of **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by "stacking." A card (`surface-container-high`) sitting on a background (`surface-dim`) provides enough contrast to be perceived as "elevated" without a shadow.
*   **Ambient Shadows:** Where floating is required (e.g., the bottom navigation bar), use an extra-diffused shadow: `box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4)`. The shadow should feel like a soft glow rather than a dark stain.
*   **The "Ghost Border":** If a separation is absolutely required for accessibility, use the `outline-variant` token at **15% opacity**. It should be felt, not seen.

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary-container`), `on-primary` text, `xl` (1.5rem) rounded corners.
*   **Secondary:** `surface-container-highest` background with a subtle "Ghost Border."
*   **Interaction:** On tap, scale down to 0.98 for tactile feedback.

### Input Fields
*   **Style:** No bottom line. Use a `surface-container-low` background with a `sm` (0.25rem) corner radius.
*   **Focus:** Transition the background to `surface-container-high` and add a 1px "Ghost Border" using the `primary` color at 30% opacity.

### Cards & Lists
*   **Forbid Dividers:** Never use a horizontal line to separate transactions. Use the **Spacing Scale** (token `2` or `3`) to create separation through whitespace.
*   **Financial Insights Card:** Use a `primary_container` background with 10% opacity and a `primary` left-accent bar (4px width) to highlight "Smart Insights."

### Signature Component: The "Pulse" Progress Bar
For category spending, use a thick (8px) bar with `full` rounding. The track should be `surface-container-highest` and the fill a gradient of the category's assigned color.

## 6. Do's and Don'ts

### Do:
*   **Embrace Negative Space:** If a screen feels "empty," leave it. It conveys luxury and focus.
*   **Use Generous Padding:** Use spacing token `6` (2rem) for container horizontal padding to give content room to breathe.
*   **Contextual Iconography:** Use high-stroke-weight (2pt) icons that match the `on-surface` color exactly.

### Don't:
*   **Don't use 100% Black:** Pure black (#000000) feels "dead." Use our `surface` (#0e0e0e) to maintain tonal depth.
*   **Don't use Centered Text for Data:** Financial figures should always be tabular-aligned or right-aligned for easy scanning.
*   **Don't Over-Animate:** Transitions should be "Snappy & Fluid" (200ms-300ms Ease-Out). Avoid bouncy or "playful" physics; the movement should feel mechanical and precise.