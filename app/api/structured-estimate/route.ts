import { NextResponse } from 'next/server';

const API_BASE = process.env.COST_ESTIMATOR_API_BASE || 'http://127.0.0.1:8010';

function asString(value: unknown, fallback = '') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

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
    const image = String(body.image || '');

    if (!image || image.startsWith('http')) {
      return NextResponse.json(
        { success: false, error: 'Upload a real drawing before requesting structured breakdown.' },
        { status: 400 }
      );
    }

    const params = body.params || {};
    const formData = new FormData();
    formData.append('diagram', dataUrlToFile(image, body.filename || 'uploaded-diagram'));
    formData.append('material_rate_per_kg', asString(params.materialRate, '240'));
    formData.append('laser_cutting_rate_per_meter', asString(params.cutRate, '200'));
    formData.append('press_machine_rate_per_hit', asString(params.pressRate, '5'));
    formData.append('bend_rate_per_bend', asString(params.bendRate, '2'));
    formData.append('welding_labor_per_meter', asString(params.weldRate, '22'));
    formData.append('painting_rate_per_m2', asString(params.surfaceRate, '120'));
    formData.append('tacking_fixed_setup_cost', asString(params.tackingFixed, '1040'));

    const response = await fetch(`${API_BASE}/extract-cost-breakdown`, {
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
