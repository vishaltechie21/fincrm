# Modal Design System & Formatting Rules

## 1. Unified CSS & Theme Variables
- **Single Source of Truth**: All modal components MUST use the unified stylesheet `frontend/src/components/Modals/Modals.css`. Do NOT create individual standalone `.css` files for separate modals.
- **Theme Variables Only**: All color declarations MUST derive from global theme CSS variables (`var(--header-bg)`, `var(--yellow)`, `var(--btn-success)`, `var(--panel)`, `var(--panel2)`, `var(--border)`, `var(--text-h)`, `var(--text)`, `var(--muted)`). Never hardcode ad-hoc hex colors.

## 2. Inline Headers & Accent Lines
- **Inline Title & Sub-heading**: Modal headers MUST display the primary heading (`<h3>`) and secondary subtitle/company name (`.modal-header-sub`) inline on the exact same line (`flex-wrap: nowrap`).
- **Golden Accent Strip**: All modal headers MUST feature a 2px golden bottom border line (`border-bottom: 2px solid var(--yellow, #d97706)`).
- **Compact Padding**: Keep header padding small and clean (`padding: 5px 12px`).

## 3. Input Character Limits & Text Truncation
- **Input Limits**: All input fields and textareas across all forms MUST enforce explicit character limits using the `maxLength` attribute.
- **Global TruncatedText Component**: Use `<TruncatedText text={val} limit={N} />` from `frontend/src/components/TruncatedText/TruncatedText.jsx` for long table cell strings. It automatically truncates text and presents a hover tooltip.

## 4. Accordions, Tables & Inline Forms
- **Non-Collapsing Stage Headers**: Always include `flex-shrink: 0` on `.chk-stage-group` and `.dash-table` rows to prevent stage headers or table rows from squishing or overlapping when accordion panels expand.
- **Clean Step Indexing**: Unnumbered sub-steps (e.g. `Final Group Demonstration`) MUST render clean single-line indices (e.g. `4b`) with `white-space: nowrap`.
- **Inline Form Expansion**: Step edit forms inside table modals MUST expand cleanly within an inline table row `<tr className="dash-edit-tr"><td colSpan={N}>...</td></tr>` directly beneath the selected step.

## 5. Standardized Buttons & Footers
- **Action Buttons**: Secondary outline buttons MUST use clean theme borders and colors (`.act-btn-outline`, `.act-btn-close`).
- **Close Button**: Footer close buttons MUST use white background with theme green border (`var(--btn-success)`).
