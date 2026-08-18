import { NextResponse } from 'next/server';

const API_BASE = process.env.COST_ESTIMATOR_API_BASE || 'http://127.0.0.1:8010';

// Converts a browser data URL into a File for backend upload.
function dataUrlToFile(dataUrl: string, filename = 'uploaded-diagram'): File {
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
    if (!body.image) {
      return NextResponse.json({ success: false, error: 'No image provided.' }, { status: 400 });
    }

    const formData = new FormData();
    formData.append('diagram', dataUrlToFile(body.image, body.filename || 'uploaded-diagram'));

    const response = await fetch(`${API_BASE}/diagram-preview`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ success: false, error: errorText || `Backend returned ${response.status}` }, { status: response.status });
    }

    const mimeType = response.headers.get('content-type') || 'image/png';
    const buffer = Buffer.from(await response.arrayBuffer());
    return NextResponse.json({
      success: true,
      image: `data:${mimeType};base64,${buffer.toString('base64')}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
