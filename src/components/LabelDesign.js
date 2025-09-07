import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { renderBarcode, renderText, LABEL_SIZES } from '../utils/labelRenderer';

const LabelDesign = () => {
  const { state, actions } = useApp();
  const { labelSettings } = state;
  const [selectedElement, setSelectedElement] = useState(null);

  // Use shared LABEL_SIZES from utils

  const handleLabelSizeChange = (e) => {
    const size = e.target.value;
    actions.setLabelSettings({ size });
  };

  const handleCustomSizeChange = (field, value) => {
    actions.setLabelSettings({
      [field]: parseFloat(value) || 0
    });
  };

  const handleBarcodeTypeChange = (e) => {
    actions.setLabelSettings({ barcodeType: e.target.value });
  };

  const addElement = (type) => {
    const newElement = {
      id: labelSettings.nextElementId,
      type,
      content: type === 'text' ? 'Sample Text' : '',
      position: { x: 10, y: 10 },
      size: { width: 100, height: type === 'barcode' ? 50 : 20 },
      style: {
        fontSize: 12,
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left'
      }
    };

    actions.setLabelSettings({
      elements: [...labelSettings.elements, newElement],
      nextElementId: labelSettings.nextElementId + 1
    });
  };

  const selectElement = (elementId) => {
    setSelectedElement(elementId);
    actions.setLabelSettings({ selectedElementId: elementId });
  };

  const updateElement = (elementId, updates) => {
    const updatedElements = labelSettings.elements.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    );
    actions.setLabelSettings({ elements: updatedElements });
  };

  const deleteElement = (elementId) => {
    const updatedElements = labelSettings.elements.filter(el => el.id !== elementId);
    actions.setLabelSettings({ elements: updatedElements });
    if (selectedElement === elementId) {
      setSelectedElement(null);
      actions.setLabelSettings({ selectedElementId: null });
    }
  };

  const getCurrentSize = () => {
    const size = LABEL_SIZES[labelSettings.size] || LABEL_SIZES['2x1'];
    if (labelSettings.size === 'custom') {
      return { ...size, width: labelSettings.customWidth, height: labelSettings.customHeight };
    }
    return size;
  };

  const renderElement = (element) => {
    if (element.type === 'barcode') {
      return <BarcodeElement element={element} />;
    } else if (element.type === 'text') {
      return <TextElement element={element} />;
    }
    return null;
  };

  const handlePrevious = () => {
    actions.setStep(2);
  };

  const handleNext = () => {
    actions.setStep(4);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Step 3: Design Your Labels</h2>
        <p className="card-description">
          Design labels with flexible layouts and element positioning
        </p>
      </div>
      <div className="card-body">
        <div className="figma-interface">
          {/* Left Panel: Settings */}
          <div className="left-panel">
            <div className="panel-section">
              <h4>Label Settings</h4>
              <div className="control-group">
                <label htmlFor="label-size">Size</label>
                <select
                  className="form-control"
                  id="label-size"
                  value={labelSettings.size}
                  onChange={handleLabelSizeChange}
                >
                  <option value="2x1">2" x 1" (Standard)</option>
                  <option value="3x1">3" x 1" (Large)</option>
                  <option value="2.5x1">2.5" x 1" (Medium)</option>
                  <option value="4x2">4" x 2" (Extra Large)</option>
                  <option value="custom">Custom Size</option>
                </select>
              </div>
              
              {labelSettings.size === 'custom' && (
                <div className="control-group">
                  <label htmlFor="custom-width">Width (inches)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="custom-width"
                    value={labelSettings.customWidth}
                    step="0.1"
                    min="0.5"
                    max="10"
                    onChange={(e) => handleCustomSizeChange('customWidth', e.target.value)}
                  />
                  <label htmlFor="custom-height">Height (inches)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="custom-height"
                    value={labelSettings.customHeight}
                    step="0.1"
                    min="0.5"
                    max="10"
                    onChange={(e) => handleCustomSizeChange('customHeight', e.target.value)}
                  />
                </div>
              )}
              
              <div className="control-group">
                <label htmlFor="barcode-type">Barcode Type</label>
                <select
                  className="form-control"
                  id="barcode-type"
                  value={labelSettings.barcodeType}
                  onChange={handleBarcodeTypeChange}
                >
                  <option value="EAN13">EAN-13 (Retail)</option>
                  <option value="CODE128">Code 128 (Universal)</option>
                  <option value="CODE39">Code 39 (Industrial)</option>
                  <option value="UPC">UPC-A (US Retail)</option>
                  <option value="ITF">ITF-14 (Shipping)</option>
                </select>
              </div>
            </div>

            <div className="panel-section">
              <h4>Add Elements</h4>
              <div className="add-buttons">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => addElement('text')}
                >
                  <span className="btn-icon">T</span>
                  Text
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => addElement('barcode')}
                >
                  <span className="btn-icon">|||</span>
                  Barcode
                </button>
              </div>
            </div>

            <div className="panel-section">
              <h4>Elements</h4>
              <div className="element-tree">
                {labelSettings.elements.map((element) => (
                  <div
                    key={element.id}
                    className={`tree-item ${selectedElement === element.id ? 'selected' : ''}`}
                    onClick={() => selectElement(element.id)}
                  >
                    <span className="tree-icon">
                      {element.type === 'text' ? 'T' : '|||'}
                    </span>
                    <span>{element.type} {element.id}</span>
                    <button
                      className="remove-element"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteElement(element.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Canvas */}
          <div className="canvas-area">
            <div className="canvas-header">
              <h4>Label Canvas</h4>
            </div>
            <div className="canvas-container">
              <div
                className="label-canvas"
                style={{
                  width: `${getCurrentSize().width * 96}px`,
                  height: `${getCurrentSize().height * 96}px`
                }}
              >
                {labelSettings.elements.map((element) => (
                  <div
                    key={element.id}
                    className={`canvas-element ${element.type} ${selectedElement === element.id ? 'selected' : ''}`}
                    style={{
                      position: 'absolute',
                      left: `${element.position.x}px`,
                      top: `${element.position.y}px`,
                      width: `${element.size.width}px`,
                      height: `${element.size.height}px`,
                      border: selectedElement === element.id ? '2px solid var(--color-primary)' : '1px dashed var(--color-gray-300)',
                      background: selectedElement === element.id ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.05)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      overflow: 'hidden'
                    }}
                    onClick={() => selectElement(element.id)}
                  >
                    {renderElement(element)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Properties */}
          <div className="right-panel">
            <div className="panel-section">
              <h4>Properties</h4>
              {selectedElement ? (
                <ElementProperties
                  element={labelSettings.elements.find(el => el.id === selectedElement)}
                  onUpdate={(updates) => updateElement(selectedElement, updates)}
                />
              ) : (
                <div className="no-selection">
                  <p>Select an element to edit its properties</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="step-actions">
          <button className="btn btn-outline" onClick={handlePrevious}>
            Previous
          </button>
          <button className="btn btn-primary" onClick={handleNext}>
            Continue to Quantities
          </button>
        </div>
      </div>
    </div>
  );
};

const ElementProperties = ({ element, onUpdate }) => {
  if (!element) return null;

  const handleStyleChange = (field, value) => {
    onUpdate({
      style: { ...element.style, [field]: value }
    });
  };

  const handleContentChange = (value) => {
    onUpdate({ content: value });
  };

  const handleSizeChange = (field, value) => {
    onUpdate({
      size: { ...element.size, [field]: parseFloat(value) || 0 }
    });
  };

  return (
    <div className="property-group">
      {element.type === 'text' && (
        <>
          <h5>Text</h5>
          <div className="prop-row">
            <label htmlFor="text-content">Content:</label>
            <input
              type="text"
              className="form-control"
              id="text-content"
              value={element.content}
              onChange={(e) => handleContentChange(e.target.value)}
            />
          </div>
          <div className="prop-row">
            <label htmlFor="font-size">Font Size (px):</label>
            <input
              type="number"
              className="form-control"
              id="font-size"
              min="8"
              max="48"
              value={element.style.fontSize}
              onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))}
            />
          </div>
          <div className="prop-row">
            <label htmlFor="text-align">Text Align:</label>
            <select
              className="form-control"
              id="text-align"
              value={element.style.textAlign}
              onChange={(e) => handleStyleChange('textAlign', e.target.value)}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div className="prop-row">
            <label htmlFor="font-weight">Weight:</label>
            <select
              className="form-control"
              id="font-weight"
              value={element.style.fontWeight}
              onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
            </select>
          </div>
          <div className="prop-row">
            <label htmlFor="color">Color:</label>
            <input
              type="color"
              className="form-control"
              id="color"
              value={element.style.color}
              onChange={(e) => handleStyleChange('color', e.target.value)}
            />
          </div>
        </>
      )}
      
      {element.type === 'barcode' && (
        <>
          <h5>Barcode</h5>
          <div className="prop-row">
            <label htmlFor="barcode-height">Height (px):</label>
            <input
              type="number"
              className="form-control"
              id="barcode-height"
              min="20"
              max="200"
              value={element.size.height}
              onChange={(e) => handleSizeChange('height', e.target.value)}
            />
          </div>
        </>
      )}
      
      <h5>Size</h5>
      <div className="prop-row">
        <label htmlFor="element-width">Width (px):</label>
        <input
          type="number"
          className="form-control"
          id="element-width"
          min="10"
          max="500"
          value={element.size.width}
          onChange={(e) => handleSizeChange('width', e.target.value)}
        />
      </div>
      <div className="prop-row">
        <label htmlFor="element-height">Height (px):</label>
        <input
          type="number"
          className="form-control"
          id="element-height"
          min="10"
          max="500"
          value={element.size.height}
          onChange={(e) => handleSizeChange('height', e.target.value)}
        />
      </div>
    </div>
  );
};

// Barcode Element Component
const BarcodeElement = ({ element }) => {
  const { state } = useApp();
  const { excelData, mappedColumns, labelSettings } = state;
  const [barcodeCanvas, setBarcodeCanvas] = useState(null);

  useEffect(() => {
    if (!excelData || !mappedColumns.barcode) return;

    try {
      const barcodeColumnIndex = excelData.columnHeaders.indexOf(mappedColumns.barcode);
      const sampleBarcode = excelData.rows[0]?.[barcodeColumnIndex];

      if (sampleBarcode) {
        // Use shared rendering function for consistency
        const canvas = renderBarcode(
          sampleBarcode,
          labelSettings.barcodeType,
          element.size.width,
          element.size.height,
          true
        );
        
        setBarcodeCanvas(canvas);
      }
    } catch (error) {
      console.error('Error generating barcode preview:', error);
    }
  }, [element, excelData, mappedColumns, labelSettings.barcodeType]);

  if (!barcodeCanvas) {
    return <div style={{ color: '#666', fontSize: '12px' }}>Barcode</div>;
  }

  return (
    <img
      src={barcodeCanvas.toDataURL()}
      alt="Barcode"
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain'
      }}
    />
  );
};

// Text Element Component
const TextElement = ({ element }) => {
  const { state } = useApp();
  const { excelData, mappedColumns } = state;
  const [textCanvas, setTextCanvas] = useState(null);

  useEffect(() => {
    // Get sample text from mapped columns if available
    let textContent = element.content;
    
    if (excelData && mappedColumns.text.length > 0) {
      const textValues = mappedColumns.text.map(col => {
        const colIndex = excelData.columnHeaders.indexOf(col);
        return excelData.rows[0]?.[colIndex] || '';
      }).filter(val => val);
      
      if (textValues.length > 0) {
        textContent = textValues.join(' - ');
      }
    }

    // Use shared rendering function for consistency
    const canvas = renderText(
      textContent,
      element.style,
      element.size.width,
      element.size.height
    );
    
    setTextCanvas(canvas);
  }, [element, excelData, mappedColumns]);

  if (!textCanvas) {
    return (
      <div
        style={{
          fontSize: `${element.style.fontSize}px`,
          fontWeight: element.style.fontWeight,
          color: element.style.color,
          textAlign: element.style.textAlign,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: element.style.textAlign === 'center' ? 'center' : 
                        element.style.textAlign === 'right' ? 'flex-end' : 'flex-start',
          padding: '2px',
          wordWrap: 'break-word',
          overflow: 'hidden'
        }}
      >
        {element.content}
      </div>
    );
  }

  return (
    <img
      src={textCanvas.toDataURL()}
      alt="Text"
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain'
      }}
    />
  );
};

export default LabelDesign;