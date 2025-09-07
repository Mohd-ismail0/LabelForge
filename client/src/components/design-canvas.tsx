import { useRef, useCallback, useEffect, useState } from "react";
import { LabelElement, LabelProject } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
} from '@dnd-kit/core';
// Note: Using custom modifiers instead of @dnd-kit/modifiers for better compatibility
import JsBarcode from 'jsbarcode';

interface DesignCanvasProps {
  project: LabelProject | null;
  onUpdateElements: (elements: LabelElement[]) => void;
  onSelectElement: (element: LabelElement | null) => void;
  selectedElement: LabelElement | null;
  previewData?: any[];
  currentDataRow?: number;
}

// Draggable Element Component with proper visual affordances
function DraggableElement({
  element,
  isSelected,
  onClick,
  children,
  zoom,
}: {
  element: LabelElement;
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  zoom: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: element.id,
  });

  const style = {
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 1000 : isSelected ? 100 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`absolute select-none group transition-all duration-200 ${
        isSelected 
          ? 'ring-2 ring-blue-500 shadow-lg' 
          : 'hover:ring-1 hover:ring-blue-300 hover:shadow-md'
      } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      onClick={onClick}
      data-testid={`canvas-element-${element.type}-${element.id}`}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        {...attributes}
        className={`absolute -top-2 -left-2 w-6 h-6 bg-blue-600 rounded-full shadow-sm border-2 border-white cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity ${
          isSelected ? 'opacity-100' : ''
        }`}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <svg className="w-3 h-3 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </div>

      {/* Resize Handles */}
      {isSelected && (
        <>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-600 border border-white rounded-sm cursor-se-resize" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 border border-white rounded-sm cursor-ne-resize" />
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-600 border border-white rounded-sm cursor-nw-resize" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-600 border border-white rounded-sm cursor-sw-resize" />
        </>
      )}

      {/* Element Content */}
      <div className="w-full h-full bg-white border border-slate-200 rounded-sm overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// EAN-13 Barcode Generation with GTIN validation
function generateEAN13CheckDigit(code: string): string {
  const digits = code.padStart(12, '0').slice(0, 12);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return digits + checkDigit;
}

function validateEAN13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  const digits = code.slice(0, 12);
  const checkDigit = parseInt(code.slice(-1));
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return ((10 - (sum % 10)) % 10) === checkDigit;
}

function BarcodeElement({ content, width, height }: { content: string; width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || !content) return;
    
    try {
      let barcodeValue = content.replace(/\D/g, ''); // Remove non-digits
      
      // Handle different barcode lengths
      if (barcodeValue.length < 12) {
        barcodeValue = barcodeValue.padStart(12, '0');
      } else if (barcodeValue.length === 12) {
        barcodeValue = generateEAN13CheckDigit(barcodeValue);
      } else if (barcodeValue.length > 13) {
        barcodeValue = barcodeValue.slice(0, 13);
      }
      
      // Validate and generate EAN-13 barcode
      if (barcodeValue.length === 13 && validateEAN13(barcodeValue)) {
        JsBarcode(canvasRef.current, barcodeValue, {
          format: "EAN13",
          width: Math.max(1, Math.floor(width / 95)),
          height: Math.max(20, height - 20),
          displayValue: true,
          fontSize: Math.max(8, Math.floor(height / 6)),
          margin: 2,
          background: "#ffffff",
          lineColor: "#000000",
        });
      } else {
        // Fallback for invalid codes - show as Code128
        JsBarcode(canvasRef.current, content || "INVALID", {
          format: "CODE128",
          width: Math.max(1, Math.floor(width / 95)),
          height: Math.max(20, height - 20),
          displayValue: true,
          fontSize: Math.max(8, Math.floor(height / 6)),
          margin: 2,
          background: "#ffffff",
          lineColor: "#000000",
        });
      }
    } catch (error) {
      console.error("Barcode generation error:", error);
      // Show error state
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#fee2e2';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#dc2626';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Invalid Barcode', width / 2, height / 2);
      }
    }
  }, [content, width, height]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

export default function DesignCanvas({ 
  project, 
  onUpdateElements, 
  onSelectElement, 
  selectedElement,
  previewData = [],
  currentDataRow = 0
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  const [elements, setElements] = useState<LabelElement[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<LabelElement | null>(null);

  // Configure sensors for accessibility
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      // Enable keyboard navigation with arrow keys
      coordinateGetter: (event, { currentCoordinates }) => {
        const delta = 10;
        switch (event.code) {
          case 'ArrowRight':
            return { ...currentCoordinates, x: currentCoordinates.x + delta };
          case 'ArrowLeft':
            return { ...currentCoordinates, x: currentCoordinates.x - delta };
          case 'ArrowDown':
            return { ...currentCoordinates, y: currentCoordinates.y + delta };
          case 'ArrowUp':
            return { ...currentCoordinates, y: currentCoordinates.y - delta };
        }
        return currentCoordinates;
      },
    })
  );

  useEffect(() => {
    if (project?.elements) {
      setElements(project.elements as LabelElement[]);
    }
  }, [project?.elements]);

  // Handle dropping new elements from sidebar
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    const elementType = e.dataTransfer.getData("text/plain");
    if (!elementType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, (e.clientX - rect.left) / (zoom / 100));
    const y = Math.max(0, (e.clientY - rect.top) / (zoom / 100));

    const newElement: LabelElement = {
      id: `element-${Date.now()}`,
      type: elementType as LabelElement['type'],
      x: Math.min(x, (parseFloat(project?.width || "2.625") * 96) - 100),
      y: Math.min(y, (parseFloat(project?.height || "1") * 96) - 30),
      width: elementType === 'barcode' ? 200 : 100,
      height: elementType === 'barcode' ? 60 : 30,
      properties: {
        text: elementType === 'text' ? 'New Text' : elementType === 'barcode' ? '1234567890128' : '',
        fontSize: 12,
        fontWeight: 'normal',
        barcodeType: elementType === 'barcode' ? 'ean13' : undefined,
        color: '#000000'
      }
    };

    const updatedElements = [...elements, newElement];
    setElements(updatedElements);
    onUpdateElements(updatedElements);
    onSelectElement(newElement);
  }, [elements, onUpdateElements, onSelectElement, zoom, project?.width, project?.height]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const element = elements.find(el => el.id === event.active.id);
    setDraggedElement(element || null);
  };

  // Handle drag end - update element position
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    
    if (delta.x === 0 && delta.y === 0) {
      setActiveId(null);
      setDraggedElement(null);
      return;
    }

    const elementId = active.id as string;
    const updatedElements = elements.map(element => {
      if (element.id === elementId) {
        const newX = Math.max(0, Math.min(element.x + delta.x, (parseFloat(project?.width || "2.625") * 96) - element.width));
        const newY = Math.max(0, Math.min(element.y + delta.y, (parseFloat(project?.height || "1") * 96) - element.height));
        
        return {
          ...element,
          x: newX,
          y: newY,
        };
      }
      return element;
    });

    setElements(updatedElements);
    onUpdateElements(updatedElements);
    setActiveId(null);
    setDraggedElement(null);
  };

  const handleElementClick = useCallback((element: LabelElement) => {
    onSelectElement(element);
  }, [onSelectElement]);

  const zoomIn = () => setZoom(Math.min(200, zoom + 25));
  const zoomOut = () => setZoom(Math.max(50, zoom - 25));

  const labelWidth = project ? parseFloat(project.width) * 96 : 252;
  const labelHeight = project ? parseFloat(project.height) * 96 : 96;

  // Get dynamic content for an element based on data mapping
  const getDynamicContent = (element: LabelElement) => {
    if (!element.properties.dataField || previewData.length === 0) {
      return element.properties.text || (element.type === 'text' ? 'New Text' : element.type === 'barcode' ? '1234567890128' : '');
    }
    
    const currentRow = previewData[currentDataRow] || previewData[0];
    const mappedValue = currentRow[element.properties.dataField];
    return String(mappedValue || element.properties.text || 'N/A');
  };

  // Delete selected element with keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement) {
          const updatedElements = elements.filter(el => el.id !== selectedElement.id);
          setElements(updatedElements);
          onUpdateElements(updatedElements);
          onSelectElement(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, elements, onUpdateElements, onSelectElement]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[]}
    >
      {/* Canvas Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid="button-undo">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid="button-redo">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                </svg>
              </Button>
            </div>
            
            <div className="h-6 w-px bg-slate-200"></div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={zoomOut} className="h-8 w-8 p-0" data-testid="button-zoom-out">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10h-6" />
                </svg>
              </Button>
              <span className="text-sm font-semibold px-3 py-1 bg-slate-100 rounded-full" data-testid="text-zoom-level">
                {zoom}%
              </span>
              <Button variant="ghost" size="sm" onClick={zoomIn} className="h-8 w-8 p-0" data-testid="button-zoom-in">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </Button>
            </div>
            
            {previewData.length > 0 && (
              <>
                <div className="h-6 w-px bg-slate-200"></div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-600">Preview:</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                    Row {currentDataRow + 1} of {previewData.length}
                  </span>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {selectedElement && (
              <div className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                Selected: {selectedElement.type} • Press Delete to remove
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <span className="font-medium">Drag elements with the blue handle</span>
            </div>
          </div>
        </div>
      </div>

      {/* Design Canvas Area */}
      <div className="flex-1 overflow-auto bg-slate-100 p-12">
        <div className="max-w-4xl mx-auto">
          {/* Canvas Container */}
          <div 
            className="bg-white rounded-xl shadow-lg p-8 border border-slate-200"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          >
            <div 
              ref={canvasRef}
              className="relative mx-auto bg-white border-2 border-dashed border-slate-300 rounded-lg"
              style={{ 
                width: `${labelWidth}px`, 
                height: `${labelHeight}px`,
                backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              data-testid="design-canvas"
            >
              {elements.map((element) => (
                <DraggableElement
                  key={element.id}
                  element={element}
                  isSelected={selectedElement?.id === element.id}
                  onClick={() => handleElementClick(element)}
                  zoom={zoom}
                >
                  {element.type === 'text' && (
                    <div 
                      className="w-full h-full flex items-center justify-center text-center overflow-hidden p-1"
                      style={{
                        fontSize: `${element.properties.fontSize || 12}px`,
                        fontWeight: element.properties.fontWeight || 'normal',
                        color: element.properties.color || '#000000'
                      }}
                    >
                      {getDynamicContent(element)}
                    </div>
                  )}

                  {element.type === 'barcode' && (
                    <BarcodeElement 
                      content={getDynamicContent(element)}
                      width={element.width}
                      height={element.height}
                    />
                  )}

                  {element.type === 'image' && (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {element.type === 'shape' && (
                    <div 
                      className="w-full h-full border-2"
                      style={{
                        borderColor: element.properties.color || '#000000',
                        backgroundColor: element.properties.backgroundColor || 'transparent'
                      }}
                    />
                  )}
                </DraggableElement>
              ))}

              {/* Drop Zone Indicator */}
              {elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <h3 className="text-lg font-semibold mb-2">Start Designing Your Label</h3>
                    <p className="text-sm">Drag elements from the sidebar to begin</p>
                  </div>
                </div>
              )}
            </div>

            {/* Canvas Guidelines */}
            <div className="text-center mt-8">
              <div className="inline-flex items-center gap-6 px-6 py-3 bg-slate-50 rounded-full border border-slate-200">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                  <span className="font-medium">{project?.width}" × {project?.height}"</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">EAN-13 GTIN Compliant</span>
                </div>
                {previewData.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">Dynamic Data Connected</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drag Overlay for visual feedback */}
      <DragOverlay>
        {activeId && draggedElement ? (
          <div
            className="bg-white border-2 border-blue-500 rounded-sm opacity-80 shadow-lg"
            style={{
              width: `${draggedElement.width}px`,
              height: `${draggedElement.height}px`,
            }}
          >
            {draggedElement.type === 'text' && (
              <div className="w-full h-full flex items-center justify-center text-center overflow-hidden p-1">
                {getDynamicContent(draggedElement)}
              </div>
            )}
            {draggedElement.type === 'barcode' && (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs">
                Barcode
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}