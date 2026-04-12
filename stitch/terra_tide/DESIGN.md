# Design System Specification: Editorial Wellness Ledger

## 1. Overview & Creative North Star
The "Creative North Star" for this system is **The Financial Sanctuary**. 

Most financial ledgers are built on rigid, anxiety-inducing grids that emphasize "crunching numbers." This design system rejects that clinical approach in favor of an **Editorial Wellness Layout**. We treat financial data like a lifestyle magazine: spacious, rhythmic, and calm. By utilizing intentional asymmetry, overlapping layers, and high-contrast typography scales, we transform a "ledger" into a "journal." The goal is to make the user feel like they are breathing through their finances rather than managing a debt.

---

## 2. Colors & Surface Philosophy
The palette moves away from "bank blue" toward a grounded, earth-toned spectrum that feels organic and tactile.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. 
Boundaries must be defined solely through:
- **Background Color Shifts:** Placing a `surface-container-low` section against a `surface` background.
- **Tonal Transitions:** Using soft gradients to suggest a change in context.
- **Negative Space:** Allowing the `plusJakartaSans` typography to anchor the eye without structural "caging."

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine, textured paper. We use the Material surface tiers to create depth:
- **Base Layer:** `surface` (#fbf9f1) – The primary canvas.
- **Low Priority/Background Content:** `surface-container-low` (#f5f4ec).
- **Interactive Cards/Content Blocks:** `surface-container-lowest` (#ffffff) – These should "float" on top of the base.
- **High Emphasis/Overlays:** `surface-container-highest` (#e4e3db).

### The "Glass & Gradient" Rule
To elevate the "out-of-the-box" feel, use **Glassmorphism** for floating elements (e.g., navigation bars, action sheets). Use semi-transparent `surface` colors with a `backdrop-blur` of 20px. 
**Signature Texture:** For primary CTAs or hero "Financial Health" scorecards, apply a subtle linear gradient from `primary` (#4d614b) to `primary-container` (#657a63). This adds "soul" and depth that flat fills lack.

---

## 3. Typography: The Editorial Voice
We use **Plus Jakarta Sans** for its modern, rounded geometric nature. It balances the "Organic" personality with professional clarity.

- **Display (3.5rem - 2.25rem):** Reserved for large "Zen moments," like the total balance or a monthly summary. Use `-0.02em` letter spacing for a high-end editorial feel.
- **Headline (2rem - 1.5rem):** Used for section titles (e.g., "Monthly Wellness Flow"). 
- **Title (1.375rem - 1rem):** Used for card titles and category headers.
- **Body (1rem - 0.75rem):** The workhorse for transaction descriptions. Maintain a generous line-height (1.6) to ensure the ledger feels "airy."
- **Labels (0.75rem - 0.6875rem):** Used for metadata, like dates or status tags. These should be set in `on-surface-variant` (#434841).

---

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering**, not structural lines.

- **The Layering Principle:** Rather than using a shadow to lift a card, place a `surface-container-lowest` (#ffffff) card on top of a `surface-container-low` (#f5f4ec) background. The subtle shift in hex value provides a soft, natural lift.
- **Ambient Shadows:** When a true "float" is required (e.g., a floating action button), use a 15% opacity shadow tinted with `primary` (#4d614b). Use a large blur (24px to 40px) to mimic soft, ambient sunlight.
- **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` token (#c3c8bf) at **20% opacity**. Never use a 100% opaque border.
- **Glassmorphism:** Navigation menus should use `surface` at 80% opacity with a blur effect, allowing the "paper" textures of the app to bleed through as the user scrolls.

---

## 5. Components

### Buttons
- **Primary:** `primary` (#4d614b) fill with `on-primary` (#ffffff) text. Use `xl` (1.5rem) or `full` roundedness. 
- **Secondary:** `secondary-container` (#fdae94) fill. This Terracotta accent should be used sparingly for "New Entry" or "Action Required."
- **Tertiary:** No background, just `primary` text. Used for "Cancel" or "Go Back."

### Cards & Lists
- **The No-Divider Rule:** Forbid the use of `1px` lines between list items. Instead, use vertical white space (16px - 24px) or a alternating subtle background shift between `surface` and `surface-container-low`.
- **Corner Radii:** Standard cards should use `xl` (1.5rem) roundedness to maintain the "soft" brand personality.

### Input Fields
- **Styling:** Use `surface-container-low` as the background fill. No border. Upon focus, transition the background to `surface-container-lowest` and add a "Ghost Border" of `primary`.
- **Tone:** Labels should be conversational (e.g., "Where did this flow to?" instead of "Category").

### Wellness Progress Bars
- Use `primary-fixed` (#d2e9cd) as the track and `primary` (#4d614b) as the progress fill. The ends must be `full` rounded.

---

## 6. Do’s and Don’ts

### Do
- **Do** use asymmetric layouts (e.g., a larger left margin for headlines) to create a premium, "non-app" feel.
- **Do** use Sage Green (`primary`) for positive financial trends and Terracotta (`secondary`) for over-budget alerts.
- **Do** prioritize white space over data density. If a screen feels "busy," add more `surface` space.

### Don't
- **Don't** use pure black (#000000) for text. Always use `on-surface` (#1b1c17) to keep the contrast "soft."
- **Don't** use sharp corners (`none` or `sm` scales). Everything must feel touchable and safe.
- **Don't** use standard Material icons in high-contrast black. Use simplified, "chunky" icons in `primary-container` to maintain the "Lifestyle" aesthetic.