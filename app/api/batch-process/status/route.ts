import { NextResponse } from 'next/server';

const API_BASE = process.env.COST_ESTIMATOR_API_BASE || 'http://127.0.0.1:8010';

// API route that handles GET requests for this endpoint.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ success: false, error: 'jobId is required' }, { status: 400 });
    }

    const response = await fetch(`${API_BASE}/batch-process/${encodeURIComponent(jobId)}`, {
      method: 'GET',
      cache: 'no-store',
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
