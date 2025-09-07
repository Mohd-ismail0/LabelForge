import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface ParsedFileData {
  data: any[];
  columns: string[];
  rowCount: number;
  filename: string;
}

export async function parseFile(file: File): Promise<ParsedFileData> {
  const filename = file.name;
  const fileExtension = filename.split('.').pop()?.toLowerCase();
  
  let parsedData: any[] = [];
  
  if (fileExtension === 'csv') {
    const text = await file.text();
    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });
    
    if (result.errors.length > 0) {
      throw new Error(`CSV parsing error: ${result.errors[0].message}`);
    }
    
    parsedData = result.data;
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Use the first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('No sheets found in the workbook');
    }
    
    const worksheet = workbook.Sheets[sheetName];
    parsedData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
  } else {
    throw new Error('Unsupported file format. Please upload CSV, XLS, or XLSX files.');
  }
  
  if (parsedData.length === 0) {
    throw new Error('No data found in the file');
  }
  
  // Extract column names
  const columns = Object.keys(parsedData[0] || {});
  
  if (columns.length === 0) {
    throw new Error('No columns found in the data');
  }
  
  return {
    data: parsedData,
    columns,
    rowCount: parsedData.length,
    filename
  };
}

export function validateFileType(file: File): boolean {
  const validExtensions = ['csv', 'xlsx', 'xls'];
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  return validExtensions.includes(fileExtension || '');
}

export function getFileTypeError(): string {
  return 'Invalid file type. Please upload CSV, XLS, or XLSX files only.';
}
