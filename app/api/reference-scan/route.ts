import { NextResponse } from 'next/server';

const API_BASE = process.env.COST_ESTIMATOR_API_BASE || 'http://127.0.0.1:8010';

// Converts a browser data URL into a File for backend upload.
function dataUrlToFile(dataUrl: string, filename = 'uploaded-diagram') {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || 'application/octet-stream';
  const binary = Buffer.from(base64 || '', 'base64');
  return new File([binary], filename, { type: mimeType });
}

// API route that handles POST requests for this endpoint.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const image = String(body.image || '');
    const filename = String(body.filename || 'uploaded-diagram');

    if (!image || image.startsWith('http')) {
      return NextResponse.json({ success: true, data: { referenced_drawings: [] }, source: 'empty' });
    }

    const formData = new FormData();
    formData.append('diagram', dataUrlToFile(image, filename));

    const response = await fetch(`${API_BASE}/extract-references`, {
      method: 'POST',
      body: formData,
    });
    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: payload.detail || `Backend returned ${response.status}`, data: { referenced_drawings: [] } },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: payload, source: 'gemini_reference_scan' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, data: { referenced_drawings: [] } }, { status: 500 });
  }
}
