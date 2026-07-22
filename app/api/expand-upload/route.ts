import { NextResponse } from 'next/server';

const API_BASE = process.env.COST_ESTIMATOR_API_BASE || 'http://127.0.0.1:8010';

export async function POST(request: Request) {
  try {
    const incoming = await request.formData();
    const formData = new FormData();
    incoming.getAll('uploads').forEach((file) => {
      if (file instanceof File) {
        formData.append('uploads', file);
      }
    });

    const response = await fetch(`${API_BASE}/expand-upload`, {
      method: 'POST',
      body: formData,
    });
    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: payload.detail || `Backend returned ${response.status}`, files: [] },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, ...payload });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, files: [] }, { status: 500 });
  }
}
