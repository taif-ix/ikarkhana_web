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
  LayoutDashboard
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
}

interface CalculationStep {
  section: string;
  name: string;
  formula: string;
  substitutedValues: string;
  result: string;
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

  // AI Extraction logging & analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisLogs, setAnalysisLogs] = useState<string[]>([]);
  const [apiSource, setApiSource] = useState<'simulation_fallback' | 'gemini_api' | null>(null);

  // zoom preview
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  // Convert uploaded drawing to base64 preview and run extraction pipeline
  const processSelectedFile = (file: File) => {
    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFilePreview(base64String);
      runExtractionPipeline(base64String, file.name);
    };
    reader.readAsDataURL(file);
  };

  // Select sample drawing instantly
  const handleSelectSample = () => {
    setFileName('Chassis_Bracket_Drawing_v2.4.dwg');
    setFileSize('4.25 MB');
    setFilePreview(DEFAULT_IMAGE_URL);
    runExtractionPipeline(DEFAULT_IMAGE_URL, 'Chassis_Bracket_Drawing_v2.4.dwg');
  };

  // Pipeline simulation or real Gemini extraction
  const runExtractionPipeline = async (imgData: string, name: string) => {
    setIsAnalyzing(true);
    setAnalysisLogs([]);
    setCurrentScreen('workspace');
    setActiveTab('estimator');
    setSidebarTab('estimator');

    const logs = [
      'Initializing Secure Engineering pipeline v2.4.0...',
      'Detecting visual drawing bounds...',
      'Running optical character recognition (OCR) on title block...',
      'Extracting dimensional geometric definitions...',
      'Comparing with Standards v2024 pricing metrics...'
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 550));
      setAnalysisLogs(prev => [...prev, logs[i]]);
    }

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
        setAnalysisLogs(prev => [...prev, '✓ OCR parsing successful! Parameters matching ' + result.data.partName + ' extracted.']);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setAnalysisLogs(prev => [...prev, '⚠ Parameter extraction service failed. Loaded sample blueprint layout.']);
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
        processes: ['Cutting', 'Welding', 'Surface', 'Bending']
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Manual extract trigger in workspace
  const handleManualExtract = () => {
    runExtractionPipeline(filePreview, fileName || 'Manual_Extract_Drawing.dwg');
  };

  // Trigger costing calculations
  const calculateCost = async () => {
    setIsCalculating(true);
    try {
      const response = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const result = await response.json();
      if (result.success) {
        setEstimation(result);
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
    const reportData = {
      timestamp: new Date().toLocaleString(),
      parameters: params,
      estimation: estimation.summary,
      processes: estimation.processDetails
    };
    
    // Copy JSON report to clipboard
    navigator.clipboard.writeText(JSON.stringify(reportData, null, 2));
    triggerToast('Technical costing report copied to clipboard as JSON!');
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
                className="hidden"
                onChange={handleFileInput}
              />

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
          <aside className="hidden lg:flex flex-col w-64 bg-[#f3f3f3] border-r border-[#c3c6d8] flex-shrink-0">
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
            <div className="flex-1 overflow-hidden grid grid-cols-12">
              {/* Left Column: Form parameters panel */}
              <section className="col-span-12 xl:col-span-7 bg-white border-r border-[#c3c6d8] flex flex-col h-full overflow-hidden">
                {/* Panel Header */}
                <div className="px-6 py-4 border-b border-[#c3c6d8] bg-slate-50 flex justify-between items-center flex-shrink-0">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Technical Parameters</h2>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">ASME Sec VIII Material Matrix</p>
                  </div>
                  <button 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f62fe] hover:bg-blue-700 text-white rounded text-xs font-bold transition-all shadow-sm"
                    onClick={handleManualExtract}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {isAnalyzing ? 'Extracting...' : 'Extract From Diagram'}
                  </button>
                </div>

                {/* Parameters Form fields list */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                  {/* Analysis Logs visualization while computing */}
                  {analysisLogs.length > 0 && (
                    <div className="p-4 bg-slate-900 text-slate-100 rounded border border-slate-700 space-y-2 font-mono text-[11px] leading-relaxed relative">
                      <div className="flex justify-between items-center pb-1 border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        <span>Parser Log Stream</span>
                        {isAnalyzing && <span className="animate-pulse text-yellow-400">● analyzing</span>}
                      </div>
                      <div className="space-y-1 max-h-[140px] overflow-y-auto custom-scrollbar">
                        {analysisLogs.map((log, index) => (
                          <div key={index} className="flex gap-2">
                            <span className="text-slate-500">[{index + 1}]</span>
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                      {[
                        ['Handle OD', 'handleOd'],
                        ['Handle thick', 'handleThickness'],
                        ['Handle length', 'handleLength'],
                        ['Angle kg/m', 'angleWeightPerM'],
                        ['Angle length', 'angleLength'],
                        ['Screw dia', 'screwDia'],
                        ['Screw length', 'screwLength'],
                        ['Screw qty', 'screwQty'],
                      ].map(([label, key]) => (
                        <div className="space-y-1" key={key}>
                          <label className="text-xs font-sans font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full bg-slate-50 border border-[#c3c6d8] px-3 py-2 rounded focus:bg-white outline-none focus:border-[#004ccd] transition-all"
                            placeholder="-"
                            value={String(params[key as keyof TechnicalParams] || '')}
                            onChange={(e) => handleParamChange(key as keyof TechnicalParams, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-slate-200"></div>

                  {/* SECTION 5: PROCESS DEFINITION */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#004ccd]">
                      <Wrench className="w-4 h-4 text-[#004ccd]" />
                      <h3 className="font-bold text-xs uppercase tracking-widest text-[#004ccd]">Process Definition</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                      {[
                        ['Total cut length mm', 'cuttingLength'],
                        ['Cut surfaces', 'cuttingSurfaceCount'],
                        ['Cut rate INR/m', 'cutRate'],
                        ['Weld length mm', 'weldLength'],
                        ['Weld labor INR/m', 'weldRate'],
                        ['Surface INR/m2', 'surfaceRate'],
                        ['Bend count', 'bendCount'],
                        ['Bend INR/stroke', 'bendRate'],
                        ['Press hits', 'pressHits'],
                      ].map(([label, key]) => (
                        <div className="space-y-1" key={key}>
                          <label className="text-xs font-sans font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full bg-slate-50 border border-[#c3c6d8] px-3 py-2 rounded focus:bg-white outline-none focus:border-[#004ccd] transition-all"
                            placeholder="-"
                            value={String(params[key as keyof TechnicalParams] || '')}
                            onChange={(e) => handleParamChange(key as keyof TechnicalParams, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { id: 'Cutting', label: 'Cutting', icon: Scissors },
                        { id: 'Welding', label: 'Welding', icon: Flame },
                        { id: 'Surface', label: 'Surface', icon: Layers },
                        { id: 'Bending', label: 'Bending', icon: RefreshCw },
                        { id: 'Press', label: 'Pressing', icon: Wrench }
                      ].map((proc) => {
                        const Icon = proc.icon;
                        const isSelected = params.processes.includes(proc.id);
                        return (
                          <button
                            key={proc.id}
                            type="button"
                            className={`flex flex-col items-center justify-center gap-2 p-4 border rounded-lg cursor-pointer transition-all hover:scale-[1.02] ${
                              isSelected 
                                ? 'bg-blue-50 border-[#004ccd] text-[#004ccd] shadow-sm' 
                                : 'bg-slate-50 border-[#c3c6d8] hover:border-[#004ccd]/70 text-[#424656]'
                            }`}
                            onClick={() => handleProcessToggle(proc.id)}
                          >
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-[#004ccd]' : 'text-slate-400'}`} />
                            <span className="text-xs font-bold uppercase tracking-wide text-center">{proc.label}</span>
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
                    <img 
                      className="object-contain p-6 mix-blend-screen opacity-90 transition-transform duration-300"
                      src={filePreview}
                      style={{ transform: `scale(${zoomLevel / 100})` }}
                      alt="Technical drawing blueprint" 
                    />
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

                {/* 1. Actions / Ready to Estimate Panel */}
                <div className="bg-white border border-[#c3c6d8] p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm flex-shrink-0">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Ready to Estimate</h4>
                      <p className="text-xs text-[#424656]">Diagram successfully parsed. Confirm parameters and calculate.</p>
                    </div>
                  </div>
                  <button 
                    className="w-full md:w-auto px-6 py-3 bg-[#004ccd] hover:bg-[#0f62fe] text-white font-bold text-xs uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2"
                    onClick={calculateCost}
                    disabled={isCalculating}
                  >
                    {isCalculating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Calculator className="w-4 h-4" />
                    )}
                    {isCalculating ? 'Estimating...' : 'Calculate Cost'}
                  </button>
                </div>

                {/* 2. Cost Estimation Results View */}
                <div className="flex-1 min-h-0 bg-white border border-[#c3c6d8] rounded-xl flex flex-col overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-[#c3c6d8] bg-slate-50 flex items-center gap-2 flex-shrink-0">
                    <Coins className="w-4 h-4 text-[#004ccd]" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-900">Estimation breakdown</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    {estimation ? (
                      /* ACTIVE ESTIMATION DETAILS */
                      <div className="space-y-5 animate-fade-in text-xs font-sans">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Extracted Unit Weight</span>
                            <div className="text-xl font-black text-slate-900 font-mono">
                              {estimation.summary.unitWeightKg} <span className="text-xs font-normal text-slate-500">kg</span>
                            </div>
                          </div>
                          <div className="p-3 bg-blue-50/50 rounded border border-blue-100/50 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-[#004ccd]">Total Project Cost</span>
                            <div className="text-xl font-black text-[#004ccd] font-mono">
                              {formatInr(estimation.summary.totalCost)}
                            </div>
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
                              <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Scrap / Offcut</span>
                                <div className="text-sm font-black text-slate-900">{estimation.stockSummary.totalScrapWeightKg.toFixed(3)} kg</div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {formatInr(estimation.stockSummary.totalScrapValue)} @ Rs {estimation.stockSummary.scrapRatePerKg}/kg
                                </div>
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
                                  <td className="p-2.5 text-right">{estimation.summary.profileWeightKg.toFixed(3)} kg</td>
                                  <td className="p-2.5 text-right">{(estimation.summary.profileWeightKg * estimation.summary.qty).toFixed(3)} kg</td>
                                </tr>
                                {estimation.summary.topPlateWeightKg > 0 && (
                                  <tr>
                                    <td className="p-2.5 font-sans font-medium text-slate-900">Top Inlay Plate</td>
                                    <td className="p-2.5 text-right">{estimation.summary.topPlateWeightKg.toFixed(3)} kg</td>
                                    <td className="p-2.5 text-right">{(estimation.summary.topPlateWeightKg * estimation.summary.qty).toFixed(3)} kg</td>
                                  </tr>
                                )}
                                {estimation.summary.bottomPlateWeightKg > 0 && (
                                  <tr>
                                    <td className="p-2.5 font-sans font-medium text-slate-900">Bottom Support Plate</td>
                                    <td className="p-2.5 text-right">{estimation.summary.bottomPlateWeightKg.toFixed(3)} kg</td>
                                    <td className="p-2.5 text-right">{(estimation.summary.bottomPlateWeightKg * estimation.summary.qty).toFixed(3)} kg</td>
                                  </tr>
                                )}
                                <tr className="bg-slate-50 font-bold text-slate-900">
                                  <td className="p-2.5 font-sans">Accumulated Material Total</td>
                                  <td className="p-2.5 text-right">{estimation.summary.unitWeightKg.toFixed(3)} kg</td>
                                  <td className="p-2.5 text-right">{estimation.summary.totalWeightKg.toFixed(3)} kg</td>
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
                                    <th className="p-2.5 font-bold text-right">Stock Yield</th>
                                    <th className="p-2.5 font-bold text-right">Scrap</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                                  {estimation.items.map((item, idx) => (
                                    <tr key={`${item.name}-${idx}`}>
                                      <td className="p-2.5 font-sans font-medium text-slate-900">{item.name}</td>
                                      <td className="p-2.5 text-right">{item.quantity}</td>
                                      <td className="p-2.5 text-right underline decoration-dotted underline-offset-4">{item.weightKg.toFixed(3)} kg</td>
                                      <td className="p-2.5 text-right underline decoration-dotted underline-offset-4">{formatInr(item.materialCost)}</td>
                                      <td className="p-2.5 text-right">{item.partsPerStock ? `${item.partsPerStock}/${item.stockForm}` : '-'}</td>
                                      <td className="p-2.5 text-right">{item.scrapWeightKg ? `${item.scrapWeightKg.toFixed(3)} kg (${formatInr(item.scrapValue || 0)})` : '-'}</td>
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
                                <div key={`${item.name}-nest-${idx}`} className="p-3 bg-slate-50 rounded border border-slate-200">
                                  <div className="text-xs font-bold text-slate-800">{item.name}</div>
                                  <div className="text-[11px] leading-relaxed text-slate-600">{item.nestingApproach}</div>
                                </div>
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
                                      <td className="p-2.5 text-right">{formatInr(pd.unitCost)}</td>
                                      <td className="p-2.5 text-right font-bold text-slate-900">{formatInr(pd.cost)}</td>
                                    </tr>
                                  ))}
                                  <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                                    <td className="p-2.5 font-sans">Operational Process Total</td>
                                    <td className="p-2.5 text-right">-</td>
                                    <td className="p-2.5 text-right">{formatInr(estimation.summary.processCost)}</td>
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
                            <span className="font-mono text-slate-900">{formatInr(estimation.summary.materialCost)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Process & Routing Surcharges:</span>
                            <span className="font-mono text-slate-900">{formatInr(estimation.summary.processCost)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-dashed border-slate-200">
                            <span>Calculated Grand Estimate:</span>
                            <span className="font-mono text-[#004ccd]">{formatInr(estimation.summary.totalCost)}</span>
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
