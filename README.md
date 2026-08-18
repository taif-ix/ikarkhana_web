<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# IkarKhana Web

Next.js frontend for the IkarKhana / Cost Estimator POC.

Backend API repo:

```text
https://github.com/taif-ix/cost_estimator
```

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:

```powershell
npm install
```

2. Run the app:

```powershell
npm run dev
```

Optional backend URL override:

```powershell
$env:COST_ESTIMATOR_API_BASE="http://127.0.0.1:8010"
```

3. Open:

```text
http://localhost:3000
```

The backend should be running separately at:

```text
http://127.0.0.1:8010
```

The Next.js app exposes `/api/extract`, `/api/structured-estimate`, and batch proxy routes as thin adapters to the FastAPI backend, so the browser stays on the frontend origin while costing and extraction remain in the backend repo.

