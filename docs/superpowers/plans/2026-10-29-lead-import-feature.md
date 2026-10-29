# Lead Import Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a CSV Lead Import feature allowing admins and brokers to upload CSV files, parse and validate lead rows against CRM rules, display error/success feedback, and batch-create leads into the CRM store.

**Architecture:** Create a new `ImportLeadsDialog.tsx` component following existing UI patterns (Shadcn Dialog, Button, Table/Summary alerts). Add a robust client-side CSV parser and validator that maps columns (Name, Phone, Email, Property Type, Budget Min, Budget Max, Bedrooms, Neighborhoods, Source, Stage) to the `Lead` type, reusing `normalizePhone`, `PROPERTY_TYPES`, `NEIGHBORHOODS`, and stages from `src/lib/crm/rules.ts`. Integrate the "Importar CSV" button into `src/routes/_authenticated/index.tsx` alongside the existing Export button.

**Tech Stack:** React, TypeScript, TanStack Router, Shadcn UI, Tailwind CSS, Sonner (toast notifications), standard browser `FileReader` API for CSV parsing.

**Spec:** User requirements for Lead Import feature in Morada CRM imobiliário.

## Global Constraints
- Strictly follow existing codebase patterns (`useCrm` store hook, shadcn components, Lucide icons, pt-BR localization).
- Reuse `normalizePhone`, `PROPERTY_TYPES`, `NEIGHBORHOODS`, and stage rules from `src/lib/crm/rules.ts`.
- File size must be read client-side securely with error handling for malformed CSVs and invalid row data.

## Trade-offs Analysis: Manual Row-by-Row Import vs Batch Supabase Insert
1. **Current `addLead` per-row approach (Chosen for MVP):**
   - *Pros:* Fully leverages existing store actions (`addLead`), handles Supabase table sync and state updates automatically, simpler error handling per row, maintains consistency with single lead creation.
   - *Cons:* Multiple network requests for large CSVs (N roundtrips to Supabase), potential race conditions or partial failures if midway.
2. **Direct Batch Supabase Insert (`supabase.from("leads").insert([...])`):**
   - *Pros:* Single network request, highly efficient for large datasets, transactional atomicity (all-or-nothing with Postgres transactions if configured).
   - *Cons:* Bypasses store action encapsulation, requires manual state synchronization or store reload, error handling is aggregated rather than row-by-row (harder to pinpoint which specific row failed unless using Postgres `ON CONFLICT` or detailed feedback arrays).

## Review Focus
- **Malformed CSV / Encoding Issues:** Handling missing headers, incorrect delimiters (comma vs semicolon), or missing BOM.
- **Data Validation & Sanitization:** Ensuring phone numbers normalize correctly, budgets are valid numbers where `budgetMin <= budgetMax`, and property types/neighborhoods match allowed values or fall back gracefully with clear row error messages.
- **Empty / Huge Files:** Graceful empty state checks and file size / row count limits.
- **Role Permissions:** Ensuring admin vs broker ownership assignment during import.

---

### Task 1: Create CSV Parsing & Validation Utility

**Files:**
- Create: `src/lib/crm/import.ts`
- Test: `src/lib/crm/import.test.ts` (or integration tests)

**Interfaces:**
- Consumes: `Lead`, `PropertyType`, `normalizePhone`, `PROPERTY_TYPES`, `NEIGHBORHOODS` from `src/lib/crm/types` and `src/lib/crm/rules.ts`.
- Produces: `parseLeadCSV(csvText: string, defaultOwnerId: string): { leads: Omit<Lead, "id" | "createdAt" | "lastContactAt" | "interactions">[], errors: { row: number; message: string }[] }`

- [ ] **Step 1: Write validation test for CSV parsing and row validation**
- [ ] **Step 2: Implement `parseLeadCSV` in `src/lib/crm/import.ts`**
- [ ] **Step 3: Verify parsing handles semicolons/commas and normalizes phones and budgets**

---

### Task 2: Create `ImportLeadsDialog.tsx` Component

**Files:**
- Create: `src/components/crm/ImportLeadsDialog.tsx`
- Modify: `src/routes/_authenticated/index.tsx`

**Interfaces:**
- Consumes: `parseLeadCSV` from `src/lib/crm/import.ts`, `useCrm` from `src/lib/crm/store.tsx`, Shadcn Dialog/Button/Alert components.
- Produces: `ImportLeadsDialog` component exported for use in the funnel page.

- [ ] **Step 1: Build file dropzone / file picker state and CSV preview table**
- [ ] **Step 2: Implement validation summary (valid rows count vs error rows count)**
- [ ] **Step 3: Implement batch import execution using `addLead` and toast feedback**

---

### Task 3: Integrate Import Button in Funnel Page

**Files:**
- Modify: `src/routes/_authenticated/index.tsx`

**Interfaces:**
- Consumes: `ImportLeadsDialog` from `@/components/crm/ImportLeadsDialog`.
- Produces: Updated funnel page actions header with "Importar CSV" button visible to admins and authorized users.

- [ ] **Step 1: Add `ImportLeadsDialog` next to "Exportar CSV" in `src/routes/_authenticated/index.tsx`**
- [ ] **Step 2: Verify build and type checking**
