# ikarkhana Frontend Flow

This document explains the Next.js frontend in simple language so a new developer can understand the project flow and folder structure.

## 1. What This Frontend Does

The frontend is the user interface for the ikarkhana engineering drawing cost estimator.

It allows users to:

- Upload one drawing, multiple drawings, or zip files.
- View parent and child/detail drawing relationships.
- See missing dependency files and upload them.
- Start extraction and costing.
- Track batch processing status file by file.
- Open extraction tables for each processed file.
- See part-wise cards, weights, costs, scrap, nesting, and formula breakdowns.
- Export costing reports and formula reports.

## 2. High Level User Flow

```text
User opens ikarkhana frontend
        |
        v
User uploads one file, multiple files, or zip
        |
        v
Frontend expands upload and scans references
        |
        v
Frontend shows parent drawings and child dependencies
        |
        v
User uploads missing child files if required
        |
        v
User proceeds with uploaded files
        |
        v
Frontend starts backend batch processing
        |
        v
Each file changes status: queued -> processing -> processed / error
        |
        v
User clicks processed file
        |
        v
Extraction table, costing, previews, part cards, and breakdowns are shown
        |
        v
User exports Excel or formula report
```

## 3. Important Frontend Folders

### `app/`

This is the Next.js App Router folder.

It contains the main page, layout, global CSS, and API proxy routes.

### `app/layout.tsx`

Root layout for the frontend.

It sets:

- Page metadata.
- HTML language.
- Global body classes.
- Global CSS import.

### `app/globals.css`

Global stylesheet.

Currently imports Tailwind CSS:

```css
@import "tailwindcss";
```

### `app/page.tsx`

Main Next.js page.

It imports and renders `src/App.tsx`.

### `app/api/`

Frontend-side Next.js API routes.

These work like proxy routes between the browser and the FastAPI backend.

Reason:

- Browser calls same frontend domain.
- Next.js API route forwards request to backend.
- Keeps backend URL handling centralized.

## 4. Frontend API Routes

### `app/api/extract/route.ts`

Calls backend extraction API for single drawing extraction.

### `app/api/estimate/route.ts`

Calls backend estimate API for cost calculation.

### `app/api/preview/route.ts`

Calls backend preview API.

Used to show browser-friendly preview images instead of raw TIFF.

### `app/api/structured-estimate/route.ts`

Calls backend structured estimate API.

Used for part-wise structured JSON breakdown.

### `app/api/reference-scan/route.ts`

Scans a single drawing for child/detail drawing references.

### `app/api/batch-reference-scan/route.ts`

Scans multiple uploaded files for parent-child drawing references.

### `app/api/expand-upload/route.ts`

Expands uploads.

Used when user uploads zip or multiple files.

### `app/api/batch-process/start/route.ts`

Starts batch processing.

This sends the batch files to backend and receives a job/result tracking response.

### `app/api/batch-process/status/route.ts`

Checks current batch processing status.

Used by frontend polling.

### `app/api/batch-process/retry/route.ts`

Retries one failed file in a batch.

## 5. `src/` Folder

The `src` folder contains frontend source code used by the Next.js app.

### `src/App.tsx`

Small wrapper file.

It keeps the app entry stable and renders the estimator feature:

```tsx
import EstimatorApp from './features/estimator/EstimatorApp';

export default EstimatorApp;
```

### `src/features/estimator/`

Main estimator feature folder.

### `src/features/estimator/EstimatorApp.tsx`

Main frontend screen and workflow component.

It currently controls:

- Upload state.
- Batch files.
- Parent-child dependency UI.
- Motion scanning animation.
- Single file flow.
- Batch processing flow.
- Extraction table.
- Rates used for costing.
- Part information fields.
- Part-wise cards.
- Diagram crop previews.
- Reference part images.
- Calculation breakdown modals.
- Nesting visual modals.
- Export buttons.

This file is large and can be split further later into smaller components.

Recommended future split:

- `UploadPanel.tsx`
- `BatchDependencyTable.tsx`
- `BatchProcessingList.tsx`
- `RatesPanel.tsx`
- `PartInformationForm.tsx`
- `PartCards.tsx`
- `DiagramPreview.tsx`
- `CalculationBreakdownModal.tsx`
- `NestingVisualModal.tsx`
- `ExportActions.tsx`

### `src/features/estimator/README.md`

Short developer note explaining what the estimator feature owns.

### `src/constants/`

Shared frontend constants.

### `src/constants/assets.ts`

Contains default image/avatar URLs used by the UI when no uploaded preview exists yet.

### `src/lib/`

Small reusable frontend helper functions.

### `src/lib/formatters.ts`

Formatting helpers.

Example:

- Format INR currency values.

### `src/types/`

TypeScript type definitions shared by frontend components and API flows.

### `src/types/batch.ts`

Types related to batch upload and batch processing.

Examples:

- Uploaded file object.
- Batch result.
- Backend batch file result.

### `src/types/costing.ts`

Types related to extraction and costing.

Examples:

- Technical parameters.
- Estimate result.
- Structured breakdown.
- Calculation steps.
- Line items.
- Plate params.

## 6. Why Static Dependency Map Was Removed

Earlier, the frontend had a hardcoded dependency file:

```text
src/constants/dependencies.ts
```

It contained fixed mappings like:

```text
LS10255 -> LS10269
LS10257 -> LS10268, LS10269
```

This was useful only for sample drawings, but it is wrong for real uploads.

Current approach:

- Dependencies should come from uploaded drawings.
- Backend/Gemini should detect referenced child drawings.
- Frontend should display whatever the backend scan returns.
- Missing files should be red.
- Uploaded dependency files should be green.

## 7. Batch Upload Flow

```text
User uploads files or zip
        |
        v
Frontend expands files if needed
        |
        v
Frontend asks backend to scan child references
        |
        v
Frontend shows each uploaded file as a row
        |
        v
Each row shows child dependencies horizontally
        |
        v
Green = dependency uploaded
Red = dependency missing
        |
        v
User can click red missing file and upload that exact child file
        |
        v
User clicks proceed
        |
        v
Batch processing starts
```

## 8. Batch Processing Flow

```text
Batch starts
        |
        v
Each file is queued
        |
        v
Limited number of files process at the same time
        |
        v
Status becomes processing
        |
        v
Backend extracts dimensions and calculates cost
        |
        v
Status becomes processed
        |
        v
If one file fails, status becomes error
        |
        v
User can retry failed file
```

## 9. Important UI States

### Upload State

Before extraction, the UI focuses on upload and dependency selection.

### Scanning Animation

After upload/proceed, a Motion-based animation shows that the files are being scanned.

This is UI animation only. Actual extraction happens through backend API calls.

### Main Files Ready

After scanning, the UI shows main files.

User clicks a file to open its extraction and costing details.

### Processed File View

Shows:

- Extracted dimensions.
- Editable rates.
- Part information.
- Diagram preview.
- Part-wise cards.
- Cost breakdown.
- Nesting/stock approach.
- Export actions.

## 10. Environment Variables

Frontend should know backend URL.

Common variable:

```text
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url
```

For local development:

```text
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010
```

For Vercel:

Set this in Vercel Project Settings -> Environment Variables.

Example:

```text
NEXT_PUBLIC_API_BASE_URL=https://cost-estimator-7x3o.onrender.com
```

## 11. Deployment Notes

Frontend can be deployed on Vercel.

Build command:

```bash
npm run build
```

Start command is handled by Vercel.

Make sure Vercel environment variables point to the deployed backend.

## 12. Developer Notes

When adding frontend work:

- Put UI workflow code under `src/features/estimator`.
- Put shared types in `src/types`.
- Put common helpers in `src/lib`.
- Put constants in `src/constants`.
- Keep `src/App.tsx` as a wrapper.
- Keep `app/api` route files as backend proxy routes.
- Do not add hardcoded drawing dependencies in the frontend.
- Prefer backend/Gemini extraction data for dependency detection.

## 13. Suggested Future Refactor

`EstimatorApp.tsx` is still very large.

Good next steps:

- Move upload UI into a separate component.
- Move batch dependency UI into a separate component.
- Move processing list into a separate component.
- Move rates form into a separate component.
- Move part cards into a separate component.
- Move modals into separate components.
- Move API calls into hooks such as `useBatchProcessing` and `useEstimator`.

This will make it easier for multiple developers to work without conflicts.
