# Estimator Feature

This folder owns the main costing workflow UI:

- upload single files, multiple files, or zip batches
- show dependency status for parent and child drawings
- run extraction and costing flows
- display rates, dimensions, previews, part cards, breakdowns, and exports

`src/App.tsx` stays as a small wrapper so the app entry point is stable while the estimator feature can keep being split into smaller components and hooks.
