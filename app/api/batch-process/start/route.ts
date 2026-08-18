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
    const files = Array.isArray(body.files) ? body.files : [];
    const dependencyHints = body.dependencyHints || {};
    const formData = new FormData();

    files.forEach((file: any, index: number) => {
      if (file?.image) {
        formData.append('diagrams', dataUrlToFile(String(file.image), file.name || `drawing-${index + 1}.png`));
      }
    });
    formData.append('dependency_hints_json', JSON.stringify(dependencyHints));

    const response = await fetch(`${API_BASE}/batch-process/start`, {
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
