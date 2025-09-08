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
      size: {
        width: type === 'barcode' ? 80 : 100,
        height: type === 'barcode' ? 50 : 20
      },
      flexbox: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0px',
        padding: '0px',
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
        gap: '0px',
        padding: '0px',
        margin: '0px',
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

  const [draggedElement, setDraggedElement] = useState(null);
  const [selectedElements, setSelectedElements] = useState([]);
  const [draggedTreeElement, setDraggedTreeElement] = useState(null);

  const moveElementToGroup = (elementId, groupId) => {
    const element = labelSettings.elements.find(el => el.id === elementId);
    const group = labelSettings.elements.find(el => el.id === groupId);
    
    if (element && group) {
      // Remove element from main elements
      const updatedElements = labelSettings.elements.filter(el => el.id !== elementId);
      
      // Add element to group
      const updatedGroup = {
        ...group,
        children: [...(group.children || []), element]
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
      const element = group.children?.find(child => child.id === elementId);
      const updatedGroup = {
        ...group,
        children: group.children?.filter(child => child.id !== elementId) || []
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

  const handleElementSelect = (elementId, isShiftKey = false) => {
    if (isShiftKey) {
      setSelectedElements(prev => 
        prev.includes(elementId) 
          ? prev.filter(id => id !== elementId)
          : [...prev, elementId]
      );
    } else {
      setSelectedElements([elementId]);
      setSelectedElement(elementId);
      setSelectedGroup(null);
    }
  };

  const createGroupFromSelected = () => {
    if (selectedElements.length < 2) return;

    const elementsToGroup = labelSettings.elements.filter(el => selectedElements.includes(el.id));
    const remainingElements = labelSettings.elements.filter(el => !selectedElements.includes(el.id));
    
    const newGroup = {
      id: labelSettings.nextElementId,
      type: 'group',
      name: `Group ${labelSettings.nextElementId}`,
      children: elementsToGroup,
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
      elements: [...remainingElements, newGroup],
      nextElementId: labelSettings.nextElementId + 1
    });
    
    setSelectedElements([]);
    setSelectedElement(null);
  };

  const ungroupSelected = () => {
    if (selectedGroup) {
      const group = labelSettings.elements.find(el => el.id === selectedGroup);
      if (group && group.children) {
        const updatedElements = labelSettings.elements.filter(el => el.id !== selectedGroup);
        actions.setLabelSettings({
          elements: [...updatedElements, ...group.children],
          nextElementId: labelSettings.nextElementId
        });
        setSelectedGroup(null);
      }
    }
  };

  // Element tree drag and drop functions
  const handleTreeDragStart = (e, elementId) => {
    setDraggedTreeElement(elementId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', elementId);
  };

  const handleTreeDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTreeDrop = (e, targetElementId) => {
    e.preventDefault();
    
    if (!draggedTreeElement || draggedTreeElement === targetElementId) {
      setDraggedTreeElement(null);
      return;
    }

    const elements = [...labelSettings.elements];
    const draggedIndex = elements.findIndex(el => el.id === draggedTreeElement);
    const targetIndex = elements.findIndex(el => el.id === targetElementId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove dragged element from its current position
      const [draggedEl] = elements.splice(draggedIndex, 1);
      
      // Insert at new position
      const newTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
      elements.splice(newTargetIndex, 0, draggedEl);
      
      actions.setLabelSettings({ elements });
    }
    
    setDraggedTreeElement(null);
  };

  const handleDragStart = (e, elementId) => {
    setDraggedElement(elementId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetGroupId) => {
    e.preventDefault();
    if (draggedElement && targetGroupId) {
      moveElementToGroup(draggedElement, targetGroupId);
    }
    setDraggedElement(null);
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

  // Create elements based on mapped columns from step 2
  useEffect(() => {
    if (labelSettings.elements.length === 0 && state.mappedColumns) {
      const newElements = [];
      let nextId = 1;

      // Add barcode element if mapped
      if (state.mappedColumns.barcode) {
        const barcodeElement = {
          id: nextId++,
          type: 'barcode',
          content: '',
          isStatic: false,
          columnName: state.mappedColumns.barcode,
            size: {
              width: 80,
              height: 50
            },
          flexbox: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0px',
            padding: '0px',
            margin: '0px'
          },
          style: {
            fontSize: 12,
            fontWeight: 'normal',
            color: '#000000',
            textAlign: 'center'
          }
        };
        newElements.push(barcodeElement);
      }

      // Add text elements for each mapped text column
      if (state.mappedColumns.text && state.mappedColumns.text.length > 0) {
        state.mappedColumns.text.forEach(columnName => {
          const textElement = {
            id: nextId++,
            type: 'text',
            content: '',
            isStatic: false,
            columnName: columnName,
            size: {
              width: 100,
              height: 20
            },
            flexbox: {
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0px',
              padding: '0px',
              margin: '0px'
            },
            style: {
              fontSize: 12,
              fontWeight: 'normal',
              color: '#000000',
              textAlign: 'center'
            }
          };
          newElements.push(textElement);
        });
      }

      // If no elements were created, add a default barcode element
      if (newElements.length === 0) {
        const defaultBarcode = {
          id: nextId++,
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
        newElements.push(defaultBarcode);
      }

      actions.setLabelSettings({
        elements: newElements,
        nextElementId: nextId
      });
    }
  }, [labelSettings.elements.length, state.mappedColumns, actions]);

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
          {/* Left Panel: Element Tree */}
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
              <h4>Grouping</h4>
              <div className="grouping-buttons">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={createGroupFromSelected}
                  disabled={selectedElements.length < 2}
                >
                  <span className="btn-icon">📦</span>
                  Group Selected ({selectedElements.length})
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={ungroupSelected}
                  disabled={!selectedGroup}
                >
                  <span className="btn-icon">📤</span>
                  Ungroup
                </button>
              </div>
            </div>

            <div className="panel-section">
              <h4>Elements & Groups</h4>
              <div className="element-tree">
                {/* Label Container */}
                <div
                  className={`tree-item label-container ${selectedElement === 'label' ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedElement('label');
                    setSelectedGroup(null);
                    setSelectedElements([]);
                  }}
                >
                  <span className="tree-icon">📄</span>
                  <span>Label Container</span>
                </div>
                
                {labelSettings.elements.map((element) => (
                  <div key={element.id} className="tree-element-container">
                    <div
                      className={`tree-item ${element.type === 'group' ? 'group-item' : 'element-item'} ${selectedElement === element.id || selectedGroup === element.id || selectedElements.includes(element.id) ? 'selected' : ''} ${draggedTreeElement === element.id ? 'dragging' : ''}`}
                      onClick={(e) => {
                        if (element.type === 'group') {
                          selectGroup(element.id);
                        } else {
                          handleElementSelect(element.id, e.shiftKey);
                        }
                      }}
                      draggable={true}
                      onDragStart={(e) => handleTreeDragStart(e, element.id)}
                      onDragOver={handleTreeDragOver}
                      onDrop={(e) => handleTreeDrop(e, element.id)}
                    >
                      <span className="tree-icon">
                        {element.type === 'text' ? 'T' : element.type === 'barcode' ? '|||' : '📦'}
                      </span>
                      <span className="tree-label">
                        {element.type === 'group' 
                          ? element.name 
                          : element.columnName 
                            ? `${element.type}: ${element.columnName}` 
                            : `${element.type} ${element.id}`
                        }
                      </span>
                      <span className="tree-size">
                        {element.size?.width ? `${element.size.width}%` : '100%'} × {element.size?.height || (element.type === 'barcode' ? '40' : '20')}px
                      </span>
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
                      <div 
                        className="tree-children"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, element.id)}
                      >
                        {element.children.map((child) => (
                          <div
                            key={child.id}
                            className={`tree-item child-item ${selectedElement === child.id || selectedElements.includes(child.id) ? 'selected' : ''}`}
                            onClick={(e) => handleElementSelect(child.id, e.shiftKey)}
                          >
                            <span className="tree-indent">└─</span>
                            <span className="tree-icon">
                              {child.type === 'text' ? 'T' : '|||'}
                            </span>
                            <span className="tree-label">
                              {child.columnName 
                                ? `${child.type}: ${child.columnName}` 
                                : `${child.type} ${child.id}`
                              }
                            </span>
                            <span className="tree-size">
                              {child.size?.width ? `${child.size.width}%` : '100%'} × {child.size?.height || (child.type === 'barcode' ? '40' : '20')}px
                            </span>
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
              <div className="canvas-info">
                <span>Size: {getCurrentSize().width}" × {getCurrentSize().height}"</span>
                <span>DPI: {getCurrentSize().dpi}</span>
              </div>
            </div>
            <div className="canvas-container">
              <div
                className={`label-canvas flexbox-canvas ${selectedElement === 'label' ? 'selected' : ''}`}
                style={{
                  width: `${getCurrentSize().width * 96}px`, // Use 96 DPI for screen display
                  height: `${getCurrentSize().height * 96}px`,
                  display: 'flex',
                  flexDirection: labelSettings.labelFlexbox?.flexDirection || 'column',
                  justifyContent: labelSettings.labelFlexbox?.justifyContent || 'center',
                  alignItems: labelSettings.labelFlexbox?.alignItems || 'center',
                  gap: labelSettings.labelFlexbox?.gap || '0px',
                  padding: labelSettings.labelFlexbox?.padding || '0px',
                  margin: labelSettings.labelFlexbox?.margin || '0px',
                  border: selectedElement === 'label' ? '2px solid var(--color-primary)' : '2px dashed #ccc',
                  borderRadius: '8px',
                  background: selectedElement === 'label' ? 'rgba(37, 99, 235, 0.1)' : '#f9f9f9',
                  cursor: 'pointer',
                  margin: '20px auto'
                }}
                onClick={() => {
                  setSelectedElement('label');
                  setSelectedGroup(null);
                  setSelectedElements([]);
                }}
              >
                {labelSettings.elements.map((element) => (
                  <div
                    key={element.id}
                    className={`canvas-element ${element.type} ${selectedElement === element.id || selectedGroup === element.id || selectedElements.includes(element.id) ? 'selected' : ''}`}
                    style={{
                      ...element.flexbox,
                      width: element.size?.width ? `${element.size.width}%` : '100%',
                      height: 'fit-content',
                      minHeight: element.size?.height ? `${element.size.height}px` : (element.type === 'barcode' ? '50px' : '20px'),
                      border: selectedElement === element.id || selectedGroup === element.id || selectedElements.includes(element.id) ? '2px solid var(--color-primary)' : '1px dashed var(--color-gray-300)',
                      background: selectedElement === element.id || selectedGroup === element.id || selectedElements.includes(element.id) ? 'rgba(37, 99, 235, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      overflow: 'visible', // Allow barcode to extend if needed for clarity
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: element.type === 'barcode' ? '8px' : '0px' // More padding for barcode elements
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (element.type === 'group') {
                        selectGroup(element.id);
                      } else {
                        handleElementSelect(element.id, e.shiftKey);
                      }
                    }}
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
              {selectedElement === 'label' ? (
                <LabelContainerProperties
                  labelSettings={labelSettings}
                  onUpdate={(updates) => actions.setLabelSettings(updates)}
                />
              ) : selectedElement ? (
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
                  <p>Select the label container or an element to edit its properties</p>
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
          <div className="prop-row">
            <label htmlFor="barcode-width">Width (% of parent):</label>
            <input
              type="number"
              className="form-control"
              id="barcode-width"
              min="10"
              max="100"
              value={element.size?.width || '80'}
              onChange={(e) => onUpdate({
                size: { ...element.size, width: parseInt(e.target.value) }
              })}
            />
          </div>
          <div className="prop-row">
            <label htmlFor="barcode-height">Height (px):</label>
            <input
              type="number"
              className="form-control"
              id="barcode-height"
              min="20"
              max="100"
              value={element.size?.height || '50'}
              onChange={(e) => onUpdate({
                size: { ...element.size, height: parseInt(e.target.value) }
              })}
            />
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

// Label Container Properties Component
const LabelContainerProperties = ({ labelSettings, onUpdate }) => {
  const handleFlexboxChange = (property, value) => {
    onUpdate({
      ...labelSettings,
      labelFlexbox: {
        ...labelSettings.labelFlexbox,
        [property]: value
      }
    });
  };

  return (
    <div className="properties-panel">
      <div className="property-group">
        <h5>Label Container</h5>
        <p className="text-muted">Configure the main label container layout</p>
      </div>

      <div className="property-group">
        <h5>Flexbox Layout</h5>
        <div className="control-group">
          <label htmlFor="label-direction">Direction</label>
          <select
            className="form-control"
            id="label-direction"
            value={labelSettings.labelFlexbox?.flexDirection || 'column'}
            onChange={(e) => handleFlexboxChange('flexDirection', e.target.value)}
          >
            <option value="column">Column (Vertical)</option>
            <option value="row">Row (Horizontal)</option>
          </select>
        </div>
        
        <div className="control-group">
          <label htmlFor="label-justify">Justify Content</label>
          <select
            className="form-control"
            id="label-justify"
            value={labelSettings.labelFlexbox?.justifyContent || 'center'}
            onChange={(e) => handleFlexboxChange('justifyContent', e.target.value)}
          >
            <option value="flex-start">Start</option>
            <option value="center">Center</option>
            <option value="flex-end">End</option>
            <option value="space-between">Space Between</option>
            <option value="space-around">Space Around</option>
            <option value="space-evenly">Space Evenly</option>
          </select>
        </div>
        
        <div className="control-group">
          <label htmlFor="label-align">Align Items</label>
          <select
            className="form-control"
            id="label-align"
            value={labelSettings.labelFlexbox?.alignItems || 'center'}
            onChange={(e) => handleFlexboxChange('alignItems', e.target.value)}
          >
            <option value="stretch">Stretch</option>
            <option value="flex-start">Start</option>
            <option value="center">Center</option>
            <option value="flex-end">End</option>
            <option value="baseline">Baseline</option>
          </select>
        </div>
        
        <div className="control-group">
          <label htmlFor="label-gap">Gap (px)</label>
          <input
            type="number"
            className="form-control"
            id="label-gap"
            value={labelSettings.labelFlexbox?.gap?.replace('px', '') || '0'}
            min="0"
            onChange={(e) => handleFlexboxChange('gap', `${e.target.value}px`)}
          />
        </div>
        
        <div className="control-group">
          <label htmlFor="label-padding">Padding (px)</label>
          <input
            type="number"
            className="form-control"
            id="label-padding"
            value={labelSettings.labelFlexbox?.padding?.replace('px', '') || '0'}
            min="0"
            onChange={(e) => handleFlexboxChange('padding', `${e.target.value}px`)}
          />
        </div>
        
        <div className="control-group">
          <label htmlFor="label-margin">Margin (px)</label>
          <input
            type="number"
            className="form-control"
            id="label-margin"
            value={labelSettings.labelFlexbox?.margin?.replace('px', '') || '0'}
            min="0"
            onChange={(e) => handleFlexboxChange('margin', `${e.target.value}px`)}
          />
        </div>
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
        // Calculate preview container size based on element percentage
        const containerWidth = element.size?.width ? 
          Math.max(120, (element.size.width / 100) * 400) : // Scale based on percentage
          200; // Default width
        const containerHeight = element.size?.height || 60;
        
        // Use shared rendering function for consistency - it will handle high-res generation
        const canvas = renderBarcode(
          sampleBarcode,
          labelSettings.barcodeType,
          containerWidth,
          containerHeight,
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
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block'
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
    
  if (!element.isStatic && element.columnName && excelData) {
    // Use specific column data for this element
    const colIndex = excelData.columnHeaders.indexOf(element.columnName);
    textContent = excelData.rows[0]?.[colIndex] || element.columnName;
  } else if (!element.isStatic && excelData && mappedColumns.text.length > 0) {
    // Fallback to all mapped text columns
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