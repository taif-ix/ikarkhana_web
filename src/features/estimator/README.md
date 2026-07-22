# Estimator Feature

This folder owns the main costing workflow UI:

- upload single files, multiple files, or zip batches
- show dependency status for parent and child drawings
- run extraction and costing flows
- display rates, dimensions, previews, part cards, breakdowns, and exports

`src/App.tsx` stays as a small wrapper so the app entry point is stable while the estimator feature can keep being split into smaller components and hooks.

## Current Component Split

Reusable UI now lives in `components/`.

Already wired into `EstimatorApp.tsx`:

- `ExportActions.tsx`
- `CalculationBreakdownModal.tsx`
- `NestingVisualModal.tsx`

Section homes created for continued extraction:

- `UploadPanel.tsx`
- `BatchDependencyTable.tsx`
- `BatchProcessingList.tsx`
- `RatesPanel.tsx`
- `PartInformationForm.tsx`
- `PartCards.tsx`
- `DiagramPreview.tsx`

Keep moving JSX from `EstimatorApp.tsx` into these files section by section. `EstimatorApp.tsx` should become the workflow/state coordinator, not the place where every UI block lives.
