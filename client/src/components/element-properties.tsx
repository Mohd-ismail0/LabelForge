import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LabelElement } from "@shared/schema";

interface ElementPropertiesProps {
  selectedElement: LabelElement | null;
  dataColumns: string[];
  previewData: any[];
  onUpdateElement: (element: LabelElement) => void;
  onUpdateMapping?: (elementId: string, columnName: string) => void;
}

export default function ElementProperties({ 
  selectedElement, 
  dataColumns,
  previewData, 
  onUpdateElement,
  onUpdateMapping
}: ElementPropertiesProps) {
  
  const handlePropertyChange = (property: string, value: any) => {
    if (!selectedElement) return;
    
    const updatedElement: LabelElement = {
      ...selectedElement,
      properties: {
        ...selectedElement.properties,
        [property]: value
      }
    };
    
    onUpdateElement(updatedElement);
  };

  const handlePositionChange = (property: 'x' | 'y' | 'width' | 'height', value: number) => {
    if (!selectedElement) return;
    
    const updatedElement: LabelElement = {
      ...selectedElement,
      [property]: value
    };
    
    onUpdateElement(updatedElement);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Element Properties */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Element Properties
          </h3>
          <p className="text-sm text-slate-500 mt-1">Configure your selected element</p>
        </div>
        <div className="p-6">
          {selectedElement ? (
            <Tabs defaultValue="properties" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="data-mapping">Data Mapping</TabsTrigger>
              </TabsList>
              
              <TabsContent value="properties" className="space-y-6">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-3 block">
                    Selected Element
                  </Label>
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl text-sm flex items-center gap-3 border border-blue-200">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {selectedElement.type === 'text' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />}
                        {selectedElement.type === 'barcode' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />}
                        {selectedElement.type === 'image' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                        {selectedElement.type === 'shape' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.78 0-2.678-2.153-1.415-3.414l5-5A2 2 0 009 9.172V5L8 4z" />}
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">
                        {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Element
                      </div>
                      <div className="text-xs text-slate-600">
                        {selectedElement.properties.dataField ? `Mapped to: ${selectedElement.properties.dataField}` : 'No data mapping'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Position & Size */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">X Position</Label>
                    <Input
                      type="number"
                      value={selectedElement.x}
                      onChange={(e) => handlePositionChange('x', parseInt(e.target.value) || 0)}
                      className="h-10"
                      data-testid="input-element-x"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Y Position</Label>
                    <Input
                      type="number"
                      value={selectedElement.y}
                      onChange={(e) => handlePositionChange('y', parseInt(e.target.value) || 0)}
                      className="h-10"
                      data-testid="input-element-y"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Width</Label>
                    <Input
                      type="number"
                      value={selectedElement.width}
                      onChange={(e) => handlePositionChange('width', parseInt(e.target.value) || 0)}
                      className="h-10"
                      data-testid="input-element-width"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Height</Label>
                    <Input
                      type="number"
                      value={selectedElement.height}
                      onChange={(e) => handlePositionChange('height', parseInt(e.target.value) || 0)}
                      className="h-10"
                      data-testid="input-element-height"
                    />
                  </div>
                </div>

                {/* Text Properties */}
                {selectedElement.type === 'text' && (
                  <>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                        Text Content
                      </Label>
                      <Input
                        value={selectedElement.properties.text || ""}
                        onChange={(e) => handlePropertyChange('text', e.target.value)}
                        placeholder="Enter text..."
                        className="h-10"
                        data-testid="input-text-content"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Font Size
                        </Label>
                        <Input
                          type="number"
                          value={selectedElement.properties.fontSize || 12}
                          onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value) || 12)}
                          className="h-10"
                          data-testid="input-font-size"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Weight
                        </Label>
                        <Select 
                          value={selectedElement.properties.fontWeight || "normal"}
                          onValueChange={(value) => handlePropertyChange('fontWeight', value)}
                        >
                          <SelectTrigger data-testid="select-font-weight" className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="bold">Bold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                {/* Barcode Properties */}
                {selectedElement.type === 'barcode' && (
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Barcode Type
                    </Label>
                    <Select 
                      value={selectedElement.properties.barcodeType || "code128"}
                      onValueChange={(value) => handlePropertyChange('barcodeType', value)}
                    >
                      <SelectTrigger data-testid="select-barcode-type" className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="code128">Code 128</SelectItem>
                        <SelectItem value="code39">Code 39</SelectItem>
                        <SelectItem value="ean13">EAN-13</SelectItem>
                        <SelectItem value="upc">UPC-A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Color Properties */}
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={selectedElement.properties.color || "#000000"}
                      onChange={(e) => handlePropertyChange('color', e.target.value)}
                      className="w-16 h-10"
                      data-testid="input-color"
                    />
                    <Input
                      value={selectedElement.properties.color || "#000000"}
                      onChange={(e) => handlePropertyChange('color', e.target.value)}
                      placeholder="#000000"
                      className="h-10"
                      data-testid="input-color-hex"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="data-mapping" className="space-y-6">
                {dataColumns.length > 0 ? (
                  <>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 mb-3 block">
                        Connect to Data Column
                      </Label>
                      <Select 
                        value={selectedElement.properties.dataField || ""}
                        onValueChange={(value) => {
                          handlePropertyChange('dataField', value);
                          onUpdateMapping?.(selectedElement.id, value);
                        }}
                      >
                        <SelectTrigger data-testid="select-data-source" className="h-12">
                          <SelectValue placeholder="Choose a column from your data..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">🚫 No data mapping</SelectItem>
                          {dataColumns.map((column) => (
                            <SelectItem key={column} value={column} className="py-3">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span className="font-medium">{column}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedElement.properties.dataField && previewData.length > 0 && (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Data Preview
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {previewData.slice(0, 3).map((row, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white/70 rounded-lg">
                              <span className="text-xs text-slate-500">Row {index + 1}:</span>
                              <span className="font-medium text-slate-700">
                                {String(row[selectedElement.properties.dataField!] || 'N/A')}
                              </span>
                            </div>
                          ))}
                          {previewData.length > 3 && (
                            <div className="text-center text-xs text-slate-500 py-1">
                              +{previewData.length - 3} more rows
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 className="font-medium text-slate-700 mb-2">No Data Available</h4>
                    <p className="text-sm">Upload a data file first to map columns to this element.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <h4 className="font-semibold text-slate-700 mb-2">No Element Selected</h4>
              <p className="text-sm leading-relaxed max-w-sm mx-auto">
                Click on any element in the design canvas to edit its properties and map it to your data.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Data Mapping */}
      {dataColumns.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Available Data Columns
            </h3>
            <p className="text-sm text-slate-500 mt-1">Quick access to all your data fields</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
              {dataColumns.map((column) => (
                <div 
                  key={column}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="font-medium text-slate-700">{column}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {previewData.length > 0 ? String(previewData[0][column] || '—').substring(0, 20) + (String(previewData[0][column] || '').length > 20 ? '...' : '') : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}