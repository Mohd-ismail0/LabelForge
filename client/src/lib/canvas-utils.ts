import { LabelElement } from '@shared/schema';

export interface CanvasSize {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

// Convert inches to pixels at 96 DPI (screen display)
export function inchesToPixels(inches: number): number {
  return inches * 96;
}

// Convert pixels to inches at 96 DPI
export function pixelsToInches(pixels: number): number {
  return pixels / 96;
}

// Get canvas size in pixels based on label dimensions
export function getCanvasSize(widthInInches: number, heightInInches: number): CanvasSize {
  return {
    width: inchesToPixels(widthInInches),
    height: inchesToPixels(heightInInches)
  };
}

// Check if a point is within an element's bounds
export function isPointInElement(point: Point, element: LabelElement): boolean {
  return (
    point.x >= element.x &&
    point.x <= element.x + element.width &&
    point.y >= element.y &&
    point.y <= element.y + element.height
  );
}

// Get element at a specific point
export function getElementAtPoint(point: Point, elements: LabelElement[]): LabelElement | null {
  // Return the topmost element (last in array)
  for (let i = elements.length - 1; i >= 0; i--) {
    if (isPointInElement(point, elements[i])) {
      return elements[i];
    }
  }
  return null;
}

// Snap position to grid
export function snapToGrid(value: number, gridSize: number = 10): number {
  return Math.round(value / gridSize) * gridSize;
}

// Constrain element within canvas bounds
export function constrainElement(element: LabelElement, canvasSize: CanvasSize): LabelElement {
  return {
    ...element,
    x: Math.max(0, Math.min(element.x, canvasSize.width - element.width)),
    y: Math.max(0, Math.min(element.y, canvasSize.height - element.height)),
    width: Math.min(element.width, canvasSize.width - element.x),
    height: Math.min(element.height, canvasSize.height - element.y)
  };
}

// Generate unique element ID
export function generateElementId(type: string): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get default properties for new elements
export function getDefaultElementProperties(type: LabelElement['type']) {
  const defaults = {
    text: {
      text: 'New Text',
      fontSize: 12,
      fontWeight: 'normal',
      color: '#000000'
    },
    barcode: {
      text: '',
      barcodeType: 'code128',
      color: '#000000'
    },
    image: {
      imageUrl: '',
      color: '#CCCCCC'
    },
    shape: {
      shapeType: 'rectangle',
      color: '#CCCCCC'
    }
  };

  return defaults[type] || {};
}

// Get default size for new elements
export function getDefaultElementSize(type: LabelElement['type']): { width: number; height: number } {
  const sizes = {
    text: { width: 100, height: 30 },
    barcode: { width: 200, height: 60 },
    image: { width: 80, height: 80 },
    shape: { width: 60, height: 40 }
  };

  return sizes[type] || { width: 100, height: 30 };
}
