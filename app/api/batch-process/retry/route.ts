import { NextResponse } from 'next/server';

const API_BASE = process.env.COST_ESTIMATOR_API_BASE || 'http://127.0.0.1:8010';

// API route that handles POST requests for this endpoint.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const jobId = String(body.jobId || '');
    const fileName = String(body.fileName || '');

    if (!jobId || !fileName) {
      return NextResponse.json({ success: false, error: 'jobId and fileName are required' }, { status: 400 });
    }

    const formData = new FormData();
    formData.append('file_name', fileName);

    const response = await fetch(`${API_BASE}/batch-process/${encodeURIComponent(jobId)}/retry`, {
      method: 'POST',
      body: formData,
    });
    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: payload.detail || `Backend returned ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: payload });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
