import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertLabelProjectSchema, insertDataFileSchema } from "@shared/schema";
import * as XLSX from "xlsx";
import Papa from "papaparse";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Label Projects
  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertLabelProjectSchema.parse(req.body);
      const project = await storage.createLabelProject(validatedData);
      res.json(project);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getLabelProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.updateLabelProject(req.params.id, req.body);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // File Upload and Processing
  app.post("/api/files/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { projectId } = req.body;
      if (!projectId) {
        return res.status(400).json({ message: "Project ID required" });
      }

      let parsedData: any[] = [];
      const filename = req.file.originalname;
      const fileExtension = filename.split('.').pop()?.toLowerCase();

      // Parse different file types
      if (fileExtension === 'csv') {
        const csvText = req.file.buffer.toString('utf-8');
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        parsedData = parsed.data;
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        parsedData = XLSX.utils.sheet_to_json(worksheet);
      } else {
        return res.status(400).json({ message: "Unsupported file format. Please upload CSV, XLS, or XLSX files." });
      }

      if (parsedData.length === 0) {
        return res.status(400).json({ message: "No data found in file" });
      }

      const dataFile = await storage.createDataFile({
        projectId,
        filename,
        data: parsedData,
        rowCount: parsedData.length
      });

      res.json({
        id: dataFile.id,
        filename: dataFile.filename,
        rowCount: dataFile.rowCount,
        columns: Object.keys(parsedData[0] || {}),
        preview: parsedData.slice(0, 5) // First 5 rows for preview
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/projects/:projectId/files", async (req, res) => {
    try {
      const files = await storage.getDataFilesByProject(req.params.projectId);
      res.json(files);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // PDF Export (simplified for now)
  app.post("/api/projects/:projectId/export", async (req, res) => {
    try {
      const project = await storage.getLabelProject(req.params.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const files = await storage.getDataFilesByProject(req.params.projectId);
      if (files.length === 0) {
        return res.status(400).json({ message: "No data files found for this project" });
      }

      // For now, return success - actual PDF generation would happen here
      res.json({ 
        message: "PDF generation started",
        totalLabels: files.reduce((sum, file) => sum + file.rowCount, 0)
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
