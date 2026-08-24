export interface PlateParams {
  length: string;
  width: string;
  thickness: string;
}

export interface TechnicalParams {
  partName: string;
  rawMaterialType: string;
  rawMaterialCode: string;
  componentMaterials: Array<Record<string, string | number | null>>;
  materialRate: string;
  materialForm: 'Round Rod' | 'Square Bar' | 'Select...';
  shape: string;
  isHollow: boolean;
  length: string;
  diameter: string;
  thickness: string;
  qty: string;
  topPlate: PlateParams;
  bottomPlate: PlateParams;
  handleOd: string;
  handleThickness: string;
  handleLength: string;
  angleWeightPerM: string;
  angleLength: string;
  screwDia: string;
  screwLength: string;
  screwQty: string;
  cuttingLength: string;
  cuttingSurfaceCount: string;
  cutRate: string;
  weldLength: string;
  weldRate: string;
  surfaceRate: string;
  bendCount: string;
  bendRate: string;
  pressHits: string;
  pressRate: string;
  tackingFixed: string;
  scrapRate: string;
  processes: string[];
}

export interface CostSummary {
  profileWeightKg: number;
  topPlateWeightKg: number;
  bottomPlateWeightKg: number;
  unitWeightKg: number;
  totalWeightKg: number;
  materialCost: number;
  processCost: number;
  totalCost: number;
  qty: number;
}

export interface ProcessDetail {
  name: string;
  unitCost: number;
  cost: number;
}

export interface CalculationStep {
  section: string;
  name: string;
  formula: string;
  substitutedValues: string;
  result: string;
}

export interface ReferencedDrawing {
  drawing_number: string;
  file_name_hint?: string | null;
  referenced_by_part_number?: string | null;
  referenced_by_component?: string | null;
  reason?: string;
  required_for_costing?: boolean;
}

export interface StructuredBreakdown {
  currency: string;
  part_name?: string | null;
  raw_material_type?: string | null;
  raw_material_code?: string | null;
  referenced_drawings?: ReferencedDrawing[];
  per_part_breakdown: Array<{
    part_number: string;
    component_name?: string | null;
    component_type: string;
    tube_type: string;
    material_type?: string | null;
    material_code?: string | null;
    per_set_qty: number;
    dimensions?: {
      length_mm?: number | null;
      width_mm?: number | null;
      height_mm?: number | null;
      outer_diameter_mm?: number | null;
      thickness_mm?: number | null;
    };
    holes?: Array<{
      hole_type: string;
      diameter_mm?: number | null;
      quantity_per_part?: number | null;
      through?: boolean | null;
    }>;
    slots?: Array<{
      slot_type: string;
      length_mm?: number | null;
      width_mm?: number | null;
      quantity_per_part?: number | null;
      through?: boolean | null;
    }>;
    threads?: Array<{ thread_size?: string | null; nominal_diameter_mm?: number | null; quantity_per_part?: number | null }>;
    notches?: Array<{ length_mm?: number | null; width_mm?: number | null; quantity_per_part?: number | null }>;
    cutouts?: Array<{ length_mm?: number | null; width_mm?: number | null; quantity_per_part?: number | null }>;
    chamfers?: Array<{ size_mm?: number | null; angle_deg?: number | null; quantity_per_part?: number | null }>;
    flat_pattern?: {
      holes?: Array<{ hole_type: string; diameter_mm?: number | null; quantity_per_part?: number | null; through?: boolean | null }>;
      slots?: Array<{ slot_type: string; length_mm?: number | null; width_mm?: number | null; quantity_per_part?: number | null; through?: boolean | null }>;
    } | null;
    image_region?: {
      x_min?: number | null;
      y_min?: number | null;
      x_max?: number | null;
      y_max?: number | null;
      source?: string | null;
    };
    surface_area_sq_meter: number;
    bends_per_part: number;
    cutting_metrics: {
      laser_cutting_length_mm: number;
      press_machine_hits_count: number;
      outer_profile_cut_length_mm?: number;
      internal_feature_cut_length_mm?: number;
      internal_feature_count?: number;
    };
    weight_ledger: {
      unit_gross_rm_weight_kg: number;
      unit_net_finished_weight_kg: number;
      unit_scrap_waste_weight_kg: number;
      total_set_gross_weight_kg: number;
    };
    nesting_layout_hint: {
      nesting_strategy: string;
      recommended_grain_or_cut_direction: string;
    };
    calculated_costs: {
      material_cost: number;
      laser_cutting_cost_estimate: number;
      machine_punching_cost_estimate: number;
      bending_cost: number;
      painting_cost: number;
      total_single_part_cost_via_laser: number;
      total_single_part_cost_via_machine: number;
      total_combined_set_cost_via_laser: number;
      total_combined_set_cost_via_machine: number;
    };
    calculation_steps?: CalculationStep[];
    notes?: string[];
  }>;
  assembly_level_fabrication: {
    total_assembly_welding_length_mm: number;
    welding_labor_cost: number;
    tacking_fixed_setup_cost: number;
    grand_total_assembly_cost_via_laser: number;
    grand_total_assembly_cost_via_machine: number;
  };
  assumptions?: string[];
}

export interface EstimationResult {
  summary: CostSummary;
  processDetails: ProcessDetail[];
  items?: Array<{
    name: string;
    quantity: number;
    weightKg: number;
    materialCost: number;
    materialLabel?: string;
    stockForm?: string;
    stockSize?: string;
    partsPerStock?: number;
    scrapWeightKg?: number;
    scrapValue?: number;
    netStockCostPerPart?: number;
    nestingApproach?: string;
    formulas?: Record<string, CalculationStep>;
  }>;
  assumptions?: string[];
  calculationSteps?: CalculationStep[];
  likelyUse?: string;
  uploadedFile?: string;
  fileSizeKb?: number;
  surfaceTreatmentCost?: number;
  materialSummary?: {
    materialType: string;
    materialLabel: string;
    materialCode?: string;
    densityKgPerMm3: number;
    ratePerKg: number;
  };
  stockSummary?: {
    rodStockLengthMm: number;
    sheetStockLengthMm: number;
    sheetStockWidthMm: number;
    scrapRatePerKg: number;
    totalScrapWeightKg: number;
    totalScrapValue: number;
    approach: string;
  };
  structuredBreakdown?: StructuredBreakdown;
  structuredError?: string;
}

export type EstimateLineItem = NonNullable<EstimationResult['items']>[number];
