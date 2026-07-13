import { NextResponse } from 'next/server';

const API_BASE = process.env.COST_ESTIMATOR_API_BASE || 'http://127.0.0.1:8010';

function asString(value: unknown, fallback = '') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

function appendIfValue(formData: FormData, key: string, value: unknown) {
  if (value !== undefined && value !== null && value !== '') {
    formData.append(key, String(value));
  }
}

function mapEstimateResponse(data: any) {
  const mainItem = data.items?.[0];
  const topPlate = data.items?.find((item: any) => item.name?.toLowerCase().includes('top'));
  const bottomPlate = data.items?.find((item: any) => item.name?.toLowerCase().includes('bottom'));
  return {
    success: true,
    summary: {
      profileWeightKg: Number(mainItem?.weight_kg || 0),
      topPlateWeightKg: Number(topPlate?.weight_kg || 0),
      bottomPlateWeightKg: Number(bottomPlate?.weight_kg || 0),
      unitWeightKg: Number(data.total_weight_kg || 0),
      totalWeightKg: Number(data.total_weight_kg || 0),
      materialCost: Number(data.total_material_cost || 0),
      processCost: Number(data.total_process_cost || 0),
      totalCost: Number(data.total_estimated_cost || 0),
      qty: 1,
    },
    processDetails: [
      { name: 'Cutting', unitCost: Number(data.process_breakdown?.cutting_cost || 0), cost: Number(data.process_breakdown?.cutting_cost || 0) },
      { name: 'Bending', unitCost: Number(data.process_breakdown?.bending_cost || 0), cost: Number(data.process_breakdown?.bending_cost || 0) },
      { name: 'Welding', unitCost: Number(data.process_breakdown?.welding_cost || 0), cost: Number(data.process_breakdown?.welding_cost || 0) },
      { name: 'Press machine', unitCost: Number(data.process_breakdown?.press_machine_cost || 0), cost: Number(data.process_breakdown?.press_machine_cost || 0) },
      { name: 'Tacking', unitCost: Number(data.process_breakdown?.tacking_cost || 0), cost: Number(data.process_breakdown?.tacking_cost || 0) },
    ].filter((item) => item.cost > 0),
  };
}

export async function POST(request: Request) {
  try {
    const params = await request.json();
    const isRound = params.materialForm === 'Round Rod';
    const isRectangular = params.materialForm === 'Square Bar' && params.shape?.toLowerCase?.().includes('rect');

    const formData = new FormData();
    formData.append('diagram', new File(['proxy estimate'], 'estimate.txt', { type: 'text/plain' }));
    formData.append('part_name', asString(params.partName, 'Extracted Part'));
    formData.append('material_rate_per_kg', asString(params.materialRate, '255'));
    formData.append('main_material_form', 'rod_profile');
    formData.append('main_profile_shape', isRound ? 'circular' : isRectangular ? 'rectangular' : 'square');
    formData.append('main_profile_is_hollow', String(Boolean(params.isHollow)));
    formData.append('main_profile_length_mm', asString(params.length, '0'));
    formData.append('main_profile_outer_a_mm', asString(params.diameter, '0'));
    formData.append('main_profile_outer_b_mm', asString(params.diameter, '0'));
    formData.append('main_profile_diameter_mm', asString(params.diameter, '0'));
    formData.append('main_profile_thickness_mm', asString(params.thickness, '0'));
    formData.append('square_tube_length_mm', asString(params.length, '0'));
    formData.append('square_tube_outer_mm', asString(params.diameter, '0'));
    formData.append('square_tube_thickness_mm', asString(params.thickness, '0'));
    appendIfValue(formData, 'top_plate_l_mm', params.topPlate?.length);
    appendIfValue(formData, 'top_plate_w_mm', params.topPlate?.width);
    appendIfValue(formData, 'top_plate_t_mm', params.topPlate?.thickness);
    appendIfValue(formData, 'bottom_plate_l_mm', params.bottomPlate?.length);
    appendIfValue(formData, 'bottom_plate_w_mm', params.bottomPlate?.width);
    appendIfValue(formData, 'bottom_plate_t_mm', params.bottomPlate?.thickness);
    formData.append('handle_od_mm', '19');
    formData.append('handle_thickness_mm', '2');
    formData.append('handle_length_mm', '288');
    formData.append('screw_piece_dia_mm', '20');
    formData.append('screw_piece_length_mm', '45');
    formData.append('screw_piece_qty', '4');
    formData.append('chair_angle_weight_per_m', '2.42');
    formData.append('chair_angle_length_mm', '150');
    formData.append('cutting_length_mm', '4049');
    formData.append('weld_length_mm', '850');
    formData.append('bend_count', params.processes?.includes('Bending') ? '1' : '0');
    formData.append('surface_type', params.processes?.includes('Surface') ? 'painted' : 'none');

    const response = await fetch(`${API_BASE}/estimate`, {
      method: 'POST',
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json({ success: false, error: payload.detail || `Backend returned ${response.status}` }, { status: response.status });
    }

    return NextResponse.json(mapEstimateResponse(payload));
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
