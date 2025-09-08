import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import JsBarcode from 'jsbarcode';

const ColumnMapping = () => {
  const { state, actions } = useApp();
  const { columnHeaders, mappedColumns, excelData } = state;
  const [draggedColumn, setDraggedColumn] = useState(null);

  useEffect(() => {
    updatePreview();
  }, [mappedColumns]);

  const handleDragStart = (e, column) => {
    setDraggedColumn(column);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, zoneType) => {
    e.preventDefault();
    if (!draggedColumn) return;

    const newMappedColumns = { ...mappedColumns };

    if (zoneType === 'barcode') {
      newMappedColumns.barcode = draggedColumn;
    } else if (zoneType === 'text') {
      if (!newMappedColumns.text.includes(draggedColumn)) {
        newMappedColumns.text = [...newMappedColumns.text, draggedColumn];
      }
    } else if (zoneType === 'quantity') {
      newMappedColumns.quantity = draggedColumn;
    }

    actions.setMappedColumns(newMappedColumns);
    setDraggedColumn(null);
  };

  const removeColumn = (column, zoneType) => {
    const newMappedColumns = { ...mappedColumns };

    if (zoneType === 'barcode') {
      newMappedColumns.barcode = null;
    } else if (zoneType === 'text') {
      newMappedColumns.text = newMappedColumns.text.filter(c => c !== column);
    } else if (zoneType === 'quantity') {
      newMappedColumns.quantity = null;
    }

    actions.setMappedColumns(newMappedColumns);
  };

  const updatePreview = () => {
    if (!mappedColumns.barcode || !excelData) return;

    try {
      const barcodeColumnIndex = excelData.columnHeaders.indexOf(mappedColumns.barcode);
      const sampleBarcode = excelData.rows[0]?.[barcodeColumnIndex];

      if (sampleBarcode) {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, sampleBarcode.toString(), {
          format: state.labelSettings.barcodeType,
          width: 2,
          height: 50,
          displayValue: true,
          background: 'white',
          lineColor: 'black'
        });

        const previewBarcode = document.getElementById('mapping-preview-barcode');
        if (previewBarcode) {
          previewBarcode.innerHTML = '';
          previewBarcode.appendChild(canvas);
        }
      }

      // Update preview text
      const previewText = document.getElementById('mapping-preview-text');
      if (previewText && mappedColumns.text.length > 0) {
        const textValues = mappedColumns.text.map(col => {
          const colIndex = excelData.columnHeaders.indexOf(col);
          return excelData.rows[0]?.[colIndex] || '';
        }).filter(val => val).join(' - ');
        
        previewText.textContent = textValues || 'Sample Product Information';
      }
    } catch (error) {
      console.error('Error updating preview:', error);
    }
  };

  const canContinue = mappedColumns.barcode !== null;

  const handlePrevious = () => {
    actions.setStep(1);
  };

  const handleNext = () => {
    if (canContinue) {
      actions.setStep(3);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Step 2: Map Columns to Label Elements</h2>
        <p className="card-description">
          Drag columns from your data to the appropriate label sections
        </p>
      </div>
      <div className="card-body">
        <div className="mapping-container">
          <div className="available-columns">
            <h3>Available Columns</h3>
            <div className="columns-grid">
              {columnHeaders.map((column, index) => (
                <div
                  key={index}
                  className="column-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, column)}
                >
                  {column}
                </div>
              ))}
            </div>
          </div>

          <div className="mapping-zones">
            <div
              className={`mapping-zone required ${!mappedColumns.barcode ? 'empty' : ''}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'barcode')}
            >
              <div className="zone-header">
                <h4>Barcode Data</h4>
                <span className="required-badge">Required</span>
              </div>
              <p className="zone-description">
                Drag the column containing barcode/EAN codes
              </p>
              <div className="dropped-columns">
                {mappedColumns.barcode && (
                  <div className="dropped-column">
                    {mappedColumns.barcode}
                    <button
                      className="remove-column"
                      onClick={() => removeColumn(mappedColumns.barcode, 'barcode')}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div
              className="mapping-zone"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'text')}
            >
              <div className="zone-header">
                <h4>Label Text</h4>
                <span className="optional-badge">Optional</span>
              </div>
              <p className="zone-description">
                Drag columns for product information (size, style, description)
              </p>
              <div className="dropped-columns">
                {mappedColumns.text.map((column, index) => (
                  <div key={index} className="dropped-column">
                    {column}
                    <button
                      className="remove-column"
                      onClick={() => removeColumn(column, 'text')}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="mapping-zone"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'quantity')}
            >
              <div className="zone-header">
                <h4>Quantity</h4>
                <span className="optional-badge">Optional</span>
              </div>
              <p className="zone-description">
                Drag column containing quantity values for label duplication
              </p>
              <div className="dropped-columns">
                {mappedColumns.quantity && (
                  <div className="dropped-column">
                    {mappedColumns.quantity}
                    <button
                      className="remove-column"
                      onClick={() => removeColumn(mappedColumns.quantity, 'quantity')}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mapping-preview">
          <h4>Label Preview</h4>
          <div className="preview-label" id="mapping-preview-label">
            <div className="preview-barcode">
              <div id="mapping-preview-barcode"></div>
            </div>
            <div className="preview-text" id="mapping-preview-text">
              Sample Product Information
            </div>
          </div>
        </div>

        <div className="step-actions">
          <button className="btn btn-outline" onClick={handlePrevious}>
            Previous
          </button>
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!canContinue}
          >
            Continue to Label Design
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnMapping;