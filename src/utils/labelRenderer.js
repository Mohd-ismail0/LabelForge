import JsBarcode from 'jsbarcode';

// Shared label rendering utilities to ensure consistency between design and generation

// Locked aspect ratio for barcode quality (2.5:1 is optimal for most barcode types)
export const BARCODE_ASPECT_RATIO = 2.5;

export const LABEL_SIZES = {
  '2x1': { width: 2, height: 1, dpi: 300 },
  '3x1': { width: 3, height: 1, dpi: 300 },
  '2.5x1': { width: 2.5, height: 1, dpi: 300 },
  '4x2': { width: 4, height: 2, dpi: 300 },
  'custom': { width: 2, height: 1, dpi: 300 }
};

export const renderBarcode = (barcode, barcodeType, width, height, showText = true) => {
  try {
    // First, generate the barcode to determine its actual width
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    
    // Reserve space for text if needed (20% of height)
    let finalBarcodeHeight = height;
    if (showText) {
      const textHeight = Math.max(8, height * 0.2);
      finalBarcodeHeight = Math.max(height - textHeight, height * 0.8);
    }
    
    // Generate barcode with optimal settings
    JsBarcode(tempCanvas, barcode.toString(), {
      format: barcodeType,
      width: 2, // Optimal line width for scanning
      height: finalBarcodeHeight,
      displayValue: showText,
      fontSize: Math.max(8, Math.min(16, finalBarcodeHeight * 0.15)),
      margin: 0, // No margin for minimal white space
      lineColor: 'black',
      textAlign: 'center',
      textPosition: 'bottom',
      textMargin: 0
    });
    
    // Now create the final canvas with the actual barcode width
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match the actual barcode width
    canvas.width = tempCanvas.width;
    canvas.height = tempCanvas.height;
    
    // Fill background with transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the barcode
    ctx.imageSmoothingEnabled = false; // Disable smoothing for crisp barcode lines
    ctx.drawImage(tempCanvas, 0, 0);
    
    return canvas;
  } catch (error) {
    console.error('Error generating barcode:', error);
    // Create error canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
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
  
  // Fill background with transparent
  ctx.clearRect(0, 0, width, height);
  
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

export const renderLabel = (labelData, labelSettings, elements = [], targetDPI = null) => {
  const currentSize = LABEL_SIZES[labelSettings.size] || LABEL_SIZES['2x1'];
  const size = labelSettings.size === 'custom' 
    ? { width: labelSettings.customWidth, height: labelSettings.customHeight }
    : currentSize;
  
  // Use target DPI if provided, otherwise use the default from label size
  const dpi = targetDPI || currentSize.dpi;
  const width = size.width * dpi;
  const height = size.height * dpi;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size
  canvas.width = width;
  canvas.height = height;
  
  // Fill background with transparent
  ctx.clearRect(0, 0, width, height);
  
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
    
    // Calculate available space after label padding - CONSTRAINED TO LABEL DIMENSIONS
    const availableWidth = Math.max(0, width - (labelPadding * 2));
    const availableHeight = Math.max(0, height - (labelPadding * 2));
    
    // Render elements with proper flexbox layout that respects label boundaries
    renderFlexboxLayout(ctx, elements, {
      x: labelPadding,
      y: labelPadding,
      width: availableWidth,
      height: availableHeight,
      flexDirection: labelFlexbox.flexDirection || 'column',
      justifyContent: labelFlexbox.justifyContent || 'center',
      alignItems: labelFlexbox.alignItems || 'center',
      gap: labelGap,
      labelData,
      labelSettings,
      dpi
    });
  }
  
  return canvas;
};

// Proper flexbox layout rendering that respects boundaries
const renderFlexboxLayout = (ctx, elements, container) => {
  const { x, y, width, height, flexDirection, justifyContent, alignItems, gap, labelData, labelSettings, dpi } = container;
  
  // Calculate element dimensions first
  const elementDimensions = elements.map(element => {
    if (element.type === 'group') {
      return calculateGroupDimensions(element, { width, height, labelData, labelSettings, dpi });
    } else {
      return calculateElementDimensions(element, { width, height, labelData, labelSettings, dpi });
    }
  });
  
  // Calculate total size needed
  let totalSize = 0;
  if (flexDirection === 'column') {
    totalSize = elementDimensions.reduce((sum, dim) => sum + dim.height, 0) + (gap * (elements.length - 1));
  } else {
    totalSize = elementDimensions.reduce((sum, dim) => sum + dim.width, 0) + (gap * (elements.length - 1));
  }
  
  // Calculate starting position based on justifyContent
  let startPos = 0;
  if (justifyContent === 'center') {
    if (flexDirection === 'column') {
      startPos = (height - totalSize) / 2;
    } else {
      startPos = (width - totalSize) / 2;
    }
  } else if (justifyContent === 'flex-end') {
    if (flexDirection === 'column') {
      startPos = height - totalSize;
    } else {
      startPos = width - totalSize;
    }
  } else if (justifyContent === 'space-between' && elements.length > 1) {
    // Will be handled in the loop
  } else if (justifyContent === 'space-around' && elements.length > 0) {
    if (flexDirection === 'column') {
      startPos = (height - totalSize) / (elements.length * 2);
    } else {
      startPos = (width - totalSize) / (elements.length * 2);
    }
  } else if (justifyContent === 'space-evenly' && elements.length > 0) {
    if (flexDirection === 'column') {
      startPos = (height - totalSize) / (elements.length + 1);
    } else {
      startPos = (width - totalSize) / (elements.length + 1);
    }
  }
  
  // Render elements
  let currentPos = startPos;
  elementDimensions.forEach((dim, index) => {
    let elementX = x;
    let elementY = y + currentPos;
    
    if (flexDirection === 'row') {
      elementX = x + currentPos;
      elementY = y;
    }
    
    // Calculate alignment
    if (flexDirection === 'column') {
      if (alignItems === 'center') {
        elementX = x + (width - dim.width) / 2;
      } else if (alignItems === 'flex-end') {
        elementX = x + width - dim.width;
      }
    } else {
      if (alignItems === 'center') {
        elementY = y + (height - dim.height) / 2;
      } else if (alignItems === 'flex-end') {
        elementY = y + height - dim.height;
      }
    }
    
    // Render the element
    if (elements[index].type === 'group') {
      renderGroup(ctx, elements[index], dim, { x: elementX, y: elementY, labelData, labelSettings, dpi });
    } else {
      ctx.drawImage(dim.canvas, elementX, elementY);
    }
    
    // Update position for next element
    if (justifyContent === 'space-between' && elements.length > 1) {
      const spaceBetween = flexDirection === 'column' 
        ? (height - totalSize) / (elements.length - 1)
        : (width - totalSize) / (elements.length - 1);
      currentPos += (flexDirection === 'column' ? dim.height : dim.width) + spaceBetween;
    } else {
      currentPos += (flexDirection === 'column' ? dim.height : dim.width) + gap;
    }
  });
};

// Calculate dimensions for individual elements
const calculateElementDimensions = (element, container) => {
  const { width: containerWidth, height: containerHeight, labelData, labelSettings, dpi } = container;
  
  if (element.type === 'barcode') {
    const elementWidth = element.size?.width ? 
      (containerWidth * element.size.width / 100) : 
      (containerWidth * 0.8);
    const elementHeight = (element.size?.height || 40) * (dpi / 96);
    
    const canvas = renderBarcode(
      labelData.barcode,
      element.barcodeType || labelSettings.barcodeType || 'EAN13',
      elementWidth,
      elementHeight
    );
    
    return { width: canvas.width, height: canvas.height, canvas };
  } else if (element.type === 'text') {
    let textContent = element.content;
    if (!element.isStatic && element.columnName) {
      const colIndex = labelData.columnHeaders?.indexOf(element.columnName);
      if (colIndex !== -1 && labelData.rowData) {
        textContent = labelData.rowData[colIndex] || element.columnName;
      }
    } else if (!element.isStatic && labelData.text) {
      textContent = labelData.text;
    }
    
    const elementWidth = element.size?.width ? 
      (containerWidth * element.size.width / 100) : 
      containerWidth;
    const elementHeight = (element.size?.height || 20) * (dpi / 96);
    
    const canvas = renderText(textContent, element.style, elementWidth, elementHeight);
    
    return { width: canvas.width, height: canvas.height, canvas };
  }
  
  return { width: 0, height: 0 };
};

// Calculate dimensions for groups
const calculateGroupDimensions = (group, container) => {
  const { width: containerWidth, height: containerHeight, labelData, labelSettings, dpi } = container;
  
  if (!group.children || group.children.length === 0) {
    return { width: 0, height: 0, children: [] };
  }
  
  const groupPadding = parseInt(group.flexbox?.padding?.replace('px', '') || '0');
  const groupGap = parseInt(group.flexbox?.gap?.replace('px', '') || '0');
  const groupFlexDirection = group.flexbox?.flexDirection || 'row';
  
  // Calculate available space within group
  const groupAvailableWidth = containerWidth - (groupPadding * 2);
  const groupAvailableHeight = containerHeight - (groupPadding * 2);
  
  // Calculate child dimensions
  const childDimensions = group.children.map(child => 
    calculateElementDimensions(child, { 
      width: groupAvailableWidth, 
      height: groupAvailableHeight, 
      labelData, 
      labelSettings, 
      dpi 
    })
  );
  
  // Calculate group size based on flex direction
  let groupWidth = 0;
  let groupHeight = 0;
  
  if (groupFlexDirection === 'row') {
    groupWidth = childDimensions.reduce((sum, dim) => sum + dim.width, 0) + (groupGap * (group.children.length - 1));
    groupHeight = Math.max(...childDimensions.map(dim => dim.height), 0);
  } else {
    groupWidth = Math.max(...childDimensions.map(dim => dim.width), 0);
    groupHeight = childDimensions.reduce((sum, dim) => sum + dim.height, 0) + (groupGap * (group.children.length - 1));
  }
  
  // Add padding
  groupWidth += groupPadding * 2;
  groupHeight += groupPadding * 2;
  
  return { 
    width: groupWidth, 
    height: groupHeight, 
    children: childDimensions,
    groupPadding,
    groupGap,
    groupFlexDirection
  };
};

// Render a group with its children
const renderGroup = (ctx, group, groupDim, container) => {
  const { x, y, labelData, labelSettings, dpi } = container;
  const { children, groupPadding, groupGap, groupFlexDirection } = groupDim;
  
  let childX = x + groupPadding;
  let childY = y + groupPadding;
  
  children.forEach((childDim, index) => {
    ctx.drawImage(childDim.canvas, childX, childY);
    
    if (groupFlexDirection === 'row') {
      childX += childDim.width + groupGap;
    } else {
      childY += childDim.height + groupGap;
    }
  });
};