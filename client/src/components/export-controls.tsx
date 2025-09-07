import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LabelProject, LabelElement } from "@shared/schema";
import { useState } from "react";

interface ExportControlsProps {
  project: LabelProject | null;
  totalRows: number;
  previewData: any[];
  onExport?: (format: string) => void;
}

export default function ExportControls({ 
  project, 
  totalRows, 
  previewData,
  onExport 
}: ExportControlsProps) {
  const [printQuantities, setPrintQuantities] = useState<{ [key: number]: number }>({});
  const [labelsPerRow, setLabelsPerRow] = useState(3);
  const [printMargin, setPrintMargin] = useState(0.5);

  // Get dynamic content for an element based on data mapping
  const getDynamicContent = (element: LabelElement, dataRow: any) => {
    if (!element.properties.dataField || !dataRow) {
      return element.properties.text || (element.type === 'text' ? 'Text' : element.type === 'barcode' ? 'BARCODE' : '');
    }
    
    const mappedValue = dataRow[element.properties.dataField];
    return String(mappedValue || element.properties.text || 'N/A');
  };

  // Calculate total labels to print
  const getTotalLabels = () => {
    if (totalRows === 0) return 0;
    return Object.values(printQuantities).reduce((sum, qty) => sum + qty, 0) || totalRows;
  };

  // Set quantity for all rows
  const setQuantityForAll = (quantity: number) => {
    const newQuantities: { [key: number]: number } = {};
    for (let i = 0; i < totalRows; i++) {
      newQuantities[i] = quantity;
    }
    setPrintQuantities(newQuantities);
  };

  // Generate print sheet preview
  const generatePrintSheet = () => {
    if (!project || totalRows === 0) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelWidth = parseFloat(project.width) * 96; // 96 DPI
    const labelHeight = parseFloat(project.height) * 96;
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Label Print Sheet - ${project.name}</title>
          <style>
            @page { 
              margin: ${printMargin}in; 
              size: letter;
            }
            body { 
              margin: 0; 
              font-family: 'Arial', sans-serif;
              background: white;
            }
            .print-header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 10px;
            }
            .label-grid {
              display: grid;
              grid-template-columns: repeat(${labelsPerRow}, 1fr);
              gap: 10px;
              justify-items: center;
            }
            .label {
              width: ${labelWidth / 2}px;
              height: ${labelHeight / 2}px;
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              position: relative;
              page-break-inside: avoid;
              background: white;
            }
            .label-element {
              position: absolute;
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
              overflow: hidden;
            }
            .barcode-visual {
              background: repeating-linear-gradient(90deg, #000 0px, #000 1px, #fff 1px, #fff 2px);
              width: 100%;
              height: 70%;
            }
            .barcode-text {
              font-family: 'Courier New', monospace;
              font-size: 8px;
              font-weight: bold;
              text-align: center;
              margin-top: 2px;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="print-header no-print">
            <h2>${project.name} - Print Sheet</h2>
            <p>Total Labels: ${getTotalLabels()} | Layout: ${labelsPerRow} per row | Size: ${project.width}" × ${project.height}"</p>
            <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px;">Print Sheet</button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #64748b; color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button>
          </div>
          <div class="label-grid">
    `;

    // Generate labels based on quantities
    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
      const quantity = printQuantities[rowIndex] || 1;
      const rowData = previewData[rowIndex];
      
      for (let labelCopy = 0; labelCopy < quantity; labelCopy++) {
        htmlContent += `<div class="label">`;
        
        // Render each element
        const elements = (project.elements as LabelElement[]) || [];
        elements.forEach(element => {
          const content = getDynamicContent(element, rowData);
          
          htmlContent += `
            <div class="label-element" style="
              left: ${element.x / 2}px;
              top: ${element.y / 2}px;
              width: ${element.width / 2}px;
              height: ${element.height / 2}px;
              font-size: ${(element.properties.fontSize || 12) / 2}px;
              font-weight: ${element.properties.fontWeight || 'normal'};
              color: ${element.properties.color || '#000000'};
            ">`;
          
          if (element.type === 'text') {
            htmlContent += content;
          } else if (element.type === 'barcode') {
            htmlContent += `
              <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div class="barcode-visual"></div>
                <div class="barcode-text">${content}</div>
              </div>
            `;
          }
          
          htmlContent += `</div>`;
        });
        
        htmlContent += `</div>`;
      }
    }

    htmlContent += `
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!project || totalRows === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v2a2 2 0 002 2h8a2 2 0 002-2z" />
              </svg>
              Export & Print
            </h3>
            <p className="text-sm text-slate-500 mt-1">Generate print-ready labels</p>
          </div>
          <div className="p-6">
            <div className="text-center py-8 text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
              <h4 className="font-medium text-slate-700 mb-2">Ready to Export</h4>
              <p className="text-sm">Upload data and create your label template to generate printable labels.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v2a2 2 0 002 2h8a2 2 0 002-2z" />
            </svg>
            Export & Print
          </h3>
          <p className="text-sm text-slate-500 mt-1">Generate print-ready labels for all your data</p>
        </div>
        
        <div className="p-6">
          <Tabs defaultValue="quantities" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="quantities">Print Quantities</TabsTrigger>
              <TabsTrigger value="layout">Print Layout</TabsTrigger>
            </TabsList>
            
            <TabsContent value="quantities" className="space-y-6">
              {/* Quick quantity controls */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <span className="text-sm font-semibold text-slate-700">Quick Set:</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setQuantityForAll(1)}
                  className="h-8"
                >
                  1 each
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setQuantityForAll(2)}
                  className="h-8"
                >
                  2 each
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setQuantityForAll(5)}
                  className="h-8"
                >
                  5 each
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setQuantityForAll(10)}
                  className="h-8"
                >
                  10 each
                </Button>
              </div>

              {/* Individual quantity controls */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                <h4 className="text-sm font-semibold text-slate-700 sticky top-0 bg-white py-2">
                  Individual Quantities ({totalRows} rows)
                </h4>
                {previewData.slice(0, Math.min(20, totalRows)).map((row, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900">Row {index + 1}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {Object.entries(row).slice(0, 2).map(([key, value]) => 
                          `${key}: ${String(value)}`
                        ).join(' • ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Label className="text-xs text-slate-600">Qty:</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={printQuantities[index] || 1}
                        onChange={(e) => setPrintQuantities({
                          ...printQuantities,
                          [index]: parseInt(e.target.value) || 0
                        })}
                        className="w-16 h-8 text-center"
                      />
                    </div>
                  </div>
                ))}
                {totalRows > 20 && (
                  <div className="text-center text-sm text-slate-500 py-2">
                    + {totalRows - 20} more rows (use Quick Set above for all)
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="layout" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Labels Per Row
                  </Label>
                  <Select 
                    value={labelsPerRow.toString()}
                    onValueChange={(value) => setLabelsPerRow(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 per row</SelectItem>
                      <SelectItem value="2">2 per row</SelectItem>
                      <SelectItem value="3">3 per row</SelectItem>
                      <SelectItem value="4">4 per row</SelectItem>
                      <SelectItem value="5">5 per row</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Page Margin (inches)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={printMargin}
                    onChange={(e) => setPrintMargin(parseFloat(e.target.value) || 0.5)}
                  />
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Print Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                  <div>Total Labels: <span className="font-semibold">{getTotalLabels()}</span></div>
                  <div>Label Size: <span className="font-semibold">{project.width}" × {project.height}"</span></div>
                  <div>Layout: <span className="font-semibold">{labelsPerRow} per row</span></div>
                  <div>Pages: <span className="font-semibold">~{Math.ceil(getTotalLabels() / (labelsPerRow * 8))}</span></div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Export buttons */}
          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <Button 
              onClick={generatePrintSheet}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
              disabled={getTotalLabels() === 0}
              data-testid="button-generate-print-sheet"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v2a2 2 0 002 2h8a2 2 0 002-2z" />
              </svg>
              Generate Print Sheet ({getTotalLabels()})
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onExport?.('pdf')}
              className="h-12 px-6"
              disabled={getTotalLabels() === 0}
              data-testid="button-export-pdf"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}