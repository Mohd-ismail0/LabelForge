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
    // Generate barcode with height 100% and width proportional to height
    const BARCODE_ASPECT_RATIO = 2; // Locked aspect ratio for optimal scanning
    const MIN_BARCODE_WIDTH = 1; // Minimum barcode width for JsBarcode
    
    // Use full height and calculate width proportionally
    const barcodeHeight = height; // 100% height
    const barcodeWidth = height * BARCODE_ASPECT_RATIO; // Width proportional to height
    
    // Reserve space for text if needed (20% of height)
    let finalBarcodeHeight = barcodeHeight;
    if (showText) {
      const textHeight = Math.max(8, barcodeHeight * 0.2);
      finalBarcodeHeight = Math.max(barcodeHeight - textHeight, barcodeHeight * 0.8);
    }
    
    // Generate barcode at calculated dimensions
    const barcodeCanvas = document.createElement('canvas');
    barcodeCanvas.width = barcodeWidth;
    barcodeCanvas.height = finalBarcodeHeight;
    
    JsBarcode(barcodeCanvas, barcode.toString(), {
      format: barcodeType,
      width: Math.max(MIN_BARCODE_WIDTH, barcodeWidth / 100), // Scale for optimal line width
      height: finalBarcodeHeight,
      displayValue: showText,
      fontSize: Math.max(8, Math.min(16, finalBarcodeHeight * 0.15)), // Proportional font size
      margin: 0, // No margin for minimal white space
      lineColor: 'black',
      textAlign: 'center',
      textPosition: 'bottom',
      textMargin: 0 // No text margin for minimal spacing
    });
    
    // Center the barcode horizontally within the container (flexbox center alignment)
    const barcodeX = (width - barcodeCanvas.width) / 2;
    const barcodeY = 0; // Start from top since we're using full height
    
    // Draw barcode with high quality
    ctx.imageSmoothingEnabled = false; // Disable smoothing for crisp barcode lines
    ctx.drawImage(barcodeCanvas, barcodeX, barcodeY);
    
    return canvas;
  } catch (error) {
    console.error('Error generating barcode:', error);
    // Draw error text
    ctx.fillStyle = 'red';
    ctx.font = `${Math.max(8, height * 0.1)}px Arial`;
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
    // Get label container flexbox properties
    const labelFlexbox = labelSettings.labelFlexbox || {
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '0px',
      padding: '0px',
      margin: '0px'
    };
    
    const labelPadding = parseInt(labelFlexbox.padding?.replace('px', '') || '0');
    const labelGap = parseInt(labelFlexbox.gap?.replace('px', '') || '0');
    
    // Calculate available space after label padding
    const availableWidth = width - (labelPadding * 2);
    const availableHeight = height - (labelPadding * 2);
    
    // Calculate total height needed for all elements
    let totalHeight = 0;
    const elementCanvases = [];
    
    elements.forEach(element => {
      if (element.type === 'group') {
        // Calculate group dimensions
        if (element.children && element.children.length > 0) {
          const groupPadding = parseInt(element.flexbox?.padding?.replace('px', '') || '0');
          const groupGap = parseInt(element.flexbox?.gap?.replace('px', '') || '0');
          
          let groupWidth = 0;
          let groupHeight = 0;
          const childCanvases = [];
          
          // Calculate group container width for percentage calculations
          const groupContainerWidth = availableWidth - (groupPadding * 2);
          
          element.children.forEach(child => {
            if (child.type === 'barcode') {
              // Convert percentage to actual pixels
              const childWidth = child.size?.width ? 
                (groupContainerWidth * child.size.width / 100) : 
                (groupContainerWidth * 0.8); // Default 80% width
              const childHeight = (child.size?.height || 40) * (dpi / 96);
              
              const childCanvas = renderBarcode(
                labelData.barcode,
                child.barcodeType || labelSettings.barcodeType || 'EAN13',
                childWidth,
                childHeight
              );
              childCanvases.push({ canvas: childCanvas, type: 'barcode' });
              groupWidth += childCanvas.width + groupGap;
              groupHeight = Math.max(groupHeight, childCanvas.height);
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
              
              // Convert percentage to actual pixels
              const childWidth = child.size?.width ? 
                (groupContainerWidth * child.size.width / 100) : 
                groupContainerWidth; // Default 100% width
              const childHeight = (child.size?.height || 20) * (dpi / 96);
              
              const childCanvas = renderText(
                textContent,
                child.style,
                childWidth,
                childHeight
              );
              childCanvases.push({ canvas: childCanvas, type: 'text' });
              groupWidth += childCanvas.width + groupGap;
              groupHeight = Math.max(groupHeight, childCanvas.height);
            }
          });
          
          if (groupWidth > 0) {
            groupWidth -= groupGap; // Remove last gap
            groupWidth += groupPadding * 2; // Add group padding
            groupHeight += groupPadding * 2; // Add group padding
          }
          
          elementCanvases.push({
            type: 'group',
            width: groupWidth,
            height: groupHeight,
            children: childCanvases,
            flexbox: element.flexbox,
            groupPadding,
            groupGap
          });
          
          totalHeight += groupHeight + labelGap;
        }
      } else {
        // Calculate individual element dimensions
        if (element.type === 'barcode') {
          // Convert percentage to actual pixels
          const elementWidth = element.size?.width ? 
            (availableWidth * element.size.width / 100) : 
            (availableWidth * 0.8); // Default 80% width
          const elementHeight = (element.size?.height || 40) * (dpi / 96);
          
          const elementCanvas = renderBarcode(
            labelData.barcode,
            element.barcodeType || labelSettings.barcodeType || 'EAN13',
            elementWidth,
            elementHeight
          );
          
          elementCanvases.push({
            type: 'barcode',
            width: elementCanvas.width,
            height: elementCanvas.height,
            canvas: elementCanvas
          });
          
          totalHeight += elementCanvas.height + labelGap;
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
          
          // Convert percentage to actual pixels
          const elementWidth = element.size?.width ? 
            (availableWidth * element.size.width / 100) : 
            availableWidth; // Default 100% width
          const elementHeight = (element.size?.height || 20) * (dpi / 96);
          
          const elementCanvas = renderText(
            textContent,
            element.style,
            elementWidth,
            elementHeight
          );
          
          elementCanvases.push({
            type: 'text',
            width: elementCanvas.width,
            height: elementCanvas.height,
            canvas: elementCanvas
          });
          
          totalHeight += elementCanvas.height + labelGap;
        }
      }
    });
    
    if (totalHeight > 0) {
      totalHeight -= labelGap; // Remove last gap
    }
    
    // Calculate starting position based on label flexbox properties
    let startY = labelPadding;
    if (labelFlexbox.justifyContent === 'center') {
      startY = (height - totalHeight) / 2;
    } else if (labelFlexbox.justifyContent === 'flex-end') {
      startY = height - labelPadding - totalHeight;
    } else if (labelFlexbox.justifyContent === 'space-between' && elementCanvases.length > 1) {
      const spaceBetween = (availableHeight - totalHeight) / (elementCanvases.length - 1);
      // Will be handled in the loop below
    } else if (labelFlexbox.justifyContent === 'space-around' && elementCanvases.length > 0) {
      const spaceAround = availableHeight / (elementCanvases.length * 2);
      startY = labelPadding + spaceAround;
    } else if (labelFlexbox.justifyContent === 'space-evenly' && elementCanvases.length > 0) {
      const spaceEvenly = availableHeight / (elementCanvases.length + 1);
      startY = spaceEvenly;
    }
    
    // Render elements
    let currentY = startY;
    elementCanvases.forEach((elementCanvas, index) => {
      if (elementCanvas.type === 'group') {
        // Render group
        const { children, flexbox, groupPadding, groupGap } = elementCanvas;
        
        // Calculate group position based on label flexbox alignment
        let groupX = labelPadding;
        if (labelFlexbox.alignItems === 'center') {
          groupX = (width - elementCanvas.width) / 2;
        } else if (labelFlexbox.alignItems === 'flex-end') {
          groupX = width - labelPadding - elementCanvas.width;
        }
        
        // Render group children
        let childX = groupX + groupPadding;
        children.forEach(({ canvas, type }) => {
          ctx.drawImage(canvas, childX, currentY + groupPadding);
          childX += canvas.width + groupGap;
        });
        
        currentY += elementCanvas.height + labelGap;
      } else {
        // Render individual element
        let elementX = labelPadding;
        if (labelFlexbox.alignItems === 'center') {
          elementX = (width - elementCanvas.width) / 2;
        } else if (labelFlexbox.alignItems === 'flex-end') {
          elementX = width - labelPadding - elementCanvas.width;
        }
        
        ctx.drawImage(elementCanvas.canvas, elementX, currentY);
        currentY += elementCanvas.height + labelGap;
      }
    });
  }
  
  return canvas;
};