import { NextResponse } from 'next/server';

const API_BASE = process.env.COST_ESTIMATOR_API_BASE || 'http://127.0.0.1:8010';

function asString(value: unknown, fallback = '') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

function asNonNegativeNumber(value: unknown, fallback = 0) {
  const parsed = Number(asString(value, String(fallback)));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function costPayload(params: any, extraction: any) {
  return {
    extraction,
    material_rate_per_kg: asNonNegativeNumber(params.materialRate, 240),
    laser_cutting_rate_per_meter: asNonNegativeNumber(params.cutRate, 200),
    press_machine_rate_per_hit: asNonNegativeNumber(params.pressRate, 5),
    bend_rate_per_bend: asNonNegativeNumber(params.bendRate, 2),
    welding_labor_per_meter: asNonNegativeNumber(params.weldRate, 22),
    painting_rate_per_m2: asNonNegativeNumber(params.surfaceRate, 120),
    scrap_rate_per_kg: asNonNegativeNumber(params.scrapRate, 28),
    tacking_fixed_setup_cost: asNonNegativeNumber(params.tackingFixed, 0),
  };
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
    const params = body.params || {};
    const extraction = body.extraction || body.structuredBreakdown || body.structuredExtraction;
    const childDrawings = Array.isArray(body.childDrawings) ? body.childDrawings : [];

    if (extraction && childDrawings.length === 0) {
      const response = await fetch(`${API_BASE}/calculate-cost-breakdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(costPayload(params, extraction)),
      });

      const payload = await response.json();
      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: payload.detail || `Backend returned ${response.status}` },
          { status: response.status }
        );
      }

      return NextResponse.json({ success: true, data: payload, source: 'cached_structured_extraction' });
    }

    if (!image || image.startsWith('http')) {
      return NextResponse.json(
        { success: false, error: 'Upload a real drawing before requesting structured breakdown.' },
        { status: 400 }
      );
    }

    const formData = new FormData();
    formData.append('diagram', dataUrlToFile(image, body.filename || 'uploaded-diagram'));
    childDrawings.forEach((drawing: any) => {
      if (drawing?.image) {
        formData.append('child_diagrams', dataUrlToFile(String(drawing.image), drawing.filename || 'child-detail-drawing'));
      }
    });
    formData.append('material_rate_per_kg', String(asNonNegativeNumber(params.materialRate, 240)));
    formData.append('laser_cutting_rate_per_meter', String(asNonNegativeNumber(params.cutRate, 200)));
    formData.append('press_machine_rate_per_hit', String(asNonNegativeNumber(params.pressRate, 5)));
    formData.append('bend_rate_per_bend', String(asNonNegativeNumber(params.bendRate, 2)));
    formData.append('welding_labor_per_meter', String(asNonNegativeNumber(params.weldRate, 22)));
    formData.append('painting_rate_per_m2', String(asNonNegativeNumber(params.surfaceRate, 120)));
    formData.append('scrap_rate_per_kg', String(asNonNegativeNumber(params.scrapRate, 28)));
    formData.append('tacking_fixed_setup_cost', String(asNonNegativeNumber(params.tackingFixed, 0)));

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
