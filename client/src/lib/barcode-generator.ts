export interface BarcodeOptions {
  value: string;
  type: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
}

export function generateBarcodeDataURL(options: BarcodeOptions): string {
  const { value, type, width = 200, height = 60, displayValue = true, fontSize = 12 } = options;
  
  // Create a canvas element
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }
  
  canvas.width = width;
  canvas.height = height;
  
  // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  
  // Generate barcode pattern based on type
  const barcodeHeight = displayValue ? height - fontSize - 10 : height;
  const barcodePattern = generateBarcodePattern(value, type);
  
  // Draw barcode bars
  ctx.fillStyle = 'black';
  const barWidth = width / barcodePattern.length;
  
  for (let index = 0; index < barcodePattern.length; index++) {
    const bar = barcodePattern[index];
    if (bar === '1') {
      ctx.fillRect(index * barWidth, 5, barWidth, barcodeHeight - 10);
    }
  }
  
  // Draw value text if enabled
  if (displayValue) {
    ctx.fillStyle = 'black';
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(value, width / 2, height - 5);
  }
  
  return canvas.toDataURL();
}

function generateBarcodePattern(value: string, type: string): string {
  switch (type.toLowerCase()) {
    case 'code128':
      return generateCode128Pattern(value);
    case 'code39':
      return generateCode39Pattern(value);
    case 'ean13':
      return generateEAN13Pattern(value);
    case 'upc':
    case 'upca':
      return generateUPCAPattern(value);
    default:
      return generateCode128Pattern(value);
  }
}

function generateCode128Pattern(value: string): string {
  // Simplified Code 128 pattern generation
  // In a real implementation, you would use proper Code 128 encoding tables
  let pattern = '11010000100'; // Start B
  
  for (let i = 0; i < value.length; i++) {
    // Add pattern for each character (simplified)
    pattern += '10110011100'; // Example pattern
  }
  
  pattern += '1100011101011'; // Stop pattern
  return pattern;
}

function generateCode39Pattern(value: string): string {
  // Simplified Code 39 pattern
  const code39Table: { [key: string]: string } = {
    'A': '110101001011', 'B': '101101001011', 'C': '110110100101',
    'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
    'G': '101010011011', 'H': '110101001101', 'I': '101101001101',
    'J': '101011001101', 'K': '110101010011', 'L': '101101010011',
    'M': '110110101001', 'N': '101011010011', 'O': '110101101001',
    'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
    'S': '101101011001', 'T': '101011011001', 'U': '110010101011',
    'V': '100110101011', 'W': '110011010101', 'X': '100101101011',
    'Y': '110010110101', 'Z': '100110110101', '0': '101001101101',
    '1': '110100101011', '2': '101100101011', '3': '110110010101',
    '4': '101001101011', '5': '110100110101', '6': '101100110101',
    '7': '101001011011', '8': '110100101101', '9': '101100101101',
    '-': '100101011011', '.': '110010101101', ' ': '100110101101',
    '*': '100101101101' // Start/Stop
  };
  
  let pattern = code39Table['*']; // Start
  
  for (const char of value.toUpperCase()) {
    if (code39Table[char]) {
      pattern += '0' + code39Table[char]; // Inter-character gap
    }
  }
  
  pattern += '0' + code39Table['*']; // Stop
  return pattern;
}

function generateEAN13Pattern(value: string): string {
  // Simplified EAN-13 pattern (requires 13 digits)
  if (value.length !== 13) {
    return generateCode128Pattern(value); // Fallback
  }
  
  // EAN-13 encoding is complex, this is a simplified version
  let pattern = '101'; // Start guard
  
  // Left group (6 digits)
  for (let i = 1; i < 7; i++) {
    pattern += '0001101'; // Simplified L-code pattern
  }
  
  pattern += '01010'; // Center guard
  
  // Right group (6 digits)  
  for (let i = 7; i < 13; i++) {
    pattern += '1110010'; // Simplified R-code pattern
  }
  
  pattern += '101'; // End guard
  return pattern;
}

function generateUPCAPattern(value: string): string {
  // UPC-A is similar to EAN-13 but with different structure
  if (value.length !== 12) {
    return generateCode128Pattern(value); // Fallback
  }
  
  let pattern = '101'; // Start guard
  
  // Left group (6 digits)
  for (let i = 0; i < 6; i++) {
    pattern += '0001101'; // Simplified pattern
  }
  
  pattern += '01010'; // Center guard
  
  // Right group (6 digits)
  for (let i = 6; i < 12; i++) {
    pattern += '1110010'; // Simplified pattern
  }
  
  pattern += '101'; // End guard
  return pattern;
}

export function validateBarcodeValue(value: string, type: string): { valid: boolean; error?: string } {
  if (!value || value.trim().length === 0) {
    return { valid: false, error: 'Barcode value cannot be empty' };
  }
  
  switch (type.toLowerCase()) {
    case 'ean13':
      if (value.length !== 13 || !/^\d+$/.test(value)) {
        return { valid: false, error: 'EAN-13 requires exactly 13 digits' };
      }
      break;
    case 'upc':
    case 'upca':
      if (value.length !== 12 || !/^\d+$/.test(value)) {
        return { valid: false, error: 'UPC-A requires exactly 12 digits' };
      }
      break;
    case 'code39':
      if (!/^[A-Z0-9\-. ]+$/.test(value.toUpperCase())) {
        return { valid: false, error: 'Code 39 supports uppercase letters, numbers, and - . space' };
      }
      break;
    case 'code128':
      // Code 128 supports most ASCII characters
      if (value.length > 80) {
        return { valid: false, error: 'Code 128 value too long (max 80 characters)' };
      }
      break;
    default:
      break;
  }
  
  return { valid: true };
}
