---
name: dcg-add-field
description: Add a new field to DCG Dental class listings end to end (DB column, form step, validation, checkout, approve copy, detail page, card, filter, tests). Use whenever someone asks to add, capture, show, or filter by a new piece of listing info.
---

# Add a listing field

A new field touches about ten places. Missing one is how fields silently vanish on approval. Attendance type followed exactly this path; use commit `ee7d323` and its neighbors as the reference.

## 0. Confirm the spec before touching code
Ask Jupiter, in one message:
- Field name and type (text, enum, number, date, boolean)
- Required or optional? Required for which attendance types?
- Allowed values, if it's an enum
- Shown where: card, detail page, admin view, user dashboard?
- Filterable on browse?

## 1. Schema (use the `dcg-migration` skill)
- Add the column to **both** `submissions` and `classes`, same name, same type
- Staging first. Prod only with an explicit yes.
- Update `docs/DATA-MODEL.md`

## 2. Wire it through, in this order
1. `components/submit/SubmitClassForm.tsx`: add to the `FormData` interface, `initialFormData`, the right step's JSX, and `validateStep(n)`. Give the input a stable `id`.
2. `app/api/checkout/route.ts`: include it in insert and update payloads
3. `app/api/admin/submissions/[id]/approve/route.ts`: copy it into the `classes` insert. **This is the step that gets forgotten.**
4. `components/admin/SubmissionDetail.tsx`: show it to the admin
5. `components/dashboard/UserSubmissionDetail.tsx`: show it, and include it in the sessionStorage edit payload
6. `app/classes/[id]/page.tsx`: detail page display + the row interface
7. `components/classes/ClassCard.tsx` and `ClassGrid.tsx`: only if it belongs on the card
8. If filterable: `components/classes/FilterBar.tsx` (URL param) and `app/classes/page.tsx` (apply to **both** the count query and the main query)

## 3. Tests
- Fill the field in `tests/e2e/submit-class.spec.ts`
- Assert it survives approval in `tests/e2e/admin.spec.ts`

## 4. Check
- `npx tsc --noEmit`
- `npm run build`
- Playwright against staging
- Grep the field name. It should appear in every file listed above that applies.

## 5. Report
List each file touched, the migration status per environment, and anything skipped with the reason. Ask before committing.
