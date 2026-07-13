import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Route: Extract parameters
  app.post('/api/extract', async (req, res) => {
    try {
      const { image, useDefault } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || useDefault) {
        // Fallback simulate with high-quality default data matching the diagram
        return res.json({
          success: true,
          source: 'simulation_fallback',
          data: {
            partName: 'Chassis_Bracket_A102',
            materialRate: 14.50,
            materialForm: 'Round Rod',
            shape: 'Symmetric Collar',
            isHollow: true,
            length: 120,
            diameter: 45,
            thickness: 5,
            qty: 1,
            topPlate: { length: 80, width: 80, thickness: 8 },
            bottomPlate: { length: 110, width: 110, thickness: 12 },
            processes: ['Cutting', 'Welding', 'Surface', 'Bending']
          }
        });
      }

      // Real Gemini API call
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Analyze this engineering drawing and extract the technical parameters as structured JSON matching this schema:
      {
        "partName": "string",
        "materialRate": number (USD/kg, default 14.50 if not specified),
        "materialForm": "Round Rod" | "Square Bar" | "Select...",
        "shape": "string",
        "isHollow": boolean,
        "length": number (mm),
        "diameter": number (mm),
        "thickness": number (mm),
        "qty": number,
        "topPlate": { "length": number, "width": number, "thickness": number },
        "bottomPlate": { "length": number, "width": number, "thickness": number },
        "processes": string[] (subset of ["Cutting", "Welding", "Surface", "Bending", "Press"])
      }
      If the drawing has details matching a main collar/rod and top/bottom plates, fill them in. Return ONLY the JSON object. Do not include markdown code block styling like \`\`\`json.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: image.split(',')[1] // remove data:image/jpeg;base64,
            }
          },
          prompt
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '{}';
      // Clean up markdown block headers if returned
      const cleanJson = responseText.replace(/```json/i, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);

      return res.json({
        success: true,
        source: 'gemini_api',
        data: parsedData
      });
    } catch (error: any) {
      console.error('Error in /api/extract:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API Route: Calculate costing
  app.post('/api/estimate', (req, res) => {
    try {
      const params = req.body;
      const qty = Number(params.qty) || 1;
      const rate = Number(params.materialRate) || 14.50;

      // Density of structural steel (g/cm^3)
      const density = 7.85; 

      // 1. Calculate Main Profile Weight
      let profileWeightKg = 0;
      if (params.materialForm === 'Round Rod') {
        const lengthCm = (Number(params.length) || 0) / 10;
        const outerRadiusCm = ((Number(params.diameter) || 0) / 2) / 10;
        const thicknessCm = (Number(params.thickness) || 0) / 10;

        let volumeCm3 = 0;
        if (params.isHollow && thicknessCm > 0) {
          const innerRadiusCm = outerRadiusCm - thicknessCm;
          volumeCm3 = Math.PI * (Math.pow(outerRadiusCm, 2) - Math.pow(Math.max(0, innerRadiusCm), 2)) * lengthCm;
        } else {
          volumeCm3 = Math.PI * Math.pow(outerRadiusCm, 2) * lengthCm;
        }
        profileWeightKg = (volumeCm3 * density) / 1000;
      } else if (params.materialForm === 'Square Bar') {
        const lengthCm = (Number(params.length) || 0) / 10;
        const widthCm = (Number(params.diameter) || 0) / 10;
        const thicknessCm = (Number(params.thickness) || 0) / 10;

        let volumeCm3 = 0;
        if (params.isHollow && thicknessCm > 0) {
          const innerWidthCm = widthCm - 2 * thicknessCm;
          volumeCm3 = (Math.pow(widthCm, 2) - Math.pow(Math.max(0, innerWidthCm), 2)) * lengthCm;
        } else {
          volumeCm3 = Math.pow(widthCm, 2) * lengthCm;
        }
        profileWeightKg = (volumeCm3 * density) / 1000;
      }

      // 2. Calculate Top Plate Weight
      let topPlateWeightKg = 0;
      if (params.topPlate && params.topPlate.length && params.topPlate.width && params.topPlate.thickness) {
        const lCm = Number(params.topPlate.length) / 10;
        const wCm = Number(params.topPlate.width) / 10;
        const tCm = Number(params.topPlate.thickness) / 10;
        const volCm3 = lCm * wCm * tCm;
        topPlateWeightKg = (volCm3 * density) / 1000;
      }

      // 3. Calculate Bottom Plate Weight
      let bottomPlateWeightKg = 0;
      if (params.bottomPlate && params.bottomPlate.length && params.bottomPlate.width && params.bottomPlate.thickness) {
        const lCm = Number(params.bottomPlate.length) / 10;
        const wCm = Number(params.bottomPlate.width) / 10;
        const tCm = Number(params.bottomPlate.thickness) / 10;
        const volCm3 = lCm * wCm * tCm;
        bottomPlateWeightKg = (volCm3 * density) / 1000;
      }

      const unitWeightKg = profileWeightKg + topPlateWeightKg + bottomPlateWeightKg;
      const totalWeightKg = unitWeightKg * qty;
      const materialCost = totalWeightKg * rate;

      // 4. Calculate Process Costs
      const processes = params.processes || [];
      const processDetails = [];
      let totalProcessCost = 0;

      if (processes.includes('Cutting')) {
        const cost = 5.50 * qty;
        processDetails.push({ name: 'Laser Cutting', unitCost: 5.50, cost });
        totalProcessCost += cost;
      }
      if (processes.includes('Welding')) {
        const cost = 12.00 * qty;
        processDetails.push({ name: 'TIG/MIG Welding', unitCost: 12.00, cost });
        totalProcessCost += cost;
      }
      if (processes.includes('Surface')) {
        const cost = 7.50 * qty;
        processDetails.push({ name: 'Powder Coating / Surface Finish', unitCost: 7.50, cost });
        totalProcessCost += cost;
      }
      if (processes.includes('Bending')) {
        const cost = 4.00 * qty;
        processDetails.push({ name: 'CNC Precision Bending', unitCost: 4.00, cost });
        totalProcessCost += cost;
      }
      if (processes.includes('Press')) {
        const cost = 3.50 * qty;
        processDetails.push({ name: 'Hydraulic Press Stamping', unitCost: 3.50, cost });
        totalProcessCost += cost;
      }

      const totalCost = materialCost + totalProcessCost;

      res.json({
        success: true,
        summary: {
          profileWeightKg: Number(profileWeightKg.toFixed(3)),
          topPlateWeightKg: Number(topPlateWeightKg.toFixed(3)),
          bottomPlateWeightKg: Number(bottomPlateWeightKg.toFixed(3)),
          unitWeightKg: Number(unitWeightKg.toFixed(3)),
          totalWeightKg: Number(totalWeightKg.toFixed(3)),
          materialCost: Number(materialCost.toFixed(2)),
          processCost: Number(totalProcessCost.toFixed(2)),
          totalCost: Number(totalCost.toFixed(2)),
          qty
        },
        processDetails
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  if (!isProd) {
    // Development: Vite Dev Middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(vite.middlewares);
    
    // Fallback index.html loading for SPA routing
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Production: Serve static assets
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EngineerEstimate Pro Server running on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start fullstack server:', err);
});
