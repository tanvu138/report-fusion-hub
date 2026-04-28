# Localization Incremental Plan (2025-06-13)

The Vietnamese localisation will be completed in **three phases** so progress can be reviewed and merged in small PR-sized chunks.

---

## Phase 1 – Departments Feature & Defaults

1. **Default to Vietnamese** 
   * Set initial language in `LanguageContext.tsx` to `vi` if no preference stored.
   * Add any missing translation keys for common actions + Department pages.

2. **Department Admin UI**
   * Refactor the following files to replace hard-coded English strings with `t('…')` look-ups:
     * `src/pages/DepartmentAdminPage.tsx`
     * `src/components/ui/DepartmentCreateDialog.tsx`
     * `src/components/ui/DepartmentEditDialog.tsx`
     * `src/components/ui/DepartmentDeleteDialog.tsx`
   * Verify toast / error messages also use translations.

3. Smoke-test app with Vietnamese as default.

---

## Phase 2 – Reports, Templates, Auth
* Repeat the string-replacement process for Report pages, Template Pack UI, Login page and any shared components.

---

## Phase 3 – Sweep / QA
* Search entire codebase for remaining English literals, add translations, run end-to-end checks.

---

### Notes
* Follow the user’s preference for **no Vite proxy** – always call the full backend URL.
* Keep translations in `LanguageContext.tsx`; avoid scattered JSON files for now.
* Update this note as phases complete so we can quickly resume if the session pauses.
