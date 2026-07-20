'use client';

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Plus, 
  ArrowRight, 
  CloudDownload, 
  ShieldCheck, 
  Scale, 
  Flame, 
  Layers, 
  Scissors, 
  Wrench, 
  Settings, 
  HelpCircle, 
  ZoomIn, 
  ZoomOut, 
  CheckCircle2, 
  Calculator, 
  Sparkles, 
  TrendingUp, 
  Coins, 
  ChevronRight, 
  Download, 
  FileJson,
  Info,
  RefreshCw,
  Clock,
  History,
  LayoutDashboard,
  AlertTriangle,
  X,
  Maximize2
} from 'lucide-react';

// Interfaces
interface PlateParams {
  length: string;
  width: string;
  thickness: string;
}

interface TechnicalParams {
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

interface CostSummary {
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

interface ProcessDetail {
  name: string;
  unitCost: number;
  cost: number;
}

interface EstimationResult {
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

type EstimateLineItem = NonNullable<EstimationResult['items']>[number];

interface BatchUploadFile {
  name: string;
  sizeMb: string;
  image: string;
  isChild: boolean;
}

interface CalculationStep {
  section: string;
  name: string;
  formula: string;
  substitutedValues: string;
  result: string;
}

interface ReferencedDrawing {
  drawing_number: string;
  file_name_hint?: string | null;
  referenced_by_part_number?: string | null;
  referenced_by_component?: string | null;
  reason?: string;
  required_for_costing?: boolean;
}

interface StructuredBreakdown {
  currency: string;
  part_name?: string | null;
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
      width_or_outer_dia_mm?: number | null;
      secondary_width_mm?: number | null;
      thickness_or_wall_thickness_mm?: number | null;
    };
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

const DEFAULT_IMAGE_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6yHgi_tmLsGYwxsl0yhWtA48tW7SMCFS_Obqmn9bF65XyFdgRv9FGPF-RmvkN3gONrEnhXZnDFDa05jyhn6iUs4O8Q3NsXysy84_Ov0aknOGe55wSI2xFe8jv54f4L84fLI5fGepe-d1WFiU30oeNpxwyDiXKpQRCOe49H81CLYOaq2yZbz0eJ94sC0oyYycyb8PYuhvoeNFooTfz4gpm9GBMx4Wii6LJN8x3SKTWsvmmkgnry9pCB9pOBdy6u6Ul2tHYcPwZBVw';
const DEFAULT_AVATAR_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvoo20EKFrEePwRASgVWvtuN3C1QE24OsZ-K0kmyFnGyr34stmkaZ6LEaSU8QtJz06ktSKf2dJu5bvvrerfkgY2qHqY5pNEjfHZTIzpP2HuoPqUNv18Y4oS_pCJd5JXunIwAa6VqumI44wek2RpyAKN8_Qc6ngUHCktWSZx1o-VX1HflaUS_NSgNjYtwU6UsFFPwyX4cPqdPjBqp8aqt3O1yrvYexRyKZEVyxTEpBrYrrDtrzzOxGrDDJ5IqmBXBH8ymsZS2IZa7s';

const formatInr = (value: number) =>
  `Rs ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function App() {
  // Navigation: 'landing' or 'workspace'
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'workspace'>('landing');
  const [activeTab, setActiveTab] = useState<'projects' | 'estimator' | 'inventory' | 'standards'>('projects');
  const [sidebarTab, setSidebarTab] = useState<'dashboard' | 'estimator' | 'materials' | 'processes' | 'history'>('estimator');

  // File uploading states
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [filePreview, setFilePreview] = useState<string>(DEFAULT_IMAGE_URL);
  const [fileSize, setFileSize] = useState<string>('');
  const [uploadedImageData, setUploadedImageData] = useState<string>('');
  const [uploadedImageName, setUploadedImageName] = useState<string>('');
  const [structuredBreakdownCache, setStructuredBreakdownCache] = useState<StructuredBreakdown | null>(null);
  const [batchUploadFiles, setBatchUploadFiles] = useState<BatchUploadFile[]>([]);
  const [selectedBatchParentName, setSelectedBatchParentName] = useState<string>('');
  const [childDrawingUploads, setChildDrawingUploads] = useState<Record<string, string>>({});
  const [childDrawingImages, setChildDrawingImages] = useState<Record<string, string>>({});
  const [allowMissingChildDrawings, setAllowMissingChildDrawings] = useState(false);

  // AI Extraction logging & analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtractionComplete, setIsExtractionComplete] = useState(false);
  const [scanPreviewPhase, setScanPreviewPhase] = useState<'scan' | 'reference'>('scan');
  const [apiSource, setApiSource] = useState<'simulation_fallback' | 'gemini_api' | null>(null);

  // zoom preview
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [previewAspectRatio, setPreviewAspectRatio] = useState<number>(1.414);
  const [selectedPartPreview, setSelectedPartPreview] = useState<StructuredBreakdown['per_part_breakdown'][number] | null>(null);
  const [selectedReferencePreview, setSelectedReferencePreview] = useState<string | null>(null);
  const [selectedReferencePart, setSelectedReferencePart] = useState<StructuredBreakdown['per_part_breakdown'][number] | null>(null);
  const [selectedPartDetails, setSelectedPartDetails] = useState<StructuredBreakdown['per_part_breakdown'][number] | null>(null);
  const [selectedNestingItem, setSelectedNestingItem] = useState<EstimateLineItem | null>(null);
  const [isPartSummaryOpen, setIsPartSummaryOpen] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState<{ title: string; steps: CalculationStep[] } | null>(null);

  // Form parameters
  const [params, setParams] = useState<TechnicalParams>({
    partName: '',
    rawMaterialType: 'ss',
    rawMaterialCode: '',
    componentMaterials: [],
    materialRate: '240',
    materialForm: 'Select...',
    shape: '',
    isHollow: false,
    length: '',
    diameter: '',
    thickness: '',
    qty: '1',
    topPlate: { length: '', width: '', thickness: '' },
    bottomPlate: { length: '', width: '', thickness: '' },
    handleOd: '',
    handleThickness: '',
    handleLength: '',
    angleWeightPerM: '',
    angleLength: '',
    screwDia: '',
    screwLength: '',
    screwQty: '',
    cuttingLength: '',
    cuttingSurfaceCount: '',
    cutRate: '30',
    weldLength: '',
    weldRate: '400',
    surfaceRate: '120',
    bendCount: '',
    bendRate: '5',
    pressHits: '0',
    pressRate: '5',
    tackingFixed: '1040',
    scrapRate: '28',
    processes: []
  });

  // Cost Estimation outputs
  const [isCalculating, setIsCalculating] = useState(false);
  const [estimation, setEstimation] = useState<EstimationResult | null>(null);

  // Saved estimates history
  const [history, setHistory] = useState<Array<{ id: string; partName: string; date: string; cost: number; weight: number }>>([
    { id: 'EST-9402', partName: 'Chassis_Bracket_A102', date: '2026-07-12', cost: 111.37, weight: 5.681 },
    { id: 'EST-9388', partName: 'Flange_Collar_V2', date: '2026-07-10', cost: 45.20, weight: 2.15 },
    { id: 'EST-9310', partName: 'Bottom_Mount_Plate', date: '2026-07-05', cost: 189.50, weight: 11.20 }
  ]);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void stageSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      void stageSelectedFiles(selectedFiles);
    }
    e.target.value = '';
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const stageSelectedFiles = async (files: File[]) => {
    try {
      const staged = await Promise.all(files.map(async (file, index) => ({
        name: file.name,
        sizeMb: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        image: await readFileAsDataUrl(file),
        isChild: index > 0,
      })));
      setBatchUploadFiles(staged);
      setSelectedBatchParentName(staged[0]?.name || '');
      setCurrentScreen('landing');
      triggerToast(`${staged.length} file${staged.length > 1 ? 's' : ''} staged. Review parent/child files, then proceed.`);
    } catch {
      triggerToast('Could not read one or more uploaded files. Please try again.');
    }
  };

  const proceedWithUploadedFiles = async () => {
    const parent = batchUploadFiles.find(file => file.name === selectedBatchParentName) || batchUploadFiles[0];
    if (!parent) {
      triggerToast('Upload at least one drawing file first.');
      return;
    }
    const childFiles = batchUploadFiles.filter(file => file.name !== parent.name);
    setChildDrawingUploads(Object.fromEntries(childFiles.map(file => [file.name.replace(/\.[^.]+$/, ''), file.name])));
    setChildDrawingImages(Object.fromEntries(childFiles.map(file => [file.name.replace(/\.[^.]+$/, ''), file.image])));
    await startExtractionFromData(parent.image, parent.name, parent.sizeMb, childFiles);
  };

  const drawingBase = (name: string) => name.toLowerCase().replace(/\.[^.]+$/, '').trim();

  const expectedChildFileHints = (parentName: string) => {
    const dependencyMap: Record<string, string[]> = {
      ls10257: ['LS10269.tif'],
    };
    return dependencyMap[drawingBase(parentName)] || [];
  };

  const fileMatchesHint = (file: BatchUploadFile, hint: string) =>
    drawingBase(file.name) === drawingBase(hint);

  const appendChildFilesToBatch = async (files: File[]) => {
    if (files.length === 0) return;
    try {
      const stagedChildren = await Promise.all(files.map(async (file) => ({
        name: file.name,
        sizeMb: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        image: await readFileAsDataUrl(file),
        isChild: true,
      })));
      setBatchUploadFiles(prev => {
        const existing = new Set(prev.map(file => file.name));
        return [...prev, ...stagedChildren.filter(file => !existing.has(file.name))];
      });
      triggerToast(`${stagedChildren.length} child/detail file${stagedChildren.length > 1 ? 's' : ''} added.`);
    } catch {
      triggerToast('Could not read child/detail files. Please try again.');
    }
  };

  // Convert uploaded drawing to base64 preview and run extraction pipeline
  const processSelectedFile = (file: File) => {
    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
    setCurrentScreen('workspace');
    setActiveTab('estimator');
    setSidebarTab('estimator');
    setIsAnalyzing(true);
    setScanPreviewPhase('scan');
    setIsExtractionComplete(false);
    setEstimation(null);
    setStructuredBreakdownCache(null);
    setChildDrawingUploads({});
    setChildDrawingImages({});
    setAllowMissingChildDrawings(false);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setUploadedImageData(base64String);
      setUploadedImageName(file.name);
      const needsPreviewConversion = file.type.includes('tif') || file.name.toLowerCase().endsWith('.tif') || file.name.toLowerCase().endsWith('.tiff');
      setFilePreview(needsPreviewConversion ? '' : base64String);
      try {
        const response = await fetch('/api/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64String, filename: file.name }),
        });
        const result = await response.json();
        setFilePreview(result.success && result.image ? result.image : base64String);
      } catch {
        setFilePreview(needsPreviewConversion ? '' : base64String);
      }
      void runExtractionPipeline(base64String, file.name);
    };
    reader.onerror = () => {
      setIsAnalyzing(false);
      triggerToast('Could not read uploaded file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const startExtractionFromData = async (
    base64String: string,
    name: string,
    size: string,
    childFiles: BatchUploadFile[] = [],
  ) => {
    setFileName(name);
    setFileSize(size);
    setCurrentScreen('workspace');
    setActiveTab('estimator');
    setSidebarTab('estimator');
    setIsAnalyzing(true);
    setScanPreviewPhase('scan');
    setIsExtractionComplete(false);
    setEstimation(null);
    setStructuredBreakdownCache(null);
    setAllowMissingChildDrawings(childFiles.length > 0);
    setUploadedImageData(base64String);
    setUploadedImageName(name);
    setFilePreview(base64String);
    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64String, filename: name }),
      });
      const result = await response.json();
      if (result.success && result.image) {
        setFilePreview(result.image);
      }
    } catch {
      setFilePreview(base64String);
    }
    void runExtractionPipeline(base64String, name, childFiles);
  };

  // Select sample drawing instantly
  const handleSelectSample = () => {
    setFileName('Chassis_Bracket_Drawing_v2.4.dwg');
    setFileSize('4.25 MB');
    setFilePreview(DEFAULT_IMAGE_URL);
    setUploadedImageData('');
    setUploadedImageName('');
    setChildDrawingUploads({});
    setChildDrawingImages({});
    setAllowMissingChildDrawings(false);
    runExtractionPipeline(DEFAULT_IMAGE_URL, 'Chassis_Bracket_Drawing_v2.4.dwg');
  };

  // Pipeline simulation or real Gemini extraction
  const runExtractionPipeline = async (imgData: string, name: string, batchChildFiles: BatchUploadFile[] = []) => {
    setIsAnalyzing(true);
    setScanPreviewPhase('scan');
    setIsExtractionComplete(false);
    setEstimation(null);
    setStructuredBreakdownCache(null);
    if (batchChildFiles.length === 0) {
      setChildDrawingUploads({});
      setChildDrawingImages({});
    }
    setAllowMissingChildDrawings(false);
    setCurrentScreen('workspace');
    setActiveTab('estimator');
    setSidebarTab('estimator');
    const scanDelay = new Promise<void>((resolve) => {
      window.setTimeout(() => {
        setScanPreviewPhase('reference');
        resolve();
      }, 6000);
    });

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: imgData.startsWith('http') ? '' : imgData, 
          useDefault: imgData.startsWith('http') 
        })
      });
      const result = await response.json();
      
      if (result.success) {
        setParams(result.data);
        setApiSource(result.source);
        if (imgData && !imgData.startsWith('http')) {
          try {
            const structuredResponse = await fetch('/api/structured-estimate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image: imgData,
                filename: name || uploadedImageName || fileName || 'uploaded-diagram',
                childDrawings: batchChildFiles.map(file => ({
                  drawingNumber: file.name.replace(/\.[^.]+$/, ''),
                  filename: file.name,
                  image: file.image,
                })),
                params: result.data,
              }),
            });
            const structuredResult = await structuredResponse.json();
            if (structuredResult.success) {
              setStructuredBreakdownCache(structuredResult.data);
            }
          } catch {
            setStructuredBreakdownCache(null);
          }
        }
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      triggerToast('Parameter extraction service failed. Loaded sample blueprint layout.');
      // fallback in case of strict network failure
      setParams({
        partName: 'Chassis_Bracket_A102',
        rawMaterialType: 'ss',
        rawMaterialCode: 'C-K201',
        componentMaterials: [],
        materialRate: '240',
        materialForm: 'Round Rod',
        shape: 'Symmetric Collar',
        isHollow: true,
        length: '120',
        diameter: '45',
        thickness: '5',
        qty: '1',
        topPlate: { length: '80', width: '80', thickness: '8' },
        bottomPlate: { length: '110', width: '110', thickness: '12' },
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
        pressRate: '5',
        tackingFixed: '1040',
        scrapRate: '28',
        processes: ['Cutting', 'Welding', 'Surface', 'Bending']
      });
    } finally {
      await scanDelay;
      setIsAnalyzing(false);
      setIsExtractionComplete(true);
    }
  };

  // Manual extract trigger in workspace
  const handleManualExtract = () => {
    runExtractionPipeline(filePreview, fileName || 'Manual_Extract_Drawing.dwg');
  };

  const referencedDrawings = structuredBreakdownCache?.referenced_drawings || estimation?.structuredBreakdown?.referenced_drawings || [];
  const missingReferencedDrawings = referencedDrawings.filter(
    (drawing) => drawing.required_for_costing !== false && !childDrawingUploads[drawing.drawing_number]
  );
  const hasBlockingMissingChildDrawings = missingReferencedDrawings.length > 0 && !allowMissingChildDrawings;

  const handleChildDrawingUpload = (drawingNumber: string, file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setChildDrawingUploads((prev) => ({ ...prev, [drawingNumber]: file.name }));
      setChildDrawingImages((prev) => ({ ...prev, [drawingNumber]: reader.result as string }));
      setAllowMissingChildDrawings(false);
      triggerToast(`Child drawing ${drawingNumber} attached: ${file.name}`);
    };
    reader.onerror = () => triggerToast(`Could not read ${file.name}. Please try again.`);
    reader.readAsDataURL(file);
  };

  // Trigger costing calculations
  const calculateCost = async () => {
    if (hasBlockingMissingChildDrawings) {
      triggerToast('Upload missing child drawings or choose calculate without missing files.');
      return;
    }

    setIsCalculating(true);
    try {
      const response = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const result = await response.json();
      if (result.success) {
        let structuredBreakdown: StructuredBreakdown | undefined;
        let structuredError: string | undefined;

        const cachedStructured = structuredBreakdownCache || estimation?.structuredBreakdown;
        const attachedChildDrawings = Object.entries(childDrawingImages).map(([drawingNumber, image]) => ({
          drawingNumber,
          filename: childDrawingUploads[drawingNumber] || `${drawingNumber}.tif`,
          image,
        }));

        if (cachedStructured && attachedChildDrawings.length === 0) {
          try {
            const structuredResponse = await fetch('/api/structured-estimate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                extraction: cachedStructured,
                params,
              }),
            });
            const structuredResult = await structuredResponse.json();
            if (structuredResult.success) {
              structuredBreakdown = structuredResult.data;
              setStructuredBreakdownCache(structuredResult.data);
            } else {
              structuredError = structuredResult.error || 'Structured JSON breakdown failed.';
            }
          } catch (error: any) {
            structuredError = error.message || 'Structured JSON breakdown failed.';
          }
        } else if (uploadedImageData) {
          try {
            const structuredResponse = await fetch('/api/structured-estimate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image: uploadedImageData,
                filename: uploadedImageName || fileName || 'uploaded-diagram',
                childDrawings: attachedChildDrawings,
                params,
              }),
            });
            const structuredResult = await structuredResponse.json();
            if (structuredResult.success) {
              structuredBreakdown = structuredResult.data;
              setStructuredBreakdownCache(structuredResult.data);
            } else {
              structuredError = structuredResult.error || 'Structured JSON breakdown failed.';
            }
          } catch (error: any) {
            structuredError = error.message || 'Structured JSON breakdown failed.';
          }
        }

        setEstimation({ ...result, structuredBreakdown, structuredError });
        triggerToast('Cost estimate successfully calculated!');
        
        // Add to history
        const newEst = {
          id: 'EST-' + Math.floor(1000 + Math.random() * 9000),
          partName: params.partName || 'Unnamed Part',
          date: new Date().toISOString().split('T')[0],
          cost: result.summary.totalCost,
          weight: result.summary.totalWeightKg
        };
        setHistory(prev => [newEst, ...prev]);
      } else {
        triggerToast('Error calculating cost: ' + result.error);
      }
    } catch (err: any) {
      triggerToast('Cost estimation failed.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Toggle visual processes
  const handleProcessToggle = (processName: string) => {
    setParams(prev => {
      const active = prev.processes.includes(processName);
      const newProcesses = active 
        ? prev.processes.filter(p => p !== processName)
        : [...prev.processes, processName];
      return { ...prev, processes: newProcesses };
    });
  };

  // Form input changer helper
  const handleParamChange = (field: keyof TechnicalParams, value: any) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  const handlePlateChange = (plateType: 'topPlate' | 'bottomPlate', field: keyof PlateParams, value: string) => {
    setParams(prev => ({
      ...prev,
      [plateType]: {
        ...prev[plateType],
        [field]: value
      }
    }));
  };

  // Export options
  const handleExport = () => {
    if (!estimation) {
      triggerToast('No active calculation to export. Please calculate cost first.');
      return;
    }

    const structured = estimation.structuredBreakdown || structuredBreakdownCache;
    const currency = structured?.currency || 'INR';
    const generatedAt = new Date().toLocaleString('en-IN');
    const safe = (value: unknown) => {
      if (value === null || value === undefined || value === '') return '-';
      return String(value);
    };
    const numberSafe = (value: unknown) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : 0;
    };
    const xmlEscape = (value: unknown) =>
      safe(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    const cell = (value: unknown, type: 'String' | 'Number' = 'String', styleId?: string, mergeAcross?: number) => {
      const style = styleId ? ` ss:StyleID="${styleId}"` : '';
      const merge = mergeAcross ? ` ss:MergeAcross="${mergeAcross}"` : '';
      if (type === 'Number') {
        return `<Cell${style}${merge}><Data ss:Type="Number">${numberSafe(value)}</Data></Cell>`;
      }
      return `<Cell${style}${merge}><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
    };
    const row = (values: Array<unknown>, numericIndexes: number[] = [], styleId?: string) =>
      `<Row>${values.map((value, index) => cell(value, numericIndexes.includes(index) ? 'Number' : 'String', styleId)).join('')}</Row>`;
    const titleRow = (title: string) => `<Row ss:Height="28">${cell(title, 'String', 'Title', 30)}</Row>`;
    const sectionRow = (title: string) => `<Row ss:Height="22">${cell(title, 'String', 'Section', 30)}</Row>`;
    const blankRow = () => '<Row />';
    const headerRow = (values: Array<unknown>) => row(values, [], 'Header');
    const metricRow = (label: string, value: unknown, unit: string, valueStyle = 'Value') =>
      `<Row>${cell(label, 'String', 'Label')}${cell(value, typeof value === 'number' ? 'Number' : 'String', valueStyle)}${cell(unit, 'String', 'Unit')}</Row>`;
    const totalScrapWeightKg = structured?.per_part_breakdown?.length
      ? structured.per_part_breakdown.reduce((total, part) => (
          total + numberSafe(part.weight_ledger?.unit_scrap_waste_weight_kg) * numberSafe(part.per_set_qty || 1)
        ), 0)
      : numberSafe(estimation.stockSummary?.totalScrapWeightKg);
    const totalWeightIncludingScrapKg = numberSafe(estimation.summary.totalWeightKg) + totalScrapWeightKg;

    const reportRows: string[] = [
      titleRow('ikarkhana Diagram Cost Report'),
      row(['Generated at', generatedAt]),
      row(['Uploaded file', estimation.uploadedFile || uploadedImageName || fileName || '-']),
      row(['Part name', structured?.part_name || params.partName || '-']),
      row(['Currency', currency]),
      row(['Likely use', estimation.likelyUse || '-']),
      blankRow(),
      sectionRow('Overall Summary'),
      headerRow(['Metric', 'Value', 'Unit']),
      metricRow('Extracted unit weight', estimation.summary.unitWeightKg, 'kg'),
      metricRow('Net finished weight', estimation.summary.totalWeightKg, 'kg'),
      metricRow('Total scrap weight', totalScrapWeightKg, 'kg'),
      metricRow('Total calculated weight including scrap', totalWeightIncludingScrapKg, 'kg'),
      metricRow('Material cost', estimation.summary.materialCost, currency, 'Money'),
      metricRow('Process cost', estimation.summary.processCost, currency, 'Money'),
      metricRow('Surface treatment cost', estimation.surfaceTreatmentCost || 0, currency, 'Money'),
      metricRow('Legacy total project cost', estimation.summary.totalCost, currency, 'Money'),
    ];

    if (structured) {
      reportRows.push(
        metricRow('Grand total via laser', structured.assembly_level_fabrication.grand_total_assembly_cost_via_laser, currency, 'TotalMoney'),
        metricRow('Grand total via machine', structured.assembly_level_fabrication.grand_total_assembly_cost_via_machine, currency, 'Money'),
        metricRow('Assembly welding length', structured.assembly_level_fabrication.total_assembly_welding_length_mm, 'mm'),
        metricRow('Assembly welding labor cost', structured.assembly_level_fabrication.welding_labor_cost, currency, 'Money'),
        metricRow('Tacking setup cost', structured.assembly_level_fabrication.tacking_fixed_setup_cost, currency, 'Money')
      );
    }

    reportRows.push(
      blankRow(),
      sectionRow('Rates Used For Costing'),
      headerRow(['Rate / Parameter', 'Value', 'Unit']),
      metricRow('Material rate', numberSafe(params.materialRate), 'INR/kg'),
      metricRow('Laser cut rate', numberSafe(params.cutRate), 'INR/m'),
      metricRow('Welding labor', numberSafe(params.weldRate), 'INR/m'),
      metricRow('Surface finish', numberSafe(params.surfaceRate), 'INR/m2'),
      metricRow('Bending', numberSafe(params.bendRate), 'INR/bend'),
      metricRow('Press cut', numberSafe(params.pressRate), 'INR/hit'),
      metricRow('Tacking setup', numberSafe(params.tackingFixed), 'INR fixed'),
      metricRow('Scrap value', numberSafe(params.scrapRate || 28), 'INR/kg'),
      blankRow(),
      sectionRow('Extracted Parameters'),
      headerRow(['Field', 'Value', 'Unit']),
      metricRow('Part name', params.partName, '-'),
      metricRow('Raw material type', params.rawMaterialType, '-'),
      metricRow('Material code', params.rawMaterialCode, '-'),
      metricRow('Material form', params.materialForm, '-'),
      metricRow('Shape profile', params.shape, '-'),
      metricRow('Is hollow', params.isHollow ? 'Yes' : 'No', '-'),
      metricRow('Main profile length', numberSafe(params.length), 'mm'),
      metricRow('Outer / diameter', numberSafe(params.diameter), 'mm'),
      metricRow('Thickness', numberSafe(params.thickness), 'mm'),
      metricRow('Quantity', numberSafe(params.qty), 'pcs'),
      metricRow('Top plate', `${params.topPlate.length} x ${params.topPlate.width} x ${params.topPlate.thickness}`, 'mm'),
      metricRow('Bottom plate', `${params.bottomPlate.length} x ${params.bottomPlate.width} x ${params.bottomPlate.thickness}`, 'mm'),
      metricRow('Handle OD x thickness x length', `${params.handleOd} x ${params.handleThickness} x ${params.handleLength}`, 'mm'),
      metricRow('Screw dia x length x qty', `${params.screwDia} x ${params.screwLength} x ${params.screwQty}`, 'mm / pcs'),
      metricRow('Total cut length', numberSafe(params.cuttingLength), 'mm'),
      metricRow('Cut surfaces', numberSafe(params.cuttingSurfaceCount), 'count'),
      metricRow('Weld length', numberSafe(params.weldLength), 'mm'),
      metricRow('Bend count', numberSafe(params.bendCount), 'count'),
      metricRow('Press hits', numberSafe(params.pressHits), 'count'),
      blankRow(),
      sectionRow('Part Wise Cost And Weight Breakdown'),
      headerRow([
        'Part no',
        'Component name',
        'Component type',
        'Tube / profile type',
        'Material',
        'Material code',
        'Qty',
        'Length mm',
        'Width / OD mm',
        'Secondary width mm',
        'Thickness mm',
        'Surface area m2',
        'Bends per part',
        'Laser cut length mm',
        'Press hits',
        'Gross RM weight kg',
        'Net finished weight kg',
        'Scrap / waste kg',
        'Total set gross weight kg',
        'Material cost INR',
        'Laser cutting cost INR',
        'Machine punching cost INR',
        'Bending cost INR',
        'Painting cost INR',
        'Total single part via laser INR',
        'Total single part via machine INR',
        'Total combined set via laser INR',
        'Total combined set via machine INR',
        'Nesting strategy',
        'Grain / cut direction',
        'Notes',
      ])
    );

    if (structured?.per_part_breakdown?.length) {
      structured.per_part_breakdown.forEach(part => {
        reportRows.push(row([
          part.part_number,
          part.component_name || '-',
          part.component_type,
          part.tube_type,
          part.material_type || '-',
          part.material_code || '-',
          part.per_set_qty,
          part.dimensions?.length_mm,
          part.dimensions?.width_or_outer_dia_mm,
          part.dimensions?.secondary_width_mm,
          part.dimensions?.thickness_or_wall_thickness_mm,
          part.surface_area_sq_meter,
          part.bends_per_part,
          part.cutting_metrics?.laser_cutting_length_mm,
          part.cutting_metrics?.press_machine_hits_count,
          part.weight_ledger?.unit_gross_rm_weight_kg,
          part.weight_ledger?.unit_net_finished_weight_kg,
          part.weight_ledger?.unit_scrap_waste_weight_kg,
          part.weight_ledger?.total_set_gross_weight_kg,
          part.calculated_costs?.material_cost,
          part.calculated_costs?.laser_cutting_cost_estimate,
          part.calculated_costs?.machine_punching_cost_estimate,
          part.calculated_costs?.bending_cost,
          part.calculated_costs?.painting_cost,
          part.calculated_costs?.total_single_part_cost_via_laser,
          part.calculated_costs?.total_single_part_cost_via_machine,
          part.calculated_costs?.total_combined_set_cost_via_laser,
          part.calculated_costs?.total_combined_set_cost_via_machine,
          part.nesting_layout_hint?.nesting_strategy || '-',
          part.nesting_layout_hint?.recommended_grain_or_cut_direction || '-',
          (part.notes || []).join('; '),
        ], [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27]));
      });
      reportRows.push(
        row([
          'TOTAL',
          'Assembly total',
          '-',
          '-',
          '-',
          '-',
          structured.per_part_breakdown.reduce((total, part) => total + numberSafe(part.per_set_qty), 0),
          '-',
          '-',
          '-',
          '-',
          structured.per_part_breakdown.reduce((total, part) => total + numberSafe(part.surface_area_sq_meter) * numberSafe(part.per_set_qty), 0),
          structured.per_part_breakdown.reduce((total, part) => total + numberSafe(part.bends_per_part) * numberSafe(part.per_set_qty), 0),
          structured.per_part_breakdown.reduce((total, part) => total + numberSafe(part.cutting_metrics?.laser_cutting_length_mm) * numberSafe(part.per_set_qty), 0),
          structured.per_part_breakdown.reduce((total, part) => total + numberSafe(part.cutting_metrics?.press_machine_hits_count) * numberSafe(part.per_set_qty), 0),
          structured.per_part_breakdown.reduce((total, part) => total + numberSafe(part.weight_ledger?.unit_gross_rm_weight_kg) * numberSafe(part.per_set_qty), 0),
          structured.per_part_breakdown.reduce((total, part) => total + numberSafe(part.weight_ledger?.unit_net_finished_weight_kg) * numberSafe(part.per_set_qty), 0),
          structured.per_part_breakdown.reduce((total, part) => total + numberSafe(part.weight_ledger?.unit_scrap_waste_weight_kg) * numberSafe(part.per_set_qty), 0),
          structured.per_part_breakdown.reduce((total, part) => total + numberSafe(part.weight_ledger?.total_set_gross_weight_kg), 0),
          structured.per_part_breakdown.reduce((total, part) => total + numberSafe(part.calculated_costs?.material_cost), 0),
          structured.per_part_breakdown.reduce((total, part) => total + numberSafe(part.calculated_costs?.laser_cutting_cost_estimate), 0),
          structured.per_part_breakdown.reduce((total, part) => total + numberSafe(part.calculated_costs?.machine_punching_cost_estimate), 0),
          structured.per_part_breakdown.reduce((total, part) => total + numberSafe(part.calculated_costs?.bending_cost), 0),
          structured.per_part_breakdown.reduce((total, part) => total + numberSafe(part.calculated_costs?.painting_cost), 0),
          '-',
          '-',
          structured.assembly_level_fabrication.grand_total_assembly_cost_via_laser,
          structured.assembly_level_fabrication.grand_total_assembly_cost_via_machine,
          'Includes assembly welding and tacking totals below',
          '-',
          '-',
        ], [6, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 26, 27], 'TotalRow')
      );
    } else {
      (estimation.items || []).forEach((item, index) => {
        reportRows.push(row([
          index + 1,
          item.name,
          '-',
          '-',
          item.materialLabel || estimation.materialSummary?.materialLabel || '-',
          estimation.materialSummary?.materialCode || '-',
          item.quantity,
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          item.weightKg,
          item.scrapWeightKg || 0,
          '-',
          item.materialCost,
          '-',
          '-',
          '-',
          '-',
          item.materialCost,
          item.materialCost,
          item.materialCost,
          item.materialCost,
          item.nestingApproach || '-',
          '-',
          '-',
        ], [0, 6, 16, 17, 19, 24, 25, 26, 27]));
      });
    }

    reportRows.push(blankRow(), sectionRow('Process Cost Summary'), headerRow(['Process', 'Parameter', 'Rate / Unit', 'Cost INR']));
    estimation.processDetails.forEach(detail => {
      reportRows.push(row([detail.name, '-', detail.unitCost, detail.cost], [2, 3]));
    });

    if (structured) {
      reportRows.push(
        row(['Assembly welding', `${structured.assembly_level_fabrication.total_assembly_welding_length_mm} mm`, `${params.weldRate || 0} INR/m`, structured.assembly_level_fabrication.welding_labor_cost], [3]),
        row(['Tacking setup', 'Fixed', 'INR fixed', structured.assembly_level_fabrication.tacking_fixed_setup_cost], [3]),
        row(['Grand total via laser', '-', currency, structured.assembly_level_fabrication.grand_total_assembly_cost_via_laser], [3], 'TotalRow'),
        row(['Grand total via machine', '-', currency, structured.assembly_level_fabrication.grand_total_assembly_cost_via_machine], [3], 'TotalRow')
      );
    }

    reportRows.push(blankRow(), sectionRow('Formula Trail'), headerRow(['Part no / Source', 'Section', 'Name', 'Formula', 'Substituted values', 'Result']));
    if (structured?.per_part_breakdown?.length) {
      structured.per_part_breakdown.forEach(part => {
        (part.calculation_steps || []).forEach(step => {
          reportRows.push(row([
            `Part ${part.part_number}`,
            step.section,
            step.name,
            step.formula,
            step.substitutedValues,
            step.result,
          ]));
        });
      });
    }
    (estimation.calculationSteps || []).forEach(step => {
      reportRows.push(row(['Legacy estimate', step.section, step.name, step.formula, step.substitutedValues, step.result]));
    });

    reportRows.push(blankRow(), sectionRow('Assumptions / Notes'));
    (estimation.assumptions || []).forEach(assumption => reportRows.push(row([assumption])));
    (structured?.assumptions || []).forEach(assumption => reportRows.push(row([assumption])));

    const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="16" ss:Color="#FFFFFF"/><Interior ss:Color="#0F172A" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style>
    <Style ss:ID="Section"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#004CCD" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style>
    <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1E40AF" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93C5FD"/></Borders><Alignment ss:WrapText="1" ss:Vertical="Center"/></Style>
    <Style ss:ID="Label"><Font ss:Bold="1" ss:Color="#334155"/><Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Value"><Font ss:Color="#0F172A"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Money"><Font ss:Bold="1" ss:Color="#004CCD"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/></Style>
    <Style ss:ID="TotalMoney"><Font ss:Bold="1" ss:Size="12" ss:Color="#FFFFFF"/><Interior ss:Color="#047857" ss:Pattern="Solid"/></Style>
    <Style ss:ID="TotalRow"><Font ss:Bold="1" ss:Color="#0F172A"/><Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Unit"><Font ss:Color="#64748B" ss:Italic="1"/></Style>
  </Styles>
  <Worksheet ss:Name="Cost Report">
    <Table>
      <Column ss:Width="120"/><Column ss:Width="170"/><Column ss:Width="110"/><Column ss:Width="150"/><Column ss:Width="130"/>
      <Column ss:Width="120"/><Column ss:Width="70"/><Column ss:Width="90"/><Column ss:Width="110"/><Column ss:Width="120"/>
      <Column ss:Width="100"/><Column ss:Width="110"/><Column ss:Width="90"/><Column ss:Width="120"/><Column ss:Width="90"/>
      <Column ss:Width="120"/><Column ss:Width="125"/><Column ss:Width="110"/><Column ss:Width="130"/><Column ss:Width="120"/>
      <Column ss:Width="130"/><Column ss:Width="140"/><Column ss:Width="110"/><Column ss:Width="110"/><Column ss:Width="145"/>
      <Column ss:Width="155"/><Column ss:Width="160"/><Column ss:Width="170"/><Column ss:Width="260"/><Column ss:Width="190"/><Column ss:Width="260"/>
      ${reportRows.join('')}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <FreezePanes/>
      <FrozenNoSplit/>
      <SplitHorizontal>1</SplitHorizontal>
      <TopRowBottomPane>1</TopRowBottomPane>
      <ActivePane>2</ActivePane>
    </WorksheetOptions>
  </Worksheet>
</Workbook>`;

    const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const reportName = (params.partName || structured?.part_name || 'diagram-cost-report')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    link.href = url;
    link.download = `${reportName || 'diagram-cost-report'}-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    triggerToast('Excel report downloaded with summary, part-wise cost, dimensions, weights, rates, and formulas.');
  };

  const openBreakdown = (title: string, steps: Array<CalculationStep | undefined>) => {
    const validSteps = steps.filter(Boolean) as CalculationStep[];
    if (validSteps.length === 0) {
      triggerToast('No formula trail is available for this value yet.');
      return;
    }
    setSelectedBreakdown({ title, steps: validSteps });
  };

  const findCalculationStep = (name: string) =>
    estimation?.calculationSteps?.find(step => step.name.toLowerCase() === name.toLowerCase());

  const findProcessStep = (name: string) => {
    const normalized = name.toLowerCase();
    const aliases: Record<string, string> = {
      painting: 'surface treatment',
      surface: 'surface treatment',
      'press machine': 'press machine',
      cutting: 'cutting',
      bending: 'bending',
      welding: 'welding',
      tacking: 'tacking',
    };
    const needle = aliases[normalized] || normalized;
    return estimation?.calculationSteps?.find(step => step.name.toLowerCase().includes(needle));
  };

  const mapStructuredSteps = (steps?: Array<any>): CalculationStep[] =>
    (steps || []).map(step => ({
      section: String(step.section || ''),
      name: String(step.name || ''),
      formula: String(step.formula || ''),
      substitutedValues: String(step.substitutedValues || step.substituted_values || ''),
      result: String(step.result || ''),
    }));

  const structuredStepsFor = (part: StructuredBreakdown['per_part_breakdown'][number], needles: string[]) => {
    const normalizedNeedles = needles.map(needle => needle.toLowerCase());
    return mapStructuredSteps(part.calculation_steps).filter(step => {
      const haystack = `${step.section} ${step.name} ${step.formula}`.toLowerCase();
      return normalizedNeedles.some(needle => haystack.includes(needle));
    });
  };

  const allocatedScrapBreakdownSteps = (): CalculationStep[] => {
    const structured = estimation?.structuredBreakdown || structuredBreakdownCache;
    if (structured?.per_part_breakdown?.length) {
      const partSteps = structured.per_part_breakdown.map((part) => {
        const scrapEach = Number(part.weight_ledger?.unit_scrap_waste_weight_kg || 0);
        const qty = Number(part.per_set_qty || 1);
        const totalScrap = scrapEach * qty;
        const name = part.component_name || part.tube_type || part.component_type || `Part ${part.part_number}`;
        return {
          section: 'Scrap',
          name: `Part ${part.part_number} ${name}`,
          formula: 'Allocated scrap = unit scrap / waste weight x set quantity',
          substitutedValues: `${scrapEach.toFixed(3)} kg x ${qty} pcs`,
          result: `${totalScrap.toFixed(3)} kg`,
        };
      });
      const total = structured.per_part_breakdown.reduce((sum, part) => (
        sum + Number(part.weight_ledger?.unit_scrap_waste_weight_kg || 0) * Number(part.per_set_qty || 1)
      ), 0);
      const value = total * displayedScrapRate;
      return [
        ...partSteps,
        {
          section: 'Scrap',
          name: 'Allocated scrap total',
          formula: 'Total allocated scrap = sum of all part scrap weights',
          substitutedValues: partSteps.map(step => step.result).join(' + '),
          result: `${total.toFixed(3)} kg`,
        },
        {
          section: 'Scrap Value',
          name: 'Scrap/offcut resale value',
          formula: 'Scrap value = total allocated scrap weight x scrap rate',
          substitutedValues: `${total.toFixed(3)} kg x Rs ${displayedScrapRate}/kg`,
          result: formatInr(value),
        },
      ];
    }

    if (estimation?.stockSummary) {
      const weight = Number(estimation.stockSummary.totalScrapWeightKg || 0);
      const value = weight * displayedScrapRate;
      return [
        {
          section: 'Scrap',
          name: 'Stock summary scrap/offcut',
          formula: 'Allocated scrap = stock/offcut weight calculated from rod or sheet nesting',
          substitutedValues: estimation.stockSummary.approach || 'Stock nesting estimate',
          result: `${weight.toFixed(3)} kg`,
        },
        {
          section: 'Scrap Value',
          name: 'Scrap/offcut resale value',
          formula: 'Scrap value = allocated scrap weight x scrap rate',
          substitutedValues: `${weight.toFixed(3)} kg x Rs ${displayedScrapRate}/kg`,
          result: formatInr(value),
        },
      ];
    }
    return [];
  };

  const nestingValueBreakdownSteps = (item: EstimateLineItem, valueType: 'weight' | 'scrapWeight' | 'scrapValue'): CalculationStep[] => {
    if (valueType === 'weight') {
      return item.formulas?.weight ? [item.formulas.weight] : [];
    }
    const parsed = parseNestingNumbers(item);
    if (valueType === 'scrapWeight') {
      return [
        {
          section: 'Stock',
          name: `${item.name} scrap weight`,
          formula: parsed.isSheet
            ? 'Scrap weight is leftover sheet/offcut weight allocated to this part.'
            : 'Scrap weight is leftover rod/profile weight allocated to this part.',
          substitutedValues: `${item.nestingApproach || 'Nesting approach not available'}; allocated scrap = ${Number(item.scrapWeightKg || 0).toFixed(3)} kg`,
          result: `${Number(item.scrapWeightKg || 0).toFixed(3)} kg`,
        },
      ];
    }
    return [
      {
        section: 'Stock',
        name: `${item.name} scrap value`,
        formula: 'Scrap value = scrap weight x scrap rate',
        substitutedValues: `${Number(item.scrapWeightKg || 0).toFixed(3)} kg x Rs ${displayedScrapRate}/kg`,
        result: formatInr(item.scrapValue || (Number(item.scrapWeightKg || 0) * displayedScrapRate)),
      },
    ];
  };

  const valueSourceBreakdownSteps = (step: CalculationStep): CalculationStep[] => {
    const text = `${step.section} ${step.name} ${step.formula} ${step.substitutedValues}`.toLowerCase();
    const valueText = cleanBreakdownText(step.substitutedValues);
    const numberMatches = valueText.match(/[-+]?\d*\.?\d+/g) || [];
    const formulaRows: CalculationStep[] = [];
    const add = (name: string, formula: string, substitutedValues: string, result: string) => {
      formulaRows.push({ section: 'Value Breakdown', name, formula, substitutedValues, result });
    };

    if (text.includes('scrap') && text.includes('rate')) {
      const scrapWeight = numberMatches[0] || '0';
      const scrapRate = numberMatches[1] || String(displayedScrapRate || 0);
      add('Scrap weight', 'Taken from part scrap/offcut calculation', valueText, `${scrapWeight} kg`);
      add('Scrap rate', 'Taken from editable Scrap Value rate', `Current UI rate = Rs ${displayedScrapRate}/kg`, `Rs ${scrapRate}/kg`);
      add('Scrap value', 'Scrap value = scrap weight x scrap rate', `${scrapWeight} kg x Rs ${scrapRate}/kg`, step.result);
      return formulaRows;
    }

    if (text.includes('laser')) {
      const mm = numberMatches[0] || '0';
      const meter = numberMatches[1] || String(Number(mm) / 1000);
      const rate = numberMatches[numberMatches.length - 1] || String(params.cutRate || 0);
      add('Cutting length in mm', 'Extracted laser cut length from diagram', valueText, `${mm} mm`);
      add('Convert mm to meter', 'meter = mm / 1000', `${mm} / 1000`, `${meter} m`);
      add('Laser rate', 'Taken from editable Laser Cut Rate', `Current UI rate = Rs ${params.cutRate || 0}/m`, `Rs ${rate}/m`);
      add('Laser cutting cost', 'Cost = length in meter x laser rate', `${meter} m x Rs ${rate}/m`, step.result);
      return formulaRows;
    }

    if (text.includes('press') || text.includes('punch')) {
      const hits = numberMatches[0] || '0';
      const rate = numberMatches[1] || String(params.pressRate || 0);
      add('Press hits', 'Extracted count of press/punch operations', valueText, `${hits} hits`);
      add('Press rate', 'Taken from editable Press Cut Rate', `Current UI rate = Rs ${params.pressRate || 0}/hit`, `Rs ${rate}/hit`);
      add('Press cost', 'Cost = press hits x rate per hit', `${hits} hits x Rs ${rate}/hit`, step.result);
      return formulaRows;
    }

    if (text.includes('bend')) {
      const bends = numberMatches[0] || '0';
      const rate = numberMatches[1] || String(params.bendRate || 0);
      add('Bend count', 'Extracted number of bends from part geometry', valueText, `${bends} bends`);
      add('Bend rate', 'Taken from editable Bending rate', `Current UI rate = Rs ${params.bendRate || 0}/bend`, `Rs ${rate}/bend`);
      add('Bending cost', 'Cost = bend count x rate per bend', `${bends} x Rs ${rate}/bend`, step.result);
      return formulaRows;
    }

    if (text.includes('weld')) {
      const mm = numberMatches[0] || '0';
      const meter = numberMatches[1] || String(Number(mm) / 1000);
      const rate = numberMatches[numberMatches.length - 1] || String(params.weldRate || 0);
      add('Weld length in mm', 'Extracted weld length from drawing/features', valueText, `${mm} mm`);
      add('Convert mm to meter', 'meter = mm / 1000', `${mm} / 1000`, `${meter} m`);
      add('Welding rate', 'Taken from editable Welding Labor rate', `Current UI rate = Rs ${params.weldRate || 0}/m`, `Rs ${rate}/m`);
      add('Welding cost', 'Cost = weld length in meter x welding rate', `${meter} m x Rs ${rate}/m`, step.result);
      return formulaRows;
    }

    if (text.includes('surface') || text.includes('paint')) {
      const area = numberMatches[0] || '0';
      const rate = numberMatches[numberMatches.length - 1] || String(params.surfaceRate || 0);
      add('Surface area', 'Calculated from part outside/inside dimensions', valueText, `${area} m squared`);
      add('Surface rate', 'Taken from editable Surface Finish rate', `Current UI rate = Rs ${params.surfaceRate || 0}/m squared`, `Rs ${rate}/m squared`);
      add('Surface cost', 'Cost = surface area x surface rate', `${area} m squared x Rs ${rate}/m squared`, step.result);
      return formulaRows;
    }

    if (text.includes('material cost')) {
      const weight = numberMatches[0] || '0';
      const rate = numberMatches[1] || String(params.materialRate || 0);
      add('Part weight', 'Calculated from extracted dimensions and density', valueText, `${weight} kg`);
      add('Material rate', 'Taken from editable Material Rate', `Current UI rate = Rs ${params.materialRate || 0}/kg`, `Rs ${rate}/kg`);
      add('Material cost', 'Cost = part weight x material rate, adjusted by scrap if present', valueText, step.result);
      return formulaRows;
    }

    return [
      {
        section: 'Values Used',
        name: `Numbers used for ${step.name}`,
        formula: 'The calculation uses the numeric values shown below.',
        substitutedValues: valueText,
        result: cleanBreakdownText(step.result),
      },
      {
        section: 'Original Formula',
        name: 'Formula and values used',
        formula: cleanBreakdownText(step.formula),
        substitutedValues: cleanBreakdownText(step.substitutedValues),
        result: cleanBreakdownText(step.result),
      },
    ];
  };

  const structuredDimensions = (part: StructuredBreakdown['per_part_breakdown'][number]) => {
    const dims = part.dimensions || {};
    return [
      dims.length_mm,
      dims.width_or_outer_dia_mm,
      dims.secondary_width_mm,
      dims.thickness_or_wall_thickness_mm,
    ].filter(value => value !== undefined && value !== null && Number(value) > 0).join(' x ') || '-';
  };

  const partDimensionBadges = (part: StructuredBreakdown['per_part_breakdown'][number]) => {
    const dims = part.dimensions || {};
    const badges: Array<{ label: string; value: string }> = [];
    const addMetric = (label: string, value: unknown, unit = 'mm') => {
      const numeric = Number(value);
      if (Number.isFinite(numeric) && numeric > 0) {
        const formatted = Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(3).replace(/\.?0+$/, '');
        badges.push({ label, value: `${formatted} ${unit}` });
      }
    };

    addMetric('Length', dims.length_mm);
    addMetric('Width / OD', dims.width_or_outer_dia_mm);
    addMetric('Height / B', dims.secondary_width_mm);
    addMetric('Thickness', dims.thickness_or_wall_thickness_mm);
    return badges;
  };

  const partTotalWeightKg = (part: StructuredBreakdown['per_part_breakdown'][number]) =>
    Number(part.weight_ledger?.unit_net_finished_weight_kg || 0) + Number(part.weight_ledger?.unit_scrap_waste_weight_kg || 0);

  const renderPartImageActions = (part: StructuredBreakdown['per_part_breakdown'][number], compact = false) => (
    <div className="absolute inset-x-2 bottom-2 z-10 flex items-end justify-between gap-2 pointer-events-none">
      <div className={`${compact ? 'px-2 py-1' : 'px-3 py-2'} rounded bg-slate-950/82 text-white shadow border border-white/10`}>
        <div className={`${compact ? 'text-[8px]' : 'text-[9px]'} uppercase tracking-wider font-black text-cyan-200`}>Total weight</div>
        <div className={`${compact ? 'text-[10px]' : 'text-xs'} font-mono font-black`}>
          Net + scrap = {partTotalWeightKg(part).toFixed(3)} kg
        </div>
      </div>
      <button
        type="button"
        className={`${compact ? 'px-2 py-1 text-[9px]' : 'px-3 py-2 text-xs'} rounded bg-[#004ccd] text-white font-black uppercase tracking-wider shadow pointer-events-auto hover:bg-blue-700`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setSelectedPartDetails(part);
        }}
      >
        Details
      </button>
    </div>
  );

  const parseNestingNumbers = (item: EstimateLineItem) => {
    const text = item.nestingApproach || '';
    const floorMatches = [...text.matchAll(/floor\(\s*([\d.]+)\s*\/\s*([\d.]+)\s*\)/g)];
    const piecesMatch = text.match(/=\s*(\d+)\s*(?:pieces|parts)/i);
    const leftoverMatch = text.match(/leftover\s*([\d.]+)\s*mm/i);
    const stockLength = Number(floorMatches[0]?.[1] || (item.stockForm?.toLowerCase().includes('sheet') ? 2500 : 6000));
    const pieceLength = Number(floorMatches[0]?.[2] || 0);
    const stockWidth = Number(floorMatches[1]?.[1] || 1250);
    const pieceWidth = Number(floorMatches[1]?.[2] || 0);
    return {
      stockLength,
      stockWidth,
      pieceLength,
      pieceWidth,
      pieces: Number(piecesMatch?.[1] || item.partsPerStock || 1),
      leftover: Number(leftoverMatch?.[1] || 0),
      isSheet: (item.stockForm || item.stockSize || text).toLowerCase().includes('sheet') || text.toLowerCase().includes('2500 x 1250'),
    };
  };

  const renderNestingVisual = (item: EstimateLineItem) => {
    const parsed = parseNestingNumbers(item);
    if (parsed.isSheet) {
      const cols = parsed.pieceLength > 0 ? Math.max(Math.floor(parsed.stockLength / parsed.pieceLength), 1) : Math.ceil(Math.sqrt(parsed.pieces));
      const rows = parsed.pieceWidth > 0 ? Math.max(Math.floor(parsed.stockWidth / parsed.pieceWidth), 1) : Math.ceil(parsed.pieces / cols);
      const visibleCols = Math.min(cols, 12);
      const visibleRows = Math.min(rows, 6);
      const shown = visibleCols * visibleRows;
      return (
        <div className="space-y-4">
          <div className="relative bg-slate-100 border-2 border-slate-900 rounded-lg overflow-hidden aspect-[2/1] shadow-inner">
            <div className="absolute inset-3 bg-white border border-slate-300">
              <div className="grid h-full gap-1 p-2" style={{ gridTemplateColumns: `repeat(${visibleCols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${visibleRows}, minmax(0, 1fr))` }}>
                {Array.from({ length: shown }).map((_, index) => (
                  <div key={`sheet-piece-${index}`} className="bg-blue-100 border border-[#004ccd]/55 rounded-sm flex items-center justify-center text-[8px] font-mono font-black text-[#004ccd]">
                    P
                  </div>
                ))}
              </div>
              <div className="absolute right-2 bottom-2 bg-amber-100 border border-amber-300 px-2 py-1 rounded text-[9px] font-black text-amber-800">
                scrap/offcut area
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-[10px] uppercase font-black text-slate-500">Stock sheet</div>
              <div className="font-mono font-black">{parsed.stockLength} x {parsed.stockWidth} mm</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-[10px] uppercase font-black text-slate-500">Part cut size</div>
              <div className="font-mono font-black">{parsed.pieceLength || '-'} x {parsed.pieceWidth || '-'} mm</div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded">
              <div className="text-[10px] uppercase font-black text-[#004ccd]">Grid yield</div>
              <div className="font-mono font-black">{cols} x {rows} = {parsed.pieces} parts</div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded">
              <div className="text-[10px] uppercase font-black text-amber-700">Allocated scrap</div>
              <div className="font-mono font-black">{Number(item.scrapWeightKg || 0).toFixed(3)} kg</div>
            </div>
          </div>
        </div>
      );
    }

    const stock = parsed.stockLength || 6000;
    const used = Math.min((parsed.pieceLength || 0) * parsed.pieces, stock);
    const usedPercent = Math.max(Math.min((used / stock) * 100, 100), 0);
    const leftoverPercent = Math.max(100 - usedPercent, 0);
    return (
      <div className="space-y-4">
        <div className="relative h-28 bg-slate-100 border border-slate-200 rounded-lg p-5">
          <div className="relative h-12 bg-slate-300 border-2 border-slate-900 rounded-full overflow-hidden shadow-inner">
            <div className="absolute inset-y-0 left-0 bg-blue-100 flex" style={{ width: `${usedPercent}%` }}>
              {Array.from({ length: Math.min(parsed.pieces, 8) }).map((_, index) => (
                <div key={`rod-piece-${index}`} className="h-full border-r-2 border-[#004ccd] flex-1 flex items-center justify-center text-[10px] font-black text-[#004ccd]">
                  {index + 1}
                </div>
              ))}
            </div>
            {leftoverPercent > 0 && (
              <div className="absolute inset-y-0 right-0 bg-amber-200 flex items-center justify-center text-[10px] font-black text-amber-900" style={{ width: `${leftoverPercent}%` }}>
                scrap
              </div>
            )}
          </div>
          <div className="absolute left-5 right-5 bottom-3 flex justify-between text-[10px] font-mono text-slate-600">
            <span>0 mm</span>
            <span>stock length {stock} mm</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <div className="text-[10px] uppercase font-black text-slate-500">Stock rod/profile</div>
            <div className="font-mono font-black">{stock} mm</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <div className="text-[10px] uppercase font-black text-slate-500">Part length</div>
            <div className="font-mono font-black">{parsed.pieceLength || '-'} mm</div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded">
            <div className="text-[10px] uppercase font-black text-[#004ccd]">Yield per stock</div>
            <div className="font-mono font-black">{parsed.pieces} pieces</div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded">
            <div className="text-[10px] uppercase font-black text-amber-700">Leftover</div>
            <div className="font-mono font-black">{parsed.leftover} mm</div>
          </div>
        </div>
      </div>
    );
  };

  const hasPartImageRegion = (part: StructuredBreakdown['per_part_breakdown'][number]) => {
    const region = part.image_region;
    if (!region) return false;
    const source = String(region.source || '').toLowerCase();
    if (source.includes('bom') || source.includes('table') || source.includes('row') || source.includes('title block')) {
      return false;
    }
    const { x_min, y_min, x_max, y_max } = region;
    return [x_min, y_min, x_max, y_max].every(value => typeof value === 'number')
      && Number(x_max) > Number(x_min)
      && Number(y_max) > Number(y_min);
  };

  const partCropImageStyle = (part: StructuredBreakdown['per_part_breakdown'][number]): React.CSSProperties => {
    const region = part.image_region;
    if (!hasPartImageRegion(part) || !region) {
      return {};
    }
    const rawXMin = Number(region.x_min);
    const rawYMin = Number(region.y_min);
    const rawXMax = Number(region.x_max);
    const rawYMax = Number(region.y_max);
    const rawWidth = rawXMax - rawXMin;
    const rawHeight = rawYMax - rawYMin;
    const paddingX = Math.max(rawWidth * 0.22, 28);
    const paddingY = Math.max(rawHeight * 0.22, 28);
    const xMin = Math.max(rawXMin - paddingX, 0);
    const yMin = Math.max(rawYMin - paddingY, 0);
    const xMax = Math.min(rawXMax + paddingX, 1000);
    const yMax = Math.min(rawYMax + paddingY, 1000);
    const width = Math.max(xMax - xMin, 1);
    const height = Math.max(yMax - yMin, 1);
    return {
      position: 'absolute',
      width: `${100000 / width}%`,
      height: `${100000 / height}%`,
      left: `-${(xMin / width) * 100}%`,
      top: `-${(yMin / height) * 100}%`,
      maxWidth: 'none',
      objectFit: 'fill',
      transformOrigin: 'top left',
      imageRendering: 'auto',
    };
  };

  const handlePreviewImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (naturalWidth > 0 && naturalHeight > 0) {
      setPreviewAspectRatio(naturalWidth / naturalHeight);
    }
  };

  const partImageRegionLabel = (part: StructuredBreakdown['per_part_breakdown'][number]) =>
    hasPartImageRegion(part) ? (part.image_region?.source || 'Detected part region') : 'Part crop not available';

  const partReferenceImageUrl = (part?: StructuredBreakdown['per_part_breakdown'][number] | null) => {
    const svgToDataUri = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    const dims = part?.dimensions || {};
    const length = Number(dims.length_mm || 0);
    const width = Number(dims.width_or_outer_dia_mm || 0);
    const secondary = Number(dims.secondary_width_mm || 0);
    const thickness = Number(dims.thickness_or_wall_thickness_mm || 0);
    const qty = Number(part?.per_set_qty || 1);
    const title = (part?.component_name || part?.tube_type || part?.component_type || 'Part reference').toUpperCase();
    const dimensionLine = structuredDimensions(part as StructuredBreakdown['per_part_breakdown'][number] || ({} as StructuredBreakdown['per_part_breakdown'][number]));
    const text = part
      ? `${part.part_number || ''} ${part.component_name || ''} ${part.component_type || ''} ${part.tube_type || ''}`.toLowerCase()
      : '';
    const escapedTitle = title.replace(/[<>&"]/g, '');
    const escapedDims = dimensionLine.replace(/[<>&"]/g, '');
    const frameOpen = (sectionTitle = escapedTitle) => `<svg width="900" height="620" viewBox="0 0 900 620" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="studio" cx="50%" cy="36%" r="78%"><stop stop-color="#f7f5ee"/><stop offset=".58" stop-color="#b8b3aa"/><stop offset="1" stop-color="#8e887d"/></radialGradient>
        <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8f7f2"/><stop offset=".16" stop-color="#cbc6bc"/><stop offset=".45" stop-color="#817d75"/><stop offset=".72" stop-color="#d8d4cc"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
        <linearGradient id="darkSteel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#6d6961"/><stop offset=".45" stop-color="#aaa59b"/><stop offset="1" stop-color="#ebe8df"/></linearGradient>
        <linearGradient id="side" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#6f6a62"/><stop offset=".55" stop-color="#9d988f"/><stop offset="1" stop-color="#d9d5cc"/></linearGradient>
        <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#45423d"/><stop offset=".5" stop-color="#98938a"/><stop offset="1" stop-color="#eeeae2"/></linearGradient>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#1f2937"/></marker>
        <filter id="shadow" x="-25%" y="-25%" width="150%" height="170%"><feDropShadow dx="0" dy="22" stdDeviation="17" flood-color="#000" flood-opacity=".32"/></filter>
        <filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="0.35"/></filter>
      </defs>
      <rect width="900" height="620" rx="26" fill="url(#studio)"/>
      <rect x="0" y="0" width="900" height="58" fill="#050505"/>
      <text x="24" y="37" fill="#f9fafb" font-family="Arial, sans-serif" font-size="23" font-weight="800">${sectionTitle}</text>
      <text x="24" y="586" fill="#111827" font-family="Arial, sans-serif" font-size="18" font-weight="800">${escapedDims || 'DIMENSIONS FROM DRAWING'}</text>
      <text x="790" y="586" fill="#111827" font-family="Arial, sans-serif" font-size="16" font-weight="800">QTY ${qty}</text>
      <ellipse cx="450" cy="512" rx="320" ry="48" fill="#5f584d" opacity=".24" filter="url(#soft)"/>`;
    const frameClose = `</svg>`;
    const dimensionCallout = (x1: number, y1: number, x2: number, y2: number, label: string) =>
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1f2937" stroke-width="2.4" marker-start="url(#arrow)" marker-end="url(#arrow)"/><rect x="${(x1 + x2) / 2 - 42}" y="${Math.min(y1, y2) - 28}" width="84" height="24" rx="4" fill="#efede6" stroke="#1f2937"/><text x="${(x1 + x2) / 2}" y="${Math.min(y1, y2) - 11}" text-anchor="middle" fill="#111827" font-family="Arial, sans-serif" font-size="14" font-weight="800">${label}</text>`;
    const hole = (cx: number, cy: number, r = 17) =>
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f7f5ee" stroke="#6a655d" stroke-width="5"/><circle cx="${cx}" cy="${cy}" r="${Math.max(r - 8, 5)}" fill="#c4beb3"/>`;
    const genericShape = `<g filter="url(#shadow)"><polygon points="270,214 560,142 690,224 400,304" fill="url(#steel)" stroke="#716d65" stroke-width="5"/><polygon points="400,304 690,224 690,382 400,468" fill="#969289" stroke="#625f58" stroke-width="5"/><polygon points="270,214 400,304 400,468 270,376" fill="#bbb7ae" stroke="#69655e" stroke-width="5"/></g>`;

    if (!part) return svgToDataUri(`${frameOpen('PART REFERENCE')}${genericShape}${frameClose}`);
    if (text.includes('screw')) return svgToDataUri(`${frameOpen('ITEM: SCREWING PIECE')}<g filter="url(#shadow)"><ellipse cx="450" cy="168" rx="108" ry="44" fill="#bcb7ad" stroke="#625e57" stroke-width="5"/><rect x="342" y="168" width="216" height="248" fill="url(#steel)" stroke="#625e57" stroke-width="5"/><ellipse cx="450" cy="416" rx="108" ry="44" fill="#8c877e" stroke="#625e57" stroke-width="5"/><ellipse cx="450" cy="168" rx="46" ry="18" fill="#f8f5ee" stroke="#625e57" stroke-width="5"/><path d="M360 226 H540 M360 278 H540 M360 330 H540 M360 382 H540" stroke="#6b665f" stroke-width="4"/></g>${dimensionCallout(338, 464, 562, 464, length ? `${length} mm` : 'L')}${dimensionCallout(610, 168, 610, 416, width ? `Dia ${width}` : 'Dia')}${frameClose}`);
    if (text.includes('handle')) return svgToDataUri(`${frameOpen('SUB-COMPONENT: HANDLE')}<g filter="url(#shadow)"><path d="M330 198 C238 198 238 430 330 430 L570 430 C662 430 662 198 570 198" stroke="#5f5a53" stroke-width="66" stroke-linecap="round" fill="none"/><path d="M330 198 C238 198 238 430 330 430 L570 430 C662 430 662 198 570 198" stroke="#d8d4cc" stroke-width="40" stroke-linecap="round" fill="none"/><path d="M330 198 C238 198 238 430 330 430 L570 430 C662 430 662 198 570 198" stroke="#9b968d" stroke-width="12" stroke-linecap="round" fill="none" opacity=".78"/><path d="M332 183 C236 190 220 425 326 445" stroke="#fff" stroke-width="8" opacity=".22"/></g>${dimensionCallout(302, 148, 598, 148, length ? `${length} mm` : 'L')}${dimensionCallout(676, 202, 676, 430, width ? `OD ${width}` : 'OD')}${frameClose}`);
    if (text.includes('chair') || text.includes('angle') || text.includes('bracket')) return svgToDataUri(`${frameOpen('SUB-COMPONENT: CHAIR ANGLE')}<g filter="url(#shadow)"><polygon points="288,406 596,286 720,358 410,486" fill="url(#steel)" stroke="#645f58" stroke-width="5"/><polygon points="410,486 720,358 720,444 410,566" fill="url(#side)" stroke="#545049" stroke-width="5"/><polygon points="596,286 720,358 720,206 596,140" fill="#b9b4aa" stroke="#645f58" stroke-width="5"/><polygon points="596,140 720,206 410,330 288,260" fill="url(#steel)" stroke="#645f58" stroke-width="5"/><path d="M618 158 L694 202 L694 337" stroke="#fff" stroke-width="8" opacity=".22"/>${hole(430,424,15)}${hole(586,360,15)}</g>${dimensionCallout(288,520,720,520, length ? `${length} mm` : 'L')}${dimensionCallout(755,206,755,444, secondary || width ? `${secondary || width} mm` : 'H')}${frameClose}`);
    if (text.includes('plate') || text.includes('sheet') || text.includes('top') || text.includes('bottom')) {
      const plateW = Math.min(Math.max(width || secondary || 125, 80), 220);
      const plateH = Math.min(Math.max(length || 150, 90), 260);
      const x = 450 - plateW * 1.02;
      const y = 182;
      const skew = 92;
      const edgeDepth = Math.max(Math.min(thickness * 4, 24), 10);
      return svgToDataUri(`${frameOpen(text.includes('top') ? 'ITEM: TOP PLATE DETAIL' : text.includes('bottom') ? 'ITEM: BOTTOM PLATE DETAIL' : 'ITEM: PLATE DETAIL')}
        <g filter="url(#shadow)">
          <polygon points="${x},${y} ${x + plateW * 1.85},${y - skew * .42} ${x + plateW * 2.55},${y + skew * .2} ${x + plateW * .68},${y + skew * .72}" fill="url(#steel)" stroke="#6d6961" stroke-width="4"/>
          <polygon points="${x + plateW * .68},${y + skew * .72} ${x + plateW * 2.55},${y + skew * .2} ${x + plateW * 2.55},${y + skew * .2 + edgeDepth} ${x + plateW * .68},${y + skew * .72 + edgeDepth}" fill="url(#edge)" stroke="#5c5851" stroke-width="4"/>
          <polygon points="${x},${y} ${x + plateW * .68},${y + skew * .72} ${x + plateW * .68},${y + skew * .72 + edgeDepth} ${x},${y + edgeDepth}" fill="#8f8a81" stroke="#5c5851" stroke-width="4"/>
          <path d="M ${x + 34} ${y + 10} L ${x + plateW * 1.72} ${y - skew * .32}" stroke="white" stroke-width="8" opacity=".22"/>
          ${hole(x + plateW * .48, y + 42, 17)}
          ${hole(x + plateW * 1.78, y + 2, 17)}
          ${hole(x + plateW * .56, y + plateH * .58, 17)}
          ${hole(x + plateW * 1.84, y + plateH * .18, 17)}
        </g>${dimensionCallout(x + 6, y + 186, x + plateW * 2.34, y + 136, length ? `${length} mm` : 'L')}${dimensionCallout(x + plateW * 2.68, y + 18, x + plateW * 2.68, y + 160, width ? `${width} mm` : 'W')}${dimensionCallout(x + plateW * .78, y + skew * .8 + edgeDepth + 20, x + plateW * 2.5, y + skew * .28 + edgeDepth + 20, thickness ? `t ${thickness}` : 't')}${frameClose}`);
    }
    if (text.includes('tube') || text.includes('square') || text.includes('pipe')) return svgToDataUri(`${frameOpen('ITEM: SQUARE TUBE SUB-ASSEMBLY')}<g filter="url(#shadow)"><polygon points="134,348 602,124 780,204 312,438" fill="url(#steel)" stroke="#5f5a53" stroke-width="5"/><polygon points="312,438 780,204 780,294 312,528" fill="url(#side)" stroke="#4f4b45" stroke-width="5"/><polygon points="134,348 312,438 312,528 134,436" fill="#706b63" stroke="#4f4b45" stroke-width="5"/><rect x="174" y="374" width="92" height="92" fill="#171b1b" stroke="#f2eee5" stroke-width="7"/><rect x="194" y="394" width="52" height="52" fill="#282d2d" stroke="#514d46" stroke-width="4"/><path d="M220 330 L638 132" stroke="#fff" stroke-width="10" opacity=".2"/>${hole(474,262,24)}${hole(592,206,24)}${hole(390,304,24)}<path d="M474 262 C490 250 514 246 528 254" stroke="#2f2c28" stroke-width="4" opacity=".5"/></g>${dimensionCallout(164,548,760,548, length ? `${length} mm` : 'L')}${dimensionCallout(106,350,106,436, width ? `${width} mm` : 'A')}${dimensionCallout(102,382,174,382, thickness ? `t ${thickness}` : 't')}${frameClose}`);
    return svgToDataUri(`${frameOpen()}${genericShape}${frameClose}`);
  };

  const renderPartRegionAnnotations = (compact = false) => {
    const parts = estimation?.structuredBreakdown?.per_part_breakdown || structuredBreakdownCache?.per_part_breakdown || [];
    return parts.filter(hasPartImageRegion).map((part, idx) => {
      const region = part.image_region;
      const xMin = Number(region?.x_min || 0) / 10;
      const yMin = Number(region?.y_min || 0) / 10;
      const width = (Number(region?.x_max || 0) - Number(region?.x_min || 0)) / 10;
      const height = (Number(region?.y_max || 0) - Number(region?.y_min || 0)) / 10;
      const label = `Part ${part.part_number}: ${part.component_name || part.tube_type || part.component_type}`;

      return (
        <div
          key={`region-${part.part_number}-${idx}`}
          className="absolute pointer-events-none"
          style={{
            left: `${xMin}%`,
            top: `${yMin}%`,
            width: `${width}%`,
            height: `${height}%`,
          }}
        >
          <div className="absolute inset-0 border-2 border-red-500 rounded-[50%] shadow-[0_0_0_2px_rgba(255,255,255,0.75)]"></div>
          <div className="absolute left-0 -top-6 flex items-center gap-2 max-w-[220px]">
            <span className="h-0.5 w-8 bg-red-500"></span>
            <span className={`${compact ? 'text-[9px]' : 'text-[11px]'} bg-red-600 text-white px-2 py-1 rounded font-black uppercase tracking-wide shadow whitespace-nowrap truncate`}>
              {label}
            </span>
          </div>
        </div>
      );
    });
  };

  const structuredScrapWeightKg = estimation?.structuredBreakdown
    ? estimation.structuredBreakdown.per_part_breakdown.reduce((total, part) => (
      total + (Number(part.weight_ledger?.unit_scrap_waste_weight_kg || 0) * Number(part.per_set_qty || 1))
    ), 0)
    : null;

  const displayedScrapRate = Number(params.scrapRate || estimation?.stockSummary?.scrapRatePerKg || 28);
  const displayedScrapWeightKg = structuredScrapWeightKg ?? Number(estimation?.stockSummary?.totalScrapWeightKg || 0);
  const displayedScrapValue = displayedScrapWeightKg * displayedScrapRate;

  const valueButtonClass = "font-mono underline decoration-dotted underline-offset-4 hover:text-[#004ccd] focus:text-[#004ccd] cursor-pointer";
  const cleanBreakdownText = (value: string) =>
    String(value || '-')
      .replace(/\bINR\b/g, 'Rs')
      .replace(/kg\/mm3/g, 'kg per mm3')
      .replace(/mm2/g, 'mm squared')
      .replace(/mm3/g, 'mm cubed')
      .replace(/m2/g, 'm squared');

  const simpleBreakdownMeaning = (step: CalculationStep) => {
    const text = `${step.section} ${step.name} ${step.formula}`.toLowerCase();
    if (text.includes('scrap') && text.includes('resale')) {
      return 'This is the money recovered from leftover material. More scrap rate increases recovered value and reduces net material cost.';
    }
    if (text.includes('scrap') || text.includes('offcut')) {
      return 'This shows how much leftover material is allocated to this part or assembly.';
    }
    if (text.includes('material cost')) {
      return 'This is the material amount charged for the part after considering weight and scrap recovery.';
    }
    if (text.includes('gross rm') || text.includes('gross raw')) {
      return 'This is the raw material weight before removing waste or scrap.';
    }
    if (text.includes('net weight') || text.includes('finished weight')) {
      return 'This is the final usable part weight calculated from size, section area, length, and material density.';
    }
    if (text.includes('surface')) {
      return 'This is the painted or finished surface area/cost. The drawing dimensions are in mm, so area is converted to square meters.';
    }
    if (text.includes('laser')) {
      return 'This is laser cutting cost: cutting length is converted to meters and multiplied by the laser rate.';
    }
    if (text.includes('press') || text.includes('punch')) {
      return 'This is press/punch cost: number of hits multiplied by the rate per hit.';
    }
    if (text.includes('bend')) {
      return 'This is bending cost: number of bends multiplied by rate per bend.';
    }
    if (text.includes('weld')) {
      return 'This is welding cost: weld length is converted to meters and multiplied by welding rate.';
    }
    if (text.includes('total')) {
      return 'This is the final total from the related material and process cost lines.';
    }
    return 'This shows the simple formula and the values used to calculate this number.';
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f9f9f9] text-[#1a1c1c] font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[100] flex items-center gap-3 px-5 py-4 bg-slate-900 text-white rounded-lg shadow-xl border border-slate-700 animate-slide-in">
          <Info className="w-5 h-5 text-sky-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {selectedBreakdown && (
        <div className="fixed inset-0 z-[120] bg-slate-950/45 flex items-center justify-center p-4" onClick={() => setSelectedBreakdown(null)}>
          <div
            className="w-full max-w-2xl max-h-[82vh] bg-white border border-[#c3c6d8] rounded-xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-50 border-b border-[#c3c6d8] flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-[#004ccd]">Calculation Breakdown</div>
                <h3 className="text-base font-black text-slate-900">{selectedBreakdown.title}</h3>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                onClick={() => setSelectedBreakdown(null)}
              >
                Close
              </button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar space-y-3">
              {selectedBreakdown.steps.map((step, idx) => (
                <div key={`${step.name}-${idx}`} className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#004ccd] tracking-wider">{step.section}</div>
                      <div className="text-sm font-black text-slate-900">{step.name}</div>
                    </div>
                    <div className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 text-xs font-mono font-black whitespace-nowrap">
                      {cleanBreakdownText(step.result)}
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-md">
                    <div className="text-[10px] uppercase font-black text-[#004ccd] mb-1">Simple meaning</div>
                    <div className="text-xs text-slate-700 leading-relaxed">{simpleBreakdownMeaning(step)}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="p-3 bg-slate-50 rounded border border-slate-100 text-left hover:border-[#004ccd] hover:bg-blue-50/50 transition-colors"
                      onClick={() => setSelectedBreakdown({
                        title: `Formula Source: ${step.name}`,
                        steps: valueSourceBreakdownSteps(step),
                      })}
                    >
                      <div className="text-[10px] uppercase font-black text-slate-500 mb-1">Formula</div>
                      <div className="font-mono text-xs text-slate-800 leading-relaxed">{cleanBreakdownText(step.formula)}</div>
                      <div className="text-[9px] uppercase font-bold text-[#004ccd] mt-2">Click for source</div>
                    </button>
                    <button
                      type="button"
                      className="p-3 bg-slate-50 rounded border border-slate-100 text-left hover:border-[#004ccd] hover:bg-blue-50/50 transition-colors"
                      onClick={() => setSelectedBreakdown({
                        title: `Values Used: ${step.name}`,
                        steps: valueSourceBreakdownSteps(step),
                      })}
                    >
                      <div className="text-[10px] uppercase font-black text-slate-500 mb-1">Values used</div>
                      <div className="font-mono text-xs text-slate-800 leading-relaxed">{cleanBreakdownText(step.substitutedValues)}</div>
                      <div className="text-[9px] uppercase font-bold text-[#004ccd] mt-2">Click for source</div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedPartDetails && (
        <div className="fixed inset-0 z-[125] bg-slate-950/55 flex items-center justify-center p-4" onClick={() => setSelectedPartDetails(null)}>
          <div
            className="w-full max-w-xl bg-white border border-[#c3c6d8] rounded-xl shadow-2xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest font-bold text-cyan-200">Part Details</div>
                <h3 className="text-base font-black truncate">
                  Part {selectedPartDetails.part_number}: {selectedPartDetails.component_name || selectedPartDetails.tube_type || selectedPartDetails.component_type}
                </h3>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded bg-white/10 text-white text-xs font-bold hover:bg-white/15"
                onClick={() => setSelectedPartDetails(null)}
              >
                Close
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <div className="text-[10px] uppercase tracking-widest font-black text-[#004ccd] mb-2">Dimensions</div>
                <div className="grid grid-cols-2 gap-3">
                  {partDimensionBadges(selectedPartDetails).map((badge) => (
                    <div key={`${badge.label}-${badge.value}`} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-[10px] uppercase font-black text-slate-500">{badge.label}</div>
                      <div className="font-mono text-sm font-black text-slate-900 mt-1">{badge.value}</div>
                    </div>
                  ))}
                  {partDimensionBadges(selectedPartDetails).length === 0 && (
                    <div className="col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                      No verified dimensions were extracted for this part.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest font-black text-[#004ccd] mb-2">Weight Breakdown</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <div className="text-[10px] uppercase font-black text-emerald-700">Net weight</div>
                    <div className="font-mono text-sm font-black text-emerald-950 mt-1">
                      {Number(selectedPartDetails.weight_ledger?.unit_net_finished_weight_kg || 0).toFixed(3)} kg
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <div className="text-[10px] uppercase font-black text-amber-700">Scrap weight</div>
                    <div className="font-mono text-sm font-black text-amber-950 mt-1">
                      {Number(selectedPartDetails.weight_ledger?.unit_scrap_waste_weight_kg || 0).toFixed(3)} kg
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="text-[10px] uppercase font-black text-[#004ccd]">Net + scrap</div>
                    <div className="font-mono text-sm font-black text-[#004ccd] mt-1">
                      {partTotalWeightKg(selectedPartDetails).toFixed(3)} kg
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-700">
                  Total weight = net finished weight + scrap weight = {Number(selectedPartDetails.weight_ledger?.unit_net_finished_weight_kg || 0).toFixed(3)} kg + {Number(selectedPartDetails.weight_ledger?.unit_scrap_waste_weight_kg || 0).toFixed(3)} kg = {partTotalWeightKg(selectedPartDetails).toFixed(3)} kg
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedNestingItem && (
        <div className="fixed inset-0 z-[126] bg-slate-950/60 flex items-center justify-center p-4" onClick={() => setSelectedNestingItem(null)}>
          <div
            className="w-full max-w-4xl bg-white border border-[#c3c6d8] rounded-xl shadow-2xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest font-bold text-cyan-200">Nesting / Stock Cutting Visual</div>
                <h3 className="text-base font-black truncate">{selectedNestingItem.name}</h3>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded bg-white/10 text-white text-xs font-bold hover:bg-white/15"
                onClick={() => setSelectedNestingItem(null)}
              >
                Close
              </button>
            </div>
            <div className="p-5 space-y-5">
              {renderNestingVisual(selectedNestingItem)}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2">Calculation approach</div>
                <div className="text-sm leading-relaxed text-slate-700">{selectedNestingItem.nestingApproach}</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded">
                  <div className="text-[10px] uppercase font-black text-slate-500">Part qty</div>
                  <div className="font-mono font-black">{selectedNestingItem.quantity} pcs</div>
                </div>
                <button
                  type="button"
                  className="p-3 bg-white border border-slate-200 hover:border-[#004ccd] hover:bg-blue-50/40 rounded text-left transition-colors"
                  onClick={() => openBreakdown(`${selectedNestingItem.name} Part Weight`, nestingValueBreakdownSteps(selectedNestingItem, 'weight'))}
                >
                  <div className="text-[10px] uppercase font-black text-slate-500">Part weight</div>
                  <div className="font-mono font-black underline decoration-dotted underline-offset-4">{Number(selectedNestingItem.weightKg || 0).toFixed(3)} kg</div>
                </button>
                <button
                  type="button"
                  className="p-3 bg-white border border-slate-200 hover:border-[#004ccd] hover:bg-blue-50/40 rounded text-left transition-colors"
                  onClick={() => openBreakdown(`${selectedNestingItem.name} Scrap Weight`, nestingValueBreakdownSteps(selectedNestingItem, 'scrapWeight'))}
                >
                  <div className="text-[10px] uppercase font-black text-slate-500">Scrap weight</div>
                  <div className="font-mono font-black underline decoration-dotted underline-offset-4">{Number(selectedNestingItem.scrapWeightKg || 0).toFixed(3)} kg</div>
                </button>
                <button
                  type="button"
                  className="p-3 bg-white border border-slate-200 hover:border-[#004ccd] hover:bg-blue-50/40 rounded text-left transition-colors"
                  onClick={() => openBreakdown(`${selectedNestingItem.name} Scrap Value`, nestingValueBreakdownSteps(selectedNestingItem, 'scrapValue'))}
                >
                  <div className="text-[10px] uppercase font-black text-slate-500">Scrap value</div>
                  <div className="font-mono font-black underline decoration-dotted underline-offset-4">{formatInr(selectedNestingItem.scrapValue || 0)}</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPartSummaryOpen && estimation && (
        <div className="fixed inset-0 z-[126] bg-slate-950/60 flex items-center justify-center p-4" onClick={() => setIsPartSummaryOpen(false)}>
          <div
            className="w-full max-w-5xl max-h-[88vh] bg-white border border-[#c3c6d8] rounded-xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest font-bold text-cyan-200">Part Summary</div>
                <h3 className="text-base font-black truncate">{fileName || estimation.uploadedFile || 'Uploaded drawing'}</h3>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded bg-white/10 text-white text-xs font-bold hover:bg-white/15"
                onClick={() => setIsPartSummaryOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] uppercase font-black text-slate-500">File name</div>
                  <div className="font-mono text-sm font-black text-slate-900 mt-1">{fileName || estimation.uploadedFile || '-'}</div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="text-[10px] uppercase font-black text-[#004ccd]">Part made</div>
                  <div className="font-mono text-sm font-black text-[#004ccd] mt-1">{params.partName || estimation.structuredBreakdown?.part_name || '-'}</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <div className="text-[10px] uppercase font-black text-emerald-700">Total cost</div>
                  <div className="font-mono text-sm font-black text-emerald-950 mt-1">{formatInr(estimation.summary.totalCost)}</div>
                </div>
              </div>

              {estimation.structuredBreakdown?.per_part_breakdown?.length ? (
                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-widest font-black text-[#004ccd]">Part-wise extracted details</div>
                  {estimation.structuredBreakdown.per_part_breakdown.map((part) => (
                    <div key={`summary-structured-${part.part_number}`} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                          <div className="text-[10px] uppercase font-black text-slate-500">Part {part.part_number}</div>
                          <div className="text-sm font-black text-slate-950">{part.component_name || part.tube_type || part.component_type}</div>
                          <div className="text-xs font-mono text-slate-600 mt-1">{part.component_type} / Qty {part.per_set_qty}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-black text-[#004ccd]">Set laser cost</div>
                          <button type="button" className="font-mono text-sm font-black text-[#004ccd] underline decoration-dotted underline-offset-4" onClick={() => openBreakdown(`Part ${part.part_number} Cost`, mapStructuredSteps(part.calculation_steps))}>
                            {formatInr(part.calculated_costs.total_combined_set_cost_via_laser)}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                        {partDimensionBadges(part).map((badge) => (
                          <div key={`summary-${part.part_number}-${badge.label}`} className="p-2 bg-white border border-slate-200 rounded">
                            <div className="text-[9px] uppercase font-black text-slate-500">{badge.label}</div>
                            <div className="font-mono text-xs font-black">{badge.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                        <button type="button" className="p-2 bg-white border border-slate-200 hover:border-[#004ccd] rounded text-left" onClick={() => openBreakdown(`Part ${part.part_number} Weight Formula`, structuredStepsFor(part, ['net weight', 'gross rm weight']))}>
                          <div className="text-[9px] uppercase font-black text-slate-500">Weight formula</div>
                          <div className="text-xs text-slate-700">View weight calculation</div>
                        </button>
                        <button type="button" className="p-2 bg-white border border-slate-200 hover:border-[#004ccd] rounded text-left" onClick={() => openBreakdown(`Part ${part.part_number} Cost Formula`, structuredStepsFor(part, ['material cost', 'total via laser']))}>
                          <div className="text-[9px] uppercase font-black text-slate-500">Cost formula</div>
                          <div className="text-xs text-slate-700">View material and route cost</div>
                        </button>
                        <button type="button" className="p-2 bg-white border border-slate-200 hover:border-[#004ccd] rounded text-left" onClick={() => openBreakdown(`Part ${part.part_number} Process Formula`, structuredStepsFor(part, ['laser cutting', 'press cutting', 'bending', 'painting']))}>
                          <div className="text-[9px] uppercase font-black text-slate-500">Process formula</div>
                          <div className="text-xs text-slate-700">View cutting, bending, finish</div>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-widest font-black text-[#004ccd]">Part-wise calculated details</div>
                  {estimation.items?.map((item, index) => (
                    <div key={`summary-item-${item.name}-${index}`} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] uppercase font-black text-slate-500">Part {index + 1}</div>
                          <div className="text-sm font-black text-slate-950">{item.name}</div>
                          <div className="text-xs font-mono text-slate-600 mt-1">Qty {item.quantity} / {item.stockForm || '-'}</div>
                        </div>
                        <button type="button" className="font-mono text-sm font-black text-[#004ccd] underline decoration-dotted underline-offset-4" onClick={() => openBreakdown(`${item.name} Cost Formula`, [item.formulas?.material])}>
                          {formatInr(item.materialCost)}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                        <button type="button" className="p-2 bg-white border border-slate-200 hover:border-[#004ccd] rounded text-left" onClick={() => openBreakdown(`${item.name} Weight Formula`, [item.formulas?.weight])}>
                          <div className="text-[9px] uppercase font-black text-slate-500">Weight</div>
                          <div className="font-mono text-xs font-black">{Number(item.weightKg || 0).toFixed(3)} kg</div>
                        </button>
                        <button type="button" className="p-2 bg-white border border-slate-200 hover:border-[#004ccd] rounded text-left" onClick={() => openBreakdown(`${item.name} Material Formula`, [item.formulas?.material])}>
                          <div className="text-[9px] uppercase font-black text-slate-500">Material cost</div>
                          <div className="font-mono text-xs font-black">{formatInr(item.materialCost)}</div>
                        </button>
                        <button type="button" className="p-2 bg-white border border-slate-200 hover:border-[#004ccd] rounded text-left" onClick={() => setSelectedNestingItem(item)}>
                          <div className="text-[9px] uppercase font-black text-slate-500">Nesting</div>
                          <div className="text-xs text-slate-700">View stock cutting visual</div>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 flex justify-between items-center w-full px-6 h-16 bg-white border-b border-[#c3c6d8] shadow-sm">
        <div className="flex items-center gap-8">
          <span 
            className="text-xl font-extrabold text-[#004ccd] tracking-tight flex items-center gap-2 cursor-pointer"
            onClick={() => { setCurrentScreen('landing'); setActiveTab('projects'); }}
          >
            <Scale className="w-6 h-6 text-[#004ccd]" />
            ikarkhana
          </span>
          <nav className="hidden md:flex items-center gap-6">
            <button 
              className={`font-semibold text-xs tracking-wider uppercase pb-1 transition-all ${
                activeTab === 'projects' 
                  ? 'text-[#004ccd] border-b-2 border-[#004ccd]' 
                  : 'text-[#424656] hover:text-[#004ccd]'
              }`}
              onClick={() => { setCurrentScreen('landing'); setActiveTab('projects'); }}
            >
              Projects
            </button>
            <button 
              className={`font-semibold text-xs tracking-wider uppercase pb-1 transition-all ${
                activeTab === 'estimator' 
                  ? 'text-[#004ccd] border-b-2 border-[#004ccd]' 
                  : 'text-[#424656] hover:text-[#004ccd]'
              }`}
              onClick={() => { setCurrentScreen('workspace'); setActiveTab('estimator'); }}
            >
              Estimator
            </button>
            <button 
              className={`font-semibold text-xs tracking-wider uppercase pb-1 transition-all ${
                activeTab === 'inventory' 
                  ? 'text-[#004ccd] border-b-2 border-[#004ccd]' 
                  : 'text-[#424656] hover:text-[#004ccd]'
              }`}
              onClick={() => triggerToast('Inventory tracking dashboard is loaded with current supplier metrics.')}
            >
              Inventory
            </button>
            <button 
              className={`font-semibold text-xs tracking-wider uppercase pb-1 transition-all ${
                activeTab === 'standards' 
                  ? 'text-[#004ccd] border-b-2 border-[#004ccd]' 
                  : 'text-[#424656] hover:text-[#004ccd]'
              }`}
              onClick={() => triggerToast('Material standards list matching ASME Section VIII Division 1 is active.')}
            >
              Standards
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button 
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors text-xs font-semibold border border-slate-300 rounded"
            onClick={() => {
              if (currentScreen === 'landing') {
                handleSelectSample();
              } else {
                setCurrentScreen('landing');
                setActiveTab('projects');
              }
            }}
          >
            {currentScreen === 'landing' ? 'Load Sample Blueprint' : 'Change File'}
          </button>
          <button 
            className="px-4 py-2 bg-[#004ccd] hover:bg-[#0f62fe] text-white transition-colors text-xs font-semibold rounded"
            onClick={handleExport}
          >
            Export Report
          </button>
          <div className="w-8 h-8 rounded-full border border-slate-300 overflow-hidden flex items-center justify-center bg-slate-100">
            <img 
              className="w-full h-full object-cover" 
              src={DEFAULT_AVATAR_URL} 
              alt="User profile" 
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {currentScreen === 'landing' ? (
        /* SCREEN 1: LANDING & FILE INGESTION */
        <main className="flex-grow flex flex-col items-center justify-center p-6 bg-slate-50">
          <div className="w-full max-w-4xl space-y-8 animate-fade-in">
            {/* Header / Intro */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI-Powered Engineering Costing Engine</h1>
              <p className="text-sm text-slate-600 max-w-xl mx-auto">
                Instantly parse complex blueprint technical drawings, extract dimensional values with high-fidelity Gemini models, and generate precise cost forecasts.
              </p>
            </div>

            {/* Custom file drop-zone */}
            <div 
              id="drop-zone"
              className={`relative bg-white border-2 border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center transition-all duration-300 group ${
                dragActive ? 'border-[#004ccd] bg-blue-50/50' : 'border-[#c3c6d8] hover:border-[#004ccd]'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              {/* Technical Upload Icon Container */}
              <div className="w-20 h-20 mb-6 bg-slate-50 rounded-full flex items-center justify-center text-[#004ccd] group-hover:scale-105 transition-transform duration-300 shadow-sm border border-slate-100">
                <Upload className="w-10 h-10 stroke-[1.5]" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Upload Engineering Drawing to Start</h2>
              <p className="text-xs text-[#424656] mb-8 font-medium">
                Supported formats:{' '}
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">TIFF</span>,{' '}
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">PNG</span>,{' '}
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">PDF</span>,{' '}
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">DWG</span>
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm justify-center">
                <button 
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#004ccd] text-white font-semibold text-xs uppercase tracking-wider rounded shadow hover:bg-[#0f62fe] transition-all active:scale-[0.98]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="w-4 h-4" />
                  Select Files
                </button>
                <button 
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-[#c3c6d8] text-slate-800 font-semibold text-xs uppercase tracking-wider rounded hover:bg-slate-50 transition-all active:scale-[0.98]"
                  onClick={handleSelectSample}
                >
                  <CloudDownload className="w-4 h-4 text-slate-600" />
                  Load Blueprint Template
                </button>
              </div>

              {/* Hidden file input */}
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".tif,.tiff,.png,.jpg,.jpeg,.pdf,.dwg"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />

              {batchUploadFiles.length > 0 && (
                <div className="mt-8 w-full max-w-6xl text-left bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-[#004ccd]">Uploaded file batch</div>
                      <div className="text-xs text-slate-600 mt-1">Each uploaded file is listed vertically. Child/detail files for that row are shown horizontally.</div>
                    </div>
                    <span className="text-[10px] uppercase font-black text-slate-500">{batchUploadFiles.length} files staged</span>
                  </div>

                  <div className="space-y-3 max-h-[430px] overflow-y-auto pr-1 custom-scrollbar">
                    <div className="grid grid-cols-[240px_1fr] gap-3 px-1 text-[10px] uppercase font-black text-slate-500">
                      <div>Main / parent file</div>
                      <div className="flex items-center justify-between gap-2">
                        <span>Child / dependency files for that parent</span>
                        <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-[10px] uppercase font-black text-slate-700">
                          Add child files
                          <input
                            type="file"
                            multiple
                            accept=".tif,.tiff,.png,.jpg,.jpeg,.pdf,.dwg"
                            className="hidden"
                            onChange={(event) => {
                              void appendChildFilesToBatch(Array.from(event.target.files || []));
                              event.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {batchUploadFiles.map((file) => {
                      const isSelectedParent = selectedBatchParentName === file.name;
                      const expectedChildren = expectedChildFileHints(file.name);
                      const uploadedExpectedChildren = expectedChildren
                        .map(hint => batchUploadFiles.find(child => child.name !== file.name && fileMatchesHint(child, hint)))
                        .filter(Boolean) as BatchUploadFile[];
                      const missingExpectedChildren = expectedChildren.filter(hint => (
                        !batchUploadFiles.some(child => child.name !== file.name && fileMatchesHint(child, hint))
                      ));
                      const rowChildren = uploadedExpectedChildren;
                      return (
                        <div
                          key={`batch-row-${file.name}`}
                          className={`grid grid-cols-1 md:grid-cols-[240px_1fr] gap-3 p-3 rounded-lg border transition-colors ${
                            isSelectedParent ? 'bg-blue-50/70 border-[#004ccd]' : 'bg-white border-slate-200'
                          }`}
                        >
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="batch-parent-file"
                              checked={isSelectedParent}
                              onChange={() => setSelectedBatchParentName(file.name)}
                            />
                            <div className="min-w-0">
                              <div className={`text-xs font-black truncate ${isSelectedParent ? 'text-[#004ccd]' : 'text-slate-900'}`}>{file.name}</div>
                              <div className="text-[10px] font-mono text-slate-500">{file.sizeMb}</div>
                              {isSelectedParent && (
                                <div className="mt-1 text-[9px] uppercase font-black text-[#004ccd]">selected parent</div>
                              )}
                            </div>
                          </label>

                          <div className="min-w-0">
                            <div className="flex gap-3 overflow-x-auto pb-2">
                              {missingExpectedChildren.map((hint) => (
                                <label
                                  key={`missing-child-${file.name}-${hint}`}
                                  className={`min-w-[250px] p-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                                    isSelectedParent
                                      ? 'bg-red-50 border-red-300 hover:bg-red-100'
                                      : 'bg-red-50/40 border-red-200 opacity-70'
                                  }`}
                                >
                                  <div className="text-[9px] uppercase font-black text-red-700">Missing child file</div>
                                  <div className="text-sm font-black text-red-900 truncate mt-1">{hint}</div>
                                  <div className="text-[10px] text-red-700 mt-1">Click to upload this dependency</div>
                                  <input
                                    type="file"
                                    accept=".tif,.tiff,.png,.jpg,.jpeg,.pdf,.dwg"
                                    className="hidden"
                                    onChange={(event) => {
                                      void appendChildFilesToBatch(Array.from(event.target.files || []));
                                      event.target.value = '';
                                    }}
                                  />
                                </label>
                              ))}
                              {rowChildren.map((child) => (
                                <div
                                  key={`child-for-${file.name}-${child.name}`}
                                  className={`min-w-[250px] p-3 rounded-lg border transition-colors ${
                                    isSelectedParent
                                      ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                                      : 'bg-slate-50 border-slate-200 opacity-60'
                                  }`}
                                >
                                  <div className={`text-[9px] uppercase font-black ${isSelectedParent ? 'text-emerald-700' : 'text-slate-400'}`}>
                                    {isSelectedParent ? 'Uploaded child' : 'Dependency uploaded'}
                                  </div>
                                  <div className="text-sm font-black text-slate-900 truncate mt-1">{child.name || 'Unnamed child file'}</div>
                                  <div className="text-[10px] font-mono text-slate-500 mt-1">{child.sizeMb}</div>
                                </div>
                              ))}
                              {rowChildren.length === 0 && missingExpectedChildren.length === 0 && (
                                <div className="min-w-[250px] p-3 bg-white border border-dashed border-slate-300 rounded-lg text-xs text-slate-500">
                                  No known child/detail dependency for this drawing.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-end border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-black uppercase tracking-wider text-slate-700"
                      onClick={() => {
                        setBatchUploadFiles([]);
                        setSelectedBatchParentName('');
                      }}
                    >
                      Clear batch
                    </button>
                    <button
                      type="button"
                      className="px-5 py-2 bg-[#004ccd] hover:bg-[#0f62fe] text-white rounded text-xs font-black uppercase tracking-wider shadow"
                      onClick={() => void proceedWithUploadedFiles()}
                    >
                      Proceed with uploaded files
                    </button>
                  </div>
                </div>
              )}

              {/* Secure note */}
              <div className="mt-8 flex items-center gap-1.5 text-slate-400 font-semibold text-[10px] uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                Secure Engineering Pipeline v2.4.0
              </div>
            </div>

            {/* Contextual Technical Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 border border-[#c3c6d8]/40 rounded-lg bg-white shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#004ccd]">
                  <Sparkles className="w-5 h-5 text-[#004ccd]" />
                  <span className="font-bold text-xs uppercase tracking-wider">OCR Detection</span>
                </div>
                <p className="text-xs text-[#424656] leading-relaxed">
                  Advanced vision engine for the automatic parsing of drawing title blocks, material requirements, and bill of materials tables.
                </p>
              </div>
              
              <div className="p-5 border border-[#c3c6d8]/40 rounded-lg bg-white shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#004ccd]">
                  <Scale className="w-5 h-5 text-[#004ccd]" />
                  <span className="font-bold text-xs uppercase tracking-wider">Scale Calibration</span>
                </div>
                <p className="text-xs text-[#424656] leading-relaxed">
                  Intelligent DPI auto-scaling ensures high-precision parameter extraction and accurate diameter/thickness calculations.
                </p>
              </div>

              <div className="p-5 border border-[#c3c6d8]/40 rounded-lg bg-white shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#004ccd]">
                  <TrendingUp className="w-5 h-5 text-[#004ccd]" />
                  <span className="font-bold text-xs uppercase tracking-wider">Costing Engine</span>
                </div>
                <p className="text-xs text-[#424656] leading-relaxed">
                  State-of-the-art material rate indexing with up-to-date regional indices matching industrial Standards v2024.
                </p>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* SCREEN 2: WORKSPACE & ESTIMATOR WORKBENCH */
        <div className="flex-grow flex h-[calc(100vh-64px)] overflow-hidden">
          {/* Side Navigation Rail */}
          <aside className="hidden">
            <div className="p-4 border-b border-[#c3c6d8] bg-slate-50">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-[#004ccd]" />
                <span className="font-extrabold text-[#1a1c1c] tracking-tight">Project Alpha</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">V2.4 Revision</p>
            </div>

            <nav className="flex-1 py-4 space-y-1">
              <button 
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-all ${
                  sidebarTab === 'dashboard' ? 'bg-slate-200 text-[#004ccd]' : 'text-slate-600 hover:bg-slate-200/50'
                }`}
                onClick={() => {
                  setSidebarTab('dashboard');
                  triggerToast('Displaying general engineer metric dashboard.');
                }}
              >
                <LayoutDashboard className="w-4 h-4 text-slate-500" />
                Dashboard
              </button>
              <button 
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all border-r-4 ${
                  sidebarTab === 'estimator' ? 'bg-blue-50/50 text-[#004ccd] border-[#004ccd]' : 'text-slate-600 hover:bg-slate-200/50 border-transparent'
                }`}
                onClick={() => setSidebarTab('estimator')}
              >
                <Scale className="w-4 h-4 text-slate-500" />
                Estimator
              </button>
              <button 
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-all ${
                  sidebarTab === 'materials' ? 'bg-slate-200 text-[#004ccd]' : 'text-slate-600 hover:bg-slate-200/50'
                }`}
                onClick={() => {
                  setSidebarTab('materials');
                  triggerToast('Viewing engineering alloys index.');
                }}
              >
                <Layers className="w-4 h-4 text-slate-500" />
                Materials
              </button>
              <button 
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-all ${
                  sidebarTab === 'processes' ? 'bg-slate-200 text-[#004ccd]' : 'text-slate-600 hover:bg-slate-200/50'
                }`}
                onClick={() => {
                  setSidebarTab('processes');
                  triggerToast('Configuring industrial machine operations rates.');
                }}
              >
                <Wrench className="w-4 h-4 text-slate-500" />
                Processes
              </button>
              <button 
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-all ${
                  sidebarTab === 'history' ? 'bg-slate-200 text-[#004ccd]' : 'text-slate-600 hover:bg-slate-200/50'
                }`}
                onClick={() => setSidebarTab('history')}
              >
                <History className="w-4 h-4 text-slate-500" />
                Estimates History
              </button>
            </nav>

            <div className="p-4 border-t border-[#c3c6d8] space-y-1">
              <button 
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/50 rounded transition-all"
                onClick={() => triggerToast('Opening global billing settings.')}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Settings
              </button>
              <button 
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/50 rounded transition-all"
                onClick={() => triggerToast('Direct technical engineer help desk is active.')}
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                Support
              </button>
            </div>
          </aside>

          {/* Sub-tab view renderer */}
          {sidebarTab === 'history' ? (
            /* HISTORY TAB */
            <div className="flex-1 overflow-y-auto p-8 max-w-4xl space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Costing History Log</h2>
                  <p className="text-xs text-slate-500">View recent calculations generated by active engineering workspace drafts.</p>
                </div>
                <button 
                  className="px-4 py-2 bg-[#004ccd] hover:bg-[#0f62fe] text-white text-xs font-bold rounded flex items-center gap-2"
                  onClick={() => setSidebarTab('estimator')}
                >
                  <Plus className="w-4 h-4" /> New Estimate
                </button>
              </div>

              <div className="bg-white border border-[#c3c6d8] rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[#c3c6d8] text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                      <th className="p-4 font-bold">Estimate ID</th>
                      <th className="p-4 font-bold">Part / Diagram Name</th>
                      <th className="p-4 font-bold">Date Computed</th>
                      <th className="p-4 font-bold text-right">Extracted Weight</th>
                      <th className="p-4 font-bold text-right">Computed Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-xs">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/20 transition-all">
                        <td className="p-4 font-semibold text-[#004ccd]">{item.id}</td>
                        <td className="p-4 font-sans text-slate-900 font-medium">{item.partName}</td>
                        <td className="p-4 text-slate-500">{item.date}</td>
                        <td className="p-4 text-right text-slate-700">{item.weight.toFixed(3)} kg</td>
                        <td className="p-4 text-right font-bold text-slate-900">{formatInr(item.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : sidebarTab === 'dashboard' || sidebarTab === 'materials' || sidebarTab === 'processes' ? (
            /* FALLBACK / PLACEHOLDER FOR WORK-IN-PROGRESS SIDEBARS */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-[#004ccd] rounded-full flex items-center justify-center border border-blue-100">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold capitalize text-slate-900">{sidebarTab} Workspace Panel</h3>
                <p className="text-xs text-slate-500 max-w-sm">This secondary section is loaded and synced with current AWS CAD data. Configure properties in your estimator.</p>
              </div>
              <button 
                className="px-4 py-2 bg-[#004ccd] hover:bg-[#0f62fe] text-white text-xs font-bold rounded"
                onClick={() => setSidebarTab('estimator')}
              >
                Return to Active Estimator
              </button>
            </div>
          ) : (
            /* PRIMARY WORKSPACE: ESTIMATOR */
            <div className="flex-1 overflow-hidden grid grid-cols-12 relative">
              {isAnalyzing && (
                <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
                  <style>{`
                    @keyframes fullDocumentScan {
                      0% { transform: translateY(-35%); opacity: 0; }
                      12% { opacity: 1; }
                      88% { opacity: 1; }
                      100% { transform: translateY(530%); opacity: 0; }
                    }
                    @keyframes fullDocumentFloat {
                      0%, 100% { transform: rotateX(4deg) rotateZ(0deg) translateY(0); }
                      50% { transform: rotateX(4deg) rotateZ(0deg) translateY(-8px); }
                    }
                    @keyframes scanPulse {
                      0%, 100% { opacity: 0.45; }
                      50% { opacity: 1; }
                    }
                  `}</style>
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_#1d4ed8_0,_transparent_58%)]"></div>
                  <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,_rgba(255,255,255,0.06)_1px,_transparent_1px),linear-gradient(0deg,_rgba(255,255,255,0.06)_1px,_transparent_1px)] bg-[size:44px_44px]"></div>

                  <div className="relative z-10 w-full max-w-5xl px-8 text-center space-y-8">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400/10 border border-cyan-300/30 text-cyan-100 text-xs font-black uppercase tracking-widest">
                        <Sparkles className="w-4 h-4" />
                        Extracting Drawing Parameters
                      </div>
                      <h2 className="text-2xl font-black text-white">Scanning uploaded engineering document</h2>
                      {scanPreviewPhase === 'reference' && (
                        <p className="text-sm text-cyan-100/80 font-medium">Clean uploaded drawing preview is ready. Extraction is still running in the background.</p>
                      )}
                    </div>

                    <div className="h-[430px] flex items-center justify-center" style={{ perspective: '1100px' }}>
                      <div className="relative w-[90%] max-w-5xl h-[82%]" style={{ transformStyle: 'preserve-3d', animation: 'fullDocumentFloat 3s ease-in-out infinite' }}>
                        <div className="absolute inset-0 bg-white rounded border border-cyan-100 shadow-[0_30px_80px_rgba(34,211,238,0.24)] overflow-hidden">
                          {scanPreviewPhase === 'reference' ? (
                            <img
                              src={filePreview || DEFAULT_IMAGE_URL}
                              alt="Clean uploaded drawing preview while extraction continues"
                              onLoad={handlePreviewImageLoad}
                              className="w-full h-full object-contain opacity-100 bg-white"
                            />
                          ) : filePreview ? (
                            <img
                              src={filePreview}
                              alt="3D scanning preview of uploaded drawing"
                              onLoad={handlePreviewImageLoad}
                              className="w-full h-full object-contain opacity-95"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-wider bg-white">
                              <FileText className="w-12 h-12 text-cyan-500" />
                              <span>Preparing drawing preview</span>
                              <span className="text-[10px] text-slate-400 normal-case">TIFF is being converted for browser preview</span>
                            </div>
                          )}
                          {scanPreviewPhase === 'scan' && (
                            <>
                              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-cyan-300/75 via-cyan-300/20 to-transparent" style={{ animation: 'fullDocumentScan 1.55s linear infinite' }}></div>
                              <div className="absolute inset-x-0 top-0 h-0.5 bg-cyan-200 shadow-[0_0_24px_rgba(103,232,249,1)]" style={{ animation: 'fullDocumentScan 1.55s linear infinite' }}></div>
                            </>
                          )}
                        </div>
                        <div className="absolute -bottom-10 left-14 right-14 h-10 bg-cyan-300/20 blur-2xl rounded-full" style={{ animation: 'scanPulse 2s ease-in-out infinite' }}></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 text-xs font-mono text-cyan-100/80">
                      <span className="truncate max-w-sm">{fileName || 'uploaded diagram'}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse"></span>
                      <span>{scanPreviewPhase === 'scan' ? 'Extracting dimensions, material, features, and costing inputs...' : 'Clean drawing preview displayed. Waiting for extracted tables...'}</span>
                    </div>
                  </div>
                </div>
              )}
              {/* Left Column: Form parameters panel */}
              <section className="col-span-12 xl:col-span-7 bg-white border-r border-[#c3c6d8] flex flex-col h-full overflow-hidden">
                {/* Panel Header */}
                <div className="px-6 py-4 border-b border-[#c3c6d8] bg-slate-50 grid grid-cols-3 items-center gap-4 flex-shrink-0">
                  <div></div>
                  <div className="flex justify-center">
                  <button 
                    className={`flex items-center justify-center gap-2 rounded font-black uppercase tracking-wider transition-all shadow-sm ${
                      isExtractionComplete
                        ? 'px-12 py-5 bg-[#004ccd] hover:bg-[#0f62fe] text-white text-base shadow-xl min-w-[280px]'
                        : 'px-6 py-3 bg-[#0f62fe] hover:bg-blue-700 text-white text-sm min-w-[220px]'
                    }`}
                    onClick={isExtractionComplete ? calculateCost : handleManualExtract}
                    disabled={isAnalyzing || isCalculating || (isExtractionComplete && hasBlockingMissingChildDrawings)}
                  >
                    {isAnalyzing || isCalculating ? (
                      <RefreshCw className={`${isExtractionComplete ? 'w-5 h-5' : 'w-3.5 h-3.5'} animate-spin`} />
                    ) : isExtractionComplete ? (
                      <Calculator className="w-5 h-5" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {isCalculating ? 'Estimating...' : isAnalyzing ? 'Extracting...' : isExtractionComplete ? (estimation ? 'Recalculate Cost' : 'Calculate Cost') : 'Extract From Diagram'}
                  </button>
                  </div>
                  <div className="flex justify-end">
                    {isExtractionComplete && (
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded">
                        Extraction complete
                      </span>
                    )}
                  </div>
                </div>

                {/* Parameters Form fields list */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                  <div className="space-y-3 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[#004ccd]">
                        <Coins className="w-4 h-4 text-[#004ccd]" />
                        <h3 className="font-bold text-xs uppercase tracking-widest text-[#004ccd]">Rates Used For Costing</h3>
                      </div>
                      <span className="text-[10px] uppercase font-black text-[#004ccd] bg-white/80 border border-blue-100 px-2 py-1 rounded">Editable</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Material', key: 'materialRate', unit: 'INR/kg', icon: Coins, accent: 'border-l-[#004ccd]', text: 'text-[#004ccd]' },
                        { label: 'Laser cut rate', key: 'cutRate', unit: 'INR/m', icon: Scissors, accent: 'border-l-sky-600', text: 'text-sky-700' },
                        { label: 'Welding labor', key: 'weldRate', unit: 'INR/m', icon: Flame, accent: 'border-l-amber-600', text: 'text-amber-700' },
                        { label: 'Surface finish', key: 'surfaceRate', unit: 'INR/m2', icon: Layers, accent: 'border-l-indigo-600', text: 'text-indigo-700' },
                        { label: 'Bending', key: 'bendRate', unit: 'INR/bend', icon: RefreshCw, accent: 'border-l-emerald-700', text: 'text-emerald-700' },
                        { label: 'Press cut rate', key: 'pressRate', unit: 'INR/hit', icon: Wrench, accent: 'border-l-violet-700', text: 'text-violet-700' },
                        { label: 'Tacking setup', key: 'tackingFixed', unit: 'INR fixed', icon: Settings, accent: 'border-l-slate-500', text: 'text-slate-700' },
                        { label: 'Scrap value', key: 'scrapRate', unit: 'INR/kg', icon: RefreshCw, accent: 'border-l-slate-500', text: 'text-slate-700' },
                      ].map(({ label, key, unit, icon: RateIcon, accent, text }) => (
                        <div key={label} className={`p-3 bg-slate-50 border border-slate-200 border-l-4 ${accent} rounded-md space-y-2 shadow-sm`}>
                          <div className="flex items-center justify-between gap-2">
                            <label className={`text-[9px] uppercase font-black tracking-wider ${text}`}>{label}</label>
                            <RateIcon className={`w-3.5 h-3.5 ${text} opacity-75`} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-slate-500">Rs</span>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-xs font-black text-slate-900 outline-none focus:border-[#004ccd]"
                              value={String(params[key as keyof TechnicalParams] || '')}
                              onChange={(e) => handleParamChange(key as keyof TechnicalParams, e.target.value)}
                            />
                          </div>
                          <div className="text-[9px] font-mono text-slate-500">{unit}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Change rates after extraction, then click the large Calculate Cost button to refresh totals.
                    </div>
                  </div>

                  {referencedDrawings.length > 0 && (
                    <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 h-8 w-8 rounded bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-4 h-4 text-amber-700" />
                          </div>
                          <div>
                            <h3 className="font-black text-xs uppercase tracking-widest text-amber-900">Referenced Child Drawings</h3>
                            <p className="text-xs text-amber-900/75 mt-1">
                              This drawing references detail files. Upload them for better costing, or continue using only the current drawing.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="px-3 py-2 bg-white hover:bg-amber-100 border border-amber-300 rounded text-[10px] font-black uppercase tracking-wider text-amber-900 transition-colors"
                          onClick={() => {
                            setAllowMissingChildDrawings(true);
                            triggerToast('Missing child drawings will be skipped for this calculation.');
                          }}
                        >
                          Calculate without missing file
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {referencedDrawings.map((drawing) => {
                          const uploadedName = childDrawingUploads[drawing.drawing_number];
                          const isMissing = drawing.required_for_costing !== false && !uploadedName;
                          return (
                            <div key={drawing.drawing_number} className="p-3 bg-white border border-amber-200 rounded-md space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-[10px] uppercase font-bold text-slate-500">Missing / referenced file</div>
                                  <div className="font-mono font-black text-sm text-slate-950">
                                    {drawing.file_name_hint || `${drawing.drawing_number}.tif`}
                                  </div>
                                  <div className="text-[11px] text-slate-600 mt-1">
                                    {drawing.referenced_by_component || drawing.referenced_by_part_number || 'Referenced child detail'}
                                  </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-[9px] uppercase font-black ${isMissing ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
                                  {isMissing ? 'Needed' : 'Attached'}
                                </span>
                              </div>
                              {drawing.reason && (
                                <p className="text-[11px] leading-relaxed text-slate-600">{drawing.reason}</p>
                              )}
                              <div className="flex items-center gap-2">
                                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded bg-[#004ccd] hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider transition-colors">
                                  <Upload className="w-3.5 h-3.5" />
                                  Upload child file
                                  <input
                                    type="file"
                                    accept=".tif,.tiff,.pdf,.png,.jpg,.jpeg"
                                    className="hidden"
                                    onChange={(event) => handleChildDrawingUpload(drawing.drawing_number, event.target.files?.[0])}
                                  />
                                </label>
                                {uploadedName && (
                                  <span className="text-[11px] text-emerald-700 font-semibold truncate">{uploadedName}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {hasBlockingMissingChildDrawings && (
                        <div className="text-[11px] text-amber-900 bg-amber-100/70 border border-amber-200 rounded px-3 py-2">
                          Cost calculation is paused until you upload the missing child file or click “Calculate without missing file”.
                        </div>
                      )}
                      {allowMissingChildDrawings && missingReferencedDrawings.length > 0 && (
                        <div className="text-[11px] text-slate-600 bg-white border border-amber-200 rounded px-3 py-2">
                          Continuing without: {missingReferencedDrawings.map((drawing) => drawing.file_name_hint || `${drawing.drawing_number}.tif`).join(', ')}.
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECTION 1: PART INFORMATION */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#004ccd]">
                      <Info className="w-4 h-4 text-[#004ccd]" />
                      <h3 className="font-bold text-xs uppercase tracking-widest text-[#004ccd]">Part Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Part Name</label>
                        <input 
                          type="text"
                          className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-[#c3c6d8] px-3 py-2 text-xs font-medium rounded outline-none focus:border-[#004ccd] transition-all"
                          placeholder="Extracting draft..."
                          value={params.partName}
                          onChange={(e) => handleParamChange('partName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Raw Material</label>
                        <select
                          className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-[#c3c6d8] px-3 py-2 text-xs font-medium rounded outline-none focus:border-[#004ccd] transition-all"
                          value={params.rawMaterialType}
                          onChange={(e) => {
                            const nextType = e.target.value;
                            const defaultRates: Record<string, string> = { ms: '60', ss: '240', aluminium: '200', copper: '900' };
                            setParams(prev => ({ ...prev, rawMaterialType: nextType, materialRate: defaultRates[nextType] || prev.materialRate }));
                          }}
                        >
                          <option value="ms">Mild Steel</option>
                          <option value="ss">Stainless Steel</option>
                          <option value="aluminium">Aluminium</option>
                          <option value="copper">Copper</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Material Code</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-[#c3c6d8] px-3 py-2 text-xs font-medium rounded outline-none focus:border-[#004ccd] transition-all"
                          placeholder="e.g. C-K201, IS2062, 6061"
                          value={params.rawMaterialCode}
                          onChange={(e) => handleParamChange('rawMaterialCode', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Material Rate (INR/kg)</label>
                        <input 
                          type="number"
                          step="0.01"
                          className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-[#c3c6d8] px-3 py-2 text-xs font-medium rounded outline-none focus:border-[#004ccd] transition-all font-mono"
                          placeholder="Rate in INR"
                          value={params.materialRate}
                          onChange={(e) => handleParamChange('materialRate', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200"></div>

                  {/* SECTION 2: MAIN PROFILE / ROD */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#004ccd]">
                      <Scale className="w-4 h-4 text-[#004ccd]" />
                      <h3 className="font-bold text-xs uppercase tracking-widest text-[#004ccd]">Square Tube / Main Profile</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Material Form</label>
                        <select 
                          className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-[#c3c6d8] px-3 py-2 text-xs font-medium rounded outline-none focus:border-[#004ccd] transition-all"
                          value={params.materialForm}
                          onChange={(e) => handleParamChange('materialForm', e.target.value)}
                        >
                          <option value="Select...">Select...</option>
                          <option value="Round Rod">Round Rod</option>
                          <option value="Square Bar">Square Bar</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shape Profile</label>
                        <input 
                          type="text"
                          className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-[#c3c6d8] px-3 py-2 text-xs font-medium rounded outline-none focus:border-[#004ccd] transition-all"
                          placeholder="e.g. Collar"
                          value={params.shape}
                          onChange={(e) => handleParamChange('shape', e.target.value)}
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="inline-flex items-center cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-[#004ccd] border-[#c3c6d8] rounded transition-all focus:ring-0 focus:ring-offset-0"
                            checked={params.isHollow}
                            onChange={(e) => handleParamChange('isHollow', e.target.checked)}
                          />
                          <span className="ml-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider">Is Hollow</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                      <div className="space-y-1">
                        <label className="text-xs font-sans font-semibold text-slate-500 uppercase tracking-wider">Length mm</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-50 border border-[#c3c6d8] px-3 py-2 rounded focus:bg-white outline-none focus:border-[#004ccd] transition-all"
                          placeholder="-"
                          value={params.length}
                          onChange={(e) => handleParamChange('length', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-sans font-semibold text-slate-500 uppercase tracking-wider">Outer / Diameter mm</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-50 border border-[#c3c6d8] px-3 py-2 rounded focus:bg-white outline-none focus:border-[#004ccd] transition-all"
                          placeholder="-"
                          value={params.diameter}
                          onChange={(e) => handleParamChange('diameter', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-sans font-semibold text-slate-500 uppercase tracking-wider">Thickness mm</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-50 border border-[#c3c6d8] px-3 py-2 rounded focus:bg-white outline-none focus:border-[#004ccd] transition-all"
                          placeholder="-"
                          disabled={!params.isHollow}
                          value={params.thickness}
                          onChange={(e) => handleParamChange('thickness', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-sans font-semibold text-slate-500 uppercase tracking-wider">Qty</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-50 border border-[#c3c6d8] px-3 py-2 rounded focus:bg-white outline-none focus:border-[#004ccd] transition-all"
                          value={params.qty}
                          onChange={(e) => handleParamChange('qty', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200"></div>

                  {/* SECTION 3: PLATES (TOP/BOTTOM) */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#004ccd]">
                      <Layers className="w-4 h-4 text-[#004ccd]" />
                      <h3 className="font-bold text-xs uppercase tracking-widest text-[#004ccd]">Plates (Top/Bottom)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Top Plate */}
                      <div className="p-4 bg-slate-50 border border-[#c3c6d8]/60 rounded space-y-3">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Top Plate
                        </span>
                        <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] font-sans font-semibold text-slate-400">Length (mm)</span>
                            <input 
                              type="number"
                              className="w-full bg-white border border-[#c3c6d8] px-2 py-1.5 rounded outline-none focus:border-[#004ccd] text-center"
                              placeholder="L"
                              value={params.topPlate.length}
                              onChange={(e) => handlePlateChange('topPlate', 'length', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-sans font-semibold text-slate-400">Width (mm)</span>
                            <input 
                              type="number"
                              className="w-full bg-white border border-[#c3c6d8] px-2 py-1.5 rounded outline-none focus:border-[#004ccd] text-center"
                              placeholder="W"
                              value={params.topPlate.width}
                              onChange={(e) => handlePlateChange('topPlate', 'width', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-sans font-semibold text-slate-400">Thick (mm)</span>
                            <input 
                              type="number"
                              className="w-full bg-white border border-[#c3c6d8] px-2 py-1.5 rounded outline-none focus:border-[#004ccd] text-center"
                              placeholder="T"
                              value={params.topPlate.thickness}
                              onChange={(e) => handlePlateChange('topPlate', 'thickness', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bottom Plate */}
                      <div className="p-4 bg-slate-50 border border-[#c3c6d8]/60 rounded space-y-3">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          Bottom Plate
                        </span>
                        <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] font-sans font-semibold text-slate-400">Length (mm)</span>
                            <input 
                              type="number"
                              className="w-full bg-white border border-[#c3c6d8] px-2 py-1.5 rounded outline-none focus:border-[#004ccd] text-center"
                              placeholder="L"
                              value={params.bottomPlate.length}
                              onChange={(e) => handlePlateChange('bottomPlate', 'length', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-sans font-semibold text-slate-400">Width (mm)</span>
                            <input 
                              type="number"
                              className="w-full bg-white border border-[#c3c6d8] px-2 py-1.5 rounded outline-none focus:border-[#004ccd] text-center"
                              placeholder="W"
                              value={params.bottomPlate.width}
                              onChange={(e) => handlePlateChange('bottomPlate', 'width', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-sans font-semibold text-slate-400">Thick (mm)</span>
                            <input 
                              type="number"
                              className="w-full bg-white border border-[#c3c6d8] px-2 py-1.5 rounded outline-none focus:border-[#004ccd] text-center"
                              placeholder="T"
                              value={params.bottomPlate.thickness}
                              onChange={(e) => handlePlateChange('bottomPlate', 'thickness', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200"></div>

                  {/* SECTION 4: HANDLE, SCREWS, AND CHAIR ANGLE */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#004ccd]">
                      <Settings className="w-4 h-4 text-[#004ccd]" />
                      <h3 className="font-bold text-xs uppercase tracking-widest text-[#004ccd]">Handle & Screwing Pieces</h3>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                      {[
                        {
                          title: 'Handle tube',
                          subtitle: 'Outer diameter, wall thickness, and cut length',
                          icon: Wrench,
                          tone: 'bg-white border-slate-200 text-slate-800 border-l-4 border-l-sky-600',
                          iconTone: 'text-sky-700 bg-sky-50 border-sky-100',
                          fields: [
                            ['OD mm', 'handleOd'],
                            ['Wall mm', 'handleThickness'],
                            ['Length mm', 'handleLength'],
                          ],
                        },
                        {
                          title: 'Chair angle / bracket',
                          subtitle: 'Section weight and profile length',
                          icon: Scale,
                          tone: 'bg-white border-slate-200 text-slate-800 border-l-4 border-l-indigo-600',
                          iconTone: 'text-indigo-700 bg-indigo-50 border-indigo-100',
                          fields: [
                            ['Kg per meter', 'angleWeightPerM'],
                            ['Length mm', 'angleLength'],
                          ],
                        },
                        {
                          title: 'Screwing pieces',
                          subtitle: 'Diameter, length, and quantity',
                          icon: Settings,
                          tone: 'bg-white border-slate-200 text-slate-800 border-l-4 border-l-violet-700',
                          iconTone: 'text-violet-700 bg-violet-50 border-violet-100',
                          fields: [
                            ['Dia mm', 'screwDia'],
                            ['Length mm', 'screwLength'],
                            ['Qty pcs', 'screwQty'],
                          ],
                        },
                      ].map(({ title, subtitle, icon: PanelIcon, tone, iconTone, fields }) => (
                        <div key={title} className={`rounded-lg border p-4 shadow-sm ${tone}`}>
                          <div className="flex items-start gap-3 mb-4">
                            <div className={`w-9 h-9 rounded-md border flex items-center justify-center flex-shrink-0 ${iconTone}`}>
                              <PanelIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-black uppercase tracking-wider text-slate-900">{title}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{subtitle}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3 font-mono text-xs">
                            {fields.map(([label, key]) => (
                              <div className="space-y-1" key={key}>
                                <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500">{label}</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-md focus:bg-white outline-none focus:border-[#004ccd] transition-all text-slate-900"
                                  placeholder="-"
                                  value={String(params[key as keyof TechnicalParams] || '')}
                                  onChange={(e) => handleParamChange(key as keyof TechnicalParams, e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 5: PROCESS DEFINITION */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#004ccd]">
                      <Wrench className="w-4 h-4 text-[#004ccd]" />
                      <h3 className="font-bold text-xs uppercase tracking-widest text-[#004ccd]">Process Definition</h3>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {[
                        {
                          title: 'Cutting & pressing',
                          subtitle: 'Laser length, cut surfaces, and press hits',
                          icon: Scissors,
                          tone: 'bg-white border-slate-200 text-slate-800 border-l-4 border-l-[#004ccd]',
                          iconTone: 'text-[#004ccd] bg-blue-50 border-blue-100',
                          fields: [
                            ['Total cut length mm', 'cuttingLength'],
                            ['Cut surfaces', 'cuttingSurfaceCount'],
                            ['Laser cut INR/m', 'cutRate'],
                            ['Press hits', 'pressHits'],
                            ['Press cut INR/hit', 'pressRate'],
                          ],
                        },
                        {
                          title: 'Joining & finishing',
                          subtitle: 'Welding, bending, and surface treatment',
                          icon: Flame,
                          tone: 'bg-white border-slate-200 text-slate-800 border-l-4 border-l-emerald-700',
                          iconTone: 'text-emerald-700 bg-emerald-50 border-emerald-100',
                          fields: [
                            ['Weld length mm', 'weldLength'],
                            ['Weld labor INR/m', 'weldRate'],
                            ['Surface INR/m2', 'surfaceRate'],
                            ['Bend count', 'bendCount'],
                            ['Bend INR/stroke', 'bendRate'],
                          ],
                        },
                      ].map(({ title, subtitle, icon: PanelIcon, tone, iconTone, fields }) => (
                        <div key={title} className={`rounded-lg border p-4 shadow-sm ${tone}`}>
                          <div className="flex items-start gap-3 mb-4">
                            <div className={`w-9 h-9 rounded-md border flex items-center justify-center flex-shrink-0 ${iconTone}`}>
                              <PanelIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-black uppercase tracking-wider text-slate-900">{title}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{subtitle}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                            {fields.map(([label, key]) => (
                              <div className="space-y-1" key={key}>
                                <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500">{label}</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-md focus:bg-white outline-none focus:border-[#004ccd] transition-all text-slate-900"
                                  placeholder="-"
                                  value={String(params[key as keyof TechnicalParams] || '')}
                                  onChange={(e) => handleParamChange(key as keyof TechnicalParams, e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { id: 'Cutting', label: 'Laser Cutting', rate: params.cutRate, unit: 'INR/m', icon: Scissors },
                        { id: 'Welding', label: 'Welding', rate: params.weldRate, unit: 'INR/m', icon: Flame },
                        { id: 'Surface', label: 'Surface', rate: params.surfaceRate, unit: 'INR/m2', icon: Layers },
                        { id: 'Bending', label: 'Bending', rate: params.bendRate, unit: 'INR/bend', icon: RefreshCw },
                        { id: 'Press', label: 'Press / Punching', rate: params.pressRate, unit: 'INR/hit', icon: Wrench }
                      ].map((proc) => {
                        const Icon = proc.icon;
                        const isSelected = params.processes.includes(proc.id);
                        return (
                          <button
                            key={proc.id}
                            type="button"
                            className={`flex flex-col items-center justify-center gap-2 p-3 border rounded-md cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                            }`}
                            onClick={() => handleProcessToggle(proc.id)}
                          >
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                            <span className="text-[11px] font-black uppercase tracking-wide text-center">{proc.label}</span>
                            <span className={`px-2 py-1 rounded border font-mono text-[10px] font-black ${
                              isSelected ? 'bg-white/10 border-white/15 text-white' : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}>
                              Rs {proc.rate || 0} / {proc.unit.replace('INR/', '')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* Right Column: Estimation Results */}
              <section className="col-span-12 xl:col-span-5 bg-slate-100 flex flex-col h-full overflow-hidden p-6 gap-6 relative">
                <button
                  type="button"
                  className="absolute top-6 right-6 z-10 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow"
                  onClick={() => setIsPreviewOpen(true)}
                  title="Open diagram preview"
                >
                  <FileText className="w-4 h-4" />
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Diagram Preview Drawer */}
                {isPreviewOpen && (
                <div className="absolute inset-6 z-30 bg-white border border-[#c3c6d8] rounded-xl flex flex-col overflow-hidden shadow-2xl">
                  <div className="px-4 py-3 border-b border-[#c3c6d8] bg-slate-50 flex justify-between items-center flex-shrink-0">
                    <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-slate-900">
                      <FileText className="w-4 h-4 text-[#004ccd]" />
                      Diagram Preview
                    </span>
                    <div className="flex gap-2">
                      <button
                        className="p-1.5 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded transition-all"
                        onClick={() => setIsPreviewOpen(false)}
                        title="Back to estimate"
                      >
                        <ArrowRight className="w-4 h-4 rotate-180" />
                      </button>
                      <button 
                        className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded transition-all"
                        onClick={() => setZoomLevel(prev => Math.min(prev + 15, 175))}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded transition-all"
                        onClick={() => setZoomLevel(prev => Math.max(prev - 15, 50))}
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 relative bg-slate-900 group overflow-hidden flex items-center justify-center">
                    {filePreview ? (
                      <button
                        type="button"
                        className="relative w-[92%] max-h-[88%] bg-white rounded border border-slate-700 overflow-hidden cursor-zoom-in shadow-xl"
                        style={{ transform: `scale(${zoomLevel / 100})`, aspectRatio: previewAspectRatio }}
                        onClick={() => {
                          setSelectedPartPreview(null);
                          setIsPreviewFullscreen(true);
                        }}
                        title="Open fullscreen drawing preview"
                      >
                        <img
                          className="absolute inset-0 w-full h-full object-fill opacity-95"
                          src={filePreview}
                          onLoad={handlePreviewImageLoad}
                          alt="Technical drawing blueprint"
                        />
                        <div className="absolute inset-0">
                          {renderPartRegionAnnotations(true)}
                        </div>
                        <div className="absolute right-3 top-3 bg-slate-950/85 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Maximize2 className="w-3 h-3" />
                          Fullscreen
                        </div>
                      </button>
                    ) : (
                      <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Preparing preview...</div>
                    )}
                    <div className="absolute inset-0 border-2 border-[#004ccd]/10 pointer-events-none"></div>

                    {/* Technical details badge */}
                    {fileName && (
                      <div className="absolute bottom-3 left-3 bg-slate-950/85 text-slate-300 px-3 py-1.5 rounded text-[10px] font-mono shadow border border-slate-800 space-y-0.5">
                        <div className="font-bold text-slate-100">{fileName}</div>
                        <div>File Size: {fileSize}</div>
                        {apiSource && (
                          <div className="text-emerald-400 font-bold flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Parsed by {apiSource === 'gemini_api' ? 'Gemini AI Pro' : 'Engine Parser'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                )}

                {isPreviewFullscreen && (
                  <div className="fixed inset-0 z-[120] bg-slate-950/95 flex flex-col">
                    <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-white text-sm font-black uppercase tracking-wider truncate">
                          {selectedPartPreview
                            ? `Part ${selectedPartPreview.part_number}: ${selectedPartPreview.component_name || selectedPartPreview.tube_type || selectedPartPreview.component_type}`
                            : selectedReferencePreview
                              ? selectedReferencePreview
                            : (fileName || 'Drawing preview')}
                        </div>
                        <div className="text-slate-400 text-xs">
                          {selectedPartPreview
                            ? 'Showing selected part crop. Click X to return.'
                            : selectedReferencePreview
                              ? 'Showing reference part image. Click X to return.'
                              : 'Extracted parts are marked in red. Click X to return.'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="p-2 rounded bg-white/10 hover:bg-white/15 text-white"
                          onClick={() => setZoomLevel(prev => Math.max(prev - 15, 50))}
                          title="Zoom out"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded bg-white/10 hover:bg-white/15 text-white"
                          onClick={() => setZoomLevel(prev => Math.min(prev + 15, 200))}
                          title="Zoom in"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => {
                            setIsPreviewFullscreen(false);
                            setSelectedPartPreview(null);
                            setSelectedReferencePreview(null);
                            setSelectedReferencePart(null);
                          }}
                          title="Close fullscreen preview"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 p-5 flex items-center justify-center overflow-auto">
                      {selectedPartPreview ? (
                        <div
                          className="relative bg-white border border-slate-700 shadow-2xl overflow-hidden"
                          style={{
                            width: 'min(92vw, 980px)',
                            height: 'min(78vh, 680px)',
                            transform: `scale(${zoomLevel / 100})`,
                            transformOrigin: 'center',
                          }}
                        >
                          {hasPartImageRegion(selectedPartPreview) ? (
                            <img
                              src={filePreview || DEFAULT_IMAGE_URL}
                              alt={`Fullscreen crop for part ${selectedPartPreview.part_number}`}
                              onLoad={handlePreviewImageLoad}
                              style={partCropImageStyle(selectedPartPreview)}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm font-bold">
                              No verified drawing crop is available for this part.
                            </div>
                          )}
                          <div className="absolute left-4 top-4 bg-slate-950/85 text-white px-3 py-2 rounded text-xs font-black uppercase tracking-wider">
                            Selected Part Crop
                          </div>
                          {renderPartImageActions(selectedPartPreview, false)}
                        </div>
                      ) : selectedReferencePreview ? (
                        <div
                          className="relative bg-white border border-slate-700 shadow-2xl overflow-hidden"
                          style={{
                            width: 'min(92vw, 1120px)',
                            height: 'min(78vh, 720px)',
                            transform: `scale(${zoomLevel / 100})`,
                            transformOrigin: 'center',
                          }}
                        >
                          <img
                            src={partReferenceImageUrl(selectedReferencePart)}
                            alt="Reference image of pillar assembly parts"
                            className="absolute inset-0 w-full h-full object-contain bg-white"
                          />
                          <div className="absolute left-4 top-4 bg-slate-950/85 text-white px-3 py-2 rounded text-xs font-black uppercase tracking-wider">
                            Reference Part Image
                          </div>
                        </div>
                      ) : (
                        <div
                          className="relative bg-white border border-slate-700 shadow-2xl"
                          style={{
                            width: `min(96vw, ${82 * previewAspectRatio}vh, 1400px)`,
                            aspectRatio: previewAspectRatio,
                            transform: `scale(${zoomLevel / 100})`,
                            transformOrigin: 'center',
                          }}
                        >
                          <img
                            src={filePreview || DEFAULT_IMAGE_URL}
                            alt="Fullscreen technical drawing preview"
                            onLoad={handlePreviewImageLoad}
                            className="absolute inset-0 w-full h-full object-fill"
                          />
                          <div className="absolute inset-0">
                            {renderPartRegionAnnotations(false)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 1. 3D document scan preview while extraction is running */}
                {!isExtractionComplete && (
                  <div className="bg-white border border-[#c3c6d8] rounded-xl shadow-sm flex-shrink-0 overflow-hidden">
                    <style>{`
                      @keyframes documentScan {
                        0% { transform: translateY(-20%); opacity: 0; }
                        15% { opacity: 1; }
                        85% { opacity: 1; }
                        100% { transform: translateY(420%); opacity: 0; }
                      }
                    @keyframes documentFloat {
                        0%, 100% { transform: rotateX(4deg) rotateZ(0deg) translateY(0); }
                        50% { transform: rotateX(4deg) rotateZ(0deg) translateY(-5px); }
                      }
                    `}</style>
                    <div className="px-4 py-3 border-b border-[#c3c6d8] bg-slate-50 flex items-center justify-between">
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#004ccd]" />
                        Document Extraction Preview
                      </span>
                      <span className="text-[10px] uppercase font-bold text-[#004ccd]">
                        {isAnalyzing ? 'scanning' : 'waiting'}
                      </span>
                    </div>
                    <div className="h-72 bg-slate-950 relative overflow-hidden flex items-center justify-center" style={{ perspective: '900px' }}>
                      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_#1d4ed8_0,_transparent_55%)]"></div>
                      <div className="relative w-[88%] h-[78%]" style={{ transformStyle: 'preserve-3d', animation: isAnalyzing ? 'documentFloat 3s ease-in-out infinite' : undefined }}>
                        <div className="absolute inset-0 bg-white rounded border border-blue-200 shadow-2xl overflow-hidden">
                          {scanPreviewPhase === 'reference' ? (
                            <img
                              src={filePreview || DEFAULT_IMAGE_URL}
                              alt="Clean uploaded drawing preview"
                              onLoad={handlePreviewImageLoad}
                              className="w-full h-full object-contain opacity-100 bg-white"
                            />
                          ) : filePreview ? (
                            <img
                              src={filePreview}
                              alt="Uploaded engineering drawing in 3D scan preview"
                              onLoad={handlePreviewImageLoad}
                              className="w-full h-full object-contain opacity-90"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Upload diagram
                            </div>
                          )}
                          {isAnalyzing && scanPreviewPhase === 'scan' && (
                            <>
                              <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-cyan-300/70 via-cyan-300/20 to-transparent" style={{ animation: 'documentScan 1.6s linear infinite' }}></div>
                              <div className="absolute inset-x-0 top-0 h-0.5 bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" style={{ animation: 'documentScan 1.6s linear infinite' }}></div>
                            </>
                          )}
                        </div>
                        <div className="absolute -bottom-8 left-10 right-10 h-8 bg-blue-500/20 blur-xl rounded-full"></div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[10px] font-mono text-cyan-100">
                        <span>{fileName || 'No file selected'}</span>
                        <span>{isAnalyzing ? (scanPreviewPhase === 'scan' ? 'Extracting dimensions...' : 'Clean preview ready...') : 'Click Extract From Diagram'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Cost Estimation Results View */}
                <div className="flex-1 min-h-0 bg-white border border-[#c3c6d8] rounded-xl flex flex-col overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-[#c3c6d8] bg-slate-50 flex items-center justify-between gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-[#004ccd]" />
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-900">Estimation breakdown</span>
                    </div>
                    {isExtractionComplete && (
                      <div className="flex items-center gap-2">
                        {estimation && (
                          <button
                            type="button"
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                            onClick={() => setIsPartSummaryOpen(true)}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Part Summary
                          </button>
                        )}
                        <button
                          type="button"
                          className="px-3 py-1.5 bg-white hover:bg-[#004ccd] border border-[#004ccd]/30 hover:border-[#004ccd] text-[#004ccd] hover:text-white rounded text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 disabled:opacity-60"
                          onClick={calculateCost}
                          disabled={isCalculating || hasBlockingMissingChildDrawings}
                        >
                          {isCalculating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
                          {estimation ? 'Recalculate' : 'Calculate'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    {estimation ? (
                      /* ACTIVE ESTIMATION DETAILS */
                      <div className="space-y-5 animate-fade-in text-xs font-sans">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Extracted Unit Weight</span>
                            <button
                              type="button"
                              className="text-xl font-black text-slate-900 font-mono text-left hover:text-[#004ccd]"
                              onClick={() => openBreakdown('Total Weight', estimation.items?.map(item => item.formulas?.weight) || [])}
                            >
                              {estimation.summary.unitWeightKg} <span className="text-xs font-normal text-slate-500">kg</span>
                            </button>
                          </div>
                          <div className="p-3 bg-blue-50/50 rounded border border-blue-100/50 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-[#004ccd]">Total Project Cost</span>
                            <button
                              type="button"
                              className="text-xl font-black text-[#004ccd] font-mono text-left hover:text-blue-800"
                              onClick={() => openBreakdown('Total Project Cost', [findCalculationStep('Material cost'), findCalculationStep('Total estimated cost')])}
                            >
                              {formatInr(estimation.summary.totalCost)}
                            </button>
                          </div>
                        </div>

                        {estimation.likelyUse && (
                          <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Likely Use</span>
                            <p className="text-xs text-slate-600 leading-relaxed">{estimation.likelyUse}</p>
                          </div>
                        )}

                        {(estimation.materialSummary || estimation.stockSummary) && (
                          <div className="grid grid-cols-2 gap-4">
                            {estimation.materialSummary && (
                              <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Material</span>
                                <div className="text-sm font-black text-slate-900">{estimation.materialSummary.materialLabel}</div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {estimation.materialSummary.materialCode || params.rawMaterialCode || 'No code'} @ {formatInr(estimation.materialSummary.ratePerKg)}/kg
                                </div>
                              </div>
                            )}
                            {estimation.stockSummary && (
                              <button
                                type="button"
                                className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1 text-left hover:border-[#004ccd] hover:bg-blue-50/40 transition-colors"
                                onClick={() => openBreakdown('Allocated Scrap / Offcut', allocatedScrapBreakdownSteps())}
                              >
                                <span className="text-[10px] uppercase font-bold text-slate-400">Allocated Scrap / Offcut</span>
                                <div className="text-sm font-black text-slate-900 underline decoration-dotted underline-offset-4">{displayedScrapWeightKg.toFixed(3)} kg</div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {formatInr(displayedScrapValue)} @ Rs {displayedScrapRate}/kg
                                </div>
                                {structuredScrapWeightKg !== null && (
                                  <div className="text-[10px] text-slate-400">from part-wise structured breakdown</div>
                                )}
                                <div className="text-[10px] text-[#004ccd] font-bold uppercase tracking-wider">View breakdown</div>
                              </button>
                            )}
                          </div>
                        )}

                        {(estimation.structuredBreakdown || estimation.structuredError) && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Structured JSON Breakdown</h5>
                              {estimation.structuredBreakdown && (
                                <span className="text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-bold uppercase">
                                  {estimation.structuredBreakdown.currency || 'INR'}
                                </span>
                              )}
                            </div>

                            {estimation.structuredError && (
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 leading-relaxed">
                                {estimation.structuredError}
                              </div>
                            )}

                            {estimation.structuredBreakdown && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="p-3 bg-blue-50/60 rounded border border-blue-100 space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-[#004ccd]">Grand Total via Laser</span>
                                    <button
                                      type="button"
                                      className="text-lg font-black text-[#004ccd] font-mono text-left hover:text-blue-800"
                                      onClick={() => openBreakdown('Structured Laser Total', estimation.structuredBreakdown?.per_part_breakdown.flatMap(part => mapStructuredSteps(part.calculation_steps)) || [])}
                                    >
                                      {formatInr(estimation.structuredBreakdown.assembly_level_fabrication.grand_total_assembly_cost_via_laser)}
                                    </button>
                                  </div>
                                  <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Grand Total via Machine</span>
                                    <button
                                      type="button"
                                      className="text-lg font-black text-slate-900 font-mono text-left hover:text-[#004ccd]"
                                      onClick={() => openBreakdown('Structured Machine Total', estimation.structuredBreakdown?.per_part_breakdown.flatMap(part => mapStructuredSteps(part.calculation_steps)) || [])}
                                    >
                                      {formatInr(estimation.structuredBreakdown.assembly_level_fabrication.grand_total_assembly_cost_via_machine)}
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Part Wise Cards</h5>
                                  {estimation.structuredBreakdown.per_part_breakdown.map((part, idx) => (
                                    <details key={`${part.part_number}-${idx}`} open={idx === 0} className="group border border-slate-200 rounded bg-white overflow-hidden">
                                      <summary className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 cursor-pointer list-none">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <button
                                            type="button"
                                            className="w-24 h-16 rounded border border-slate-200 bg-white overflow-hidden flex-shrink-0 relative cursor-zoom-in"
                                            onClick={(event) => {
                                              event.preventDefault();
                                              setSelectedPartPreview(part);
                                              setIsPreviewFullscreen(true);
                                            }}
                                            title="Open selected part crop"
                                          >
                                            {hasPartImageRegion(part) ? (
                                              <img
                                                src={filePreview || DEFAULT_IMAGE_URL}
                                                alt={`Part ${part.part_number} source drawing crop`}
                                                style={partCropImageStyle(part)}
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400 text-center px-1">
                                                No drawing crop
                                              </div>
                                            )}
                                          </button>
                                          <div className="min-w-0">
                                            <div className="text-[10px] uppercase font-bold text-slate-400">Part {part.part_number}</div>
                                            <div className="text-sm font-black text-slate-900 truncate">{part.component_name || part.tube_type || part.component_type}</div>
                                            <div className="text-[11px] text-slate-500 font-mono truncate">
                                              {part.component_type} / {part.tube_type || 'NA'} / Qty {part.per_set_qty}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right flex items-center gap-3 flex-shrink-0">
                                          <div>
                                          <div className="text-[10px] uppercase font-bold text-[#004ccd]">Set Total Laser</div>
                                          <div className="text-sm font-black text-[#004ccd] font-mono">
                                            {formatInr(part.calculated_costs.total_combined_set_cost_via_laser)}
                                          </div>
                                          </div>
                                          <ChevronRight className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-90" />
                                        </div>
                                      </summary>

                                      <div className="p-3 space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div className="p-2 bg-slate-950 rounded border border-slate-800">
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                              <div className="text-[9px] uppercase font-bold text-slate-400">Diagram crop</div>
                                              <div className="text-[9px] font-mono text-slate-500">{partImageRegionLabel(part)}</div>
                                            </div>
                                            <div className="h-56 w-full bg-white rounded overflow-hidden border border-slate-700 relative block">
                                              {hasPartImageRegion(part) ? (
                                                <img
                                                  src={filePreview || DEFAULT_IMAGE_URL}
                                                  alt={`Part ${part.part_number} drawing crop`}
                                                  style={partCropImageStyle(part)}
                                                />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-500 text-center px-4">
                                                  Specific drawing/detail region is not available. BOM/table rows are ignored because they are not real part images.
                                                </div>
                                              )}
                                              <button
                                                type="button"
                                                className="absolute top-2 right-2 bg-slate-950/80 text-white px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-slate-800"
                                                onClick={() => {
                                                  setSelectedPartPreview(part);
                                                  setSelectedReferencePreview(null);
                                                  setIsPreviewFullscreen(true);
                                                }}
                                                title="Open selected part crop"
                                              >
                                                <Maximize2 className="w-3 h-3" />
                                                Open crop
                                              </button>
                                              {renderPartImageActions(part, true)}
                                            </div>
                                          </div>
                                          <div className="p-2 bg-slate-950 rounded border border-slate-800">
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                              <div className="text-[9px] uppercase font-bold text-slate-400">Reference part image</div>
                                              <div className="text-[9px] font-mono text-slate-500">visual reference</div>
                                            </div>
                                            <button
                                              type="button"
                                              className="h-56 w-full bg-white rounded overflow-hidden border border-slate-700 relative block cursor-zoom-in"
                                              onClick={() => {
                                                setSelectedPartPreview(null);
                                                setSelectedReferencePart(part);
                                                setSelectedReferencePreview(`Part ${part.part_number}: Reference Image`);
                                                setIsPreviewFullscreen(true);
                                              }}
                                              title="Open reference part image"
                                            >
                                              <img
                                                src={partReferenceImageUrl(part)}
                                                alt={`Reference image for part ${part.part_number}`}
                                                className="absolute inset-0 w-full h-full object-contain bg-white"
                                              />
                                              <div className="absolute top-2 right-2 bg-slate-950/80 text-white px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                <Maximize2 className="w-3 h-3" />
                                                Open image
                                              </div>
                                            </button>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Dimensions</div>
                                            <div className="font-mono text-xs text-slate-800">{structuredDimensions(part)} mm</div>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Material</div>
                                            <div className="font-mono text-xs text-slate-800">{part.material_type || '-'} {part.material_code ? `(${part.material_code})` : ''}</div>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Surface Area</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-slate-800`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Surface Area`, structuredStepsFor(part, ['surface area']))}
                                            >
                                              {part.surface_area_sq_meter.toFixed(4)} m2
                                            </button>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Bends</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-slate-800`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Bending`, structuredStepsFor(part, ['bending']))}
                                            >
                                              {part.bends_per_part}
                                            </button>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="p-2 bg-emerald-50/60 rounded border border-emerald-100">
                                            <div className="text-[9px] uppercase font-bold text-emerald-700">Net Finished Weight</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-emerald-900`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Weight`, mapStructuredSteps(part.calculation_steps))}
                                            >
                                              {part.weight_ledger.unit_net_finished_weight_kg.toFixed(3)} kg
                                            </button>
                                          </div>
                                          <div className="p-2 bg-amber-50/60 rounded border border-amber-100">
                                            <div className="text-[9px] uppercase font-bold text-amber-700">Scrap / Waste</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-amber-900`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Scrap`, mapStructuredSteps(part.calculation_steps))}
                                            >
                                              {part.weight_ledger.unit_scrap_waste_weight_kg.toFixed(3)} kg
                                            </button>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Gross RM Weight</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-slate-800`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Gross RM Weight`, structuredStepsFor(part, ['gross rm weight']))}
                                            >
                                              {part.weight_ledger.unit_gross_rm_weight_kg.toFixed(3)} kg
                                            </button>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Total Set Gross</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-slate-800`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Set Gross Weight`, structuredStepsFor(part, ['gross rm weight']))}
                                            >
                                              {part.weight_ledger.total_set_gross_weight_kg.toFixed(3)} kg
                                            </button>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Laser Cutting Length</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-slate-800`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Laser Cutting`, structuredStepsFor(part, ['laser cutting']))}
                                            >
                                              {part.cutting_metrics.laser_cutting_length_mm} mm
                                            </button>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Press Machine Hits</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-slate-800`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Press Cutting`, structuredStepsFor(part, ['press cutting', 'press / punching']))}
                                            >
                                              {part.cutting_metrics.press_machine_hits_count}
                                            </button>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="p-2 bg-blue-50/60 rounded border border-blue-100">
                                            <div className="text-[9px] uppercase font-bold text-[#004ccd]">Material Cost</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-[#004ccd]`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Material Cost`, mapStructuredSteps(part.calculation_steps))}
                                            >
                                              {formatInr(part.calculated_costs.material_cost)}
                                            </button>
                                          </div>
                                          <div className="p-2 bg-blue-50/60 rounded border border-blue-100">
                                            <div className="text-[9px] uppercase font-bold text-[#004ccd]">Laser Cost</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-[#004ccd]`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Laser Cost`, structuredStepsFor(part, ['laser cutting cost']))}
                                            >
                                              {formatInr(part.calculated_costs.laser_cutting_cost_estimate)}
                                            </button>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Machine Cost</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-slate-800`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Press Cost`, structuredStepsFor(part, ['press cutting cost']))}
                                            >
                                              {formatInr(part.calculated_costs.machine_punching_cost_estimate)}
                                            </button>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Bending + Painting</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-slate-800`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Bending + Painting`, structuredStepsFor(part, ['bending cost', 'painting cost']))}
                                            >
                                              {formatInr(part.calculated_costs.bending_cost)} + {formatInr(part.calculated_costs.painting_cost)}
                                            </button>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Single via Laser</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-slate-800`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Single via Laser`, structuredStepsFor(part, ['total via laser']))}
                                            >
                                              {formatInr(part.calculated_costs.total_single_part_cost_via_laser)}
                                            </button>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Single via Machine</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-slate-800`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Single via Machine`, structuredStepsFor(part, ['total via machine']))}
                                            >
                                              {formatInr(part.calculated_costs.total_single_part_cost_via_machine)}
                                            </button>
                                          </div>
                                        </div>

                                        <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                          <div className="text-[9px] uppercase font-bold text-slate-400">Nesting Layout</div>
                                          <div className="text-[11px] leading-relaxed text-slate-600">{part.nesting_layout_hint.nesting_strategy}</div>
                                          <div className="text-[10px] text-slate-400 mt-1">{part.nesting_layout_hint.recommended_grain_or_cut_direction}</div>
                                        </div>

                                        {part.notes && part.notes.length > 0 && (
                                          <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                                            {part.notes.map((note, noteIdx) => (
                                              <li key={`${part.part_number}-note-${noteIdx}`}>{note}</li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    </details>
                                  ))}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Welding</span>
                                    <div className="text-xs text-slate-600 font-mono">
                                      {estimation.structuredBreakdown.assembly_level_fabrication.total_assembly_welding_length_mm} mm = {formatInr(estimation.structuredBreakdown.assembly_level_fabrication.welding_labor_cost)}
                                    </div>
                                  </div>
                                  <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Tacking Setup</span>
                                    <div className="text-xs text-slate-600 font-mono">
                                      {formatInr(estimation.structuredBreakdown.assembly_level_fabrication.tacking_fixed_setup_cost)}
                                    </div>
                                  </div>
                                </div>

                                <details className="border border-slate-200 rounded bg-slate-950 text-slate-100 overflow-hidden">
                                  <summary className="cursor-pointer px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-slate-300 bg-slate-900">
                                    View raw JSON
                                  </summary>
                                  <pre className="max-h-80 overflow-auto p-3 text-[10px] leading-relaxed font-mono whitespace-pre-wrap">
                                    {JSON.stringify(estimation.structuredBreakdown, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Calculations Breakdowns table */}
                        <div className="space-y-3">
                          <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Itemized Mass Distribution</h5>
                          <div className="border border-slate-200 rounded overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-mono text-[9px]">
                                  <th className="p-2.5 font-bold">Element</th>
                                  <th className="p-2.5 font-bold text-right">Unit Weight</th>
                                  <th className="p-2.5 font-bold text-right">Project Total ({estimation.summary.qty}x)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                                <tr>
                                  <td className="p-2.5 font-sans font-medium text-slate-900">Main Profile / Rod ({params.materialForm})</td>
                                  <td className="p-2.5 text-right">
                                    <button type="button" className={valueButtonClass} onClick={() => openBreakdown('Main Profile Weight', [estimation.items?.[0]?.formulas?.weight])}>
                                      {estimation.summary.profileWeightKg.toFixed(3)} kg
                                    </button>
                                  </td>
                                  <td className="p-2.5 text-right">
                                    <button type="button" className={valueButtonClass} onClick={() => openBreakdown('Main Profile Total Weight', [estimation.items?.[0]?.formulas?.weight])}>
                                      {(estimation.summary.profileWeightKg * estimation.summary.qty).toFixed(3)} kg
                                    </button>
                                  </td>
                                </tr>
                                {estimation.summary.topPlateWeightKg > 0 && (
                                  <tr>
                                    <td className="p-2.5 font-sans font-medium text-slate-900">Top Inlay Plate</td>
                                    <td className="p-2.5 text-right">
                                      <button type="button" className={valueButtonClass} onClick={() => openBreakdown('Top Plate Weight', [estimation.items?.find(item => item.name.toLowerCase().includes('top'))?.formulas?.weight])}>
                                        {estimation.summary.topPlateWeightKg.toFixed(3)} kg
                                      </button>
                                    </td>
                                    <td className="p-2.5 text-right">
                                      <button type="button" className={valueButtonClass} onClick={() => openBreakdown('Top Plate Total Weight', [estimation.items?.find(item => item.name.toLowerCase().includes('top'))?.formulas?.weight])}>
                                        {(estimation.summary.topPlateWeightKg * estimation.summary.qty).toFixed(3)} kg
                                      </button>
                                    </td>
                                  </tr>
                                )}
                                {estimation.summary.bottomPlateWeightKg > 0 && (
                                  <tr>
                                    <td className="p-2.5 font-sans font-medium text-slate-900">Bottom Support Plate</td>
                                    <td className="p-2.5 text-right">
                                      <button type="button" className={valueButtonClass} onClick={() => openBreakdown('Bottom Plate Weight', [estimation.items?.find(item => item.name.toLowerCase().includes('bottom'))?.formulas?.weight])}>
                                        {estimation.summary.bottomPlateWeightKg.toFixed(3)} kg
                                      </button>
                                    </td>
                                    <td className="p-2.5 text-right">
                                      <button type="button" className={valueButtonClass} onClick={() => openBreakdown('Bottom Plate Total Weight', [estimation.items?.find(item => item.name.toLowerCase().includes('bottom'))?.formulas?.weight])}>
                                        {(estimation.summary.bottomPlateWeightKg * estimation.summary.qty).toFixed(3)} kg
                                      </button>
                                    </td>
                                  </tr>
                                )}
                                <tr className="bg-slate-50 font-bold text-slate-900">
                                  <td className="p-2.5 font-sans">Accumulated Material Total</td>
                                  <td className="p-2.5 text-right">
                                    <button type="button" className={valueButtonClass} onClick={() => openBreakdown('Accumulated Material Weight', estimation.items?.map(item => item.formulas?.weight) || [])}>
                                      {estimation.summary.unitWeightKg.toFixed(3)} kg
                                    </button>
                                  </td>
                                  <td className="p-2.5 text-right">
                                    <button type="button" className={valueButtonClass} onClick={() => openBreakdown('Total Material Weight', estimation.items?.map(item => item.formulas?.weight) || [])}>
                                      {estimation.summary.totalWeightKg.toFixed(3)} kg
                                    </button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {estimation.items && estimation.items.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Material Item Cost</h5>
                            <div className="border border-slate-200 rounded overflow-hidden">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-mono text-[9px]">
                                    <th className="p-2.5 font-bold">Item</th>
                                    <th className="p-2.5 font-bold text-right">Qty</th>
                                    <th className="p-2.5 font-bold text-right">Weight</th>
                                    <th className="p-2.5 font-bold text-right">Material</th>
                                    <th className="p-2.5 font-bold text-right">Parts / Stock</th>
                                    <th className="p-2.5 font-bold text-right">Allocated Scrap</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                                  {estimation.items.map((item, idx) => (
                                    <tr key={`${item.name}-${idx}`}>
                                      <td className="p-2.5 font-sans font-medium text-slate-900">{item.name}</td>
                                      <td className="p-2.5 text-right">{item.quantity}</td>
                                      <td className="p-2.5 text-right">
                                        <button type="button" className={valueButtonClass} onClick={() => openBreakdown(`${item.name} Weight`, [item.formulas?.weight])}>
                                          {item.weightKg.toFixed(3)} kg
                                        </button>
                                      </td>
                                      <td className="p-2.5 text-right">
                                        <button type="button" className={valueButtonClass} onClick={() => openBreakdown(`${item.name} Material Cost`, [item.formulas?.material])}>
                                          {formatInr(item.materialCost)}
                                        </button>
                                      </td>
                                      <td className="p-2.5 text-right">{item.partsPerStock ? `${item.partsPerStock}/${item.stockForm}` : '-'}</td>
                                      <td className="p-2.5 text-right">
                                        {item.scrapWeightKg ? (
                                          <button type="button" className={valueButtonClass} onClick={() => openBreakdown(`${item.name} Scrap`, [findCalculationStep('Scrap value')])}>
                                            {item.scrapWeightKg.toFixed(3)} kg ({formatInr(item.scrapValue || 0)})
                                          </button>
                                        ) : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {estimation.items?.some(item => item.nestingApproach) && (
                          <div className="space-y-3">
                            <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Nesting / Stock Approach</h5>
                            <div className="space-y-2">
                              {estimation.items.filter(item => item.nestingApproach).map((item, idx) => (
                                <button
                                  type="button"
                                  key={`${item.name}-nest-${idx}`}
                                  className="w-full p-3 bg-slate-50 hover:bg-blue-50/60 rounded border border-slate-200 hover:border-[#004ccd] text-left transition-colors group"
                                  onClick={() => setSelectedNestingItem(item)}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs font-bold text-slate-800">{item.name}</div>
                                    <div className="text-[9px] uppercase font-black tracking-wider text-[#004ccd] opacity-0 group-hover:opacity-100 transition-opacity">
                                      View nesting
                                    </div>
                                  </div>
                                  <div className="text-[11px] leading-relaxed text-slate-600 mt-1">{item.nestingApproach}</div>
                                </button>
                              ))}
                              {estimation.stockSummary && (
                                <div className="text-[11px] leading-relaxed text-slate-500">{estimation.stockSummary.approach}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Processing fee itemization */}
                        {estimation.processDetails.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Configured Processing Operations</h5>
                            <div className="border border-slate-200 rounded overflow-hidden">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-mono text-[9px]">
                                    <th className="p-2.5 font-bold">Process Operation</th>
                                    <th className="p-2.5 font-bold text-right">Base / Unit</th>
                                    <th className="p-2.5 font-bold text-right">Operational Cost</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                                  {estimation.processDetails.map((pd, idx) => (
                                    <tr key={idx}>
                                      <td className="p-2.5 font-sans font-medium text-slate-900">{pd.name}</td>
                                      <td className="p-2.5 text-right">
                                        <button type="button" className={valueButtonClass} onClick={() => openBreakdown(`${pd.name} Cost`, [findProcessStep(pd.name)])}>
                                          {formatInr(pd.unitCost)}
                                        </button>
                                      </td>
                                      <td className="p-2.5 text-right font-bold text-slate-900">
                                        <button type="button" className={valueButtonClass} onClick={() => openBreakdown(`${pd.name} Cost`, [findProcessStep(pd.name)])}>
                                          {formatInr(pd.cost)}
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                  <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                                    <td className="p-2.5 font-sans">Operational Process Total</td>
                                    <td className="p-2.5 text-right">-</td>
                                    <td className="p-2.5 text-right">
                                      <button
                                        type="button"
                                        className={valueButtonClass}
                                        onClick={() => openBreakdown('Operational Process Total', estimation.processDetails.map(pd => findProcessStep(pd.name)))}
                                      >
                                        {formatInr(estimation.summary.processCost)}
                                      </button>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Overall dynamic totals footer */}
                        <div className="pt-3 border-t border-slate-200 space-y-1 text-slate-600 font-medium">
                          <div className="flex justify-between">
                            <span>Base Material Cost ({estimation.summary.totalWeightKg.toFixed(3)} kg @ Rs {params.materialRate}/kg):</span>
                            <button
                              type="button"
                              className={`${valueButtonClass} text-slate-900`}
                              onClick={() => openBreakdown('Base Material Cost', [findCalculationStep('Material cost')])}
                            >
                              {formatInr(estimation.summary.materialCost)}
                            </button>
                          </div>
                          <div className="flex justify-between">
                            <span>Process & Routing Surcharges:</span>
                            <button
                              type="button"
                              className={`${valueButtonClass} text-slate-900`}
                              onClick={() => openBreakdown('Process & Routing Surcharges', estimation.processDetails.map(pd => findProcessStep(pd.name)))}
                            >
                              {formatInr(estimation.summary.processCost)}
                            </button>
                          </div>
                          <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-dashed border-slate-200">
                            <span>Calculated Grand Estimate:</span>
                            <button
                              type="button"
                              className={`${valueButtonClass} text-[#004ccd]`}
                              onClick={() => openBreakdown('Calculated Grand Estimate', [findCalculationStep('Material cost'), findCalculationStep('Total estimated cost')])}
                            >
                              {formatInr(estimation.summary.totalCost)}
                            </button>
                          </div>
                        </div>

                        {estimation.assumptions && estimation.assumptions.length > 0 && (
                          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 leading-relaxed">
                            {estimation.assumptions.map((assumption, idx) => (
                              <li key={idx}>{assumption}</li>
                            ))}
                          </ul>
                        )}

                        {estimation.calculationSteps && estimation.calculationSteps.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Formula Trail</h5>
                            <div className="space-y-2">
                              {estimation.calculationSteps.slice(0, 12).map((step, idx) => (
                                <div key={`${step.name}-${idx}`} className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                                  <div className="text-[10px] uppercase font-bold text-slate-400">{step.section}</div>
                                  <div className="text-xs font-bold text-slate-700">{step.name}</div>
                                  <div className="font-mono text-[11px] text-slate-700">{step.formula}</div>
                                  <div className="font-mono text-[11px] text-slate-500">{step.substitutedValues}</div>
                                  <div className="font-mono text-xs font-black text-[#00796b]">{step.result}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* EMPTY STATE */
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 my-auto">
                        <div className="w-16 h-16 bg-[#f3f3f3] rounded-full flex items-center justify-center border border-[#c3c6d8]/60">
                          <Calculator className="w-8 h-8 text-[#424656]" />
                        </div>
                        <h4 className="font-bold text-[#1a1c1c] text-sm">No Calculation Found</h4>
                        <p className="text-xs text-[#424656] max-w-[280px] leading-relaxed mx-auto">
                          Review the part information and profile dimensions on the left, then click <strong className="text-[#004ccd]">'Calculate Cost'</strong> to generate the engineering estimate.
                        </p>
                        {isExtractionComplete && (
                          <button
                            type="button"
                            className="mt-2 px-6 py-3 bg-[#004ccd] hover:bg-[#0f62fe] disabled:bg-slate-300 disabled:text-slate-500 text-white rounded font-black uppercase tracking-wider text-xs shadow-sm transition-colors flex items-center gap-2"
                            onClick={calculateCost}
                            disabled={isCalculating || hasBlockingMissingChildDrawings}
                          >
                            {isCalculating ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Calculator className="w-4 h-4" />
                            )}
                            {isCalculating ? 'Estimating...' : 'Calculate Cost'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Floating Action Button (FAB) */}
          <div className="fixed bottom-6 right-6 z-50">
            <button 
              className="w-14 h-14 rounded-full bg-[#0f62fe] hover:bg-blue-700 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
              onClick={() => {
                setCurrentScreen('landing');
                setActiveTab('projects');
              }}
              title="Upload New Drawing"
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>
        </div>
      )}

      {/* Corporate Technical Footer */}
      <footer className="h-14 border-t border-[#c3c6d8] bg-white flex justify-between items-center px-6 text-[11px] font-medium text-[#424656] shrink-0">
        <div>© 2026 ikarkhana. All technical rights reserved.</div>
        <div className="flex gap-6 font-semibold">
          <a href="#" className="hover:text-[#004ccd] transition-colors" onClick={() => triggerToast('Direct support and compliance notes.')}>Privacy Policy</a>
          <a href="#" className="hover:text-[#004ccd] transition-colors" onClick={() => triggerToast('ASME and structural engineering manual documentation.')}>Technical Docs</a>
        </div>
      </footer>
    </div>
  );
}
