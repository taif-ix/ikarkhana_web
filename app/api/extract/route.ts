import { NextResponse } from 'next/server';

const API_BASE = process.env.COST_ESTIMATOR_API_BASE || 'http://127.0.0.1:8010';

function fallbackData() {
  return {
    partName: 'PILLAR ASSEMBLY',
    rawMaterialType: 'ss',
    rawMaterialCode: 'C-K201',
    componentMaterials: [],
    materialRate: '240',
    materialForm: 'Square Bar',
    shape: 'Square hollow tube',
    isHollow: true,
    length: '2581',
    diameter: '45',
    thickness: '4',
    qty: '1',
    topPlate: { length: '125', width: '125', thickness: '5' },
    bottomPlate: { length: '150', width: '100', thickness: '5' },
    handleOd: '19',
    handleThickness: '2',
    handleLength: '288',
    angleWeightPerM: '2.42',
    angleLength: '150',
    screwDia: '20',
    screwLength: '45',
    screwQty: '4',
    cuttingLength: '4049',
    cuttingSurfaceCount: '4',
    cutRate: '30',
    weldLength: '780',
    weldRate: '400',
    surfaceRate: '120',
    bendCount: '2',
    bendRate: '5',
    pressHits: '0',
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
    rawMaterialType: data.raw_material_type || 'ss',
    rawMaterialCode: data.raw_material_code || '',
    componentMaterials: Array.isArray(data.component_materials) ? data.component_materials : [],
    materialRate: data.raw_material_type === 'ms' ? '60' : data.raw_material_type === 'aluminium' ? '200' : data.raw_material_type === 'copper' ? '900' : '240',
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
    handleOd: String(data.handle_od_mm || ''),
    handleThickness: String(data.handle_thickness_mm || ''),
    handleLength: String(data.handle_length_mm || ''),
    angleWeightPerM: String(data.chair_angle_weight_per_m || ''),
    angleLength: String(data.chair_angle_length_mm || ''),
    screwDia: String(data.screw_piece_dia_mm || ''),
    screwLength: String(data.screw_piece_length_mm || ''),
    screwQty: String(data.screw_piece_qty || ''),
    cuttingLength: String(data.cutting_length_mm || ''),
    cuttingSurfaceCount: String(data.cutting_surface_count || ''),
    cutRate: '30',
    weldLength: String(data.weld_length_mm || ''),
    weldRate: '400',
    surfaceRate: '120',
    bendCount: String(data.bend_count || ''),
    bendRate: '5',
    pressHits: '0',
    processes: ['Cutting', 'Welding', 'Surface', ...(Number(data.bend_count || 0) > 0 ? ['Bending'] : [])],
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
      return NextResponse.json({
        success: true,
        source: 'simulation_fallback',
        warning: payload.detail || `Backend returned ${response.status}`,
        data: fallbackData(),
      });
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
