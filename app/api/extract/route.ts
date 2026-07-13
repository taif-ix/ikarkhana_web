import { NextResponse } from 'next/server';

const API_BASE = process.env.COST_ESTIMATOR_API_BASE || 'http://127.0.0.1:8010';

function fallbackData() {
  return {
    partName: 'PILLAR ASSEMBLY',
    materialRate: '255',
    materialForm: 'Square Bar',
    shape: 'Square hollow tube',
    isHollow: true,
    length: '2581',
    diameter: '45',
    thickness: '4',
    qty: '1',
    topPlate: { length: '125', width: '125', thickness: '5' },
    bottomPlate: { length: '150', width: '100', thickness: '5' },
    processes: ['Cutting', 'Welding', 'Surface'],
  };
}

function dataUrlToFile(dataUrl: string): File {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || 'image/png';
  const binary = Buffer.from(base64 || '', 'base64');
  return new File([binary], 'uploaded-diagram.png', { type: mimeType });
}

function mapExtractedDimensions(data: any) {
  const shape = data.main_profile_shape || 'square';
  const isCircular = shape === 'circular';
  return {
    partName: data.part_name || 'Extracted Part',
    materialRate: '255',
    materialForm: isCircular ? 'Round Rod' : 'Square Bar',
    shape,
    isHollow: data.main_profile_is_hollow ?? true,
    length: String(data.main_profile_length_mm || data.square_tube_length_mm || ''),
    diameter: String(data.main_profile_diameter_mm || data.main_profile_outer_a_mm || data.square_tube_outer_mm || ''),
    thickness: String(data.main_profile_thickness_mm || data.square_tube_thickness_mm || ''),
    qty: '1',
    topPlate: {
      length: String(data.top_plate_l_mm || ''),
      width: String(data.top_plate_w_mm || ''),
      thickness: String(data.top_plate_t_mm || ''),
    },
    bottomPlate: {
      length: String(data.bottom_plate_l_mm || ''),
      width: String(data.bottom_plate_w_mm || ''),
      thickness: String(data.bottom_plate_t_mm || ''),
    },
    processes: ['Cutting', 'Welding', 'Surface'],
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.useDefault || !body.image) {
      return NextResponse.json({ success: true, source: 'simulation_fallback', data: fallbackData() });
    }

    const formData = new FormData();
    formData.append('diagram', dataUrlToFile(body.image));

    const response = await fetch(`${API_BASE}/extract-dimensions`, {
      method: 'POST',
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json({ success: false, error: payload.detail || `Backend returned ${response.status}` }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      source: payload.source || 'gemini_api',
      data: mapExtractedDimensions(payload),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
