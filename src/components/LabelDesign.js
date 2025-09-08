import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { renderBarcode, renderText, LABEL_SIZES } from '../utils/labelRenderer';

const LabelDesign = () => {
  const { state, actions } = useApp();
  const { labelSettings } = state;
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

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
      content: type === 'text' ? 'Static Text' : '',
      isStatic: type === 'text', // Mark static text elements
      flexbox: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '5px',
        padding: '5px',
        margin: '0px'
      },
      style: {
        fontSize: 12,
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'center'
      }
    };

    actions.setLabelSettings({
      elements: [...labelSettings.elements, newElement],
      nextElementId: labelSettings.nextElementId + 1
    });
  };

  const addGroup = () => {
    const newGroup = {
      id: labelSettings.nextElementId,
      type: 'group',
      name: `Group ${labelSettings.nextElementId}`,
      children: [],
      flexbox: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        padding: '10px',
        margin: '5px',
        border: '1px dashed #ccc',
        borderRadius: '4px'
      }
    };

    actions.setLabelSettings({
      elements: [...labelSettings.elements, newGroup],
      nextElementId: labelSettings.nextElementId + 1
    });
  };

  const selectElement = (elementId) => {
    setSelectedElement(elementId);
    setSelectedGroup(null);
    actions.setLabelSettings({ selectedElementId: elementId });
  };

  const selectGroup = (groupId) => {
    setSelectedGroup(groupId);
    setSelectedElement(null);
  };

  const updateElement = (elementId, updates) => {
    const updatedElements = labelSettings.elements.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    );
    actions.setLabelSettings({ elements: updatedElements });
  };

  const updateGroup = (groupId, updates) => {
    const updatedElements = labelSettings.elements.map(el =>
      el.id === groupId ? { ...el, ...updates } : el
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

  const moveElementToGroup = (elementId, groupId) => {
    const element = labelSettings.elements.find(el => el.id === elementId);
    const group = labelSettings.elements.find(el => el.id === groupId);
    
    if (element && group) {
      // Remove element from main elements
      const updatedElements = labelSettings.elements.filter(el => el.id !== elementId);
      
      // Add element to group
      const updatedGroup = {
        ...group,
        children: [...group.children, element]
      };
      
      const finalElements = updatedElements.map(el => 
        el.id === groupId ? updatedGroup : el
      );
      
      actions.setLabelSettings({ elements: finalElements });
    }
  };

  const removeElementFromGroup = (elementId, groupId) => {
    const group = labelSettings.elements.find(el => el.id === groupId);
    
    if (group) {
      const element = group.children.find(child => child.id === elementId);
      const updatedGroup = {
        ...group,
        children: group.children.filter(child => child.id !== elementId)
      };
      
      const updatedElements = labelSettings.elements.map(el => 
        el.id === groupId ? updatedGroup : el
      );
      
      // Add element back to main elements
      if (element) {
        updatedElements.push(element);
      }
      
      actions.setLabelSettings({ elements: updatedElements });
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
    } else if (element.type === 'group') {
      return <GroupElement element={element} />;
    }
    return null;
  };

  const handlePrevious = () => {
    actions.setStep(2);
  };

  const handleNext = () => {
    actions.setStep(4);
  };

  // Add default elements if none exist
  useEffect(() => {
    if (labelSettings.elements.length === 0) {
      // Add a default barcode element
      const defaultBarcode = {
        id: 1,
        type: 'barcode',
        content: '',
        isStatic: false,
        flexbox: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '5px',
          padding: '5px',
          margin: '0px'
        },
        style: {
          fontSize: 12,
          fontWeight: 'normal',
          color: '#000000',
          textAlign: 'center'
        }
      };
      
      // Add a default text element
      const defaultText = {
        id: 2,
        type: 'text',
        content: 'Static Text',
        isStatic: true,
        flexbox: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '5px',
          padding: '5px',
          margin: '0px'
        },
        style: {
          fontSize: 12,
          fontWeight: 'normal',
          color: '#000000',
          textAlign: 'center'
        }
      };

      actions.setLabelSettings({
        elements: [defaultBarcode, defaultText],
        nextElementId: 3
      });
    }
  }, [labelSettings.elements.length, actions]);

  return (
    <div className="card">
      <div className="card-header">
        <h2>Step 3: Design Your Labels</h2>
        <p className="card-description">
          Design labels with flexbox-based layout system
        </p>
      </div>
      <div className="card-body">
        <div className="flexbox-interface">
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
                  Static Text
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => addElement('barcode')}
                >
                  <span className="btn-icon">|||</span>
                  Barcode
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={addGroup}
                >
                  <span className="btn-icon">📦</span>
                  Group
                </button>
              </div>
            </div>

            <div className="panel-section">
              <h4>Elements & Groups</h4>
              <div className="element-tree">
                {labelSettings.elements.map((element) => (
                  <div key={element.id}>
                    <div
                      className={`tree-item ${selectedElement === element.id || selectedGroup === element.id ? 'selected' : ''}`}
                      onClick={() => element.type === 'group' ? selectGroup(element.id) : selectElement(element.id)}
                    >
                      <span className="tree-icon">
                        {element.type === 'text' ? 'T' : element.type === 'barcode' ? '|||' : '📦'}
                      </span>
                      <span>{element.type === 'group' ? element.name : `${element.type} ${element.id}`}</span>
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
                    {element.type === 'group' && element.children && element.children.length > 0 && (
                      <div className="tree-children">
                        {element.children.map((child) => (
                          <div
                            key={child.id}
                            className={`tree-item child ${selectedElement === child.id ? 'selected' : ''}`}
                            onClick={() => selectElement(child.id)}
                          >
                            <span className="tree-icon">
                              {child.type === 'text' ? 'T' : '|||'}
                            </span>
                            <span>{child.type} {child.id}</span>
                            <button
                              className="remove-element"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeElementFromGroup(child.id, element.id);
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
                className="label-canvas flexbox-canvas"
                style={{
                  width: `${getCurrentSize().width * 96}px`,
                  height: `${getCurrentSize().height * 96}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  border: '2px dashed #ccc',
                  borderRadius: '8px',
                  background: '#f9f9f9'
                }}
              >
                {labelSettings.elements.map((element) => (
                  <div
                    key={element.id}
                    className={`canvas-element ${element.type} ${selectedElement === element.id || selectedGroup === element.id ? 'selected' : ''}`}
                    style={{
                      ...element.flexbox,
                      border: selectedElement === element.id || selectedGroup === element.id ? '2px solid var(--color-primary)' : '1px dashed var(--color-gray-300)',
                      background: selectedElement === element.id || selectedGroup === element.id ? 'rgba(37, 99, 235, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      minHeight: element.type === 'barcode' ? '40px' : '20px',
                      minWidth: element.type === 'barcode' ? '100px' : '50px'
                    }}
                    onClick={() => element.type === 'group' ? selectGroup(element.id) : selectElement(element.id)}
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
              ) : selectedGroup ? (
                <GroupProperties
                  group={labelSettings.elements.find(el => el.id === selectedGroup)}
                  onUpdate={(updates) => updateGroup(selectedGroup, updates)}
                />
              ) : (
                <div className="no-selection">
                  <p>Select an element or group to edit its properties</p>
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

  const handleFlexboxChange = (field, value) => {
    onUpdate({
      flexbox: { ...element.flexbox, [field]: value }
    });
  };

  return (
    <div className="property-group">
      {element.type === 'text' && (
        <>
          <h5>Text Content</h5>
          <div className="prop-row">
            <label htmlFor="text-content">Content:</label>
            <input
              type="text"
              className="form-control"
              id="text-content"
              value={element.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter static text"
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
            <label>Barcode will use data from Excel</label>
            <p className="help-text">Barcode content comes from your mapped column</p>
          </div>
        </>
      )}
      
      <h5>Flexbox Layout</h5>
      <div className="prop-row">
        <label htmlFor="flex-direction">Direction:</label>
        <select
          className="form-control"
          id="flex-direction"
          value={element.flexbox.flexDirection}
          onChange={(e) => handleFlexboxChange('flexDirection', e.target.value)}
        >
          <option value="row">Row (Horizontal)</option>
          <option value="column">Column (Vertical)</option>
        </select>
      </div>
      <div className="prop-row">
        <label htmlFor="justify-content">Justify Content:</label>
        <select
          className="form-control"
          id="justify-content"
          value={element.flexbox.justifyContent}
          onChange={(e) => handleFlexboxChange('justifyContent', e.target.value)}
        >
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
          <option value="space-between">Space Between</option>
          <option value="space-around">Space Around</option>
        </select>
      </div>
      <div className="prop-row">
        <label htmlFor="align-items">Align Items:</label>
        <select
          className="form-control"
          id="align-items"
          value={element.flexbox.alignItems}
          onChange={(e) => handleFlexboxChange('alignItems', e.target.value)}
        >
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
          <option value="stretch">Stretch</option>
        </select>
      </div>
      <div className="prop-row">
        <label htmlFor="gap">Gap (px):</label>
        <input
          type="number"
          className="form-control"
          id="gap"
          min="0"
          max="50"
          value={parseInt(element.flexbox.gap) || 0}
          onChange={(e) => handleFlexboxChange('gap', `${e.target.value}px`)}
        />
      </div>
      <div className="prop-row">
        <label htmlFor="padding">Padding (px):</label>
        <input
          type="number"
          className="form-control"
          id="padding"
          min="0"
          max="50"
          value={parseInt(element.flexbox.padding) || 0}
          onChange={(e) => handleFlexboxChange('padding', `${e.target.value}px`)}
        />
      </div>
    </div>
  );
};

const GroupProperties = ({ group, onUpdate }) => {
  if (!group) return null;

  const handleFlexboxChange = (field, value) => {
    onUpdate({
      flexbox: { ...group.flexbox, [field]: value }
    });
  };

  const handleNameChange = (value) => {
    onUpdate({ name: value });
  };

  return (
    <div className="property-group">
      <h5>Group Settings</h5>
      <div className="prop-row">
        <label htmlFor="group-name">Group Name:</label>
        <input
          type="text"
          className="form-control"
          id="group-name"
          value={group.name}
          onChange={(e) => handleNameChange(e.target.value)}
        />
      </div>
      
      <h5>Flexbox Layout</h5>
      <div className="prop-row">
        <label htmlFor="group-flex-direction">Direction:</label>
        <select
          className="form-control"
          id="group-flex-direction"
          value={group.flexbox.flexDirection}
          onChange={(e) => handleFlexboxChange('flexDirection', e.target.value)}
        >
          <option value="row">Row (Horizontal)</option>
          <option value="column">Column (Vertical)</option>
        </select>
      </div>
      <div className="prop-row">
        <label htmlFor="group-justify-content">Justify Content:</label>
        <select
          className="form-control"
          id="group-justify-content"
          value={group.flexbox.justifyContent}
          onChange={(e) => handleFlexboxChange('justifyContent', e.target.value)}
        >
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
          <option value="space-between">Space Between</option>
          <option value="space-around">Space Around</option>
        </select>
      </div>
      <div className="prop-row">
        <label htmlFor="group-align-items">Align Items:</label>
        <select
          className="form-control"
          id="group-align-items"
          value={group.flexbox.alignItems}
          onChange={(e) => handleFlexboxChange('alignItems', e.target.value)}
        >
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
          <option value="stretch">Stretch</option>
        </select>
      </div>
      <div className="prop-row">
        <label htmlFor="group-gap">Gap (px):</label>
        <input
          type="number"
          className="form-control"
          id="group-gap"
          min="0"
          max="50"
          value={parseInt(group.flexbox.gap) || 0}
          onChange={(e) => handleFlexboxChange('gap', `${e.target.value}px`)}
        />
      </div>
      <div className="prop-row">
        <label htmlFor="group-padding">Padding (px):</label>
        <input
          type="number"
          className="form-control"
          id="group-padding"
          min="0"
          max="50"
          value={parseInt(group.flexbox.padding) || 0}
          onChange={(e) => handleFlexboxChange('padding', `${e.target.value}px`)}
        />
      </div>
      
      <h5>Group Contents</h5>
      <div className="prop-row">
        <label>Elements in group: {group.children?.length || 0}</label>
        <p className="help-text">Drag elements from the main canvas into this group</p>
      </div>
    </div>
  );
};

// Group Element Component
const GroupElement = ({ element }) => {
  return (
    <div
      style={{
        display: 'flex',
        ...element.flexbox,
        width: '100%',
        height: '100%',
        minHeight: '40px'
      }}
    >
      {element.children && element.children.length > 0 ? (
        element.children.map((child) => (
          <div
            key={child.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: child.type === 'barcode' ? '80px' : '40px',
              minHeight: child.type === 'barcode' ? '30px' : '20px'
            }}
          >
            {child.type === 'barcode' ? (
              <BarcodeElement element={child} />
            ) : (
              <TextElement element={child} />
            )}
          </div>
        ))
      ) : (
        <div style={{ color: '#999', fontSize: '12px' }}>
          Empty Group
        </div>
      )}
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
          120, // Fixed width for preview
          40,  // Fixed height for preview
          true
        );
        
        setBarcodeCanvas(canvas);
      }
    } catch (error) {
      console.error('Error generating barcode preview:', error);
    }
  }, [element, excelData, mappedColumns, labelSettings.barcodeType]);

  if (!barcodeCanvas) {
    return (
      <div style={{ 
        color: '#666', 
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%'
      }}>
        Barcode
      </div>
    );
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

  // Get text content - use static text if it's a static element, otherwise use Excel data
  let textContent = element.content;
  
  if (!element.isStatic && excelData && mappedColumns.text.length > 0) {
    const textValues = mappedColumns.text.map(col => {
      const colIndex = excelData.columnHeaders.indexOf(col);
      return excelData.rows[0]?.[colIndex] || '';
    }).filter(val => val);
    
    if (textValues.length > 0) {
      textContent = textValues.join(' - ');
    }
  }

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
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }}
    >
      {textContent}
    </div>
  );
};

export default LabelDesign;