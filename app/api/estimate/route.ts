import { NextResponse } from 'next/server';

const API_BASE = process.env.COST_ESTIMATOR_API_BASE || 'http://127.0.0.1:8010';

function asString(value: unknown, fallback = '') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

function asNonNegativeNumber(value: unknown, fallback = 0) {
  const parsed = Number(asString(value, String(fallback)));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
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
  const mapStep = (step: any) => step ? ({
    section: String(step.section || ''),
    name: String(step.name || ''),
    formula: String(step.formula || ''),
    substitutedValues: String(step.substituted_values || ''),
    result: String(step.result || ''),
  }) : undefined;
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
      { name: 'Painting', unitCost: Number(data.process_breakdown?.painting_cost || 0), cost: Number(data.process_breakdown?.painting_cost || 0) },
      { name: 'Tacking', unitCost: Number(data.process_breakdown?.tacking_cost || 0), cost: Number(data.process_breakdown?.tacking_cost || 0) },
    ],
    items: (data.items || []).map((item: any) => ({
      name: String(item.name || ''),
      quantity: Number(item.quantity || 0),
      weightKg: Number(item.weight_kg || 0),
      materialCost: Number(item.material_cost || 0),
      materialLabel: String(item.material_label || ''),
      stockForm: item.stock_form || '',
      stockSize: item.stock_size || '',
      partsPerStock: item.parts_per_stock,
      scrapWeightKg: Number(item.scrap_weight_kg || 0),
      scrapValue: Number(item.scrap_value || 0),
      netStockCostPerPart: Number(item.net_stock_cost_per_part || 0),
      nestingApproach: item.nesting_approach || '',
      formulas: item.formulas ? Object.fromEntries(
        Object.entries(item.formulas).map(([key, value]) => [key, mapStep(value)])
      ) : {},
    })),
    assumptions: data.assumptions || [],
    calculationSteps: (data.calculation_steps || []).map(mapStep).filter(Boolean),
    likelyUse: data.likely_use || '',
    uploadedFile: data.uploaded_file || '',
    fileSizeKb: Number(data.file_size_kb || 0),
    surfaceTreatmentCost: Number(data.surface_treatment_cost || 0),
    materialSummary: data.material_summary ? {
      materialType: String(data.material_summary.material_type || ''),
      materialLabel: String(data.material_summary.material_label || ''),
      materialCode: data.material_summary.material_code || '',
      densityKgPerMm3: Number(data.material_summary.density_kg_per_mm3 || 0),
      ratePerKg: Number(data.material_summary.rate_per_kg || 0),
    } : undefined,
    stockSummary: data.stock_summary ? {
      rodStockLengthMm: Number(data.stock_summary.rod_stock_length_mm || 0),
      sheetStockLengthMm: Number(data.stock_summary.sheet_stock_length_mm || 0),
      sheetStockWidthMm: Number(data.stock_summary.sheet_stock_width_mm || 0),
      scrapRatePerKg: Number(data.stock_summary.scrap_rate_per_kg || 0),
      totalScrapWeightKg: Number(data.stock_summary.total_scrap_weight_kg || 0),
      totalScrapValue: Number(data.stock_summary.total_scrap_value || 0),
      approach: String(data.stock_summary.approach || ''),
    } : undefined,
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
    formData.append('raw_material_type', asString(params.rawMaterialType, 'ss'));
    formData.append('raw_material_code', asString(params.rawMaterialCode, ''));
    formData.append('component_materials_json', JSON.stringify(params.componentMaterials || []));
    formData.append('material_rate_per_kg', asString(params.materialRate, '240'));
    formData.append('cutting_rate_per_meter', asString(params.cutRate, '30'));
    formData.append('welding_labor_per_meter', asString(params.weldRate, '400'));
    formData.append('surface_rate_per_m2', asString(params.surfaceRate, '120'));
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
    formData.append('handle_od_mm', asString(params.handleOd, '19'));
    formData.append('handle_thickness_mm', asString(params.handleThickness, '2'));
    formData.append('handle_length_mm', asString(params.handleLength, '288'));
    formData.append('screw_piece_dia_mm', asString(params.screwDia, '20'));
    formData.append('screw_piece_length_mm', asString(params.screwLength, '45'));
    formData.append('screw_piece_qty', asString(params.screwQty, '4'));
    formData.append('chair_angle_weight_per_m', asString(params.angleWeightPerM, '2.42'));
    formData.append('chair_angle_length_mm', asString(params.angleLength, '150'));
    formData.append('cutting_length_mm', asString(params.cuttingLength, '4049'));
    formData.append('cutting_surface_count', asString(params.cuttingSurfaceCount, '0'));
    formData.append('weld_length_mm', asString(params.weldLength, '780'));
    formData.append('bend_count', asString(params.bendCount, params.processes?.includes('Bending') ? '1' : '0'));
    formData.append('bend_rate_per_stroke', asString(params.bendRate, '5'));
    formData.append('press_machine_hits', asString(params.pressHits, '0'));
    formData.append('press_machine_rate_per_hit', asString(params.pressRate, '5'));
    formData.append('scrap_rate_per_kg', asString(params.scrapRate, '28'));
    formData.append('tacking_labor_fixed', asString(params.tackingFixed, '0'));
    formData.append('include_tacking_labor', String(asNonNegativeNumber(params.tackingFixed, 0) > 0));
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
