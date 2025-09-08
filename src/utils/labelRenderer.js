import JsBarcode from 'jsbarcode';

// Shared label rendering utilities to ensure consistency between design and generation

export const LABEL_SIZES = {
  '2x1': { width: 2, height: 1, dpi: 300 },
  '3x1': { width: 3, height: 1, dpi: 300 },
  '2.5x1': { width: 2.5, height: 1, dpi: 300 },
  '4x2': { width: 4, height: 2, dpi: 300 },
  'custom': { width: 2, height: 1, dpi: 300 }
};

export const renderBarcode = (barcode, barcodeType, width, height, showText = true) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size
  canvas.width = width;
  canvas.height = height;
  
  // Fill background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  
  try {
    // Generate barcode
    const barcodeCanvas = document.createElement('canvas');
    JsBarcode(barcodeCanvas, barcode.toString(), {
      format: barcodeType,
      width: 2,
      height: height * 0.6,
      displayValue: showText,
      fontSize: Math.max(8, height * 0.15),
      margin: 5,
      background: 'white',
      lineColor: 'black'
    });
    
    // Draw barcode centered
    const barcodeX = (width - barcodeCanvas.width) / 2;
    const barcodeY = (height - barcodeCanvas.height) / 2;
    ctx.drawImage(barcodeCanvas, barcodeX, barcodeY);
    
    return canvas;
  } catch (error) {
    console.error('Error generating barcode:', error);
    // Draw error text
    ctx.fillStyle = 'red';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Invalid Barcode', width / 2, height / 2);
    return canvas;
  }
};

export const renderText = (text, style, width, height) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size
  canvas.width = width;
  canvas.height = height;
  
  // Fill background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  
  // Set text properties
  ctx.fillStyle = style.color || '#000000';
  ctx.font = `${style.fontWeight || 'normal'} ${style.fontSize || 12}px Arial`;
  ctx.textAlign = style.textAlign || 'left';
  ctx.textBaseline = 'middle';
  
  // Calculate text position
  let x, y;
  switch (style.textAlign) {
    case 'center':
      x = width / 2;
      break;
    case 'right':
      x = width - 5;
      break;
    default:
      x = 5;
  }
  y = height / 2;
  
  // Draw text
  ctx.fillText(text, x, y);
  
  return canvas;
};

export const renderLabel = (labelData, labelSettings, elements = []) => {
  const currentSize = LABEL_SIZES[labelSettings.size] || LABEL_SIZES['2x1'];
  const size = labelSettings.size === 'custom' 
    ? { width: labelSettings.customWidth, height: labelSettings.customHeight }
    : currentSize;
  const dpi = currentSize.dpi;
  const width = size.width * dpi;
  const height = size.height * dpi;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size
  canvas.width = width;
  canvas.height = height;
  
  // Fill background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  
  // If no elements defined, use default layout
  if (elements.length === 0) {
    // Default: barcode centered, text below
    const barcodeHeight = height * 0.6;
    const barcodeCanvas = renderBarcode(
      labelData.barcode,
      labelSettings.barcodeType || 'EAN13',
      width * 0.8,
      barcodeHeight,
      true
    );
    
    const barcodeX = (width - barcodeCanvas.width) / 2;
    const barcodeY = height * 0.1;
    ctx.drawImage(barcodeCanvas, barcodeX, barcodeY);
    
    // Add text if available
    if (labelData.text) {
      ctx.fillStyle = 'black';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      const textY = height * 0.8;
      ctx.fillText(labelData.text, width / 2, textY);
    }
  } else {
    // Render elements using flexbox layout with real-world dimensions
    const padding = 10; // 10px padding
    const gap = 10; // 10px gap between elements
    
    // Calculate available space
    const availableWidth = width - (padding * 2);
    const availableHeight = height - (padding * 2);
    
    // Start rendering from top-left with padding
    let currentY = padding;
    
    elements.forEach(element => {
      if (element.type === 'group') {
        // Render group elements
        if (element.children && element.children.length > 0) {
          // Calculate group dimensions
          const groupPadding = parseInt(element.flexbox.padding) || 10;
          const groupGap = parseInt(element.flexbox.gap) || 10;
          
          // Calculate total width needed for group
          let totalGroupWidth = 0;
          const childCanvases = [];
          
          element.children.forEach(child => {
            if (child.type === 'barcode') {
              const childCanvas = renderBarcode(
                labelData.barcode,
                child.barcodeType || labelSettings.barcodeType || 'EAN13',
                120 * (dpi / 96),
                40 * (dpi / 96)
              );
              childCanvases.push({ canvas: childCanvas, type: 'barcode' });
              totalGroupWidth += childCanvas.width + groupGap;
            } else if (child.type === 'text') {
              // Get text content for this specific element
              let textContent = child.content;
              if (!child.isStatic && child.columnName) {
                // Use specific column data
                const colIndex = labelData.columnHeaders?.indexOf(child.columnName);
                if (colIndex !== -1 && labelData.rowData) {
                  textContent = labelData.rowData[colIndex] || child.columnName;
                }
              } else if (!child.isStatic && labelData.text) {
                textContent = labelData.text;
              }
              
              const childCanvas = renderText(
                textContent,
                child.style,
                100 * (dpi / 96),
                20 * (dpi / 96)
              );
              childCanvases.push({ canvas: childCanvas, type: 'text' });
              totalGroupWidth += childCanvas.width + groupGap;
            }
          });
          
          totalGroupWidth -= groupGap; // Remove last gap
          
          // Position group based on flexbox properties
          let startX = padding;
          if (element.flexbox.justifyContent === 'center') {
            startX = (width - totalGroupWidth) / 2;
          } else if (element.flexbox.justifyContent === 'flex-end') {
            startX = width - padding - totalGroupWidth;
          }
          
          // Render group children
          let currentX = startX;
          childCanvases.forEach(({ canvas, type }) => {
            ctx.drawImage(canvas, currentX, currentY);
            currentX += canvas.width + groupGap;
          });
          
          currentY += Math.max(...childCanvases.map(c => c.canvas.height)) + gap;
        }
      } else {
        // Render individual elements
        if (element.type === 'barcode') {
          const elementCanvas = renderBarcode(
            labelData.barcode,
            element.barcodeType || labelSettings.barcodeType || 'EAN13',
            120 * (dpi / 96),
            40 * (dpi / 96)
          );
          
          // Center horizontally
          const x = (width - elementCanvas.width) / 2;
          ctx.drawImage(elementCanvas, x, currentY);
          currentY += elementCanvas.height + gap;
        } else if (element.type === 'text') {
          // Get text content for this specific element
          let textContent = element.content;
          if (!element.isStatic && element.columnName) {
            // Use specific column data
            const colIndex = labelData.columnHeaders?.indexOf(element.columnName);
            if (colIndex !== -1 && labelData.rowData) {
              textContent = labelData.rowData[colIndex] || element.columnName;
            }
          } else if (!element.isStatic && labelData.text) {
            textContent = labelData.text;
          }
          
          const elementCanvas = renderText(
            textContent,
            element.style,
            150 * (dpi / 96),
            20 * (dpi / 96)
          );
          
          // Center horizontally
          const x = (width - elementCanvas.width) / 2;
          ctx.drawImage(elementCanvas, x, currentY);
          currentY += elementCanvas.height + gap;
        }
      }
    });
  }
  
  return canvas;
};