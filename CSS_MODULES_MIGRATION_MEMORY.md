# CSS Modules Migration Memory

## Purpose

This document is the durable working memory for migrating Tack Wise from the monolithic src/App.css stylesheet to CSS Modules. The migration is incremental: complete and verify one checklist item at a time, then wait for explicit confirmation before starting the next item.

## Current Audit Baseline

- src/App.css contains 4,805 lines.
- src/App.tsx is the only current import site: import './App.css';.
- No *.module.css files currently exist under src/.
- App.css contains component styles, shared styles, theme overrides, responsive overrides, print rules, and two keyframe animations.
- The audit identified 317 CSS class tokens, plus global selectors and state/theme selectors.
- Existing global foundation styles in src/index.css are separate from this App.css migration and must remain accounted for.

## Migration Rules

1. Work on exactly one checklist item per iteration.
2. Before editing, inspect the complete relevant CSS rules in src/App.css and the complete React component usage.
3. For every item, provide or record:
   - The original global selectors and declarations from src/App.css.
   - The new colocated Component.module.css code.
   - The refactored React component importing the module and referencing styles correctly.
4. Preserve rendered behavior, DOM semantics, class-state combinations, responsive behavior, theme variants, focus/hover states, animations, and test behavior.
5. Do not migrate unrelated selectors opportunistically.
6. Do not remove a selector from App.css until all usages have moved and verification has passed.
7. After each item, stop and wait for confirmation or a specific next item.

## CSS Module Conventions

- Use colocated files named after the component, for example ColorPicker.module.css beside ColorPicker.tsx.
- Keep component-specific selectors local to the component module.
- Prefer readable local names such as trigger, menu, isOpen, and selected.
- Import modules with a named styles binding unless an existing file convention requires otherwise.
- Replace static class names with styles.name.
- Replace conditional class names with a safe composition pattern that preserves every state class.
- Keep true global foundation styles global: :root, body, theme variables, resets, print rules, and app-wide layout behavior.
- Use :global(...) only when a component module must respond to an app-wide theme or state ancestor such as .light-theme or .presenter-mode.
- Keep shared selectors shared only when they represent a real cross-component contract.
- Preserve keyframe names and animation behavior unless there is a concrete reason to scope or rename them.

## Ordered Migration Checklist

Each checkbox is one migration item. The items are ordered from global/shared foundations toward isolated component groups.

### 1. Global shell and theme foundation

- [x] Audit and classify :root, body, .app-shell, .app-shell.light-theme, and .workspace. The true global foundation now lives in src/index.css.
- [x] Preserve theme custom properties and color-scheme behavior.
- [x] Preserve print rules for body, .app-shell, .workspace, .canvas-container, .app-header, .step-panel, .timeline-bar, .canvas-zoom-controls, .wind-vane-container, and .sidebar-backdrop; retain the component-dependent selectors in App.css until their modules exist.
- [x] Preserve playbackToastIn and rotateSpinner; their owning component rules remain in App.css until the related overlay migrations.
- [x] Retain cross-component presenter-mode and print overrides in App.css until the dependent component modules are migrated.
- Primary files: src/App.tsx, src/index.css, src/App.css.

### 2. Application header and branding

- [x] Migrate .app-header, .header-main, .branding h1, .brand-icon, .branding .eyebrow, .header-tools, .header-tool-btn, .header-about-btn, and responsive header rules.
- [x] Preserve shared header behavior used by AppHeader and AboutPage.
- Primary files: src/components/AppHeader.tsx, src/components/AboutPage.tsx, src/components/BrandMark.tsx.

#### Item 2 migration record (2026-07-22)

- Original global CSS: `.app-header`, `.header-main`, `.branding h1`, `.brand-icon`, `.branding .eyebrow`, `.header-tools`, `.header-tool-btn` with its hover/disabled states, the print hide rule for `.app-header`, and the `max-width: 768px` rules for `.app-header`, `.header-main`, `.header-tools`, `.header-tool-btn`, and `.header-about-btn`.
- New module: `src/components/AppHeader.module.css` contains the equivalent declarations under local names (`appHeader`, `headerMain`, `branding`, `brandIcon`, `eyebrow`, `headerTools`, `headerToolButton`, `headerAboutButton`), including print and responsive rules.
- React refactor: `AppHeader` and `AboutPage` import the shared module. `HeaderMoreActions` and `SponsorshipActions` also use the shared `headerToolButton` class so no remaining runtime usage depends on the removed global `.header-tool-btn` selector. Their item-specific modifier classes remain global for items 5 and 6.
- Verification: `npm run build`, `npm run lint`, all 35 Jest suites (259 tests), targeted header/support tests (20 tests), and browser checks at desktop, 390px mobile, and `/about` all passed. The temporary browser viewport was reset after verification.

### 3. Export and file menus

- [x] Migrate .export-actions, the ExportActions usage of .action-btn and .action-icon, .file-dropdown, .file-menu-trigger, .file-menu-chevron, .file-dropdown-menu, .file-submenu, .file-submenu-menu, .file-submenu-trigger, .file-submenu-chevron, .file-menu-item, and interaction states.
- [x] Migrate .template-search, .template-search-input, .template-search-empty, .template-list, .template-sheet-backdrop, .template-sheet-header, .template-sheet-title, .template-sheet-close, .template-menu-divider, .template-contribute-btn, and mobile template-sheet rules.
- Primary file: src/components/ExportActions.tsx.

#### Item 3 migration record (2026-07-22)

- Original global CSS: `.export-actions` supplied the flex row and 12px gap; `.action-btn` supplied the 0.85rem/8px 16px button base, border, card background, text color, transition, weight, min-height, and hover lift/accent state; `.action-icon` supplied inline-flex icon alignment. File rules covered `.file-dropdown`, `.file-menu-trigger`, `.file-menu-chevron`, `.file-dropdown-menu`, `.file-submenu`, `.file-submenu-menu`, `.file-submenu-trigger`, `.file-submenu-chevron`, and `.file-menu-item`, including menu positioning, layering, spacing, hover transform suppression, and responsive mobile sheet placement. Template rules covered the search field/focus outline, empty state, list layout, hidden desktop sheet header, divider, disabled contribution action, mobile backdrop/theme overlay, sheet header/title/close control, and scrollable list.
- New module: `src/components/ExportActions.module.css` contains the equivalent declarations under local names (`exportActions`, `actionButton`, `actionIcon`, `fileDropdown`, `fileMenuTrigger`, `fileMenuChevron`, `fileDropdownMenu`, `fileSubmenu`, `fileSubmenuMenu`, `fileSubmenuTrigger`, `fileSubmenuChevron`, `fileMenuItem`, `templateSearch`, `templateSearchInput`, `templateSearchEmpty`, `templateList`, `templateSheetBackdrop`, `templateSheetHeader`, `templateSheetTitle`, `templateSheetClose`, `templateMenuDivider`, and `templateContributeButton`). The narrow `:global(.header-export-actions)` modifier preserves compact header sizing, and `:global(.light-theme)` preserves the mobile backdrop color. The global `.action-btn` and `.action-icon` contract remains only for `ViewActions` until item 4; ExportActions no longer depends on it.
- React refactor: `ExportActions` imports the module, composes its local root class with the existing `className` prop, and converts every file/template state, menu, icon, focus, disabled, and responsive class reference. `AppHeader` now passes only its header modifier because the root export styling is local. The template-list test uses the rendered element relationship instead of a global selector.
- Verification: `npm run build`, `npm run lint`, all 35 Jest suites (259 tests), targeted export/header/view tests (38 tests), and browser checks at desktop plus 390×844 mobile passed. The mobile check confirmed the File menu, Templates bottom sheet, backdrop, close control, search field, contribution disabled state, and template list. The temporary browser viewport was reset after verification. Vite emitted existing Konva z-index console warnings during the browser check; they are unrelated to this migration.

### 4. View actions

- [x] Migrate .view-dropdown, .view-menu-trigger, .view-menu-chevron, .view-dropdown-menu, .view-menu-item, and hover/focus/disabled behavior.
- [x] Preserve shared action-button and icon composition.
- Primary file: src/components/ViewActions.tsx.

#### Item 4 migration record (2026-07-22)

- Original global CSS: `.action-btn` and its hover state supplied the shared button base; `.action-icon` supplied icon alignment; `.view-dropdown`, `.view-menu-trigger`, `.view-menu-chevron`, `.view-dropdown-menu`, `.view-menu-item`, and its hover state supplied the View menu layout, positioning, spacing, and interaction behavior. The `.header-view-actions .action-btn` rules supplied the 34px desktop header sizing and the 32px/0.74rem mobile sizing.
- New module: `src/components/ViewActions.module.css` contains the equivalent local rules under `actionButton`, `actionIcon`, `viewDropdown`, `viewMenuTrigger`, `viewMenuChevron`, `viewDropdownMenu`, and `viewMenuItem`. The narrow `:global(.header-view-actions) .actionButton` selectors preserve the existing header modifier and its responsive sizing. The `header-view-actions` root gap remains global because it is an existing header layout contract.
- React refactor: `ViewActions` imports the module, composes `actionButton` with the trigger and menu-item classes, and converts the dropdown, chevron, and icon references. The caller-provided `className` remains unchanged so existing `view-actions header-view-actions` modifiers continue to apply. No runtime component or test depends on the removed global View actions selectors.
- Verification: `npm run build`, `npm run lint`, all 35 Jest suites (259 tests), targeted ViewActions tests (2 tests), `git diff --check`, and browser checks at 1280×800 and 390×844 passed. The mobile check confirmed the compact 32px trigger and an in-viewport menu. The temporary browser viewport was reset after verification.

### 5. Header more-actions menu

- [x] Migrate .header-more-actions, .header-more-trigger, .header-more-trigger-label, .header-more-menu, .header-more-about, .header-more-section-heading, .header-more-about p, .header-more-link, and .header-more-divider.
- [x] Preserve mobile-only visibility and compact trigger behavior.
- Primary file: src/components/HeaderMoreActions.tsx.

#### Item 5 migration record (2026-07-22)

- Original global CSS: `.header-more-actions` controlled desktop hiding and relative positioning; `.header-more-menu` supplied the fixed, viewport-aware panel styling; `.header-more-about`, `.header-more-section-heading`, `.header-more-about p`, `.header-more-link` and its hover/focus state, and `.header-more-divider` supplied the menu content layout and interactions. The mobile rules made `.header-more-actions` visible, constrained `.header-more-trigger` to a 34px square, and hid `.header-more-trigger-label`.
- New module: `src/components/HeaderMoreActions.module.css` contains the equivalent local rules under `headerMoreActions`, `headerMoreTrigger`, `headerMoreTriggerLabel`, `headerMoreMenu`, `headerMoreAbout`, `headerMoreSectionHeading`, `headerMoreLink`, and `headerMoreDivider`. The menu’s inline `top`, `left`, `maxHeight`, and `visibility` positioning contract remains unchanged. The existing `AppHeader.module.css` `headerToolButton` class remains composed on the trigger.
- React refactor: `HeaderMoreActions` imports the module and converts the root, trigger, label, panel, content, headings, links, and dividers to module references. The narrow viewport-positioning logic and sponsorship menu composition are unchanged. The narrow viewport test now observes the stable ARIA label and menu role instead of generated or removed CSS class names.
- Verification: `npm run build`, `npm run lint`, all 35 Jest suites (259 tests), targeted AppHeader tests (19 tests), `git diff --check`, and browser checks at 1280×800 and 390×844 passed. Desktop hides the More container; mobile shows a 34×32px trigger with the label hidden and keeps the 280px menu inside the viewport. The temporary browser viewport was reset after verification. Existing Konva z-index console warnings remain unrelated.

### 6. Sponsorship and donation UI

- [x] Migrate .sponsorship-actions, .sponsorship-trigger, .sponsorship-menu, .sponsorship-menu-title, .sponsorship-menu-item, and interaction states.
- [x] Migrate .stripe-donation-form, .stripe-donation-amount-field, .stripe-donation-quick-amounts, .stripe-donation-submit, .stripe-donation-error, and selected/disabled states.
- Primary files: src/components/SponsorshipActions.tsx, src/components/StripeDonationForm.tsx.

#### Item 6 migration record (2026-07-22)

- Original global CSS: sponsorship trigger/menu/item rules and Stripe donation form rules from `src/App.css`.
- New module: `src/components/SponsorshipActions.module.css` contains the equivalent scoped rules with readable local names, including green Support trigger, menu interactions, selected quick amounts, and disabled submit states.
- React refactor: `SponsorshipActions` and `StripeDonationForm` import the module and use its classes. The layout test identifies the trigger and menu through their accessible attributes rather than removed global class hooks.

### 7. Sidebar and frame navigation

- [ ] Migrate .step-panel, .sidebar-backdrop, .sidebar-drawer-handle, .scenario-title-editor, .scenario-title-input, .sidebar-scenario-title-editor, .control-section, .sidebar-frame-section, .sidebar-layers-section, .sidebar-back-btn, .sidebar-layers-heading, .sidebar-layers-frame-name, and .section-title.
- [ ] Preserve drawer states, mobile transitions, title input states, and responsive layout.
- Primary file: src/components/Sidebar.tsx.

### 8. Layers list

- [ ] Migrate .layers-list, .layers-summary, .layer-group, .layer-group-title, .layer-group-count, .layer-group-items, .layer-row, .layer-row-icon, .layer-row-copy, .layer-row-name, .layer-row-detail, and .layers-empty.
- [ ] Preserve .is-selected and .is-wind modifiers, keyboard focus, and dynamic inline color behavior.
- Primary file: src/components/LayerList.tsx.

### 9. Inspector forms and object controls

- [x] Migrate .editor-form, .form-row, form labels/selects/textareas, .connection-list-heading, .connection-section-label, .connection-add-btn, .connection-list, .connection-row, .connection-target-name, .connection-row-btn, .connection-row-delete-btn, and .connection-empty.
- [x] Migrate .quick-angle-dial, .quick-angle-button, .direction-btn, .flex-row, .checkbox-label, and .grid-hint.
- [x] Migrate .inspector-tabs, .inspector-tab, .inspector-tab-panel, .inspector-subsection, .inspector-subsection-title, .inspector-actions, .inspector-close-btn, .inspector-duplicate-btn, .inspector-delete-btn, .inspector-object-name, .inspector-drag-handle, .inspector-title-content, and .no-selection.
- [x] Migrate .speech-bubble-presets, .speech-bubble-preset, .speech-bubble-clear, .rule-offense-list, .rule-offense-row, .rule-offense-name, .rule-offense-remove, and #rule-offense-add.
- Primary file: src/components/Inspector.tsx.

#### Item 9 migration record (2026-07-22)

- Original global CSS: `.editor-form`, `.form-row` with its label, text/search/select, focus, and textarea rules; connection selectors `.connection-list-heading`, `.connection-section-label`, `.connection-add-btn` with hover/focus/disabled states, `.connection-list`, `.connection-row` with nested select, `.connection-target-name`, `.connection-row-btn` with hover/focus and delete modifiers, and `.connection-empty`; object controls `.quick-angle-dial` with its `::before`/`::after` decorations, `.quick-angle-button` with hover/pressed/focus states, `.direction-btn`, `.flex-row`, `.checkbox-label` with checkbox sizing, and `.grid-hint`; tabs and rule-offense selectors; speech-bubble preset/clear controls; and Inspector header/fallback selectors. The `#rule-offense-add` width rule was paired with `.rule-offense-add select`. Floating-inspector overrides supplied drag behavior, local section padding/title layout, and title-content/object-name truncation. Light-theme overrides supplied the Inspector action-button background and shadow. There were no Inspector-specific responsive, print, animation, or presenter-mode rules to move; the global `.floating-inspector` container and its responsive max-height remain with item 11.
- New module: `src/components/inspector/Inspector.module.css` contains the complete equivalent under local names: `controlSection`, `sectionTitle`, `editorForm`, `formRow`, `connectionListHeading`, `connectionSectionLabel`, `connectionAddButton`, `connectionList`, `connectionRow`, `connectionTargetName`, `connectionRowButton`, `connectionRowDeleteButton`, `connectionEmpty`, `quickAngleDial`, `quickAngleButton`, `directionButton`, `flexRow`, `checkboxLabel`, `gridHint`, `inspectorTabs`, `inspectorTab`, `inspectorTabPanel`, `inspectorSubsection`, `inspectorSubsectionTitle`, `ruleOffenseList`, `ruleOffenseRow`, `ruleOffenseName`, `ruleOffenseRemove`, `ruleOffenseAdd`, `speechBubblePresets`, `speechBubblePreset`, `speechBubbleClear`, `actions`, `closeButton`, `duplicateButton`, `deleteButton`, `dragHandle`, `titleContent`, `objectName`, and `noSelection`. Narrow `:global(.floating-inspector)` selectors preserve the floating panel contract, and `:global(.light-theme)` scopes the moved action-button theme overrides. The global `.control-section` and `.section-title` base rules remain intentionally in `App.css` for Sidebar item 7; Inspector uses its local equivalents.
- React refactor: `Inspector` and all existing inspector form/object subcomponents import the module and convert their static and composed class names. The `quick-angle-button-*` class suffix had no CSS declaration and was removed while preserving inline angle positioning and `aria-pressed`. The rule-offense wrapper now owns the width rule through `ruleOffenseAdd`; the public `rule-offense-add` element id remains unchanged for accessibility. `CanvasWorkspace` now passes generated Inspector module classes to `react-rnd` for its cancel and drag-handle contracts. ColorPicker usage and selectors remain untouched. Inspector tests assert accessible roles, labels, and relationships instead of generated module class names.
- Verification: targeted `Inspector.test.tsx` (30 tests), full Jest suite (35 suites / 259 tests), `npm run build`, `npm run lint`, and `git diff --check` passed. A selector search confirmed the migrated Inspector selectors are no longer referenced by the Inspector components or `App.css`; the shared Sidebar `.control-section`/`.section-title` rules and ColorPicker selectors remain intentionally global.

### 10. Color picker

- [ ] Migrate .color-picker, .color-picker-trigger, .color-picker-trigger-swatch, .color-picker-trigger-value, .color-picker-native-input, .color-picker-menu, .color-picker-menu-heading, .color-picker-menu-value, and open/focus states.
- [ ] Migrate .color-picker-speed-dial, .color-picker-speed-dial-ring, .color-picker-speed-dial-center, .color-picker-dial-button, and swatch states.
- [ ] Migrate custom, saved-color, feedback, hint, remove, save, and compact-mode selectors.
- [ ] Preserve light-theme overrides and the data-open state selector.
- Primary file: src/components/ColorPicker.tsx.

### 11. Canvas workspace and overlays

- [ ] Migrate .canvas-container, .canvas-wrap, .canvas-wrap.is-arrow-drawing, .canvas-wrap:active, .canvas-wrap canvas, .arrow-drawing-hint, .arrow-drawing-cancel, and .canvas-edit-hint.
- [ ] Migrate .canvas-top-controls, grid-area relationships, presenter-mode overrides, .canvas-frame-header, and frame-header typography.
- [ ] Migrate .playback-toast, .playback-toast-dismiss, light-theme variants, and playbackToastIn.
- [ ] Preserve floating inspector placement and theme behavior.
- Primary files: src/components/CanvasWorkspace.tsx, src/components/FrameHeader.tsx.

### 12. Canvas controls

- [ ] Migrate history controls: .canvas-history-controls, .canvas-history-btn, and .canvas-history-restore-btn.
- [ ] Migrate zoom controls: .canvas-zoom-controls, .canvas-zoom-btn, .canvas-zoom-fit, .canvas-zoom-reset, and .canvas-zoom-level.
- [ ] Migrate .canvas-settings-btn.
- [ ] Migrate playback controls: .canvas-playback-controls, .canvas-playback-action-btn, .canvas-play-btn, and .canvas-playback-options-btn.
- [ ] Migrate wind HUD selectors .wind-vane-container, .wind-vane-dial, .wind-vane-needle, .compass-n, .compass-s, .compass-e, .compass-w, .wind-vane-info, .wind-vane-speed, and .wind-vane-angle.
- [ ] Preserve mobile sizing, grid areas, light-theme overrides, and pointer-event behavior.
- Primary files: src/components/CanvasHistoryControls.tsx, src/components/CanvasZoomControls.tsx, src/components/GridSettingsButton.tsx, src/components/PlaybackButton.tsx, src/components/WindHud.tsx.

### 13. Timeline and frame thumbnails

- [ ] Migrate .timeline-bar, .sidebar-timeline, .playback-controls, .timeline-control-icon, .timeline-control-label, .play-pause-btn, .playback-replay-btn, .playback-step-btn, .speed-selector, .timeline-action-btn, and .delete-frame-btn.
- [ ] Migrate .frames-scrubber, scrollbar pseudo-elements, .frame-thumbnail, .frame-thumbnail-row, thumbnail layout modifiers, and active/hover/transition-warning states.
- [ ] Migrate .frame-transition-warning, .frame-transition-fix-btn, .frame-duplicate-btn, .frame-layers-btn, .frame-edit-btn, .frame-delete-btn, .thumbnail-num, .thumbnail-title, .thumbnail-title-input, and .timeline-context-hint.
- [ ] Preserve sidebar-specific selectors and mobile control compaction.
- Primary file: src/components/Timeline.tsx.

### 14. Export progress overlay

- [ ] Migrate .export-overlay, .export-spinner-box, .spinner, and rotateSpinner.
- [ ] Preserve light-theme overlay behavior and animation timing.
- Primary file: src/components/ExportOverlay.tsx.

### 15. Export dialog

- [ ] Migrate .export-dialog-backdrop, .export-dialog, .export-dialog-header, .export-dialog-eyebrow, .export-dialog-close, .export-dialog-fields, .export-dialog-field, and form element rules.
- [ ] Migrate .export-dialog-theme-options, .export-theme-option, .export-theme-swatch, .export-dialog-auto-fit, .export-dialog-preparation-note, .export-dialog-actions, .export-dialog-primary, and .export-dialog-secondary.
- [ ] Preserve selected theme, focus, disabled, and auto-fit states.
- Primary file: src/components/ExportDialog.tsx.

### 16. New scenario dialog

- [ ] Migrate .new-scenario-backdrop, .new-scenario-dialog, .new-scenario-header, .new-scenario-heading, .new-scenario-close, .new-scenario-actions, .new-scenario-secondary, .new-scenario-export, and .new-scenario-danger.
- [ ] Preserve modal focus, hover, focus-visible, and disabled behavior.
- Primary file: src/components/NewScenarioDialog.tsx.

### 17. Template contribution dialog

- [ ] Migrate .template-contribution-backdrop, .template-contribution-dialog, .template-contribution-header, .template-contribution-eyebrow, .template-contribution-close, .template-contribution-intro, .template-contribution-form, .template-contribution-field, .template-contribution-errors, .template-contribution-path, .template-contribution-preview, .template-contribution-metadata, and .template-contribution-fallback.
- [ ] Migrate .template-contribution-feedback, .template-contribution-actions, .template-contribution-copy-actions, .template-contribution-primary, and .template-contribution-secondary.
- [ ] Preserve disabled, focus, fallback, and feedback states.
- Primary file: src/components/TemplateContributionDialog.tsx.

### 18. About page

- [ ] Migrate .about-shell, .about-header, .about-back-btn, .about-page, .about-hero, .about-hero-copy, .about-eyebrow, .about-lede, .about-hero-actions, .about-primary-btn, and .about-text-link.
- [ ] Migrate tactical board selectors: .about-hero-board, .about-board-grid, .about-board-footer, .about-board-label, .about-board-wind, .about-course-line, .about-mark, .about-boat, and .about-board-note.
- [ ] Migrate story, capability, author, and footer selectors, including responsive layouts.
- [ ] Preserve shared header/branding styles and theme behavior.
- Primary file: src/components/AboutPage.tsx.

### 19. Orphaned legacy rules

- [ ] Classify before removing .control-row, .inline-buttons, .add-btn, .file-add-btn, .object-toolbar .inline-buttons, .object-toolbar .add-btn, .rule-list, .rule-chip, .library-select-row, .library-items, .library-delete, and .export-quality-control.
- [ ] Confirm each selector has no runtime usage, test-only usage, or dynamically generated usage.
- [ ] Remove only after related migration and regression checks are complete.

## Responsive and Cross-Cutting Requirements

Responsive overrides in src/App.css must move with the owning module whenever possible, including mobile rules for the sidebar, header, template sheet, canvas controls, timeline, and About page.

Cross-component selectors such as .light-theme .color-picker-menu, .presenter-mode .canvas-top-controls, .sidebar-timeline .frame-thumbnail, and .floating-inspector .control-section require explicit review when converted to local module names.

When a module needs to react to an app-wide ancestor, use a narrow global ancestor selector in the module, for example:

    :global(.light-theme) .menu {
      /* theme-specific component rule */
    }

Do not use broad global wrappers that recreate the original monolithic stylesheet.

## Per-Item Deliverable Template

For each selected checklist item, record the following before marking it complete.

### Original global CSS

- Exact selectors and relevant declarations from src/App.css.
- Parent, modifier, pseudo-class, media-query, theme, and animation dependencies.

### New module

- Complete colocated Component.module.css content or exact incremental addition.
- Any required :global(...) selectors documented and justified.

### React refactor

- The module import.
- Static and conditional className conversions.
- Preservation of custom class-name props and shared component contracts.

### Verification

- Targeted component tests.
- Relevant full test suite or build/typecheck.
- Visual or browser verification for responsive and theme-sensitive UI.
- Search confirming migrated selectors are no longer depended on globally.

## Acceptance Criteria

The migration is complete only when:

- Every used App.css selector is migrated, intentionally retained as global foundation, or explicitly classified as orphaned.
- No component references a removed global selector.
- Theme, presenter mode, print behavior, responsive layouts, hover/focus/disabled states, and animations remain functional.
- Existing tests pass, with targeted regression coverage where needed.
- App.css is removed or reduced only after its remaining contents are intentionally accounted for.
- The migration remains reviewable as a sequence of small, independently verifiable changes.

## Current Status

- Audit: complete.
- Memory document: created.
- Component migrations: items 1, 2, 3, 4, 5, and 6 complete; item 7 is next.
- Next action: wait for confirmation or a specific next item before processing item 7.
