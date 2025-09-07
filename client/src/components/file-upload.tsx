import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isUploading: boolean;
  dataColumns: string[];
  previewData: any[];
}

export default function FileUpload({ 
  onFileUpload, 
  isUploading, 
  dataColumns, 
  previewData 
}: FileUploadProps) {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validTypes = ['.csv', '.xlsx', '.xls'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (validTypes.includes(fileExtension)) {
        onFileUpload(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload CSV, XLS, or XLSX files only.",
          variant: "destructive",
        });
      }
    }
  }, [onFileUpload, toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  }, [onFileUpload]);

  return (
    <div className="p-6 space-y-6">
      {/* File Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Data Source
          </h3>
          <p className="text-sm text-slate-500 mt-1">Upload your Excel, CSV, or XLSX files to get started</p>
        </div>
        <div className="p-6 space-y-4">
          {/* File Drop Zone */}
          <div 
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
              dragActive 
                ? 'border-blue-400 bg-blue-50 scale-[1.02]' 
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-testid="file-drop-zone"
          >
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-6 shadow-sm">
              {isUploading ? (
                <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
            </div>
            <h4 className="text-xl font-semibold text-slate-900 mb-3">
              {isUploading ? "Processing your file..." : "Drop your files here"}
            </h4>
            <p className="text-slate-600 mb-6 max-w-sm mx-auto leading-relaxed">
              Upload Excel (.xlsx), CSV, or legacy Excel (.xls) files. We'll automatically parse your data and show you a preview.
            </p>
            <div className="relative inline-block">
              <button 
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isUploading}
                data-testid="button-browse-files"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h2a2 2 0 012 2v0H8v0z" />
                </svg>
                Choose Files
              </button>
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file-upload"
              />
            </div>
          </div>

          {/* Data Preview */}
          {previewData.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-5 border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Data Successfully Loaded
                </h4>
                <span className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-full" data-testid="badge-row-count">
                  {previewData.length} rows
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {dataColumns.slice(0, 6).map((column, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/70 rounded-lg">
                    <span className="font-medium text-slate-700">{column}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                      Ready
                    </span>
                  </div>
                ))}
                {dataColumns.length > 6 && (
                  <div className="text-center py-2 text-slate-600 font-medium">
                    + {dataColumns.length - 6} more columns available
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Design Tools */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.78 0-2.678-2.153-1.415-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
            </svg>
            Design Elements
          </h3>
          <p className="text-sm text-slate-500 mt-1">Drag elements onto your label canvas</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div 
              className="group bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 text-center cursor-move hover:from-blue-50 hover:to-blue-100 transition-all duration-200 border border-slate-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-1"
              draggable
              data-element-type="text"
              data-testid="drag-element-text"
            >
              <svg className="w-6 h-6 text-slate-600 group-hover:text-blue-600 mx-auto mb-3 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
              </svg>
              <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">Text</p>
            </div>
            
            <div 
              className="group bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 text-center cursor-move hover:from-green-50 hover:to-green-100 transition-all duration-200 border border-slate-200 hover:border-green-300 hover:shadow-md hover:-translate-y-1"
              draggable
              data-element-type="barcode"
              data-testid="drag-element-barcode"
            >
              <svg className="w-6 h-6 text-slate-600 group-hover:text-green-600 mx-auto mb-3 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <p className="text-sm font-semibold text-slate-700 group-hover:text-green-700">Barcode</p>
            </div>
            
            <div 
              className="group bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 text-center cursor-move hover:from-purple-50 hover:to-purple-100 transition-all duration-200 border border-slate-200 hover:border-purple-300 hover:shadow-md hover:-translate-y-1"
              draggable
              data-element-type="image"
              data-testid="drag-element-image"
            >
              <svg className="w-6 h-6 text-slate-600 group-hover:text-purple-600 mx-auto mb-3 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-semibold text-slate-700 group-hover:text-purple-700">Image</p>
            </div>
            
            <div 
              className="group bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 text-center cursor-move hover:from-orange-50 hover:to-orange-100 transition-all duration-200 border border-slate-200 hover:border-orange-300 hover:shadow-md hover:-translate-y-1"
              draggable
              data-element-type="shape"
              data-testid="drag-element-shape"
            >
              <svg className="w-6 h-6 text-slate-600 group-hover:text-orange-600 mx-auto mb-3 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.78 0-2.678-2.153-1.415-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
              </svg>
              <p className="text-sm font-semibold text-slate-700 group-hover:text-orange-700">Shape</p>
            </div>
          </div>
        </div>
      </div>

      {/* Label Dimensions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
            </svg>
            Label Dimensions
          </h3>
          <p className="text-sm text-slate-500 mt-1">Set precise measurements for your labels</p>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-3 block">
              Choose Label Size
            </label>
            <select 
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              data-testid="select-preset-sizes"
            >
              <option value="avery-5160">📋 Avery 5160 (2.625" × 1") - Address Labels</option>
              <option value="avery-5161">📋 Avery 5161 (4" × 1") - Address Labels</option>
              <option value="avery-5162">📋 Avery 5162 (4" × 1.33") - Shipping Labels</option>
              <option value="custom">⚙️ Custom Size</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Width
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  defaultValue="2.625" 
                  step="0.125"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 transition-all"
                  data-testid="input-width"
                />
                <span className="absolute right-4 top-3.5 text-xs font-semibold text-slate-400">
                  inches
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Height
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  defaultValue="1.000" 
                  step="0.125"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 transition-all"
                  data-testid="input-height"
                />
                <span className="absolute right-4 top-3.5 text-xs font-semibold text-slate-400">
                  inches
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-blue-50 rounded-lg p-3 border border-blue-200">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Professional 300 DPI print resolution</span>
          </div>
        </div>
      </div>
    </div>
  );
}