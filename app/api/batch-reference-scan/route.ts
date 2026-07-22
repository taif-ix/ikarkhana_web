import { NextResponse } from 'next/server';

const API_BASE = process.env.COST_ESTIMATOR_API_BASE || 'http://127.0.0.1:8010';

function dataUrlToFile(dataUrl: string, filename = 'uploaded-diagram') {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || 'application/octet-stream';
  const binary = Buffer.from(base64 || '', 'base64');
  return new File([binary], filename, { type: mimeType });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const files = Array.isArray(body.files) ? body.files : [];

    if (files.length === 0) {
      return NextResponse.json({ success: true, data: { files: [] }, source: 'empty' });
    }

    const formData = new FormData();
    files.forEach((file: any) => {
      const image = String(file.image || '');
      const filename = String(file.filename || file.name || 'uploaded-diagram');
      if (image && !image.startsWith('http')) {
        formData.append('diagrams', dataUrlToFile(image, filename));
      }
    });

    const response = await fetch(`${API_BASE}/batch-extract-references`, {
      method: 'POST',
      body: formData,
    });
    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: payload.detail || `Backend returned ${response.status}`, data: { files: [] } },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: payload, source: 'gemini_batch_reference_scan' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, data: { files: [] } }, { status: 500 });
  }
}
