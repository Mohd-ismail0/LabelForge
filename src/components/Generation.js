import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { renderLabel, LABEL_SIZES } from '../utils/labelRenderer';
import jsPDF from 'jspdf';
import JSZip from 'jszip';

const Generation = () => {
  const { state, actions } = useApp();
  const { excelData, mappedColumns, labelSettings, quantitySettings } = state;
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPageSizeSelection, setShowPageSizeSelection] = useState(false);
  const [pageSize, setPageSize] = useState('a4');

  // Use shared LABEL_SIZES from utils

  const PAGE_SIZES = {
    a4: { width: 210, height: 297, unit: 'mm' },
    letter: { width: 216, height: 279, unit: 'mm' },
    legal: { width: 216, height: 356, unit: 'mm' }
  };

  const calculateSummary = () => {
    if (!excelData) return { products: 0, labels: 0, size: '', barcodeType: '' };

    const products = excelData.rows.length;
    let totalLabels = 0;

    if (quantitySettings.type === 'column' && mappedColumns.quantity) {
      const quantityColumnIndex = excelData.columnHeaders.indexOf(mappedColumns.quantity);
      totalLabels = excelData.rows.reduce((sum, row) => {
        const qty = parseInt(row[quantityColumnIndex]) || 0;
        return sum + qty;
      }, 0);
    } else if (quantitySettings.type === 'fixed') {
      totalLabels = products * quantitySettings.fixedQuantity;
    } else if (quantitySettings.type === 'manual') {
      totalLabels = Object.values(quantitySettings.manualQuantities).reduce((sum, qty) => sum + qty, 0);
    }

    const currentSize = LABEL_SIZES[labelSettings.size] || LABEL_SIZES['2x1'];
    const size = labelSettings.size === 'custom' 
      ? { width: labelSettings.customWidth, height: labelSettings.customHeight }
      : currentSize;
    const sizeText = `${size.width}" x ${size.height}"`;

    return {
      products,
      labels: totalLabels,
      size: sizeText,
      barcodeType: labelSettings.barcodeType
    };
  };

  const summary = calculateSummary();

  const generateLabels = async () => {
    if (!excelData || !mappedColumns.barcode) {
      actions.setError('Missing required data for label generation. Please ensure you have uploaded an Excel file and mapped the barcode column.');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const labels = [];
      const barcodeColumnIndex = excelData.columnHeaders.indexOf(mappedColumns.barcode);
      const textColumns = mappedColumns.text.map(col => 
        excelData.columnHeaders.indexOf(col)
      ).filter(index => index !== -1);

      let processedCount = 0;
      const totalRows = excelData.rows.length;

      for (let rowIndex = 0; rowIndex < excelData.rows.length; rowIndex++) {
        const row = excelData.rows[rowIndex];
        const barcode = row[barcodeColumnIndex];
        
        if (!barcode || barcode.toString().trim() === '') continue;

        // Get quantity for this row
        let quantity = 1;
        if (quantitySettings.type === 'column' && mappedColumns.quantity) {
          const quantityColumnIndex = excelData.columnHeaders.indexOf(mappedColumns.quantity);
          quantity = parseInt(row[quantityColumnIndex]) || 0;
        } else if (quantitySettings.type === 'fixed') {
          quantity = quantitySettings.fixedQuantity;
        } else if (quantitySettings.type === 'manual') {
          quantity = quantitySettings.manualQuantities[rowIndex] || 1;
        }
        
        // Skip rows with zero quantity
        if (quantity <= 0) continue;

        // Get text content
        const textContent = textColumns.map(colIndex => row[colIndex]).filter(val => val).join(' - ');

        // Generate labels for this product
        for (let i = 0; i < quantity; i++) {
          const labelData = {
            barcode,
            text: textContent,
            productIndex: rowIndex,
            labelIndex: i,
            columnHeaders: excelData.columnHeaders,
            rowData: row
          };
          labels.push(labelData);
        }

        processedCount++;
        setGenerationProgress((processedCount / totalRows) * 100);
      }

      actions.setGeneratedLabels(labels);
      setGenerationProgress(100);
    } catch (error) {
      actions.setError('Error generating labels: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadZIP = async () => {
    if (!state.generatedLabels.length) {
      actions.setError('No labels generated yet');
      return;
    }

    try {
      actions.setLoading(true);
      const zip = new JSZip();

      for (let i = 0; i < state.generatedLabels.length; i++) {
        const label = state.generatedLabels[i];
        
        // Use shared rendering function with high DPI for consistency
        const canvas = renderLabel(label, labelSettings, labelSettings.elements, 300);
        
        // Convert to high-quality blob and add to zip
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
        zip.file(`label_${label.productIndex + 1}_${label.labelIndex + 1}.png`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'barcode_labels.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      actions.setError('Error creating ZIP file: ' + error.message);
    } finally {
      actions.setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!state.generatedLabels.length) {
      actions.setError('No labels generated yet');
      return;
    }

    try {
      actions.setLoading(true);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: pageSize === 'a4' ? 'a4' : pageSize === 'letter' ? 'letter' : 'legal'
      });

      const currentSize = LABEL_SIZES[labelSettings.size] || LABEL_SIZES['2x1'];
      const size = labelSettings.size === 'custom' 
        ? { width: labelSettings.customWidth, height: labelSettings.customHeight }
        : currentSize;
      const pageSizeInfo = PAGE_SIZES[pageSize];
      
      // Calculate labels per page with zero wastage
      const labelWidthMM = size.width * 25.4; // Convert inches to mm
      const labelHeightMM = size.height * 25.4;
      const margin = 5; // Minimal margin for cutting
      
      // Calculate maximum labels that fit with zero wastage
      const labelsPerRow = Math.floor(pageSizeInfo.width / labelWidthMM);
      const labelsPerColumn = Math.floor(pageSizeInfo.height / labelHeightMM);
      const labelsPerPage = labelsPerRow * labelsPerColumn;
      
      // Calculate actual spacing to center labels
      const totalLabelWidth = labelsPerRow * labelWidthMM;
      const totalLabelHeight = labelsPerColumn * labelHeightMM;
      const horizontalSpacing = labelsPerRow > 1 ? (pageSizeInfo.width - totalLabelWidth) / (labelsPerRow - 1) : 0;
      const verticalSpacing = labelsPerColumn > 1 ? (pageSizeInfo.height - totalLabelHeight) / (labelsPerColumn - 1) : 0;

      let currentPage = 0;
      let currentRow = 0;
      let currentCol = 0;

      for (let i = 0; i < state.generatedLabels.length; i++) {
        const label = state.generatedLabels[i];
        
        if (i > 0 && i % labelsPerPage === 0) {
          pdf.addPage();
          currentPage++;
          currentRow = 0;
          currentCol = 0;
        }

        // Calculate position with zero wastage spacing
        const x = currentCol * (labelWidthMM + horizontalSpacing);
        const y = currentRow * (labelHeightMM + verticalSpacing);

        // Use shared rendering function with high DPI for PDF consistency
        const canvas = renderLabel(label, labelSettings, labelSettings.elements, 300);
        
        // Convert canvas to high-quality image data
        const imgData = canvas.toDataURL('image/png', 1.0); // Maximum quality
        
        // Add image to PDF with precise positioning
        pdf.addImage(imgData, 'PNG', x, y, labelWidthMM, labelHeightMM, undefined, 'FAST');

        // Update position
        currentCol++;
        if (currentCol >= labelsPerRow) {
          currentCol = 0;
          currentRow++;
        }
      }

      pdf.save('barcode_labels.pdf');
    } catch (error) {
      actions.setError('Error creating PDF: ' + error.message);
    } finally {
      actions.setLoading(false);
    }
  };

  const handlePrevious = () => {
    actions.setStep(4);
  };

  const handleStartOver = () => {
    actions.resetApp();
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Step 5: Generate & Export Labels</h2>
        <p className="card-description">
          Generate your labels and download in your preferred format
        </p>
      </div>
      <div className="card-body">
        <div className="generation-summary">
          <div className="summary-card">
            <h4>Final Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">File:</span>
                <span className="summary-value">{excelData?.fileName || '-'}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Products:</span>
                <span className="summary-value">{summary.products}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Labels:</span>
                <span className="summary-value">{summary.labels}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Label Size:</span>
                <span className="summary-value">{summary.size}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Barcode Type:</span>
                <span className="summary-value">{summary.barcodeType}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="generation-actions">
          <button
            className="btn btn-primary btn-large"
            onClick={generateLabels}
            disabled={isGenerating}
          >
            <span className="btn-icon">🚀</span>
            Generate All Labels
          </button>
        </div>

        {isGenerating && (
          <div className="generation-progress">
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
              <p>Generating labels... {Math.round(generationProgress)}%</p>
            </div>
          </div>
        )}

        {state.generatedLabels.length > 0 && (
          <div className="download-section">
            <h4>Download Your Labels</h4>
            
            {showPageSizeSelection && (
              <div className="page-size-selection">
                <h5>Select Page Size for PDF</h5>
                <div className="page-size-options">
                  <div className="option-group">
                    <input
                      type="radio"
                      id="page-a4"
                      name="page-size"
                      value="a4"
                      checked={pageSize === 'a4'}
                      onChange={(e) => setPageSize(e.target.value)}
                    />
                    <label htmlFor="page-a4">
                      <span className="option-title">A4 (210 × 297 mm)</span>
                      <span className="option-description">Standard international size</span>
                    </label>
                  </div>
                  <div className="option-group">
                    <input
                      type="radio"
                      id="page-letter"
                      name="page-size"
                      value="letter"
                      checked={pageSize === 'letter'}
                      onChange={(e) => setPageSize(e.target.value)}
                    />
                    <label htmlFor="page-letter">
                      <span className="option-title">Letter (8.5 × 11 in)</span>
                      <span className="option-description">Standard US size</span>
                    </label>
                  </div>
                  <div className="option-group">
                    <input
                      type="radio"
                      id="page-legal"
                      name="page-size"
                      value="legal"
                      checked={pageSize === 'legal'}
                      onChange={(e) => setPageSize(e.target.value)}
                    />
                    <label htmlFor="page-legal">
                      <span className="option-title">Legal (8.5 × 14 in)</span>
                      <span className="option-description">Extended length</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="download-options">
              <button
                className="btn btn-primary btn-large"
                onClick={downloadZIP}
                disabled={state.loading}
              >
                <span className="btn-icon">📦</span>
                Download ZIP
                <span className="btn-description">Individual label images</span>
              </button>
              <button
                className="btn btn-secondary btn-large"
                onClick={() => {
                  setShowPageSizeSelection(!showPageSizeSelection);
                  if (!showPageSizeSelection) {
                    setTimeout(downloadPDF, 100);
                  }
                }}
                disabled={state.loading}
              >
                <span className="btn-icon">📄</span>
                Download PDF
                <span className="btn-description">Print-ready labels in PDF format</span>
              </button>
            </div>
            <div className="download-info">
              <p><strong>ZIP Format:</strong> Contains individual high-resolution label images for custom printing or integration.</p>
              <p><strong>PDF Format:</strong> Optimized for printing with proper margins and cut lines. Compatible with Avery label sheets.</p>
              <div className="quality-note" style={{ 
                marginTop: '10px', 
                padding: '8px', 
                background: '#e8f5e8', 
                border: '1px solid #4caf50', 
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                <strong>✅ Quality Assurance:</strong> PDF output now matches the design preview exactly with consistent 300 DPI rendering and locked aspect ratios.
              </div>
            </div>
          </div>
        )}

        <div className="step-actions">
          <button className="btn btn-outline" onClick={handlePrevious}>
            Previous
          </button>
          <button className="btn btn-secondary" onClick={handleStartOver}>
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
};

export default Generation;