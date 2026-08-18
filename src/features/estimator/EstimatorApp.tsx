'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Upload, 
  FileText, 
  Plus, 
  ArrowRight, 
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
import { DEFAULT_AVATAR_URL, DEFAULT_IMAGE_URL } from '../../constants/assets';
import { formatInr } from '../../lib/formatters';
import {
  CalculationBreakdownModal,
  ExportActions,
  NestingVisualModal,
} from './components';
import { useBatchProcessing } from './hooks/useBatchProcessing';
import { dependencyFallbacksFor } from './lib/dependencyFallbacks';
import { downloadTextFile, numberSafe as excelNumberSafe, safe as excelSafe, xmlEscape as excelXmlEscape } from './lib/excelXml';
import type { BackendBatchFileResult, BatchProcessingResult, BatchUploadFile } from '../../types/batch';
import type {
  CalculationStep,
  EstimateLineItem,
  EstimationResult,
  PlateParams,
  ReferencedDrawing,
  StructuredBreakdown,
  TechnicalParams,
} from '../../types/costing';

// Coordinates the full estimator workflow and screen state.
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
  const [singleFileReferencedDrawings, setSingleFileReferencedDrawings] = useState<ReferencedDrawing[]>([]);
  const [batchUploadFiles, setBatchUploadFiles] = useState<BatchUploadFile[]>([]);
  const [selectedBatchParentName, setSelectedBatchParentName] = useState<string>('');
  const [isUploadExpanding, setIsUploadExpanding] = useState(false);
  const [uploadPreparingCount, setUploadPreparingCount] = useState(0);
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [isBatchReady, setIsBatchReady] = useState(false);
  const [isBatchDependencyScanning, setIsBatchDependencyScanning] = useState(false);
  const [batchDependencyHints, setBatchDependencyHints] = useState<Record<string, string[]>>({});
  const [batchProcessingResults, setBatchProcessingResults] = useState<Record<string, BatchProcessingResult>>({});
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
  const [isDependencySummaryOpen, setIsDependencySummaryOpen] = useState(false);
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
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    message: string;
    kind: 'info' | 'success' | 'warning' | 'error';
  } | null>(null);

  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Returns true when backend rejected a file before AI extraction.
  const isUploadValidationError = (message: string) => {
    const lowerMessage = message.toLowerCase();
    return (
      lowerMessage.includes('technical engineering drawing') ||
      lowerMessage.includes('unsupported file type') ||
      lowerMessage.includes('uploaded image looks blank') ||
      lowerMessage.includes('corrupt') ||
      lowerMessage.includes('too small') ||
      lowerMessage.includes('readable engineering drawing')
    );
  };

  // Shows a short user-facing notification.
  const triggerToast = (
    msg: string,
    kind: 'info' | 'success' | 'warning' | 'error' = 'info',
    title?: string,
  ) => {
    const fallbackTitle = kind === 'error' ? 'Action needed' : kind === 'success' ? 'Done' : kind === 'warning' ? 'Check this' : 'Notice';
    setToastMessage({ title: title || fallbackTitle, message: msg, kind });
    window.setTimeout(() => setToastMessage(null), kind === 'error' ? 7000 : 3500);
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

  // Handles drop user action.
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleUploadedFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Handles upload input user action.
  const handleUploadInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      void handleUploadedFiles(selectedFiles);
    }
    e.target.value = '';
  };

  // Handles read file as data url.
  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Handles drawing base.
  const drawingBase = (name: string) => name.toLowerCase().replace(/\.[^.]+$/, '').trim();

  const DEPENDENCY_SCAN_CONCURRENCY = 3;

  // Scans one file for child/detail drawing references.
  const scanReferencesForFile = async (file: BatchUploadFile): Promise<ReferencedDrawing[]> => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 18000);
    try {
      const response = await fetch('/api/reference-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, image: file.image }),
        signal: controller.signal,
      });
      const result = await response.json();
      return Array.isArray(result?.data?.referenced_drawings) ? result.data.referenced_drawings : [];
    } catch {
      return [];
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  // Converts child/detail references into file-name hints.
  const hintsFromReferences = (references: ReferencedDrawing[]) => {
    const hints: string[] = [];

    references.forEach((reference) => {
      let hint = '';

      if (reference.file_name_hint) {
        hint = String(reference.file_name_hint).trim();
      } else if (reference.drawing_number) {
        hint = `${reference.drawing_number}.tif`.trim();
      }

      if (hint && hint !== '.tif' && !hints.includes(hint)) {
        hints.push(hint);
      }
    });

    return hints;
  };

  // Scans dependency hints for files.
  const scanDependencyHintsForFiles = async (files: BatchUploadFile[]) => {
    const scannedHints: Record<string, string[]> = {};

    // Scans one file.
    const scanOneFile = async (file: BatchUploadFile) => {
      const key = drawingBase(file.name);
      const references = await scanReferencesForFile(file);
      scannedHints[key] = hintsFromReferences(references);

      setBatchDependencyHints(prev => ({
        ...prev,
        [key]: scannedHints[key] || [],
      }));
    };

    let nextIndex = 0;
    const workerCount = Math.min(DEPENDENCY_SCAN_CONCURRENCY, files.length);
    const workers = Array.from({ length: workerCount }, async () => {
      while (nextIndex < files.length) {
        const file = files[nextIndex];
        nextIndex += 1;
        await scanOneFile(file);
      }
    });

    if (workers.length > 0) {
      await Promise.all(workers);
    }
    return scannedHints;
  };

  // Handles stage normalized files.
  const stageNormalizedFiles = (staged: BatchUploadFile[]) => {
    setSingleFileReferencedDrawings([]);
    setBatchUploadFiles(staged);
    setSelectedBatchParentName(staged[0]?.name || '');
    setIsBatchReady(false);
    setIsBatchScanning(false);
    setBatchDependencyHints({});
    setBatchProcessingResults({});
    setCurrentScreen('landing');
    triggerToast(`${staged.length} file${staged.length > 1 ? 's' : ''} staged. Review drawing/child files, then proceed.`);
    setIsBatchDependencyScanning(true);
    scanDependencyHintsForFiles(staged)
      .then((hints) => setBatchDependencyHints(hints))
      .finally(() => setIsBatchDependencyScanning(false));
  };

  // Handles uploaded files user action.
  const handleUploadedFiles = async (files: File[]) => {
    setIsUploadExpanding(true);
    setUploadPreparingCount(files.length);
    setCurrentScreen('landing');
    setActiveTab('projects');
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('uploads', file));
      const response = await fetch('/api/expand-upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Upload expansion failed');
      }
      const staged = (Array.isArray(result.files) ? result.files : []).map((file: any, index: number) => ({
        name: String(file.name || `drawing-${index + 1}`),
        sizeMb: String(file.size_mb || '0.00 MB'),
        image: String(file.image || ''),
        isChild: index > 0,
      })).filter((file: BatchUploadFile) => file.image);

      if (staged.length === 0) {
        triggerToast('No supported drawing files found. Upload TIFF, PNG, PDF, DWG, JPG, or ZIP.');
        return;
      }

      if (staged.length === 1) {
        const references = await scanReferencesForFile(staged[0]);
        setSingleFileReferencedDrawings(references);
        setIsUploadExpanding(false);
        await startExtractionFromData(staged[0].image, staged[0].name, staged[0].sizeMb, [], references);
        return;
      }

      stageNormalizedFiles(staged);
    } catch (error: any) {
      triggerToast(error?.message || 'Could not read one or more uploaded files. Please try again.');
    } finally {
      setIsUploadExpanding(false);
      setUploadPreparingCount(0);
    }
  };

  // Handles proceed with uploaded files.
  const proceedWithUploadedFiles = async () => {
    if (batchUploadFiles.length === 0) {
      triggerToast('Upload at least one drawing file first.');
      return;
    }
    setIsBatchReady(false);
    setIsBatchScanning(true);
    const scanDelay = new Promise<void>((resolve) => window.setTimeout(resolve, 1800));
    const hasScannedHints = batchUploadFiles.every(file =>
      Object.prototype.hasOwnProperty.call(batchDependencyHints, drawingBase(file.name))
    );
    const scanTimeout = new Promise<Record<string, string[]>>((resolve) => {
      window.setTimeout(() => resolve(batchDependencyHints), 8000);
    });
    const hints = hasScannedHints
      ? batchDependencyHints
      : await Promise.race([scanDependencyHintsForFiles(batchUploadFiles), scanTimeout]);

    await scanDelay;
    setBatchDependencyHints(hints);
    setIsBatchScanning(false);
    setIsBatchReady(true);
    triggerToast('Batch scan complete. Extracting and costing files one by one.');
    void runBatchExtractionForFiles(batchUploadFiles, hints);
  };

  /*
    Batch dependency detection is AI driven:
    Gemini pre-scan fills batchDependencyHints for each uploaded file.
  */
  // Handles expected child file hints.
  const expectedChildFileHints = (parentName: string) => {
    const key = drawingBase(parentName);
    if (!Object.prototype.hasOwnProperty.call(batchDependencyHints, key)) {
      return [];
    }
    const aiHints = batchDependencyHints[key] || [];
    let hintsToUse = aiHints;

    if (aiHints.length === 0) {
      hintsToUse = dependencyFallbacksFor(key);
    }

    return Array.from(new Set(hintsToUse));
  };

  // Handles expected child file hints from map.
  const expectedChildFileHintsFromMap = (parentName: string, hintsMap: Record<string, string[]>) => {
    const key = drawingBase(parentName);
    if (!Object.prototype.hasOwnProperty.call(hintsMap, key)) {
      return [];
    }
    const aiHints = hintsMap[key] || [];
    let hintsToUse = aiHints;

    if (aiHints.length === 0) {
      hintsToUse = dependencyFallbacksFor(key);
    }

    return Array.from(new Set(hintsToUse));
  };

  // Handles file matches hint.
  const fileMatchesHint = (file: BatchUploadFile, hint: string) => {
    return drawingBase(file.name) === drawingBase(hint);
  };

  // Handles expected child base set for batch.
  const expectedChildBaseSetForBatch = () => new Set(
    batchUploadFiles.flatMap(file => expectedChildFileHints(file.name).map(hint => drawingBase(hint)))
  );

  // Returns every uploaded drawing because each file gets its own calculation result.
  const batchFilesForCalculation = () => {
    return batchUploadFiles;
  };

  // Handles child files for parent.
  const childFilesForParent = (parent: BatchUploadFile) => {
    const hints = expectedChildFileHints(parent.name);
    return hints
      .map(hint => batchUploadFiles.find(file => file.name !== parent.name && fileMatchesHint(file, hint)))
      .filter(Boolean) as BatchUploadFile[];
  };

  // Handles child files for parent from map.
  const childFilesForParentFromMap = (parent: BatchUploadFile, files: BatchUploadFile[], hintsMap: Record<string, string[]>) => {
    const hints = expectedChildFileHintsFromMap(parent.name, hintsMap);
    return hints
      .map(hint => files.find(file => file.name !== parent.name && drawingBase(file.name) === drawingBase(hint)))
      .filter(Boolean) as BatchUploadFile[];
  };

  // Handles missing child hints for file.
  const missingChildHintsForFile = (parent: BatchUploadFile, files: BatchUploadFile[], hintsMap: Record<string, string[]>) =>
    expectedChildFileHintsFromMap(parent.name, hintsMap).filter(hint => (
      !files.some(file => file.name !== parent.name && drawingBase(file.name) === drawingBase(hint))
    ));

  // Returns every uploaded drawing from a batch because each file is processed separately.
  const batchFilesForCalculationFromMap = (files: BatchUploadFile[], hintsMap: Record<string, string[]>) => {
    return files;
  };

  // Handles map backend child files.
  const mapBackendChildFiles = (childFiles?: BackendBatchFileResult['child_files']) =>
    (childFiles || []).map(child => ({
      name: child.file_name,
      sizeMb: child.size_mb,
      image: child.preview_image,
      isChild: true,
    }));

  const paramsFromStructuredBreakdown = (structured: StructuredBreakdown, fallbackFileName: string): TechnicalParams => {
    const parts = structured.per_part_breakdown || [];
    const firstTube = parts.find(part => part.component_type?.toLowerCase() === 'tube') || parts[0];
    const topPlate = parts.find(part => `${part.component_name || ''} ${part.tube_type || ''}`.toLowerCase().includes('top'));
    const bottomPlate = parts.find(part => `${part.component_name || ''} ${part.tube_type || ''}`.toLowerCase().includes('bottom'));
    const handle = parts.find(part => `${part.component_name || ''} ${part.tube_type || ''}`.toLowerCase().includes('handle'));
    const screw = parts.find(part => `${part.component_name || ''} ${part.tube_type || ''}`.toLowerCase().includes('screw'));
    const angle = parts.find(part => `${part.component_name || ''} ${part.tube_type || ''}`.toLowerCase().includes('angle'));
    const tubeText = String(firstTube?.tube_type || firstTube?.component_name || '').toLowerCase();
    const dims = firstTube?.dimensions || {};
    const totalLaserLength = parts.reduce((total, part) => total + Number(part.cutting_metrics?.laser_cutting_length_mm || 0), 0);
    const totalPressHits = parts.reduce((total, part) => total + Number(part.cutting_metrics?.press_machine_hits_count || 0), 0);
    const totalBends = parts.reduce((total, part) => total + Number(part.bends_per_part || 0) * Number(part.per_set_qty || 1), 0);
    const materialType = structured.per_part_breakdown.find(part => part.material_type)?.material_type || 'ss';
    const materialCode = structured.raw_material_code || structured.per_part_breakdown.find(part => part.material_code)?.material_code || '';

    return {
      ...params,
      partName: structured.part_name || fallbackFileName.replace(/\.[^.]+$/, ''),
      rawMaterialType: String(materialType || 'ss'),
      rawMaterialCode: String(materialCode || ''),
      materialRate: params.materialRate || '240',
      materialForm: tubeText.includes('round') || tubeText.includes('dia') ? 'Round Rod' : 'Square Bar',
      shape: firstTube?.tube_type || firstTube?.component_type || '',
      isHollow: firstTube?.component_type?.toLowerCase() === 'tube',
      length: dims.length_mm ? String(dims.length_mm) : '',
      diameter: dims.width_or_outer_dia_mm ? String(dims.width_or_outer_dia_mm) : '',
      thickness: dims.thickness_or_wall_thickness_mm ? String(dims.thickness_or_wall_thickness_mm) : '',
      qty: firstTube?.per_set_qty ? String(firstTube.per_set_qty) : '1',
      topPlate: {
        length: topPlate?.dimensions?.length_mm ? String(topPlate.dimensions.length_mm) : '',
        width: topPlate?.dimensions?.width_or_outer_dia_mm ? String(topPlate.dimensions.width_or_outer_dia_mm) : '',
        thickness: topPlate?.dimensions?.thickness_or_wall_thickness_mm ? String(topPlate.dimensions.thickness_or_wall_thickness_mm) : '',
      },
      bottomPlate: {
        length: bottomPlate?.dimensions?.length_mm ? String(bottomPlate.dimensions.length_mm) : '',
        width: bottomPlate?.dimensions?.width_or_outer_dia_mm ? String(bottomPlate.dimensions.width_or_outer_dia_mm) : '',
        thickness: bottomPlate?.dimensions?.thickness_or_wall_thickness_mm ? String(bottomPlate.dimensions.thickness_or_wall_thickness_mm) : '',
      },
      handleOd: handle?.dimensions?.width_or_outer_dia_mm ? String(handle.dimensions.width_or_outer_dia_mm) : '',
      handleThickness: handle?.dimensions?.thickness_or_wall_thickness_mm ? String(handle.dimensions.thickness_or_wall_thickness_mm) : '',
      handleLength: handle?.dimensions?.length_mm ? String(handle.dimensions.length_mm) : '',
      angleLength: angle?.dimensions?.length_mm ? String(angle.dimensions.length_mm) : '',
      screwDia: screw?.dimensions?.width_or_outer_dia_mm ? String(screw.dimensions.width_or_outer_dia_mm) : '',
      screwLength: screw?.dimensions?.length_mm ? String(screw.dimensions.length_mm) : '',
      screwQty: screw?.per_set_qty ? String(screw.per_set_qty) : '',
      cuttingLength: String(Math.round(totalLaserLength)),
      cuttingSurfaceCount: String(parts.filter(part => Number(part.cutting_metrics?.laser_cutting_length_mm || 0) > 0).length),
      weldLength: String(structured.assembly_level_fabrication?.total_assembly_welding_length_mm || ''),
      bendCount: String(totalBends),
      pressHits: String(totalPressHits),
      processes: ['Cutting', 'Welding', 'Surface', 'Bending', 'Pressing'],
    };
  };

  const estimationFromStructuredBreakdown = (
    structured: StructuredBreakdown,
    file: BatchUploadFile,
    childFiles: BatchUploadFile[],
  ): EstimationResult => {
    const parts = structured.per_part_breakdown || [];
    const totalGrossWeight = parts.reduce((total, part) => (
      total + Number(part.weight_ledger?.total_set_gross_weight_kg || 0)
    ), 0);
    const totalNetWeight = parts.reduce((total, part) => (
      total + Number(part.weight_ledger?.unit_net_finished_weight_kg || 0) * Number(part.per_set_qty || 1)
    ), 0);
    const materialCost = parts.reduce((total, part) => total + Number(part.calculated_costs?.material_cost || 0) * Number(part.per_set_qty || 1), 0);
    const partProcessCost = parts.reduce((total, part) => total
      + Number(part.calculated_costs?.laser_cutting_cost_estimate || 0) * Number(part.per_set_qty || 1)
      + Number(part.calculated_costs?.bending_cost || 0) * Number(part.per_set_qty || 1)
      + Number(part.calculated_costs?.painting_cost || 0) * Number(part.per_set_qty || 1), 0);
    const assemblyProcessCost = Number(structured.assembly_level_fabrication?.welding_labor_cost || 0)
      + Number(structured.assembly_level_fabrication?.tacking_fixed_setup_cost || 0);
    const totalCost = Number(structured.assembly_level_fabrication?.grand_total_assembly_cost_via_laser || materialCost + partProcessCost + assemblyProcessCost);

    return {
      summary: {
        profileWeightKg: Number(parts[0]?.weight_ledger?.unit_net_finished_weight_kg || 0),
        topPlateWeightKg: 0,
        bottomPlateWeightKg: 0,
        unitWeightKg: totalNetWeight,
        totalWeightKg: totalGrossWeight,
        materialCost,
        processCost: partProcessCost + assemblyProcessCost,
        totalCost,
        qty: 1,
      },
      processDetails: [
        { name: 'Laser Cutting', unitCost: 0, cost: parts.reduce((total, part) => total + Number(part.calculated_costs?.laser_cutting_cost_estimate || 0) * Number(part.per_set_qty || 1), 0) },
        { name: 'Bending', unitCost: 0, cost: parts.reduce((total, part) => total + Number(part.calculated_costs?.bending_cost || 0) * Number(part.per_set_qty || 1), 0) },
        { name: 'Welding', unitCost: 0, cost: Number(structured.assembly_level_fabrication?.welding_labor_cost || 0) },
        { name: 'Painting', unitCost: 0, cost: parts.reduce((total, part) => total + Number(part.calculated_costs?.painting_cost || 0) * Number(part.per_set_qty || 1), 0) },
      ],
      likelyUse: structured.part_name || 'Engineering drawing assembly.',
      uploadedFile: file.name,
      fileSizeKb: Number.parseFloat(file.sizeMb) * 1024,
      materialSummary: {
        materialType: structured.per_part_breakdown.find(part => part.material_type)?.material_type || 'ss',
        materialLabel: 'Stainless Steel',
        materialCode: structured.raw_material_code || structured.per_part_breakdown.find(part => part.material_code)?.material_code || undefined,
        densityKgPerMm3: 0,
        ratePerKg: Number(params.materialRate || 240),
      },
      stockSummary: {
        rodStockLengthMm: 6000,
        sheetStockLengthMm: 2500,
        sheetStockWidthMm: 1250,
        scrapRatePerKg: Number(params.scrapRate || 28),
        totalScrapWeightKg: parts.reduce((total, part) => total + Number(part.weight_ledger?.unit_scrap_waste_weight_kg || 0) * Number(part.per_set_qty || 1), 0),
        totalScrapValue: parts.reduce((total, part) => total + Number(part.weight_ledger?.unit_scrap_waste_weight_kg || 0) * Number(part.per_set_qty || 1), 0) * Number(params.scrapRate || 28),
        approach: 'Backend batch structured estimate. Child drawings used where uploaded.',
      },
      assumptions: [
        `Processed by backend batch worker with ${childFiles.length} attached child/detail file(s).`,
        'Images were converted to PNG previews before rendering in the browser.',
      ],
      items: parts.map(part => ({
        name: part.component_name || part.tube_type || `Part ${part.part_number}`,
        quantity: Number(part.per_set_qty || 1),
        weightKg: Number(part.weight_ledger?.unit_net_finished_weight_kg || 0),
        materialCost: Number(part.calculated_costs?.material_cost || 0),
        materialLabel: part.material_type || 'material',
        stockForm: part.stock_nesting?.stock_form,
        stockSize: part.stock_nesting?.stock_width_mm
          ? `${part.stock_nesting.stock_length_mm || 0} x ${part.stock_nesting.stock_width_mm} mm`
          : part.stock_nesting?.stock_length_mm
            ? `${part.stock_nesting.stock_length_mm} mm`
            : undefined,
        partsPerStock: Number(part.stock_nesting?.parts_per_stock || 0) || undefined,
        stockCount: Number(part.stock_nesting?.stock_count || 0) || undefined,
        stockWeightKg: Number(part.stock_nesting?.stock_weight_kg || 0) || undefined,
        stockLengthMm: Number(part.stock_nesting?.stock_length_mm || 0) || undefined,
        stockWidthMm: Number(part.stock_nesting?.stock_width_mm || 0) || undefined,
        partLengthMm: Number(part.stock_nesting?.part_length_mm || 0) || undefined,
        partWidthMm: Number(part.stock_nesting?.part_width_mm || 0) || undefined,
        leftoverMm: Number(part.stock_nesting?.leftover_per_stock_mm || 0) || undefined,
        scrapWeightKg: Number(part.weight_ledger?.unit_scrap_waste_weight_kg || 0),
        scrapValue: Number(part.weight_ledger?.unit_scrap_waste_weight_kg || 0) * Number(params.scrapRate || 28),
        nestingApproach: part.stock_nesting?.approach || part.nesting_layout_hint?.nesting_strategy,
      })),
      structuredBreakdown: structured,
    };
  };

  // Handles apply backend batch job.
  const applyBackendBatchJob = (job: any) => {
    const files = Array.isArray(job?.files) ? job.files as BackendBatchFileResult[] : [];
    const uploadByName = new Map(batchUploadFiles.map(file => [file.name, file]));
    const nextResults: Record<string, BatchProcessingResult> = {};

    files.forEach(fileResult => {
      const uploadFile = uploadByName.get(fileResult.file_name) || {
        name: fileResult.file_name,
        sizeMb: fileResult.size_mb,
        image: fileResult.preview_image,
        isChild: false,
      };
      const childFiles = mapBackendChildFiles(fileResult.child_files);
      const structured = fileResult.structured_breakdown;
      nextResults[fileResult.file_name] = {
        status: fileResult.status,
        childFiles,
        structuredBreakdown: structured,
        params: structured ? paramsFromStructuredBreakdown(structured, fileResult.file_name) : undefined,
        estimation: structured ? estimationFromStructuredBreakdown(structured, uploadFile, childFiles) : undefined,
        error: fileResult.error || undefined,
      };
    });

    setBatchProcessingResults(nextResults);
    setBatchUploadFiles(prev => prev.map(file => {
      const backendFile = files.find(item => item.file_name === file.name);
      return backendFile?.preview_image ? { ...file, image: backendFile.preview_image } : file;
    }));
  };

  // Handles process single batch file.
  const processSingleBatchFile = async (parent: BatchUploadFile, files: BatchUploadFile[], hintsMap: Record<string, string[]>) => {
      const childFiles = childFilesForParentFromMap(parent, files, hintsMap);
      setBatchProcessingResults(prev => ({
        ...prev,
        [parent.name]: { ...(prev[parent.name] || {}), status: 'processing', childFiles },
      }));

      try {
        const extractResponse = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: parent.image, useDefault: false }),
        });
        const extractResult = await extractResponse.json();
        if (!extractResult.success) {
          throw new Error(extractResult.error || 'Extraction failed');
        }

        const extractedParams = extractResult.data as TechnicalParams;
        let structuredBreakdown: StructuredBreakdown | undefined;
        try {
          const structuredResponse = await fetch('/api/structured-estimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: parent.image,
              filename: parent.name,
              childDrawings: childFiles.map(file => ({
                drawingNumber: file.name.replace(/\.[^.]+$/, ''),
                filename: file.name,
                image: file.image,
              })),
              params: extractedParams,
            }),
          });
          const structuredResult = await structuredResponse.json();
          if (structuredResult.success) {
            structuredBreakdown = structuredResult.data;
          }
        } catch {
          structuredBreakdown = undefined;
        }

        if (!structuredBreakdown) {
          throw new Error('Structured cost calculation failed');
        }

        const nextEstimation = estimationFromStructuredBreakdown(structuredBreakdown, parent, childFiles);
        setBatchProcessingResults(prev => ({
          ...prev,
          [parent.name]: {
            status: 'processed',
            params: extractedParams,
            estimation: nextEstimation,
            structuredBreakdown,
            childFiles,
          },
        }));
      } catch (error: any) {
        setBatchProcessingResults(prev => ({
          ...prev,
          [parent.name]: {
            ...(prev[parent.name] || {}),
            status: 'error',
            childFiles,
            error: error?.message || 'Batch extraction failed',
          },
        }));
      }
  };

  const { runBatchExtractionForFiles, retryBatchFile } = useBatchProcessing({
    setBatchProcessingResults,
    applyBackendBatchJob,
    childFilesForParentFromMap,
    processSingleBatchFile,
    batchUploadFiles,
    batchDependencyHints,
  });

  // Opens main batch file in the workspace.
  const openBatchFile = async (parent: BatchUploadFile) => {
    const cached = batchProcessingResults[parent.name];
    if (cached?.status === 'processed' && cached.params && cached.estimation) {
      const childFiles = cached.childFiles || childFilesForParent(parent);
      setParams(cached.params);
      setEstimation(cached.estimation);
      setStructuredBreakdownCache(cached.structuredBreakdown || cached.estimation.structuredBreakdown || null);
      setFileName(parent.name);
      setFileSize(parent.sizeMb);
      setUploadedImageData(parent.image);
      setUploadedImageName(parent.name);
      setFilePreview(parent.image);
      setChildDrawingUploads(Object.fromEntries(childFiles.map(file => [file.name.replace(/\.[^.]+$/, ''), file.name])));
      setChildDrawingImages(Object.fromEntries(childFiles.map(file => [file.name.replace(/\.[^.]+$/, ''), file.image])));
      setIsAnalyzing(false);
      setIsExtractionComplete(true);
      setCurrentScreen('workspace');
      setActiveTab('estimator');
      setSidebarTab('estimator');
      return;
    }
    if (cached?.status === 'processing' || cached?.status === 'queued') {
      triggerToast(`${parent.name} is still processing. Please wait.`);
      return;
    }
    const childFiles = childFilesForParent(parent);
    setChildDrawingUploads(Object.fromEntries(childFiles.map(file => [file.name.replace(/\.[^.]+$/, ''), file.name])));
    setChildDrawingImages(Object.fromEntries(childFiles.map(file => [file.name.replace(/\.[^.]+$/, ''), file.image])));
    await startExtractionFromData(parent.image, parent.name, parent.sizeMb, childFiles);
  };

  // Handles append child files to batch.
  const appendChildFilesToBatch = async (files: File[]) => {
    if (files.length === 0) return;
    try {
      const stagedChildren = await Promise.all(files.map(async (file) => ({
        name: file.name,
        sizeMb: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        image: await readFileAsDataUrl(file),
        isChild: true,
      })));
      const existing = new Set(batchUploadFiles.map(file => file.name));
      const nextBatchFiles = [...batchUploadFiles, ...stagedChildren.filter(file => !existing.has(file.name))];
      setBatchUploadFiles(nextBatchFiles);
      triggerToast(`${stagedChildren.length} child/detail file${stagedChildren.length > 1 ? 's' : ''} added.`);
      setIsBatchDependencyScanning(true);
      scanDependencyHintsForFiles(nextBatchFiles)
        .then((hints) => setBatchDependencyHints(hints))
        .finally(() => setIsBatchDependencyScanning(false));
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
    preScannedReferences: ReferencedDrawing[] = [],
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
    setSingleFileReferencedDrawings(preScannedReferences);
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

  // Pipeline simulation or real Gemini extraction
  const runExtractionPipeline = async (imgData: string, name: string, batchChildFiles: BatchUploadFile[] = []) => {
    setIsAnalyzing(true);
    setScanPreviewPhase('scan');
    setIsExtractionComplete(false);
    setEstimation(null);
    setStructuredBreakdownCache(null);
    if (batchChildFiles.length > 0) {
      setSingleFileReferencedDrawings([]);
    }
    if (batchChildFiles.length === 0) {
      setChildDrawingUploads({});
      setChildDrawingImages({});
    }
    setAllowMissingChildDrawings(false);
    setCurrentScreen('workspace');
    setActiveTab('estimator');
    setSidebarTab('estimator');
    let extractionWasRejected = false;
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
      const errorMessage = err?.message || 'Parameter extraction service failed.';
      if (isUploadValidationError(errorMessage)) {
        extractionWasRejected = true;
        setEstimation(null);
        setStructuredBreakdownCache(null);
        triggerToast(errorMessage, 'error', 'Upload rejected');
        return;
      }

      triggerToast('Parameter extraction service failed. Loaded sample blueprint layout.', 'warning', 'Extraction fallback loaded');
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
      setIsExtractionComplete(!extractionWasRejected);
    }
  };

  // Manual extract trigger in workspace
  const handleManualExtract = () => {
    runExtractionPipeline(filePreview, fileName || 'Manual_Extract_Drawing.dwg');
  };

  const referencedDrawings = (() => {
    const merged = [...singleFileReferencedDrawings, ...(structuredBreakdownCache?.referenced_drawings || estimation?.structuredBreakdown?.referenced_drawings || [])];
    const byNumber = new Map<string, ReferencedDrawing>();
    merged.forEach((drawing) => {
      const key = drawing.drawing_number || drawing.file_name_hint || JSON.stringify(drawing);
      if (!byNumber.has(key)) byNumber.set(key, drawing);
    });
    return Array.from(byNumber.values());
  })();
  const missingReferencedDrawings = referencedDrawings.filter(
    (drawing) => drawing.required_for_costing !== false && !childDrawingUploads[drawing.drawing_number]
  );
  const hasBlockingMissingChildDrawings = false;

  // Handles child drawing upload user action.
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
    setIsCalculating(true);
    try {
      const cachedStructured = structuredBreakdownCache || estimation?.structuredBreakdown;
      const attachedChildDrawings = Object.entries(childDrawingImages).map(([drawingNumber, image]) => ({
        drawingNumber,
        filename: childDrawingUploads[drawingNumber] || `${drawingNumber}.tif`,
        image,
      }));
      const attachedChildFiles: BatchUploadFile[] = attachedChildDrawings.map(drawing => ({
        name: drawing.filename,
        sizeMb: '0 MB',
        image: drawing.image,
        isChild: true,
      }));

      let structuredBreakdown: StructuredBreakdown | undefined;
      if (cachedStructured && attachedChildDrawings.length === 0) {
        const structuredResponse = await fetch('/api/structured-estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            extraction: cachedStructured,
            params,
          }),
        });
        const structuredResult = await structuredResponse.json();
        if (!structuredResult.success) {
          throw new Error(structuredResult.error || 'Structured JSON breakdown failed.');
        }
        structuredBreakdown = structuredResult.data;
      } else if (uploadedImageData) {
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
        if (!structuredResult.success) {
          throw new Error(structuredResult.error || 'Structured JSON breakdown failed.');
        }
        structuredBreakdown = structuredResult.data;
      } else {
        throw new Error('Upload or extract a drawing before calculating cost.');
      }

      if (!structuredBreakdown) {
        throw new Error('Structured cost calculation failed.');
      }

      setStructuredBreakdownCache(structuredBreakdown);
      const sourceFile: BatchUploadFile = {
        name: uploadedImageName || fileName || 'uploaded-diagram',
        sizeMb: fileSize || '0 MB',
        image: uploadedImageData || filePreview,
        isChild: false,
      };
      const nextEstimation = estimationFromStructuredBreakdown(structuredBreakdown, sourceFile, attachedChildFiles);
      setEstimation(nextEstimation);
      triggerToast('Cost estimate successfully calculated!');

      const newEst = {
        id: 'EST-' + Math.floor(1000 + Math.random() * 9000),
        partName: params.partName || structuredBreakdown.part_name || 'Unnamed Part',
        date: new Date().toISOString().split('T')[0],
        cost: nextEstimation.summary.totalCost,
        weight: nextEstimation.summary.totalWeightKg,
      };
      setHistory(prev => [newEst, ...prev]);
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error';
      triggerToast(errorMessage, 'error', isUploadValidationError(errorMessage) ? 'Upload rejected' : 'Cost estimation failed');
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

  // Handles plate change user action.
  const handlePlateChange = (plateType: 'topPlate' | 'bottomPlate', field: keyof PlateParams, value: string) => {
    setParams(prev => ({
      ...prev,
      [plateType]: {
        ...prev[plateType],
        [field]: value
      }
    }));
  };

  // Handles export batch master bom user action.
  const handleExportBatchMasterBom = () => {
    const batchFiles = batchUploadFiles;
    const processed = batchFiles
      .map(file => ({ file, result: batchProcessingResults[file.name] }))
      .filter(entry => entry.result?.status === 'processed' && entry.result.estimation);

    if (processed.length === 0) {
      triggerToast('No processed batch files yet. Wait for at least one file to finish.');
      return;
    }

    const numberSafe = excelNumberSafe;
    // Handles cell.
    const cell = (value: unknown, type: 'String' | 'Number' = 'String', styleId?: string) => {
      const style = styleId ? ` ss:StyleID="${styleId}"` : '';
      if (type === 'Number') {
        return `<Cell${style}><Data ss:Type="Number">${excelNumberSafe(value)}</Data></Cell>`;
      }
      return `<Cell${style}><Data ss:Type="String">${excelXmlEscape(value)}</Data></Cell>`;
    };
    // Handles row.
    const row = (values: Array<unknown>, numericIndexes: number[] = [], styleId?: string) =>
      `<Row>${values.map((value, index) => cell(value, numericIndexes.includes(index) ? 'Number' : 'String', styleId)).join('')}</Row>`;
    // Handles header row.
    const headerRow = (values: Array<unknown>) => row(values, [], 'Header');

    const summaryRows = processed.map(({ file, result }) => {
      const estimationResult = result.estimation!;
      const structured = result.structuredBreakdown || estimationResult.structuredBreakdown;
      const scrap = structured?.per_part_breakdown?.reduce((total, part) => (
        total + numberSafe(part.weight_ledger?.unit_scrap_waste_weight_kg) * numberSafe(part.per_set_qty || 1)
      ), 0) || numberSafe(estimationResult.stockSummary?.totalScrapWeightKg);
      const net = numberSafe(estimationResult.summary.totalWeightKg);
      const childMap = (result.childFiles || []).map(child => child.name.replace(/\.[^.]+$/, '')).join(', ');
      return row([
        excelSafe(file.name).replace(/\.[^.]+$/, ''),
        net + scrap,
        net,
        scrap,
        net + scrap,
        structured?.assembly_level_fabrication?.grand_total_assembly_cost_via_laser || estimationResult.summary.totalCost,
        structured?.assembly_level_fabrication?.grand_total_assembly_cost_via_machine || estimationResult.summary.totalCost,
        childMap || '-',
      ], [1, 2, 3, 4, 5, 6]);
    });

    const componentRows = processed.flatMap(({ file, result }) => {
      const estimationResult = result.estimation!;
      const structured = result.structuredBreakdown || estimationResult.structuredBreakdown;
      const parentReference = excelSafe(file.name).replace(/\.[^.]+$/, '');
      if (structured?.per_part_breakdown?.length) {
        return structured.per_part_breakdown.map(part => {
          const qty = numberSafe(part.per_set_qty || 1);
          const net = numberSafe(part.weight_ledger?.unit_net_finished_weight_kg) * qty;
          const scrap = numberSafe(part.weight_ledger?.unit_scrap_waste_weight_kg) * qty;
          const gross = numberSafe(part.weight_ledger?.total_set_gross_weight_kg) || net + scrap;
          return row([
            parentReference,
            part.part_number || '-',
            String(part.component_type || '-').toUpperCase(),
            qty,
            part.dimensions?.length_mm,
            part.dimensions?.width_or_outer_dia_mm,
            part.dimensions?.thickness_or_wall_thickness_mm,
            net,
            scrap,
            gross,
            part.cutting_metrics?.laser_cutting_length_mm,
            structured.assembly_level_fabrication?.total_assembly_welding_length_mm || 0,
            part.bends_per_part,
            part.calculated_costs?.bending_cost,
            part.calculated_costs?.painting_cost,
            part.calculated_costs?.laser_cutting_cost_estimate,
            part.calculated_costs?.machine_punching_cost_estimate,
            part.nesting_layout_hint?.nesting_strategy || 'ROUTING: Stock cutting, forming, welding, finishing, and quality check.',
          ], [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
        });
      }
      return (estimationResult.items || []).map((item, index) => {
        const net = numberSafe(item.weightKg);
        const scrap = numberSafe(item.scrapWeightKg);
        return row([
          parentReference,
          `ITEM-${index + 1}`,
          item.name || '-',
          item.quantity || 1,
          '-',
          '-',
          '-',
          net,
          scrap,
          net + scrap,
          '-',
          '-',
          '-',
          0,
          0,
          item.materialCost || 0,
          item.materialCost || 0,
          item.nestingApproach || 'ROUTING: Stock cutting, forming, welding, finishing, and quality check.',
        ], [3, 7, 8, 9, 13, 14, 15, 16]);
      });
    });

    const rates = processed[0]?.result.params || params;
    const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1D4ED8" ss:Pattern="Solid"/><Alignment ss:WrapText="1" ss:Vertical="Center"/></Style>
    <Style ss:ID="TotalRow"><Font ss:Bold="1" ss:Color="#0F172A"/><Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/></Style>
  </Styles>
  <Worksheet ss:Name="Project Executive Summary">
    <Table>
      <Column ss:Width="170"/><Column ss:Width="150"/><Column ss:Width="150"/><Column ss:Width="160"/><Column ss:Width="160"/><Column ss:Width="190"/><Column ss:Width="220"/><Column ss:Width="260"/>
      ${headerRow(['Master Component Reference', 'Target Mass Blueprint (kg)', 'Calibrated Net Mass (kg)', 'Calibrated Scrap Mass (kg)', 'Calibrated Gross Mass (kg)', 'Total Operations Cost (Laser Layout)', 'Total Operations Cost (Turret Punch Matrix)', 'Child Sub-Assembly Maps'])}
      ${summaryRows.join('')}
      ${row([
        'GRAND TOTALS',
        'N/A',
        processed.reduce((total, entry) => total + numberSafe(entry.result.estimation?.summary.totalWeightKg), 0),
        processed.reduce((total, entry) => {
          const structured = entry.result.structuredBreakdown || entry.result.estimation?.structuredBreakdown;
          return total + (structured?.per_part_breakdown?.reduce((sum, part) => sum + numberSafe(part.weight_ledger?.unit_scrap_waste_weight_kg) * numberSafe(part.per_set_qty || 1), 0) || numberSafe(entry.result.estimation?.stockSummary?.totalScrapWeightKg));
        }, 0),
        processed.reduce((total, entry) => total + numberSafe(entry.result.estimation?.summary.totalWeightKg), 0),
        processed.reduce((total, entry) => total + numberSafe((entry.result.structuredBreakdown || entry.result.estimation?.structuredBreakdown)?.assembly_level_fabrication?.grand_total_assembly_cost_via_laser || entry.result.estimation?.summary.totalCost), 0),
        processed.reduce((total, entry) => total + numberSafe((entry.result.structuredBreakdown || entry.result.estimation?.structuredBreakdown)?.assembly_level_fabrication?.grand_total_assembly_cost_via_machine || entry.result.estimation?.summary.totalCost), 0),
        '',
      ], [2, 3, 4, 5, 6], 'TotalRow')}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="All Components Ledger">
    <Table>
      <Column ss:Width="150"/><Column ss:Width="130"/><Column ss:Width="190"/><Column ss:Width="90"/><Column ss:Width="100"/><Column ss:Width="100"/><Column ss:Width="110"/><Column ss:Width="120"/><Column ss:Width="120"/><Column ss:Width="120"/><Column ss:Width="140"/><Column ss:Width="140"/><Column ss:Width="130"/><Column ss:Width="130"/><Column ss:Width="155"/><Column ss:Width="150"/><Column ss:Width="155"/><Column ss:Width="360"/>
      ${headerRow(['Parent Sheet Link', 'Part No', 'Classification Profile', 'Quantity Run', 'Length (mm)', 'Width (mm)', 'Thickness (mm)', 'Net Mass (kg)', 'Scrap Mass (kg)', 'Gross Mass (kg)', 'Laser Trace Path (mm)', 'Laser Weld Path (mm)', 'Bending Stroke Sets', 'Bending Cost (INR)', 'Surface Coating Cost (INR)', 'Laser Routing Cost (INR)', 'Punch Tooling Cost (INR)', 'Advanced Manufacturing Process Guidance'])}
      ${componentRows.join('')}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Material &amp; Process Rates">
    <Table>
      <Column ss:Width="360"/><Column ss:Width="150"/><Column ss:Width="120"/>
      ${headerRow(['Process Parameters / Raw Stock Classification', 'Base Rate (INR)', 'Unit'])}
      ${row(['Raw material base rate', numberSafe(rates.materialRate), 'Per Kg'], [1])}
      ${row(['High Velocity Laser Periphery Cut Path Fee', numberSafe(rates.cutRate), 'Per Meter'], [1])}
      ${row(['Turret Punch / Press Cut Strike Fee', numberSafe(rates.pressRate), 'Per Stroke'], [1])}
      ${row(['CNC Brake Press Bending Deformation Stroke Fee', numberSafe(rates.bendRate), 'Per Bend'], [1])}
      ${row(['Industrial Surface Coating Protection Fee', numberSafe(rates.surfaceRate), 'Per Sqm'], [1])}
      ${row(['Structural Manual Weld Seam Labor Fee', numberSafe(rates.weldRate), 'Per Meter'], [1])}
      ${row(['Structural Assembly Framing Tacking Jig Setup Fee', numberSafe(rates.tackingFixed), 'Fixed'], [1])}
      ${row(['Scrap / Offcut Resale Value', numberSafe(rates.scrapRate || 28), 'Per Kg'], [1])}
    </Table>
  </Worksheet>
</Workbook>`;

    downloadTextFile(workbook, `batch-master-bom-${new Date().toISOString().slice(0, 10)}.xls`);
    triggerToast(`Batch Excel downloaded for ${processed.length} processed file${processed.length === 1 ? '' : 's'}.`);
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
    // Handles safe.
    const safe = (value: unknown) => {
      if (value === null || value === undefined || value === '') return '-';
      return String(value);
    };
    // Handles number safe.
    const numberSafe = (value: unknown) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : 0;
    };
    // Handles xml escape.
    const xmlEscape = (value: unknown) =>
      safe(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    // Handles cell.
    const cell = (value: unknown, type: 'String' | 'Number' = 'String', styleId?: string, mergeAcross?: number) => {
      const style = styleId ? ` ss:StyleID="${styleId}"` : '';
      const merge = mergeAcross ? ` ss:MergeAcross="${mergeAcross}"` : '';
      if (type === 'Number') {
        return `<Cell${style}${merge}><Data ss:Type="Number">${numberSafe(value)}</Data></Cell>`;
      }
      return `<Cell${style}${merge}><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
    };
    // Handles row.
    const row = (values: Array<unknown>, numericIndexes: number[] = [], styleId?: string) =>
      `<Row>${values.map((value, index) => cell(value, numericIndexes.includes(index) ? 'Number' : 'String', styleId)).join('')}</Row>`;
    // Handles title row.
    const titleRow = (title: string) => `<Row ss:Height="28">${cell(title, 'String', 'Title', 30)}</Row>`;
    // Handles section row.
    const sectionRow = (title: string) => `<Row ss:Height="22">${cell(title, 'String', 'Section', 30)}</Row>`;
    // Handles blank row.
    const blankRow = () => '<Row />';
    // Handles header row.
    const headerRow = (values: Array<unknown>) => row(values, [], 'Header');
    // Handles metric row.
    const metricRow = (label: string, value: unknown, unit: string, valueStyle = 'Value') =>
      `<Row>${cell(label, 'String', 'Label')}${cell(value, typeof value === 'number' ? 'Number' : 'String', valueStyle)}${cell(unit, 'String', 'Unit')}</Row>`;
    const totalScrapWeightKg = structured?.per_part_breakdown?.length
      ? structured.per_part_breakdown.reduce((total, part) => (
          total + numberSafe(part.weight_ledger?.unit_scrap_waste_weight_kg) * numberSafe(part.per_set_qty || 1)
        ), 0)
      : numberSafe(estimation.stockSummary?.totalScrapWeightKg);
    const totalWeightIncludingScrapKg = numberSafe(estimation.summary.totalWeightKg) + totalScrapWeightKg;

    const parentReference = (estimation.uploadedFile || uploadedImageName || fileName || params.partName || 'current-drawing')
      .replace(/\.[^.]+$/, '');
    const childMap = referencedDrawings
      .map(drawing => childDrawingUploads[drawing.drawing_number] || drawing.file_name_hint || `${drawing.drawing_number}.tif`)
      .filter(Boolean)
      .join(', ');
    const componentRows = structured?.per_part_breakdown?.length
      ? structured.per_part_breakdown.map(part => {
          const qty = numberSafe(part.per_set_qty || 1);
          const net = numberSafe(part.weight_ledger?.unit_net_finished_weight_kg) * qty;
          const scrap = numberSafe(part.weight_ledger?.unit_scrap_waste_weight_kg) * qty;
          const gross = numberSafe(part.weight_ledger?.total_set_gross_weight_kg) || net + scrap;
          return row([
            parentReference,
            part.part_number || '-',
            String(part.component_type || '-').toUpperCase(),
            qty,
            part.dimensions?.length_mm,
            part.dimensions?.width_or_outer_dia_mm,
            part.dimensions?.thickness_or_wall_thickness_mm,
            net,
            scrap,
            gross,
            part.cutting_metrics?.laser_cutting_length_mm,
            structured.assembly_level_fabrication?.total_assembly_welding_length_mm || params.weldLength || 0,
            part.bends_per_part,
            part.calculated_costs?.bending_cost,
            part.calculated_costs?.painting_cost,
            part.calculated_costs?.laser_cutting_cost_estimate,
            part.calculated_costs?.machine_punching_cost_estimate,
            part.nesting_layout_hint?.nesting_strategy || part.nesting_layout_hint?.recommended_grain_or_cut_direction || 'ROUTING: Stock cutting, forming, welding, finishing, and quality check.',
          ], [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
        })
      : (estimation.items || []).map((item, index) => {
          const net = numberSafe(item.weightKg);
          const scrap = numberSafe(item.scrapWeightKg);
          return row([
            parentReference,
            `ITEM-${index + 1}`,
            item.name || '-',
            item.quantity || 1,
            '-',
            '-',
            '-',
            net,
            scrap,
            net + scrap,
            params.cuttingLength || 0,
            params.weldLength || 0,
            params.bendCount || 0,
            0,
            0,
            item.materialCost || 0,
            item.materialCost || 0,
            item.nestingApproach || 'ROUTING: Stock cutting, forming, welding, finishing, and quality check.',
          ], [3, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
        });
    const masterBomWorkbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="14" ss:Color="#FFFFFF"/><Interior ss:Color="#0F172A" ss:Pattern="Solid"/><Alignment ss:Vertical="Center" ss:WrapText="1"/></Style>
    <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1D4ED8" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93C5FD"/></Borders><Alignment ss:WrapText="1" ss:Vertical="Center"/></Style>
    <Style ss:ID="TotalRow"><Font ss:Bold="1" ss:Color="#0F172A"/><Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Money"><Font ss:Bold="1" ss:Color="#004CCD"/></Style>
  </Styles>
  <Worksheet ss:Name="Project Executive Summary">
    <Table>
      <Column ss:Width="170"/><Column ss:Width="150"/><Column ss:Width="150"/><Column ss:Width="160"/>
      <Column ss:Width="160"/><Column ss:Width="190"/><Column ss:Width="220"/><Column ss:Width="260"/>
      ${headerRow(['Master Component Reference', 'Target Mass Blueprint (kg)', 'Calibrated Net Mass (kg)', 'Calibrated Scrap Mass (kg)', 'Calibrated Gross Mass (kg)', 'Total Operations Cost (Laser Layout)', 'Total Operations Cost (Turret Punch Matrix)', 'Child Sub-Assembly Maps'])}
      ${row([
        parentReference,
        totalWeightIncludingScrapKg,
        numberSafe(estimation.summary.totalWeightKg),
        totalScrapWeightKg,
        totalWeightIncludingScrapKg,
        structured?.assembly_level_fabrication?.grand_total_assembly_cost_via_laser || estimation.summary.totalCost,
        structured?.assembly_level_fabrication?.grand_total_assembly_cost_via_machine || estimation.summary.totalCost,
        childMap || '-',
      ], [1, 2, 3, 4, 5, 6])}
      ${row([
        'GRAND TOTALS',
        'N/A',
        numberSafe(estimation.summary.totalWeightKg),
        totalScrapWeightKg,
        totalWeightIncludingScrapKg,
        structured?.assembly_level_fabrication?.grand_total_assembly_cost_via_laser || estimation.summary.totalCost,
        structured?.assembly_level_fabrication?.grand_total_assembly_cost_via_machine || estimation.summary.totalCost,
        '',
      ], [2, 3, 4, 5, 6], 'TotalRow')}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane></WorksheetOptions>
  </Worksheet>
  <Worksheet ss:Name="All Components Ledger">
    <Table>
      <Column ss:Width="150"/><Column ss:Width="130"/><Column ss:Width="190"/><Column ss:Width="90"/>
      <Column ss:Width="100"/><Column ss:Width="100"/><Column ss:Width="110"/><Column ss:Width="120"/>
      <Column ss:Width="120"/><Column ss:Width="120"/><Column ss:Width="140"/><Column ss:Width="140"/>
      <Column ss:Width="130"/><Column ss:Width="130"/><Column ss:Width="155"/><Column ss:Width="150"/>
      <Column ss:Width="155"/><Column ss:Width="360"/>
      ${headerRow(['Parent Sheet Link', 'Part No', 'Classification Profile', 'Quantity Run', 'Length (mm)', 'Width (mm)', 'Thickness (mm)', 'Net Mass (kg)', 'Scrap Mass (kg)', 'Gross Mass (kg)', 'Laser Trace Path (mm)', 'Laser Weld Path (mm)', 'Bending Stroke Sets', 'Bending Cost (INR)', 'Surface Coating Cost (INR)', 'Laser Routing Cost (INR)', 'Punch Tooling Cost (INR)', 'Advanced Manufacturing Process Guidance'])}
      ${componentRows.join('')}
      ${row([
        parentReference,
        'TOTAL',
        'Assembly total',
        structured?.per_part_breakdown?.reduce((total, part) => total + numberSafe(part.per_set_qty || 1), 0) || estimation.items?.reduce((total, item) => total + numberSafe(item.quantity || 1), 0) || 1,
        '-',
        '-',
        '-',
        numberSafe(estimation.summary.totalWeightKg),
        totalScrapWeightKg,
        totalWeightIncludingScrapKg,
        params.cuttingLength || 0,
        params.weldLength || 0,
        params.bendCount || 0,
        structured?.per_part_breakdown?.reduce((total, part) => total + numberSafe(part.calculated_costs?.bending_cost), 0) || 0,
        estimation.surfaceTreatmentCost || 0,
        structured?.assembly_level_fabrication?.grand_total_assembly_cost_via_laser || estimation.summary.totalCost,
        structured?.assembly_level_fabrication?.grand_total_assembly_cost_via_machine || estimation.summary.totalCost,
        'Assembly total includes material, scrap allocation, laser/machine process, bending, welding, tacking, and surface finish where available.',
      ], [3, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], 'TotalRow')}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane></WorksheetOptions>
  </Worksheet>
  <Worksheet ss:Name="Material &amp; Process Rates">
    <Table>
      <Column ss:Width="360"/><Column ss:Width="150"/><Column ss:Width="120"/>
      ${headerRow(['Process Parameters / Raw Stock Classification', 'Base Rate (INR)', 'Unit'])}
      ${row(['Raw material base rate', numberSafe(params.materialRate), 'Per Kg'], [1])}
      ${row(['High Velocity Laser Periphery Cut Path Fee', numberSafe(params.cutRate), 'Per Meter'], [1])}
      ${row(['Turret Punch / Press Cut Strike Fee', numberSafe(params.pressRate), 'Per Stroke'], [1])}
      ${row(['CNC Brake Press Bending Deformation Stroke Fee', numberSafe(params.bendRate), 'Per Bend'], [1])}
      ${row(['Industrial Surface Coating Protection Fee', numberSafe(params.surfaceRate), 'Per Sqm'], [1])}
      ${row(['Structural Manual Weld Seam Labor Fee', numberSafe(params.weldRate), 'Per Meter'], [1])}
      ${row(['Structural Assembly Framing Tacking Jig Setup Fee', numberSafe(params.tackingFixed), 'Fixed'], [1])}
      ${row(['Scrap / Offcut Resale Value', numberSafe(params.scrapRate || 28), 'Per Kg'], [1])}
    </Table>
  </Worksheet>
</Workbook>`;

    const masterBlob = new Blob([masterBomWorkbook], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const masterUrl = URL.createObjectURL(masterBlob);
    const masterLink = document.createElement('a');
    masterLink.href = masterUrl;
    masterLink.download = `${parentReference.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'calibrated-project-master-bom'}-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(masterLink);
    masterLink.click();
    masterLink.remove();
    URL.revokeObjectURL(masterUrl);
    triggerToast('Master BOM Excel downloaded in project summary, component ledger, and rates format.');
    return;

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
      reportRows.push(row(['Structured estimate', step.section, step.name, step.formula, step.substitutedValues, step.result]));
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

  // Handles export formula user action.
  const handleExportFormula = () => {
    if (!estimation) {
      triggerToast('No active calculation to export. Please calculate cost first.');
      return;
    }

    const structured = estimation.structuredBreakdown || structuredBreakdownCache;
    // Handles safe.
    const safe = (value: unknown) => {
      if (value === null || value === undefined || value === '') return '-';
      return String(value);
    };
    // Handles xml escape.
    const xmlEscape = (value: unknown) =>
      safe(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    // Handles cell.
    const cell = (value: unknown, styleId?: string, mergeAcross?: number) => {
      const style = styleId ? ` ss:StyleID="${styleId}"` : '';
      const merge = mergeAcross ? ` ss:MergeAcross="${mergeAcross}"` : '';
      return `<Cell${style}${merge}><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
    };
    // Handles row.
    const row = (values: Array<unknown>, styleId?: string) =>
      `<Row>${values.map(value => cell(value, styleId)).join('')}</Row>`;
    // Handles title row.
    const titleRow = (title: string) => `<Row ss:Height="28">${cell(title, 'Title', 6)}</Row>`;
    // Handles section row.
    const sectionRow = (title: string) => `<Row ss:Height="22">${cell(title, 'Section', 6)}</Row>`;
    // Handles header row.
    const headerRow = (values: Array<unknown>) => row(values, 'Header');
    // Handles blank row.
    const blankRow = () => '<Row />';
    const formulaRows: string[] = [
      titleRow('ikarkhana Formula Export'),
      row(['Generated at', new Date().toLocaleString('en-IN')]),
      row(['Uploaded drawing', estimation.uploadedFile || uploadedImageName || fileName || '-']),
      row(['Part name', structured?.part_name || params.partName || '-']),
      blankRow(),
      sectionRow('Parent And Child Files'),
      headerRow(['File role', 'Drawing / file', 'Status', 'Used for']),
      row(['Parent', estimation.uploadedFile || uploadedImageName || fileName || '-', 'Uploaded', structured?.part_name || params.partName || '-']),
    ];

    referencedDrawings.forEach(drawing => {
      const uploadedName = childDrawingUploads[drawing.drawing_number];
      formulaRows.push(row([
        'Child / dependency',
        uploadedName || drawing.file_name_hint || `${drawing.drawing_number}.tif`,
        uploadedName ? 'Uploaded' : 'Missing',
        drawing.referenced_by_component || drawing.referenced_by_part_number || drawing.reason || 'Referenced detail drawing',
      ]));
    });

    formulaRows.push(blankRow(), sectionRow('Part Formula Trail'), headerRow([
      'File no / source',
      'Part no',
      'Part / component',
      'Formula type',
      'Formula',
      'Values used',
      'Result',
    ]));

    if (structured?.per_part_breakdown?.length) {
      structured.per_part_breakdown.forEach(part => {
        (part.calculation_steps || []).forEach(step => {
          formulaRows.push(row([
            estimation.uploadedFile || uploadedImageName || fileName || '-',
            part.part_number,
            part.component_name || part.tube_type || part.component_type || '-',
            step.section || '-',
            cleanBreakdownText(step.formula),
            cleanBreakdownText(step.substitutedValues),
            cleanBreakdownText(step.result),
          ]));
        });
      });
    }

    (estimation.calculationSteps || []).forEach(step => {
      formulaRows.push(row([
        estimation.uploadedFile || uploadedImageName || fileName || 'Structured estimate',
        '-',
        'Structured estimate',
        step.section,
        cleanBreakdownText(step.formula),
        cleanBreakdownText(step.substitutedValues),
        cleanBreakdownText(step.result),
      ]));
    });

    if (!structured?.per_part_breakdown?.length && !estimation.calculationSteps?.length) {
      formulaRows.push(row(['-', '-', '-', 'No formulas found', '-', '-', '-']));
    }

    const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="16" ss:Color="#FFFFFF"/><Interior ss:Color="#0F172A" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style>
    <Style ss:ID="Section"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#004CCD" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style>
    <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1E40AF" ss:Pattern="Solid"/><Alignment ss:WrapText="1" ss:Vertical="Center"/></Style>
  </Styles>
  <Worksheet ss:Name="Formula Export">
    <Table>
      <Column ss:Width="150"/><Column ss:Width="90"/><Column ss:Width="190"/><Column ss:Width="130"/>
      <Column ss:Width="300"/><Column ss:Width="300"/><Column ss:Width="130"/>
      ${formulaRows.join('')}
    </Table>
  </Worksheet>
</Workbook>`;

    const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const reportName = (params.partName || structured?.part_name || 'formula-export')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    link.href = url;
    link.download = `${reportName || 'formula-export'}-formulas-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    triggerToast('Formula export downloaded with uploaded drawing, child files, part names, and formulas.');
  };

  // Opens breakdown in the workspace.
  const openBreakdown = (title: string, steps: Array<CalculationStep | undefined>) => {
    const validSteps = steps.filter(Boolean) as CalculationStep[];
    if (validSteps.length === 0) {
      triggerToast('No formula trail is available for this value yet.');
      return;
    }
    setSelectedBreakdown({ title, steps: validSteps });
  };

  // Handles find calculation step.
  const findCalculationStep = (name: string) =>
    estimation?.calculationSteps?.find(step => step.name.toLowerCase() === name.toLowerCase());

  // Handles find process step.
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

  // Handles structured steps for.
  const structuredStepsFor = (part: StructuredBreakdown['per_part_breakdown'][number], needles: string[]) => {
    const normalizedNeedles = needles.map(needle => needle.toLowerCase());
    return mapStructuredSteps(part.calculation_steps).filter(step => {
      const haystack = `${step.section} ${step.name}`.toLowerCase();
      return normalizedNeedles.some(needle => haystack.includes(needle));
    });
  };

  // Handles structured step by name.
  const structuredStepByName = (part: StructuredBreakdown['per_part_breakdown'][number], needle: string) => {
    const normalizedNeedle = needle.toLowerCase();
    return mapStructuredSteps(part.calculation_steps).filter(step => step.name.toLowerCase().includes(normalizedNeedle)).slice(0, 1);
  };

  const setGrossWeightBreakdownSteps = (part: StructuredBreakdown['per_part_breakdown'][number]): CalculationStep[] => {
    const unitGross = Number(part.weight_ledger?.unit_gross_rm_weight_kg || 0);
    const qty = Number(part.per_set_qty || 1);
    const total = Number(part.weight_ledger?.total_set_gross_weight_kg || 0);
    return [{
      section: 'Weight',
      name: `Part ${part.part_number} total set gross weight`,
      formula: 'Total set gross weight = unit gross RM weight x quantity',
      substitutedValues: `${unitGross.toFixed(3)} kg x ${qty} pcs`,
      result: `${total.toFixed(3)} kg`,
    }];
  };

  const laserLengthBreakdownSteps = (part: StructuredBreakdown['per_part_breakdown'][number]): CalculationStep[] => {
    const dims = part.dimensions || {};
    const length = Number(dims.length_mm || 0);
    const width = Number(dims.width_or_outer_dia_mm || 0);
    const secondary = Number(dims.secondary_width_mm || 0);
    const laserLength = Number(part.cutting_metrics?.laser_cutting_length_mm || 0);
    const text = `${part.component_type || ''} ${part.tube_type || ''} ${part.component_name || ''}`.toLowerCase();

    if (laserLength <= 0) {
      return [{
        section: 'Process',
        name: `Part ${part.part_number} laser cutting length`,
        formula: 'Laser cutting length was not extracted',
        substitutedValues: 'No visible cut path length found for this part',
        result: '0 mm',
      }];
    }

    if ((text.includes('sheet') || text.includes('plate')) && length > 0 && width > 0) {
      return [{
        section: 'Process',
        name: `Part ${part.part_number} laser cutting length`,
        formula: 'Rectangular cutting length = 2 x (length + width)',
        substitutedValues: `2 x (${length} mm + ${width} mm)`,
        result: `${laserLength} mm`,
      }];
    }

    if ((text.includes('round') || text.includes('circular') || text.includes('dia')) && width > 0) {
      return [{
        section: 'Process',
        name: `Part ${part.part_number} laser cutting length`,
        formula: 'Circular cutting length = pi x diameter',
        substitutedValues: `pi x ${width} mm`,
        result: `${laserLength} mm`,
      }];
    }

    if ((text.includes('square') || text.includes('rect')) && width > 0) {
      const b = secondary > 0 ? secondary : width;
      return [{
        section: 'Process',
        name: `Part ${part.part_number} laser cutting length`,
        formula: 'Profile cutting length = 2 x (outer A + outer B)',
        substitutedValues: `2 x (${width} mm + ${b} mm)`,
        result: `${laserLength} mm`,
      }];
    }

    return [{
      section: 'Process',
      name: `Part ${part.part_number} laser cutting length`,
      formula: 'Laser cutting length = visible cut path length extracted from drawing',
      substitutedValues: `Extracted laser cutting length = ${laserLength} mm`,
      result: `${laserLength} mm`,
    }];
  };

  const singleValueStep = (
    section: string,
    name: string,
    formula: string,
    substitutedValues: string,
    result: string,
  ): CalculationStep => ({
    section,
    name,
    formula,
    substitutedValues,
    result,
  });

  const itemWeightStep = (item?: EstimateLineItem): CalculationStep[] => {
    if (!item) {
      return [
        singleValueStep(
          'Weight',
          'Item weight',
          'Item weight = extracted/calculated item weight',
          'No matching item row was found for this summary value',
          '-',
        ),
      ];
    }
    if (item.formulas?.weight) {
      return [item.formulas.weight];
    }
    return [
      singleValueStep(
        'Weight',
        `${item.name} weight`,
        'Part weight = extracted/calculated item weight',
        `${item.name} weight from costing result`,
        `${item.weightKg.toFixed(3)} kg`,
      ),
    ];
  };

  const itemMaterialCostStep = (item: EstimateLineItem): CalculationStep[] => {
    if (item.formulas?.material) {
      return [item.formulas.material];
    }
    return [
      singleValueStep(
        'Cost',
        `${item.name} material cost`,
        'Material cost = part weight x material rate',
        `${item.weightKg.toFixed(3)} kg x Rs ${params.materialRate}/kg`,
        formatInr(item.materialCost),
      ),
    ];
  };

  const itemScrapBreakdownSteps = (item: EstimateLineItem): CalculationStep[] => {
    const scrapWeight = Number(item.scrapWeightKg || 0);
    const scrapValue = Number(item.scrapValue || (scrapWeight * displayedScrapRate));
    return [
      singleValueStep(
        'Scrap',
        `${item.name} scrap weight`,
        'Scrap weight = stock/offcut weight allocated to this part',
        item.nestingApproach || `${item.name} allocated scrap = ${scrapWeight.toFixed(3)} kg`,
        `${scrapWeight.toFixed(3)} kg`,
      ),
      singleValueStep(
        'Scrap Value',
        `${item.name} scrap value`,
        'Scrap value = scrap weight x scrap rate',
        `${scrapWeight.toFixed(3)} kg x Rs ${displayedScrapRate}/kg`,
        formatInr(scrapValue),
      ),
    ];
  };

  const projectWeightStep = (label: string, unitWeightKg: number, qty: number): CalculationStep[] => [
    singleValueStep(
      'Weight',
      `${label} project total weight`,
      'Project total weight = unit weight x project quantity',
      `${unitWeightKg.toFixed(3)} kg x ${qty}`,
      `${(unitWeightKg * qty).toFixed(3)} kg`,
    ),
  ];

  const accumulatedUnitWeightStep = (): CalculationStep[] => {
    const rows = estimation?.items || [];
    return [
      singleValueStep(
        'Weight',
        'Accumulated unit material weight',
        'Accumulated unit weight = sum of item weights',
        rows.length ? rows.map(item => `${item.weightKg.toFixed(3)} kg`).join(' + ') : 'No item weights available',
        `${Number(estimation?.summary.unitWeightKg || 0).toFixed(3)} kg`,
      ),
    ];
  };

  const accumulatedProjectWeightStep = (): CalculationStep[] => [
    singleValueStep(
      'Weight',
      'Accumulated project material weight',
      'Project material weight = accumulated unit weight x project quantity',
      `${Number(estimation?.summary.unitWeightKg || 0).toFixed(3)} kg x ${Number(estimation?.summary.qty || 1)}`,
      `${Number(estimation?.summary.totalWeightKg || 0).toFixed(3)} kg`,
    ),
  ];

  const processBaseStep = (pd: { name: string; unitCost: number; cost: number }): CalculationStep[] => [
    singleValueStep(
      'Process',
      `${pd.name} base / unit value`,
      'Base / unit = process base value returned by costing engine',
      `${pd.name} base / unit`,
      formatInr(pd.unitCost),
    ),
  ];

  const processCostStep = (pd: { name: string; unitCost: number; cost: number }): CalculationStep[] => {
    const name = pd.name.toLowerCase();
    const structured = estimation?.structuredBreakdown || structuredBreakdownCache;
    const parts = structured?.per_part_breakdown || [];

    if (name.includes('laser')) {
      return [singleValueStep(
        'Process',
        `${pd.name} operational cost`,
        'Laser cutting cost = sum of part laser cutting costs',
        parts.length
          ? parts.map(part => `Rs ${Number(part.calculated_costs?.laser_cutting_cost_estimate || 0).toFixed(2)} x ${Number(part.per_set_qty || 1)}`).join(' + ')
          : `${Number(params.cuttingLength || 0)} mm / 1000 x Rs ${params.cutRate}/m`,
        formatInr(pd.cost),
      )];
    }

    if (name.includes('bend')) {
      return [singleValueStep(
        'Process',
        `${pd.name} operational cost`,
        'Bending cost = sum of part bending costs',
        parts.length
          ? parts.map(part => `Rs ${Number(part.calculated_costs?.bending_cost || 0).toFixed(2)} x ${Number(part.per_set_qty || 1)}`).join(' + ')
          : `${Number(params.bendCount || 0)} bends x Rs ${params.bendRate}/bend`,
        formatInr(pd.cost),
      )];
    }

    if (name.includes('weld')) {
      return [singleValueStep(
        'Process',
        `${pd.name} operational cost`,
        'Welding cost = weld length in meters x welding rate',
        `${Number(params.weldLength || 0)} mm / 1000 x Rs ${params.weldRate}/m`,
        formatInr(pd.cost),
      )];
    }

    if (name.includes('paint')) {
      return [singleValueStep(
        'Process',
        `${pd.name} operational cost`,
        'Painting cost = sum of part painting costs',
        parts.length
          ? parts.map(part => `Rs ${Number(part.calculated_costs?.painting_cost || 0).toFixed(2)} x ${Number(part.per_set_qty || 1)}`).join(' + ')
          : `${formatInr(pd.cost)} from costing engine`,
        formatInr(pd.cost),
      )];
    }

    return [singleValueStep(
      'Process',
      `${pd.name} operational cost`,
      'Operational cost = process value returned by costing engine',
      `${pd.name} cost`,
      formatInr(pd.cost),
    )];
  };

  const processTotalStep = (): CalculationStep[] => {
    const rows = estimation?.processDetails || [];
    return [
      singleValueStep(
        'Process',
        'Operational process total',
        'Operational process total = sum of configured process costs',
        rows.length ? rows.map(pd => `${pd.name}: ${formatInr(pd.cost)}`).join(' + ') : 'No process rows available',
        formatInr(estimation?.summary.processCost || 0),
      ),
    ];
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
    // Handles add.
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
        section: 'Source',
        name: step.name.replace(/^Numbers used for\s+/i, ''),
        formula: cleanBreakdownText(step.formula),
        substitutedValues: valueText,
        result: cleanBreakdownText(step.result),
      },
    ];
  };

  // Handles structured dimensions.
  const structuredDimensions = (part: StructuredBreakdown['per_part_breakdown'][number]) => {
    const dims = part.dimensions || {};
    return [
      dims.length_mm,
      dims.width_or_outer_dia_mm,
      dims.secondary_width_mm,
      dims.thickness_or_wall_thickness_mm,
    ].filter(value => value !== undefined && value !== null && Number(value) > 0).join(' x ') || '-';
  };

  // Handles part dimension badges.
  const partDimensionBadges = (part: StructuredBreakdown['per_part_breakdown'][number]) => {
    const dims = part.dimensions || {};
    const badges: Array<{ label: string; value: string }> = [];
    // Handles add metric.
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

  // Handles part total weight kg.
  const partTotalWeightKg = (part: StructuredBreakdown['per_part_breakdown'][number]) =>
    Number(part.weight_ledger?.unit_net_finished_weight_kg || 0) + Number(part.weight_ledger?.unit_scrap_waste_weight_kg || 0);

  // Renders part image actions UI content.
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

  // Parses nesting numbers values.
  const parseNestingNumbers = (item: EstimateLineItem) => {
    const text = item.nestingApproach || '';
    const floorMatches = [...text.matchAll(/floor\(\s*([\d.]+)\s*\/\s*([\d.]+)\s*\)/g)];
    const piecesMatch = text.match(/=\s*(\d+)\s*(?:pieces|parts)/i);
    const leftoverMatch = text.match(/leftover\s*([\d.]+)\s*mm/i);
    const isSheet = (item.stockForm || item.stockSize || text).toLowerCase().includes('sheet') || text.toLowerCase().includes('2500 x 1250');
    const stockLength = Number(item.stockLengthMm || floorMatches[0]?.[1] || (isSheet ? 2500 : 6000));
    const pieceLength = Number(item.partLengthMm || floorMatches[0]?.[2] || 0);
    const stockWidth = Number(item.stockWidthMm || floorMatches[1]?.[1] || (isSheet ? 1250 : 0));
    const pieceWidth = Number(item.partWidthMm || floorMatches[1]?.[2] || 0);
    return {
      stockLength,
      stockWidth,
      pieceLength,
      pieceWidth,
      pieces: Number(item.partsPerStock || piecesMatch?.[1] || 0),
      leftover: Number(item.leftoverMm ?? leftoverMatch?.[1] ?? 0),
      isSheet,
      canCalculate: Number(item.partsPerStock || piecesMatch?.[1] || 0) > 0 && pieceLength > 0,
    };
  };

  // Renders nesting visual UI content.
  const renderNestingVisual = (item: EstimateLineItem) => {
    const parsed = parseNestingNumbers(item);
    // Formats yield percent for display.
    const formatYieldPercent = (value: number) => `${Math.max(Math.min(value, 100), 0).toFixed(1)}%`;
    if (!parsed.canCalculate) {
      return (
        <div className="space-y-4">
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
            Nesting cannot be calculated for this part because the required stock cutting dimensions were not extracted.
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-[10px] uppercase font-black text-slate-500">Stock type</div>
              <div className="font-mono font-black">{item.stockForm || '-'}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="text-[10px] uppercase font-black text-slate-500">Part length</div>
              <div className="font-mono font-black">{parsed.pieceLength || '-'} mm</div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded">
              <div className="text-[10px] uppercase font-black text-[#004ccd]">Yield per stock</div>
              <div className="font-mono font-black">-</div>
              <div className="mt-1 text-[10px] font-bold text-slate-500">Yield: -</div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded">
              <div className="text-[10px] uppercase font-black text-amber-700">Leftover</div>
              <div className="font-mono font-black">-</div>
            </div>
          </div>
        </div>
      );
    }
    if (parsed.isSheet) {
      const cols = parsed.pieceLength > 0 ? Math.max(Math.floor(parsed.stockLength / parsed.pieceLength), 1) : Math.ceil(Math.sqrt(parsed.pieces));
      const rows = parsed.pieceWidth > 0 ? Math.max(Math.floor(parsed.stockWidth / parsed.pieceWidth), 1) : Math.ceil(parsed.pieces / cols);
      const visibleCols = Math.min(cols, 12);
      const visibleRows = Math.min(rows, 6);
      const shown = visibleCols * visibleRows;
      const stockArea = parsed.stockLength * parsed.stockWidth;
      const usedArea = parsed.pieceLength * parsed.pieceWidth * parsed.pieces;
      const yieldPercent = stockArea > 0 ? (usedArea / stockArea) * 100 : 0;
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
              <div className="mt-1 text-[10px] font-bold text-[#004ccd]">{formatYieldPercent(yieldPercent)} sheet yield</div>
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
            <div className="mt-1 text-[10px] font-bold text-[#004ccd]">{formatYieldPercent(usedPercent)} stock yield</div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded">
            <div className="text-[10px] uppercase font-black text-amber-700">Leftover</div>
            <div className="font-mono font-black">{parsed.leftover} mm</div>
          </div>
        </div>
      </div>
    );
  };

  // Handles has part image region.
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

  // Handles preview image load user action.
  const handlePreviewImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (naturalWidth > 0 && naturalHeight > 0) {
      setPreviewAspectRatio(naturalWidth / naturalHeight);
    }
  };

  // Handles part image region label.
  const partImageRegionLabel = (part: StructuredBreakdown['per_part_breakdown'][number]) =>
    hasPartImageRegion(part) ? (part.image_region?.source || 'Detected part region') : 'Part crop not available';

  // Handles part reference image url.
  const partReferenceImageUrl = (part?: StructuredBreakdown['per_part_breakdown'][number] | null) => {
    // Handles svg to data uri.
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
    // Handles frame open.
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
    // Handles dimension callout.
    const dimensionCallout = (x1: number, y1: number, x2: number, y2: number, label: string) =>
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1f2937" stroke-width="2.4" marker-start="url(#arrow)" marker-end="url(#arrow)"/><rect x="${(x1 + x2) / 2 - 42}" y="${Math.min(y1, y2) - 28}" width="84" height="24" rx="4" fill="#efede6" stroke="#1f2937"/><text x="${(x1 + x2) / 2}" y="${Math.min(y1, y2) - 11}" text-anchor="middle" fill="#111827" font-family="Arial, sans-serif" font-size="14" font-weight="800">${label}</text>`;
    // Handles hole.
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

  // Renders part region annotations UI content.
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
  // Handles clean breakdown text.
  const cleanBreakdownText = (value: string) =>
    String(value || '-')
      .replace(/\bINR\b/g, 'Rs')
      .replace(/kg\/mm3/g, 'kg per mm3')
      .replace(/mm2/g, 'mm squared')
      .replace(/mm3/g, 'mm cubed')
      .replace(/m2/g, 'm squared');

  // Handles simple breakdown meaning.
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
        <div
          className={`fixed top-20 right-6 z-[100] w-[min(460px,calc(100vw-32px))] rounded-xl border shadow-2xl animate-slide-in ${
            toastMessage.kind === 'error'
              ? 'border-red-200 bg-red-50 text-red-950'
              : toastMessage.kind === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-950'
                : toastMessage.kind === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                  : 'border-slate-700 bg-slate-900 text-white'
          }`}
        >
          <div className="flex gap-3 p-4">
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                toastMessage.kind === 'error'
                  ? 'bg-red-100 text-red-700'
                  : toastMessage.kind === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : toastMessage.kind === 'success'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-sky-500/15 text-sky-300'
              }`}
            >
              {toastMessage.kind === 'error' ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black uppercase tracking-wide">{toastMessage.title}</div>
              <div className="mt-1 text-sm font-semibold leading-5">{toastMessage.message}</div>
              {toastMessage.kind === 'error' && (
                <div className="mt-3 rounded-lg border border-red-200 bg-white/70 px-3 py-2 text-xs font-semibold text-red-900">
                  Please upload a clear technical drawing with title block, BOM, dimensions, and line work.
                </div>
              )}
            </div>
            <button
              className="shrink-0 rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
              onClick={() => setToastMessage(null)}
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <CalculationBreakdownModal
        selectedBreakdown={selectedBreakdown}
        onClose={() => setSelectedBreakdown(null)}
        cleanBreakdownText={cleanBreakdownText}
        simpleBreakdownMeaning={simpleBreakdownMeaning}
        onOpenStepSource={(title, step) => setSelectedBreakdown({
          title,
          steps: valueSourceBreakdownSteps(step),
        })}
      />

      {isDependencySummaryOpen && (
        <div className="fixed inset-0 z-[122] bg-slate-950/45 flex items-center justify-center p-4" onClick={() => setIsDependencySummaryOpen(false)}>
          <div
            className="w-full max-w-2xl max-h-[82vh] bg-white border border-[#c3c6d8] rounded-xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-50 border-b border-[#c3c6d8] flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-[#004ccd]">Drawing Dependency Summary</div>
                <h3 className="text-base font-black text-slate-900">Drawing & Child Files</h3>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                onClick={() => setIsDependencySummaryOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar space-y-4">
              <div className="p-4 border border-blue-100 bg-blue-50/70 rounded-lg">
                <div className="text-[10px] uppercase font-black tracking-wider text-[#004ccd]">Uploaded drawing</div>
                <div className="mt-1 font-mono text-sm font-black text-slate-950">{uploadedImageName || fileName || estimation?.uploadedFile || '-'}</div>
                <div className="mt-1 text-xs text-slate-600">{estimation?.structuredBreakdown?.part_name || structuredBreakdownCache?.part_name || params.partName || 'Current drawing'}</div>
                {(filePreview || uploadedImageData) && (
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded bg-white hover:bg-blue-50 border border-blue-200 text-[#004ccd] text-[10px] font-black uppercase tracking-wider"
                    onClick={() => {
                      setSelectedReferencePreview(filePreview || uploadedImageData);
                      setSelectedReferencePart(null);
                    }}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    View drawing image
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="text-[10px] uppercase font-black tracking-wider text-slate-500">Child / dependency files</div>
                {referencedDrawings.length === 0 && (
                  <div className="p-4 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500">
                    No referenced child drawings were detected for this file.
                  </div>
                )}
                {referencedDrawings.map((drawing) => {
                  const uploadedName = childDrawingUploads[drawing.drawing_number];
                  const uploadedImage = childDrawingImages[drawing.drawing_number];
                  const isMissing = drawing.required_for_costing !== false && !uploadedName;
                  return (
                    <div
                      key={`dependency-summary-${drawing.drawing_number}`}
                      className={`p-4 rounded-lg border ${isMissing ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <div className={`text-[10px] uppercase font-black tracking-wider ${isMissing ? 'text-red-700' : 'text-emerald-700'}`}>
                            {isMissing ? 'Missing child file' : 'Attached child file'}
                          </div>
                          <div className="mt-1 font-mono text-sm font-black text-slate-950 truncate">
                            {uploadedName || drawing.file_name_hint || `${drawing.drawing_number}.tif`}
                          </div>
                          <div className="mt-1 text-xs text-slate-700">
                            {drawing.referenced_by_component || drawing.referenced_by_part_number || 'Referenced child detail'}
                          </div>
                          {drawing.reason && (
                            <div className="mt-2 text-[11px] leading-relaxed text-slate-600">{drawing.reason}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-[9px] uppercase font-black ${isMissing ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {isMissing ? 'Needed' : 'Attached'}
                          </span>
                          {isMissing && (
                            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded bg-[#004ccd] hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider transition-colors">
                              <Upload className="w-3.5 h-3.5" />
                              Upload
                              <input
                                type="file"
                                accept=".tif,.tiff,.pdf,.png,.jpg,.jpeg"
                                className="hidden"
                                onChange={(event) => handleChildDrawingUpload(drawing.drawing_number, event.target.files?.[0])}
                              />
                            </label>
                          )}
                          {!isMissing && uploadedImage && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider transition-colors"
                              onClick={() => {
                                setSelectedReferencePreview(uploadedImage);
                                setSelectedReferencePart(null);
                              }}
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                              View image
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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

      <NestingVisualModal
        item={selectedNestingItem}
        onClose={() => setSelectedNestingItem(null)}
        renderNestingVisual={renderNestingVisual}
        formatInr={formatInr}
        onOpenBreakdown={openBreakdown}
        nestingValueBreakdownSteps={nestingValueBreakdownSteps}
      />

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

        {currentScreen === 'workspace' && (
          <ExportActions
            currentScreen={currentScreen}
            avatarUrl={DEFAULT_AVATAR_URL}
            showBackToFileList={batchUploadFiles.length > 0 && isBatchReady}
            onBackToFileList={() => {
              setCurrentScreen('landing');
              setActiveTab('projects');
              setIsBatchReady(true);
              setIsBatchScanning(false);
              setIsAnalyzing(false);
            }}
            onLoadSampleOrChangeFile={() => {
              setCurrentScreen('landing');
              setActiveTab('projects');
            }}
            onExportReport={handleExport}
            onExportFormula={handleExportFormula}
          />
        )}
      </header>

      {/* Main Content Area */}
      {currentScreen === 'landing' ? (
        /* SCREEN 1: LANDING & FILE INGESTION */
        <main className="flex-grow flex flex-col items-center justify-start p-6 bg-slate-50">
          <div className="w-full max-w-7xl space-y-8 animate-fade-in">
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
              <h2 className="text-xl font-bold text-slate-900 mb-1">Upload Drawing File, Multiple Files, or ZIP</h2>
              <p className="text-xs text-[#424656] mb-8 font-medium">
                Supported formats:{' '}
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">TIFF</span>,{' '}
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">PNG</span>,{' '}
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">PDF</span>,{' '}
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">DWG</span>,{' '}
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">ZIP</span>
              </p>

              {/* Action Buttons */}
              <div className="w-full max-w-sm">
                <button 
                  className="w-full flex flex-col items-center justify-center gap-2 px-6 py-4 bg-[#004ccd] text-white font-semibold text-xs uppercase tracking-wider rounded shadow hover:bg-[#0f62fe] transition-all active:scale-[0.98]"
                  onClick={() => uploadInputRef.current?.click()}
                >
                  <Upload className="w-5 h-5" />
                  Upload Drawing Set
                  <span className="text-[10px] normal-case tracking-normal font-medium text-blue-100">Single, multiple files, or ZIP</span>
                </button>
              </div>

              {/* Hidden file input */}
              <input 
                ref={uploadInputRef}
                type="file" 
                accept=".tif,.tiff,.png,.jpg,.jpeg,.pdf,.dwg,.zip"
                multiple
                className="hidden"
                onChange={handleUploadInput}
              />

              {(isUploadExpanding || (batchUploadFiles.length > 0 && isBatchScanning)) && (
                <div className="mt-8 w-full max-w-6xl overflow-hidden rounded-2xl bg-slate-950 border border-blue-900/60 p-8 text-left shadow-2xl">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-300/30 text-cyan-100 text-[10px] font-black uppercase tracking-widest">
                        <Sparkles className="w-3.5 h-3.5" />
                        Motion batch scan
                      </div>
                      <h3 className="mt-3 text-xl font-black text-white">
                        {isUploadExpanding ? 'Preparing uploaded drawing set' : 'Scanning uploaded drawing set'}
                      </h3>
                      <p className="mt-1 text-xs text-cyan-100/70">
                        {isUploadExpanding
                          ? 'Reading ZIP/multiple files and preparing previews for extraction.'
                          : 'Identifying uploaded drawings and child dependency files before extraction.'}
                      </p>
                    </div>
                    <div className="font-mono text-xs text-cyan-100/80">{batchUploadFiles.length || uploadPreparingCount} files queued</div>
                  </div>

                  <div className="relative h-[340px] rounded-xl border border-cyan-300/15 bg-slate-900 overflow-hidden">
                    <div className="absolute inset-0 opacity-25 bg-[linear-gradient(90deg,_rgba(34,211,238,0.12)_1px,_transparent_1px),linear-gradient(0deg,_rgba(34,211,238,0.10)_1px,_transparent_1px)] bg-[size:42px_42px]"></div>
                    <div className="absolute inset-y-8 left-8 w-48 rounded-xl border border-cyan-300/20 bg-slate-950/70 p-4">
                      <div className="text-[10px] uppercase font-black tracking-widest text-cyan-100/80">Uploaded drawings</div>
                      <div className="mt-4 space-y-2">
                        {batchFilesForCalculation().slice(0, 4).map((file, index) => (
                          <motion.div
                            key={`main-stack-${file.name}`}
                            className="h-9 rounded border border-emerald-300/40 bg-emerald-400/10 px-3 flex items-center text-[10px] font-mono text-emerald-100 truncate"
                            initial={{ opacity: 0, x: 70 }}
                            animate={{ opacity: [0, 1, 1], x: [70, 0, 0] }}
                            transition={{ duration: 1.2, delay: 0.45 + index * 0.25, repeat: Infinity, repeatDelay: 2.8 }}
                          >
                            {file.name}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="absolute inset-y-8 right-8 w-48 rounded-xl border border-cyan-300/20 bg-slate-950/70 p-4">
                      <div className="text-[10px] uppercase font-black tracking-widest text-cyan-100/80">Dependencies</div>
                      <div className="mt-4 space-y-2">
                        {batchUploadFiles.filter(file => expectedChildBaseSetForBatch().has(drawingBase(file.name))).slice(0, 4).map((file, index) => (
                          <motion.div
                            key={`dep-stack-${file.name}`}
                            className="h-9 rounded border border-blue-300/40 bg-blue-400/10 px-3 flex items-center text-[10px] font-mono text-blue-100 truncate"
                            initial={{ opacity: 0, x: -70 }}
                            animate={{ opacity: [0, 1, 1], x: [-70, 0, 0] }}
                            transition={{ duration: 1.2, delay: 0.65 + index * 0.25, repeat: Infinity, repeatDelay: 2.8 }}
                          >
                            {file.name}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="absolute left-1/2 top-1/2 w-64 h-44 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-cyan-200/30 bg-slate-950/85 shadow-[0_0_80px_rgba(34,211,238,0.22)] flex items-center justify-center">
                      <motion.div
                        className="absolute inset-5 rounded-xl border border-cyan-300/20"
                        animate={{ rotate: [0, 180, 360] }}
                        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
                      />
                      <motion.div
                        className="absolute h-36 w-1 rounded-full bg-cyan-300 shadow-[0_0_28px_rgba(103,232,249,0.9)]"
                        animate={{ rotate: [0, 90, 180, 270, 360] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <div className="relative z-10 text-center">
                        <motion.div
                          className="mx-auto h-16 w-16 rounded-full border border-cyan-300/40 bg-cyan-300/10 flex items-center justify-center"
                          animate={{ scale: [1, 1.08, 1], boxShadow: ['0 0 0 rgba(34,211,238,0)', '0 0 36px rgba(34,211,238,0.35)', '0 0 0 rgba(34,211,238,0)'] }}
                          transition={{ duration: 1.4, repeat: Infinity }}
                        >
                          <FileJson className="w-7 h-7 text-cyan-100" />
                        </motion.div>
                        <div className="mt-3 text-[10px] uppercase font-black tracking-widest text-cyan-100">Classifier</div>
                      </div>
                    </div>

                    {batchUploadFiles.slice(0, 6).map((file, index) => (
                      <motion.div
                        key={`orbit-file-${file.name}`}
                        className="absolute left-1/2 top-1/2 w-28 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100/30 bg-white/10 backdrop-blur px-3 flex items-center justify-center text-[9px] font-mono text-cyan-50 truncate"
                        animate={{
                          x: [0, Math.cos(index) * 155, 0],
                          y: [0, Math.sin(index * 1.3) * 95, 0],
                          opacity: [0, 1, 0],
                          scale: [0.85, 1, 0.85],
                        }}
                        transition={{ duration: 2.6, delay: index * 0.22, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        {file.name}
                      </motion.div>
                    ))}

                    <div className="absolute inset-x-0 bottom-5 text-center font-mono text-[11px] text-cyan-100/80">
                      {isUploadExpanding
                        ? 'Expanding files and preparing drawing previews...'
                        : 'Classifying drawing relationships before opening extraction...'}
                    </div>
                  </div>
                </div>
              )}

              {batchUploadFiles.length > 0 && !isBatchScanning && isBatchReady && (
                <div className="mt-8 w-full max-w-5xl text-left bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-[#004ccd]">Batch files processing</div>
                      <div className="text-xs text-slate-600 mt-1">Every uploaded file is processed asynchronously. Click a processed file to open its extraction table.</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-[#004ccd] hover:bg-[#0f62fe] text-white rounded text-[10px] font-black uppercase tracking-wider disabled:bg-slate-300 disabled:cursor-not-allowed"
                        disabled={!Object.values(batchProcessingResults).some(result => result.status === 'processed')}
                        onClick={handleExportBatchMasterBom}
                      >
                        Download Batch Excel
                      </button>
                      <span className="text-[10px] uppercase font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded">
                        {Object.values(batchProcessingResults).filter(result => result.status === 'processed').length}/{batchUploadFiles.length} processed
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {batchUploadFiles.map((file) => {
                      const childCount = childFilesForParent(file).length;
                      const missingChildCount = missingChildHintsForFile(file, batchUploadFiles, batchDependencyHints).length;
                      const batchResult = batchProcessingResults[file.name];
                      const status = batchResult?.status || 'queued';
                      const statusClass = status === 'processed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : status === 'processing'
                          ? 'bg-blue-50 text-[#004ccd] border-blue-100'
                          : status === 'error'
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : 'bg-slate-50 text-slate-500 border-slate-200';
                      return (
                        <button
                          key={`main-file-ready-${file.name}`}
                          type="button"
                          className={`w-full p-4 rounded-lg border text-left transition-colors flex items-center justify-between gap-4 ${
                            status === 'processed'
                              ? 'border-emerald-200 hover:border-[#004ccd] hover:bg-blue-50/60'
                              : status === 'error'
                                ? 'border-red-200 bg-red-50/40'
                                : 'border-slate-200 bg-slate-50 cursor-wait'
                          }`}
                          onClick={() => void openBatchFile(file)}
                        >
                          <div className="min-w-0">
                            <div className="font-mono text-sm font-black text-slate-950 truncate">{file.name}</div>
                            {missingChildCount > 0 && (
                              <div className="mt-1 text-[10px] font-semibold text-amber-700">{missingChildCount} missing child file{missingChildCount === 1 ? '' : 's'}; processed with available files</div>
                            )}
                            {batchResult?.error && <div className="mt-1 text-[10px] text-red-700">{batchResult.error}</div>}
                            <div className="mt-1 text-[10px] text-slate-500">{file.sizeMb} • {childCount} child file{childCount === 1 ? '' : 's'} attached</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] uppercase font-black border px-2 py-1 rounded ${statusClass}`}>
                              {status === 'processing' ? 'Processing' : status === 'processed' ? 'Processed' : status === 'error' ? 'Error' : 'Queued'}
                            </span>
                            {status === 'processing' ? (
                              <RefreshCw className="w-4 h-4 text-[#004ccd] animate-spin flex-shrink-0" />
                            ) : status === 'error' ? (
                              <span
                                role="button"
                                tabIndex={0}
                                className="inline-flex items-center justify-center w-8 h-8 rounded border border-red-200 bg-white text-red-700 hover:bg-red-50"
                                title="Retry this file"
                                onClick={(event) => void retryBatchFile(file, event)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.stopPropagation();
                                    void retryBatchFile(file);
                                  }
                                }}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </span>
                            ) : (
                              <ArrowRight className="w-4 h-4 text-[#004ccd] flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-black uppercase tracking-wider text-slate-700"
                      onClick={() => {
                        setIsBatchReady(false);
                        setIsBatchScanning(false);
                      }}
                    >
                      Back to file batch
                    </button>
                  </div>
                </div>
              )}

              {batchUploadFiles.length > 0 && !isBatchScanning && !isBatchReady && (
                <div className="mt-8 w-full max-w-7xl text-left bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-2">
                    <div className="flex items-center gap-2">
                      {isBatchDependencyScanning && (
                        <span className="text-[10px] uppercase font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                          Finding dependencies
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-black text-slate-500">{batchUploadFiles.length} files staged</span>
                    </div>
                  </div>

                  <div className="space-y-3 pr-1">
                    <div className="grid grid-cols-[280px_1fr] gap-4 px-1 text-[10px] uppercase font-black text-slate-500">
                      <div>Uploaded file</div>
                      <div className="flex items-center justify-between gap-2">
                        <span>Child / dependency files used by this drawing</span>
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
                      const expectedChildBases = expectedChildBaseSetForBatch();
                      const isDependencyFile = expectedChildBases.has(drawingBase(file.name));
                      const referencedByParents = batchUploadFiles.filter(parent => (
                        parent.name !== file.name &&
                        expectedChildFileHints(parent.name).some(hint => fileMatchesHint(file, hint))
                      ));
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
                          className={`grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 p-3 rounded-lg border transition-colors ${
                            isDependencyFile
                              ? 'bg-emerald-50 border-emerald-300'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="min-w-0">
                              <div className={`text-sm font-black truncate ${isDependencyFile ? 'text-emerald-800' :  'text-slate-900'}`}>{file.name}</div>
                              <div className="text-[10px] font-mono text-slate-500">{file.sizeMb}</div>
                              <div className="mt-1 text-[9px] uppercase font-black text-[#004ccd]">uploaded drawing</div>
                              {isDependencyFile && (
                                <div className="mt-1 text-[9px] uppercase font-black text-emerald-700">also used as dependency</div>
                              )}
                            </div>
                          </div>

                          <div className="min-w-0">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                              {isDependencyFile && (
                                <div className="w-full p-4 rounded-lg border transition-colors bg-emerald-100/70 border-emerald-300 shadow-sm">
                                  <div className="text-[9px] uppercase font-black text-emerald-700">Dependency uploaded</div>
                                  <div className="text-base font-black text-slate-900 truncate mt-1">{file.name}</div>
                                  <div className="text-[10px] text-emerald-800 mt-1">
                                    Used by {referencedByParents.length > 0 ? referencedByParents.map(parent => parent.name).join(', ') : 'an uploaded drawing'}
                                  </div>
                                </div>
                              )}
                              {missingExpectedChildren.map((hint) => (
                                <label
                                  key={`missing-child-${file.name}-${hint}`}
                                  className="w-full p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors bg-red-50 border-red-300 hover:bg-red-100"
                                >
                                  <div className="text-[9px] uppercase font-black text-red-700">Missing child file</div>
                                  <div className="text-base font-black text-red-900 truncate mt-1">{hint}</div>
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
                                  className="w-full p-4 rounded-lg border transition-colors bg-emerald-50 border-emerald-300 shadow-sm"
                                >
                                  <div className="text-[9px] uppercase font-black text-emerald-700">Dependency uploaded</div>
                                  <div className="text-base font-black text-slate-900 truncate mt-1">{child.name || 'Unnamed child file'}</div>
                                  <div className="text-[10px] font-mono text-slate-500 mt-1">{child.sizeMb}</div>
                                </div>
                              ))}
                              {!isDependencyFile && rowChildren.length === 0 && missingExpectedChildren.length === 0 && (
                                <div className="w-full p-4 bg-white border border-dashed border-slate-300 rounded-lg text-xs text-slate-500">
                                  {isBatchDependencyScanning ? 'Checking child/detail references...' : 'No known child/detail dependency for this drawing.'}
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
                        setIsBatchReady(false);
                        setIsBatchScanning(false);
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
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 h-8 w-8 rounded bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-4 h-4 text-amber-700" />
                          </div>
                          <div>
                            <h3 className="font-black text-xs uppercase tracking-widest text-amber-900">Referenced child drawings found</h3>
                            <p className="text-xs text-amber-900/75 mt-1">
                              Uploaded drawing: <span className="font-mono font-black">{uploadedImageName || fileName || estimation?.uploadedFile || '-'}</span>. {referencedDrawings.length} child/reference file{referencedDrawings.length > 1 ? 's' : ''} detected.
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-amber-100 border border-amber-300 rounded text-[10px] font-black uppercase tracking-wider text-amber-900 transition-colors"
                            onClick={() => setIsDependencySummaryOpen(true)}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View drawing & child files
                          </button>
                          {missingReferencedDrawings.length > 0 && (
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
                          )}
                        </div>
                      </div>

                      {hasBlockingMissingChildDrawings && (
                        <div className="mt-3 text-[11px] text-amber-900 bg-amber-100/70 border border-amber-200 rounded px-3 py-2">
                          Cost calculation is paused until you upload the missing child file or click “Calculate without missing file”.
                        </div>
                      )}
                      {allowMissingChildDrawings && missingReferencedDrawings.length > 0 && (
                        <div className="mt-3 text-[11px] text-slate-600 bg-white border border-amber-200 rounded px-3 py-2">
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
                                              onClick={() => openBreakdown(`Part ${part.part_number} Surface Area`, structuredStepByName(part, 'surface area'))}
                                            >
                                              {part.surface_area_sq_meter.toFixed(4)} m2
                                            </button>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Bends</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-slate-800`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Bends`, structuredStepByName(part, 'bending cost'))}
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
                                              onClick={() => openBreakdown(`Part ${part.part_number} Net Finished Weight`, structuredStepByName(part, 'net weight'))}
                                            >
                                              {part.weight_ledger.unit_net_finished_weight_kg.toFixed(3)} kg
                                            </button>
                                          </div>
                                          <div className="p-2 bg-amber-50/60 rounded border border-amber-100">
                                            <div className="text-[9px] uppercase font-bold text-amber-700">Scrap / Waste</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-amber-900`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Scrap / Waste`, structuredStepByName(part, 'scrap resale value'))}
                                            >
                                              {part.weight_ledger.unit_scrap_waste_weight_kg.toFixed(3)} kg
                                            </button>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Gross RM Weight</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-slate-800`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Gross RM Weight`, structuredStepByName(part, 'gross rm weight'))}
                                            >
                                              {part.weight_ledger.unit_gross_rm_weight_kg.toFixed(3)} kg
                                            </button>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Total Set Gross</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-slate-800`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Set Gross Weight`, setGrossWeightBreakdownSteps(part))}
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
                                            onClick={() => openBreakdown(`Part ${part.part_number} Laser Cutting Length`, laserLengthBreakdownSteps(part))}
                                            >
                                              {part.cutting_metrics.laser_cutting_length_mm} mm
                                            </button>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Press Machine Hits</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-slate-800`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Press Machine Hits`, structuredStepByName(part, 'press cutting cost'))}
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
                                              onClick={() => openBreakdown(`Part ${part.part_number} Material Cost`, structuredStepByName(part, 'material cost'))}
                                            >
                                              {formatInr(part.calculated_costs.material_cost)}
                                            </button>
                                          </div>
                                          <div className="p-2 bg-blue-50/60 rounded border border-blue-100">
                                            <div className="text-[9px] uppercase font-bold text-[#004ccd]">Laser Cost</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-[#004ccd]`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Laser Cost`, structuredStepByName(part, 'laser cutting cost'))}
                                            >
                                              {formatInr(part.calculated_costs.laser_cutting_cost_estimate)}
                                            </button>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Machine Cost</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-slate-800`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Machine Cost`, structuredStepByName(part, 'press cutting cost'))}
                                            >
                                              {formatInr(part.calculated_costs.machine_punching_cost_estimate)}
                                            </button>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Bending + Painting</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-slate-800`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Bending + Painting`, [...structuredStepByName(part, 'bending cost'), ...structuredStepByName(part, 'painting cost')])}
                                            >
                                              {formatInr(part.calculated_costs.bending_cost)} + {formatInr(part.calculated_costs.painting_cost)}
                                            </button>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Single via Laser</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-slate-800`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Single via Laser`, structuredStepByName(part, 'total via laser'))}
                                            >
                                              {formatInr(part.calculated_costs.total_single_part_cost_via_laser)}
                                            </button>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                            <div className="text-[9px] uppercase font-bold text-slate-400">Single via Machine</div>
                                            <button
                                              type="button"
                                              className={`${valueButtonClass} font-mono text-xs text-slate-800`}
                                              onClick={() => openBreakdown(`Part ${part.part_number} Single via Machine`, structuredStepByName(part, 'total via machine'))}
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
                                    <button type="button" className={valueButtonClass} onClick={() => openBreakdown('Main Profile Weight', itemWeightStep(estimation.items?.[0]))}>
                                      {estimation.summary.profileWeightKg.toFixed(3)} kg
                                    </button>
                                  </td>
                                  <td className="p-2.5 text-right">
                                    <button type="button" className={valueButtonClass} onClick={() => openBreakdown('Main Profile Total Weight', projectWeightStep('Main profile', estimation.summary.profileWeightKg, estimation.summary.qty))}>
                                      {(estimation.summary.profileWeightKg * estimation.summary.qty).toFixed(3)} kg
                                    </button>
                                  </td>
                                </tr>
                                {estimation.summary.topPlateWeightKg > 0 && (
                                  <tr>
                                    <td className="p-2.5 font-sans font-medium text-slate-900">Top Inlay Plate</td>
                                    <td className="p-2.5 text-right">
                                      <button type="button" className={valueButtonClass} onClick={() => openBreakdown('Top Plate Weight', itemWeightStep(estimation.items?.find(item => item.name.toLowerCase().includes('top'))))}>
                                        {estimation.summary.topPlateWeightKg.toFixed(3)} kg
                                      </button>
                                    </td>
                                    <td className="p-2.5 text-right">
                                      <button type="button" className={valueButtonClass} onClick={() => openBreakdown('Top Plate Total Weight', projectWeightStep('Top plate', estimation.summary.topPlateWeightKg, estimation.summary.qty))}>
                                        {(estimation.summary.topPlateWeightKg * estimation.summary.qty).toFixed(3)} kg
                                      </button>
                                    </td>
                                  </tr>
                                )}
                                {estimation.summary.bottomPlateWeightKg > 0 && (
                                  <tr>
                                    <td className="p-2.5 font-sans font-medium text-slate-900">Bottom Support Plate</td>
                                    <td className="p-2.5 text-right">
                                      <button type="button" className={valueButtonClass} onClick={() => openBreakdown('Bottom Plate Weight', itemWeightStep(estimation.items?.find(item => item.name.toLowerCase().includes('bottom'))))}>
                                        {estimation.summary.bottomPlateWeightKg.toFixed(3)} kg
                                      </button>
                                    </td>
                                    <td className="p-2.5 text-right">
                                      <button type="button" className={valueButtonClass} onClick={() => openBreakdown('Bottom Plate Total Weight', projectWeightStep('Bottom plate', estimation.summary.bottomPlateWeightKg, estimation.summary.qty))}>
                                        {(estimation.summary.bottomPlateWeightKg * estimation.summary.qty).toFixed(3)} kg
                                      </button>
                                    </td>
                                  </tr>
                                )}
                                <tr className="bg-slate-50 font-bold text-slate-900">
                                  <td className="p-2.5 font-sans">Accumulated Material Total</td>
                                  <td className="p-2.5 text-right">
                                    <button type="button" className={valueButtonClass} onClick={() => openBreakdown('Accumulated Material Weight', accumulatedUnitWeightStep())}>
                                      {estimation.summary.unitWeightKg.toFixed(3)} kg
                                    </button>
                                  </td>
                                  <td className="p-2.5 text-right">
                                    <button type="button" className={valueButtonClass} onClick={() => openBreakdown('Total Material Weight', accumulatedProjectWeightStep())}>
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
                                        <button type="button" className={valueButtonClass} onClick={() => openBreakdown(`${item.name} Weight`, itemWeightStep(item))}>
                                          {item.weightKg.toFixed(3)} kg
                                        </button>
                                      </td>
                                      <td className="p-2.5 text-right">
                                        <button type="button" className={valueButtonClass} onClick={() => openBreakdown(`${item.name} Material Cost`, itemMaterialCostStep(item))}>
                                          {formatInr(item.materialCost)}
                                        </button>
                                      </td>
                                      <td className="p-2.5 text-right">{item.partsPerStock ? `${item.partsPerStock}/${item.stockForm}` : '-'}</td>
                                      <td className="p-2.5 text-right">
                                        {item.scrapWeightKg ? (
                                          <button type="button" className={valueButtonClass} onClick={() => openBreakdown(`${item.name} Scrap`, itemScrapBreakdownSteps(item))}>
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
                                        <button type="button" className={valueButtonClass} onClick={() => openBreakdown(`${pd.name} Base / Unit`, processBaseStep(pd))}>
                                          {formatInr(pd.unitCost)}
                                        </button>
                                      </td>
                                      <td className="p-2.5 text-right font-bold text-slate-900">
                                        <button type="button" className={valueButtonClass} onClick={() => openBreakdown(`${pd.name} Cost`, processCostStep(pd))}>
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
                                        onClick={() => openBreakdown('Operational Process Total', processTotalStep())}
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



