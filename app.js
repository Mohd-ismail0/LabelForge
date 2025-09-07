// Professional Barcode Label Generator
// Global application state
let appState = {
    currentStep: 1,
    excelData: null,
    columnHeaders: [],
    mappedColumns: {
        barcode: null,
        text: [],
        quantity: null
    },
    labelSettings: {
        size: '2x1',
        customWidth: 2,
        customHeight: 1,
        barcodeType: 'EAN13',
        elements: [], // Hierarchical element tree
        selectedElementId: null,
        nextElementId: 1
    },
    generatedLabels: [],
    quantitySettings: {
        type: 'column', // 'column', 'manual', 'fixed'
        fixedQuantity: 1,
        manualQuantities: {}
    }
};

// Label size configurations
const LABEL_SIZES = {
    '2x1': { width: 2, height: 1, dpi: 300 },
    '3x1': { width: 3, height: 1, dpi: 300 },
    '2.5x1': { width: 2.5, height: 1, dpi: 300 },
    '4x2': { width: 4, height: 2, dpi: 300 },
    'custom': { width: 2, height: 1, dpi: 300 }
};

const DISPLAY_DPI = 96;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    updateStepDisplay();
    setupStepNavigation();
    setupColumnMapping();
    setupLabelDesign();
    setupQuantityManagement();
}

// Event Listeners Setup
function setupEventListeners() {
    // File upload
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleFileDrop);
        uploadArea.addEventListener('click', () => fileInput.click());
    }
    
    // Label design controls
    const labelSize = document.getElementById('label-size');
    const customSizeGroup = document.getElementById('custom-size-group');
    const customWidth = document.getElementById('custom-width');
    const customHeight = document.getElementById('custom-height');
    const barcodeType = document.getElementById('barcode-type');
    const staticText = document.getElementById('static-text');
    const fontSize = document.getElementById('font-size');
    const spacing = document.getElementById('label-spacing');
    
    if (labelSize) {
        labelSize.addEventListener('change', handleLabelSizeChange);
    }
    
    if (customWidth) {
        customWidth.addEventListener('input', handleCustomSizeChange);
    }
    
    if (customHeight) {
        customHeight.addEventListener('input', handleCustomSizeChange);
    }
    
    if (barcodeType) {
        barcodeType.addEventListener('change', (e) => {
            appState.labelSettings.barcodeType = e.target.value;
            renderCanvas();
        });
    }
    
    if (staticText) {
        staticText.addEventListener('input', updateDesignPreview);
    }
    
    if (fontSize) {
        fontSize.addEventListener('change', updateDesignPreview);
    }
    
    if (spacing) {
        spacing.addEventListener('change', updateDesignPreview);
    }
    
    // Quantity management
    const quantityRadios = document.querySelectorAll('input[name="quantity-type"]');
    const fixedQuantity = document.getElementById('fixed-quantity');
    
    quantityRadios.forEach(radio => {
        radio.addEventListener('change', handleQuantityTypeChange);
    });
    
    if (fixedQuantity) {
        fixedQuantity.addEventListener('input', updateQuantitySummary);
    }
}

// Step Navigation
function setupStepNavigation() {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        step.addEventListener('click', () => {
            if (index + 1 <= appState.currentStep) {
                setStep(index + 1);
            }
        });
    });
}

function setStep(stepNumber) {
    // Validate step transitions
    if (!validateStepTransition(stepNumber)) {
        return;
    }
    
    appState.currentStep = stepNumber;
    updateStepDisplay();
    
    // Update step-specific content
    switch (stepNumber) {
        case 2:
            setupColumnMapping();
            updateContinueButton();
            break;
        case 3:
            initializeLabelDesigner();
            break;
        case 4:
            // Capture current design state before moving to quantity management
            cacheDesignConfiguration();
            setupQuantityManagement();
            break;
        case 5:
            // Ensure design cache is up to date before generation
            cacheDesignConfiguration();
            updateFinalSummary();
            break;
    }
}

function validateStepTransition(targetStep) {
    switch (targetStep) {
        case 2:
            return appState.excelData && appState.excelData.length > 0;
        case 3:
            return appState.mappedColumns.barcode !== null;
        case 4:
            return true; // Always allow quantity step
        case 5:
            return true; // Always allow generation step
        default:
            return true;
    }
}

function updateStepDisplay() {
    const steps = document.querySelectorAll('.step');
    const stepContents = document.querySelectorAll('.step-content');
    
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNumber === appState.currentStep) {
            step.classList.add('active');
        } else if (stepNumber < appState.currentStep) {
            step.classList.add('completed');
        }
    });
    
    stepContents.forEach((content, index) => {
        content.classList.remove('active');
        if (index + 1 === appState.currentStep) {
            content.classList.add('active');
        }
    });
}

function nextStep() {
    if (appState.currentStep < 5) {
        setStep(appState.currentStep + 1);
    }
}

function previousStep() {
    if (appState.currentStep > 1) {
        setStep(appState.currentStep - 1);
    }
}

function startOver() {
    if (confirm('Are you sure you want to start over? All your progress will be lost.')) {
        appState = {
            currentStep: 1,
            excelData: null,
            columnHeaders: [],
            mappedColumns: { barcode: null, text: [], quantity: null },
            labelSettings: {
                size: '2x1',
                customWidth: 2,
                customHeight: 1,
                barcodeType: 'EAN13',
                staticTexts: [],
                fontSize: 'medium',
                spacing: 'normal',
                textLayout: 'vertical',
                textGap: 2,
                elements: {
                    barcode: { x: 0.1, y: 0.1, width: 1.8, height: 0.4, fontSize: 10, align: 'center' },
                    textContainer: { x: 0.1, y: 0.6, width: 1.8, height: 0.3, fontSize: 10, align: 'center' }
                },
                textElements: []
            },
            generatedLabels: [],
            quantitySettings: { type: 'column', fixedQuantity: 1, manualQuantities: {} }
        };
        
        // Reset UI
        document.getElementById('file-info').classList.add('hidden');
        document.getElementById('upload-progress').classList.add('hidden');
        document.getElementById('file-input').value = '';
        
        setStep(1);
    }
}

// File Upload Handling
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    // Validate file type
    const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/excel'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        showError('Invalid file type', 'Please upload an Excel file (.xlsx or .xls)');
        return;
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        showError('File too large', 'Please upload a file smaller than 10MB');
        return;
    }
    
    showProgress('Reading Excel file...');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Get the first worksheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length === 0) {
                showError('Empty file', 'The Excel file appears to be empty');
                return;
            }
            
            // Extract headers and data
            const headers = jsonData[0];
            const dataRows = jsonData.slice(1);
            
            // Validate headers
            if (!headers || headers.length === 0) {
                showError('Invalid format', 'The Excel file must have column headers in the first row');
                return;
            }
            
            // Store data
            appState.excelData = dataRows;
            appState.columnHeaders = headers;
            
            // Update UI
            updateFileInfo(file.name, dataRows.length, headers.length);
            displayDataPreview(headers, dataRows.slice(0, 5)); // Show first 5 rows
            
            hideProgress();
            document.getElementById('file-info').classList.remove('hidden');
            
        } catch (error) {
            console.error('Error processing file:', error);
            showError('File processing error', 'There was an error reading the Excel file. Please make sure it\'s a valid Excel file.');
        }
    };
    
    reader.onerror = function() {
        showError('File read error', 'There was an error reading the file. Please try again.');
    };
    
    reader.readAsArrayBuffer(file);
}

function updateFileInfo(fileName, rowCount, columnCount) {
    document.getElementById('file-name').textContent = fileName;
    document.getElementById('total-rows').textContent = rowCount.toLocaleString();
    document.getElementById('total-columns').textContent = columnCount;
}

function displayDataPreview(headers, dataRows) {
    const headerRow = document.getElementById('preview-headers');
    const bodyRows = document.getElementById('preview-body');
    
    // Clear existing content
    headerRow.innerHTML = '';
    bodyRows.innerHTML = '';
    
    // Add headers
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header || 'Empty';
        headerRow.appendChild(th);
    });
    
    // Add data rows
    dataRows.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach((header, index) => {
            const td = document.createElement('td');
            td.textContent = row[index] || '';
            tr.appendChild(td);
        });
        bodyRows.appendChild(tr);
    });
}

// Column Mapping
function setupColumnMapping() {
    if (!appState.columnHeaders || appState.columnHeaders.length === 0) {
        return;
    }
    
    const availableColumns = document.getElementById('available-columns');
    availableColumns.innerHTML = '';
    
    appState.columnHeaders.forEach((header, index) => {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'column-item';
        columnDiv.textContent = header;
        columnDiv.draggable = true;
        columnDiv.dataset.columnIndex = index;
        columnDiv.dataset.columnName = header;
        
        columnDiv.addEventListener('dragstart', handleColumnDragStart);
        columnDiv.addEventListener('dragend', handleColumnDragEnd);
        
        availableColumns.appendChild(columnDiv);
    });
    
    // Setup drop zones
    setupDropZones();
}

function setupDropZones() {
    const zones = document.querySelectorAll('.mapping-zone');
    
    zones.forEach(zone => {
        zone.addEventListener('dragover', handleZoneDragOver);
        zone.addEventListener('dragleave', handleZoneDragLeave);
        zone.addEventListener('drop', handleZoneDrop);
    });
}

function handleColumnDragStart(e) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
        columnIndex: e.target.dataset.columnIndex,
        columnName: e.target.dataset.columnName
    }));
    e.target.classList.add('dragging');
}

function handleColumnDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleZoneDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleZoneDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleZoneDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const zoneType = e.currentTarget.dataset.type;
    
    // Remove from other zones if already mapped
    removeColumnFromAllZones(data.columnName);
    
    // Add to new zone
    addColumnToZone(zoneType, data.columnName, data.columnIndex);
    
    // Update mapping
    updateColumnMapping();
    updateMappingPreview();
    updateContinueButton();
}

function removeColumnFromAllZones(columnName) {
    const zones = document.querySelectorAll('.dropped-columns');
    zones.forEach(zone => {
        const existing = zone.querySelector(`[data-column-name="${columnName}"]`);
        if (existing) {
            existing.remove();
        }
    });
}

function addColumnToZone(zoneType, columnName, columnIndex) {
    const zone = document.getElementById(`${zoneType}-zone`);
    const columnDiv = document.createElement('div');
    columnDiv.className = 'dropped-column';
    columnDiv.dataset.columnName = columnName;
    columnDiv.dataset.columnIndex = columnIndex;
    
    columnDiv.innerHTML = `
        <span>${columnName}</span>
        <button class="remove-column" onclick="removeColumnFromZone('${zoneType}', '${columnName}')">×</button>
    `;
    
    zone.appendChild(columnDiv);
}

function removeColumnFromZone(zoneType, columnName) {
    const zone = document.getElementById(`${zoneType}-zone`);
    const column = zone.querySelector(`[data-column-name="${columnName}"]`);
    if (column) {
        column.remove();
        updateColumnMapping();
        updateMappingPreview();
        updateContinueButton();
    }
}

function updateColumnMapping() {
    // Reset mapping
    appState.mappedColumns = { barcode: null, text: [], quantity: null };
    
    // Update barcode mapping
    const barcodeZone = document.getElementById('barcode-zone');
    const barcodeColumn = barcodeZone.querySelector('.dropped-column');
    if (barcodeColumn) {
        appState.mappedColumns.barcode = {
            name: barcodeColumn.dataset.columnName,
            index: parseInt(barcodeColumn.dataset.columnIndex)
        };
    }
    
    // Update text mappings
    const textZone = document.getElementById('text-zone');
    const textColumns = textZone.querySelectorAll('.dropped-column');
    appState.mappedColumns.text = Array.from(textColumns).map(col => ({
        name: col.dataset.columnName,
        index: parseInt(col.dataset.columnIndex)
    }));
    
    // Update quantity mapping
    const quantityZone = document.getElementById('quantity-zone');
    const quantityColumn = quantityZone.querySelector('.dropped-column');
    if (quantityColumn) {
        appState.mappedColumns.quantity = {
            name: quantityColumn.dataset.columnName,
            index: parseInt(quantityColumn.dataset.columnIndex)
        };
    }
}

function updateMappingPreview() {
    const previewLabel = document.getElementById('mapping-preview-label');
    const previewBarcode = document.getElementById('mapping-preview-barcode');
    const previewText = document.getElementById('mapping-preview-text');
    
    if (appState.mappedColumns.barcode && appState.excelData.length > 0) {
        const sampleBarcode = appState.excelData[0][appState.mappedColumns.barcode.index];
        if (sampleBarcode) {
            try {
                JsBarcode(previewBarcode, sampleBarcode, {
                    format: appState.labelSettings.barcodeType,
                    width: 2,
                    height: 50,
                    displayValue: false
                });
            } catch (error) {
                previewBarcode.innerHTML = '<text>Invalid barcode</text>';
            }
        }
    } else {
        previewBarcode.innerHTML = '';
    }
    
    if (appState.mappedColumns.text.length > 0 && appState.excelData.length > 0) {
        const textParts = appState.mappedColumns.text.map(col => {
            const value = appState.excelData[0][col.index];
            return value ? value.toString() : '';
        }).filter(text => text.length > 0);
        
        previewText.textContent = textParts.join(' | ') || 'Sample Product Information';
    } else {
        previewText.textContent = 'Sample Product Information';
    }
}

function updateContinueButton() {
    const continueBtn = document.getElementById('continue-mapping');
    if (continueBtn) {
        const hasBarcode = appState.mappedColumns.barcode !== null;
        continueBtn.disabled = !hasBarcode;
    }
}

// Label Design
function setupLabelDesign() {
    // Initialize with default values
    // Note: initializeLabelDesigner() is called when step 3 is reached
}

// Figma-like Element System
let selectedElements = new Set();

// Element structure:
// {
//   id: unique identifier,
//   type: 'container' | 'text' | 'barcode',
//   name: display name,
//   children: array of child element IDs,
//   parent: parent element ID or null,
//   properties: type-specific properties,
//   style: CSS flex properties
// }

function initializeLabelDesigner() {
    console.log('Initializing Figma-like label designer...');
    
    // Initialize with default root container
    initializeDefaultElements();
    
    // Setup event listeners
    setupFigmaEventListeners();
    
    // Render initial state
    renderCanvas();
    renderElementTree();
    renderProperties();
    
    console.log('Figma-like label designer initialized');
}

function initializeDefaultElements() {
    // Create root container (the label itself)
    const rootElement = {
        id: 'root',
        type: 'container',
        name: 'Label',
        children: [],
        parent: null,
        properties: {},
        style: {
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
            gap: 4,
            padding: 8,
            margin: 0
        }
    };
    
    appState.labelSettings.elements = [rootElement];
    appState.labelSettings.nextElementId = 1;
    
    // Auto-add elements from Step 2 mapping
    addMappedElements();
}

function addMappedElements() {
    // Add barcode element if mapped
    if (appState.mappedColumns.barcode) {
        addElement('barcode', 'root', {
            height: 50,
            showText: true
        });
    }
    
    // Add text elements for each mapped text column
    if (appState.mappedColumns.text && appState.mappedColumns.text.length > 0) {
        appState.mappedColumns.text.forEach((column, index) => {
            addElement('text', 'root', {
                content: column.name,
                fontSize: 12,
                color: '#000000',
                fontWeight: 'normal',
                textAlign: 'left',
                columnIndex: column.index,
                columnName: column.name
            });
        });
    }
}

// Core Element Management Functions
function getElementById(id) {
    return appState.labelSettings.elements.find(el => el.id === id);
}

function addElement(type, parentId = 'root', properties = {}) {
    const id = `element_${appState.labelSettings.nextElementId++}`;
    const parent = getElementById(parentId);
    
    const element = {
        id,
        type,
        name: getDefaultElementName(type),
        children: [],
        parent: parentId,
        properties: getDefaultProperties(type, properties),
        style: getDefaultStyle(type)
    };
    
    // Add to elements array
    appState.labelSettings.elements.push(element);
    
    // Add to parent's children
    if (parent) {
        parent.children.push(id);
    }
    
    // Re-render
    renderCanvas();
    renderElementTree();
    
    // Update design cache
    setTimeout(() => cacheDesignConfiguration(), 100);
    
    return element;
}

function deleteElement(id) {
    if (id === 'root') return; // Cannot delete root
    
    const element = getElementById(id);
    if (!element) return;
    
    // Remove from parent's children
    const parent = getElementById(element.parent);
    if (parent) {
        parent.children = parent.children.filter(childId => childId !== id);
    }
    
    // Recursively delete children
    element.children.forEach(childId => deleteElement(childId));
    
    // Remove from elements array
    appState.labelSettings.elements = appState.labelSettings.elements.filter(el => el.id !== id);
    
    // Clear selection if this element was selected
    selectedElements.delete(id);
    if (appState.labelSettings.selectedElementId === id) {
        appState.labelSettings.selectedElementId = null;
    }
    
    // Re-render
    renderCanvas();
    renderElementTree();
    renderProperties();
    
    // Update design cache
    setTimeout(() => cacheDesignConfiguration(), 100);
}

function getDefaultElementName(type) {
    switch (type) {
        case 'container': return 'Container';
        case 'text': return 'Text';
        case 'barcode': return 'Barcode';
        default: return 'Element';
    }
}

function getDefaultProperties(type, overrides = {}) {
    const defaults = {
        container: {},
        text: {
            content: 'Sample Text',
            fontSize: 12,
            color: '#000000',
            fontWeight: 'normal',
            textAlign: 'left'
        },
        barcode: {
            height: 50,
            showText: true
        }
    };
    
    return { ...defaults[type], ...overrides };
}

function getDefaultStyle(type) {
    const defaults = {
        container: {
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
            gap: 4,
            padding: 4,
            margin: 0
        },
        text: {
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: 0,
            padding: 4,
            margin: 0
        },
        barcode: {
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            padding: 4,
            margin: 0
        }
    };
    
    return defaults[type] || defaults.container;
}

// Event Handlers for Adding Elements (Global functions accessible from HTML onclick)
window.addFlexContainer = function() {
    const selectedId = appState.labelSettings.selectedElementId || 'root';
    addElement('container', selectedId);
};

window.addTextElement = function() {
    const selectedId = appState.labelSettings.selectedElementId || 'root';
    addElement('text', selectedId);
};

window.addBarcodeElement = function() {
    const selectedId = appState.labelSettings.selectedElementId || 'root';
    addElement('barcode', selectedId);
};

// Rendering Functions
function renderCanvas() {
    const canvas = document.getElementById('label-canvas');
    if (!canvas) return;
    
    // Set canvas size based on label dimensions (96 DPI for screen display)
    const labelWidth = getLabelWidth();
    const labelHeight = getLabelHeight();
    canvas.style.width = `${labelWidth * DISPLAY_DPI}px`;
    canvas.style.height = `${labelHeight * DISPLAY_DPI}px`;
    canvas.style.background = '#ffffff';
    canvas.style.border = 'none';
    canvas.style.boxShadow = 'none';
    
    // Clear canvas
    canvas.innerHTML = '';
    
    // Add click handler to canvas for deselection
    canvas.addEventListener('click', (e) => {
        if (e.target === canvas) {
            selectedElements.clear();
            appState.labelSettings.selectedElementId = null;
            updateSelectionUI();
            renderElementTree();
            renderProperties();
            updateGroupButtons();
        }
    });
    
    // Render root element
    const rootElement = getElementById('root');
    if (rootElement) {
        const rootDiv = renderElement(rootElement);
        canvas.appendChild(rootDiv);
    }
}

function renderElement(element, labelData) {
    const div = document.createElement('div');
    div.className = `flex-element flex-${element.type}`;
    div.dataset.elementId = element.id;
    
    // Apply flex styles
    applyFlexStyles(div, element.style);
    
    // Add selection handling
    div.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.shiftKey) {
            // Additive selection
            if (selectedElements.has(element.id)) {
                selectedElements.delete(element.id);
            } else {
                selectedElements.add(element.id);
            }
        } else {
            // Single selection
            selectedElements.clear();
            selectedElements.add(element.id);
        }
        appState.labelSettings.selectedElementId = element.id;
        updateSelectionUI();
        renderElementTree();
        renderProperties();
        updateGroupButtons();
    });
    
    // Render content based on type
    switch (element.type) {
        case 'container':
            renderContainer(div, element);
            break;
        case 'text':
            renderText(div, element, labelData);
            break;
        case 'barcode':
            renderBarcode(div, element, labelData);
            break;
    }
    
    // Render children
    element.children.forEach(childId => {
        const childElement = getElementById(childId);
        if (childElement) {
            const childDiv = renderElement(childElement, labelData);
            div.appendChild(childDiv);
        }
    });
    
    return div;
}

function applyFlexStyles(div, style) {
    div.style.display = 'flex';
    div.style.flexDirection = style.flexDirection || 'column';
    div.style.justifyContent = style.justifyContent || 'flex-start';
    div.style.alignItems = style.alignItems || 'stretch';
    div.style.gap = `${style.gap || 0}px`;
    div.style.padding = `${style.padding || 0}px`;
    div.style.margin = `${style.margin || 0}px`;
}

function renderContainer(div, element) {
    // Container is just a flex box, children will be added separately
    if (element.children.length === 0) {
        div.classList.add('flex-container');
    } else {
        div.classList.add('flex-container', 'has-children');
    }
}

function renderText(div, element, labelData) {
    const textSpan = document.createElement('span');
    
    // Use actual Excel data if available and element is mapped to a column
    let textContent = element.properties.content || 'Text';
    if (labelData && element.properties.columnIndex !== undefined) {
        const mappedText = labelData.textElements.find(t => t.columnIndex === element.properties.columnIndex);
        if (mappedText) {
            textContent = mappedText.text;
        } else {
            textContent = element.properties.columnName; // Fallback
        }
    } else if (element.properties.columnIndex !== undefined && appState.excelData && appState.excelData.length > 0) {
        const value = appState.excelData[0][element.properties.columnIndex];
        textContent = value ? value.toString() : element.properties.columnName || textContent;
    }
    
    textSpan.textContent = textContent;
    textSpan.style.fontSize = `${element.properties.fontSize || 12}px`;
    textSpan.style.color = element.properties.color || '#000000';
    textSpan.style.fontWeight = element.properties.fontWeight || 'normal';
    textSpan.style.textAlign = element.properties.textAlign || 'left';
    div.appendChild(textSpan);
}

function renderBarcode(div, element, labelData) {
    // Create barcode SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.className = 'barcode-svg';
    
    // Get sample barcode data
    let barcodeData = '1234567890123';
    if (labelData) {
        barcodeData = labelData.barcode;
    } else if (appState.mappedColumns.barcode && appState.excelData.length > 0) {
        barcodeData = appState.excelData[0][appState.mappedColumns.barcode.index] || barcodeData;
    }
    
    try {
        JsBarcode(svg, barcodeData, {
            format: appState.labelSettings.barcodeType,
            width: 2,
            height: element.properties.height || 50,
            displayValue: element.properties.showText || false
        });
    } catch (error) {
        svg.innerHTML = '<text>Invalid barcode</text>';
    }
    
    div.appendChild(svg);
}

function renderElementTree() {
    const tree = document.getElementById('element-tree');
    if (!tree) return;
    
    tree.innerHTML = '';
    
    const rootElement = getElementById('root');
    if (rootElement) {
        renderTreeItem(tree, rootElement, 0);
    }
}

function renderTreeItem(container, element, depth) {
    const item = document.createElement('div');
    item.className = `tree-item depth-${depth}`;
    item.dataset.elementId = element.id;
    item.style.paddingLeft = `${depth * 20}px`;
    
    if (selectedElements.has(element.id)) {
        item.classList.add('selected');
    }

    // Add drag-and-drop handlers
    item.draggable = true;
    item.addEventListener('dragstart', e => handleTreeDragStart(e, element.id));
    item.addEventListener('dragover', e => handleTreeDragOver(e));
    item.addEventListener('dragleave', e => handleTreeDragLeave(e));
    item.addEventListener('drop', e => handleTreeDrop(e, element.id));
    
    // Toggle button for containers with children
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'tree-toggle';
    toggleContainer.textContent = '▼';
    item.appendChild(toggleContainer);
    
    // Element icon
    const icon = document.createElement('span');
    icon.className = 'tree-icon';
    icon.textContent = getElementIcon(element.type);
    item.appendChild(icon);
    
    // Element name
    const name = document.createElement('span');
    name.textContent = element.name;
    item.appendChild(name);
    
    // Click handler
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.shiftKey) {
            // Additive selection
            if (selectedElements.has(element.id)) {
                selectedElements.delete(element.id);
            } else {
                selectedElements.add(element.id);
            }
        } else {
            // Single selection
            selectedElements.clear();
            selectedElements.add(element.id);
        }
        appState.labelSettings.selectedElementId = element.id;
        updateSelectionUI();
        renderElementTree();
        renderProperties();
        updateGroupButtons();
    });
    
    container.appendChild(item);
    
    // Render children
    if (element.children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'tree-item-children';
        container.appendChild(childrenContainer);
        
        element.children.forEach(childId => {
            const childElement = getElementById(childId);
            if (childElement) {
                renderTreeItem(childrenContainer, childElement, depth + 1);
            }
        });
    }
}

function getElementIcon(type) {
    switch (type) {
        case 'container': return '📦';
        case 'text': return 'T';
        case 'barcode': return '|||';
        default: return '?';
    }
}

// Selection and Properties Functions
function selectElement(id, additive = false) {
    if (!additive) {
        selectedElements.clear();
    }
    
    selectedElements.add(id);
    appState.labelSettings.selectedElementId = id;
    
    // Update UI
    updateSelectionUI();
    renderElementTree();
    renderProperties();
    updateGroupButtons();

    const element = getElementById(id);
    if (element && element.type === 'text') {
        const textInput = document.getElementById('text-content');
        if (textInput) {
            textInput.focus();
            textInput.select();
        }
    }
}

function updateSelectionUI() {
    // Update canvas selection
    document.querySelectorAll('.flex-element').forEach(el => {
        el.classList.remove('selected');
        if (selectedElements.has(el.dataset.elementId)) {
            el.classList.add('selected');
        }
    });
}

function updateGroupButtons() {
    const groupBtn = document.getElementById('group-btn');
    const ungroupBtn = document.getElementById('ungroup-btn');
    const deleteBtn = document.getElementById('delete-btn');
    
    const hasSelection = selectedElements.size > 0;
    const canGroup = selectedElements.size > 1;
    const selectedElement = appState.labelSettings.selectedElementId ? getElementById(appState.labelSettings.selectedElementId) : null;
    const canUngroup = selectedElement && selectedElement.type === 'container' && selectedElement.children.length > 0;
    
    if (groupBtn) groupBtn.disabled = !canGroup;
    if (ungroupBtn) ungroupBtn.disabled = !canUngroup;
    if (deleteBtn) deleteBtn.disabled = !hasSelection || appState.labelSettings.selectedElementId === 'root';
}

function renderProperties() {
    const propertiesDiv = document.getElementById('element-properties');
    if (!propertiesDiv) return;
    
    // Hide all property groups
    document.querySelectorAll('.property-group').forEach(group => {
        group.classList.add('hidden');
    });
    
    const selectedId = appState.labelSettings.selectedElementId;
    if (!selectedId) {
        document.querySelector('.no-selection').style.display = 'block';
        return;
    }
    
    document.querySelector('.no-selection').style.display = 'none';
    
    const element = getElementById(selectedId);
    if (!element) return;
    
    // Show relevant property group
    switch (element.type) {
        case 'container':
            showContainerProperties(element);
            break;
        case 'text':
            showTextProperties(element);
            break;
        case 'barcode':
            showBarcodeProperties(element);
            break;
    }
}

function showContainerProperties(element) {
    const group = document.getElementById('container-props');
    group.classList.remove('hidden');
    
    // Populate values
    document.getElementById('flex-direction').value = element.style.flexDirection || 'column';
    document.getElementById('justify-content').value = element.style.justifyContent || 'flex-start';
    document.getElementById('align-items').value = element.style.alignItems || 'stretch';
    document.getElementById('gap').value = element.style.gap || 0;
    document.getElementById('padding').value = element.style.padding || 0;
    document.getElementById('margin').value = element.style.margin || 0;
}

function showTextProperties(element) {
    const group = document.getElementById('text-props');
    group.classList.remove('hidden');
    
    // Populate values
    document.getElementById('text-content').value = element.properties.content || '';
    document.getElementById('font-size').value = element.properties.fontSize || 12;
    document.getElementById('text-align').value = element.properties.textAlign || 'left';
    document.getElementById('font-weight').value = element.properties.fontWeight || 'normal';
    document.getElementById('color').value = element.properties.color || '#000000';
}

function showBarcodeProperties(element) {
    const group = document.getElementById('barcode-props');
    group.classList.remove('hidden');
    
    // Populate values
    document.getElementById('barcode-height').value = element.properties.height || 50;
    document.getElementById('show-text').checked = element.properties.showText || false;
}

// Event Listeners Setup
function setupFigmaEventListeners() {
    // Label size changes
    const labelSize = document.getElementById('label-size');
    if (labelSize) {
        labelSize.addEventListener('change', handleLabelSizeChange);
    }
    
    const customWidth = document.getElementById('custom-width');
    const customHeight = document.getElementById('custom-height');
    if (customWidth) customWidth.addEventListener('input', handleCustomSizeChange);
    if (customHeight) customHeight.addEventListener('input', handleCustomSizeChange);
    
    const barcodeType = document.getElementById('barcode-type');
    if (barcodeType) {
        barcodeType.addEventListener('change', (e) => {
            appState.labelSettings.barcodeType = e.target.value;
            renderCanvas();
        });
    }
    
    // Property controls
    setupPropertyEventListeners();
}

function setupPropertyEventListeners() {
    // Container properties
    ['flex-direction', 'justify-content', 'align-items'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updateSelectedElementStyle);
        }
    });
    
    ['gap', 'padding', 'margin'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateSelectedElementStyle);
        }
    });
    
    // Text properties
    ['text-content', 'font-size', 'text-align', 'font-weight', 'color'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateSelectedElementProperties);
        }
    });
    
    // Barcode properties
    ['barcode-height', 'show-text'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateSelectedElementProperties);
        }
    });
}

function updateSelectedElementStyle() {
    const selectedId = appState.labelSettings.selectedElementId;
    if (!selectedId) return;
    
    const element = getElementById(selectedId);
    if (!element) return;
    
    // Update style properties
    element.style.flexDirection = document.getElementById('flex-direction').value;
    element.style.justifyContent = document.getElementById('justify-content').value;
    element.style.alignItems = document.getElementById('align-items').value;
    element.style.gap = parseInt(document.getElementById('gap').value) || 0;
    element.style.padding = parseInt(document.getElementById('padding').value) || 0;
    element.style.margin = parseInt(document.getElementById('margin').value) || 0;
    
    renderCanvas();
}

function updateSelectedElementProperties() {
    const selectedId = appState.labelSettings.selectedElementId;
    if (!selectedId) return;
    
    const element = getElementById(selectedId);
    if (!element) return;
    
    // Update properties based on element type
    switch (element.type) {
        case 'text':
            const textContent = document.getElementById('text-content');
            const fontSize = document.getElementById('font-size');
            const textAlign = document.getElementById('text-align');
            const fontWeight = document.getElementById('font-weight');
            const color = document.getElementById('color');
            
            if (textContent) element.properties.content = textContent.value;
            if (fontSize) element.properties.fontSize = parseInt(fontSize.value) || 12;
            if (textAlign) element.properties.textAlign = textAlign.value;
            if (fontWeight) element.properties.fontWeight = fontWeight.value;
            if (color) element.properties.color = color.value;
            break;
        case 'barcode':
            const barcodeHeight = document.getElementById('barcode-height');
            const showText = document.getElementById('show-text');
            
            if (barcodeHeight) element.properties.height = parseInt(barcodeHeight.value) || 50;
            if (showText) element.properties.showText = showText.checked;
            break;
    }
    
    renderCanvas();
}

// Grouping Functions (Global functions accessible from HTML onclick)
window.groupSelected = function() {
    if (selectedElements.size < 2) {
        showError('Grouping Error', 'Please select at least 2 elements to group.');
        return;
    }
    
    const selectedIds = Array.from(selectedElements);
    const elementsToGroup = selectedIds.map(id => getElementById(id)).filter(Boolean);

    if (elementsToGroup.length !== selectedIds.length) {
        console.error("Some selected elements could not be found.");
        return;
    }

    const parentId = elementsToGroup[0].parent;
    if (!elementsToGroup.every(el => el.parent === parentId)) {
        showError('Grouping Error', 'You can only group elements that are on the same level (siblings).');
        return;
    }
    
    const firstElement = elementsToGroup[0];
    if (!firstElement) return;
    
    // Create new container
    const container = addElement('container', firstElement.parent);
    container.name = 'Group';
    
    // Move selected elements into the container
    elementsToGroup.forEach(element => {
        // Remove from current parent
        const parent = getElementById(element.parent);
        if (parent) {
            parent.children = parent.children.filter(childId => childId !== element.id);
        }
        
        // Add to container
        element.parent = container.id;
        container.children.push(element.id);
    });
    
    // Select the new container
    selectedElements.clear();
    selectedElements.add(container.id);
    appState.labelSettings.selectedElementId = container.id;
    updateSelectionUI();
    renderElementTree();
    renderProperties();
    updateGroupButtons();
    
    renderCanvas();
};

window.ungroupSelected = function() {
    const selectedId = appState.labelSettings.selectedElementId;
    if (!selectedId) return;
    
    const element = getElementById(selectedId);
    if (!element || element.type !== 'container') return;
    
    const parent = getElementById(element.parent);
    if (!parent) return;
    
    // Move children up to parent
    element.children.forEach(childId => {
        const child = getElementById(childId);
        if (child) {
            child.parent = parent.id;
            parent.children.push(childId);
        }
    });
    
    // Remove the container
    deleteElement(selectedId);
};

window.deleteSelected = function() {
    selectedElements.forEach(id => {
        deleteElement(id);
    });
    selectedElements.clear();
    appState.labelSettings.selectedElementId = null;
    renderProperties();
};

// Helper function to convert existing static text to auto-sizing
function convertExistingStaticTextToAutoSize() {
    appState.labelSettings.staticTexts.forEach((staticText, index) => {
        const elementId = `static-${index}`;
        if (appState.labelSettings.elements[elementId]) {
            // Convert to auto sizing while keeping position
            appState.labelSettings.elements[elementId].width = 'auto';
            appState.labelSettings.elements[elementId].height = 'auto';
        }
    });
}

function setupDragAndDrop() {
    const previewLabel = document.getElementById('design-preview-label');
    
    // Prevent default drag behavior
    previewLabel.addEventListener('dragstart', (e) => e.preventDefault());
    
    // Handle clicks on the label area
    previewLabel.addEventListener('click', (e) => {
        if (e.target === previewLabel) {
            deselectAllElements();
        }
    });
    
    // Delegated mousedown event for all draggable elements
    previewLabel.addEventListener('mousedown', (e) => {
        const target = e.target;
        // Check if the target or its parent is a draggable element
        const draggableElement = target.closest('.preview-barcode, .preview-text, .preview-static');
        
        if (draggableElement && draggableElement.dataset.elementId) {
            console.log('Delegated drag started for:', draggableElement.dataset.elementId);
            handleElementMouseDown.call(draggableElement, e);
        }
    });
}

function getDefaultElementConfig(id) {
    const labelWidth = appState.labelSettings.size === 'custom' 
        ? appState.labelSettings.customWidth 
        : LABEL_SIZES[appState.labelSettings.size].width;
    const labelHeight = appState.labelSettings.size === 'custom' 
        ? appState.labelSettings.customHeight 
        : LABEL_SIZES[appState.labelSettings.size].height;
    
    switch (id) {
        case 'barcode':
            return { x: 0.1, y: 0.1, width: labelWidth - 0.2, height: 0.4, fontSize: 10, align: 'center' };
        case 'textContainer':
            return { x: 0.1, y: 0.6, width: labelWidth - 0.2, height: 0.3, fontSize: 10, align: 'center' };
        default:
            if (id.startsWith('static-')) {
                // Position static text elements in a vertical stack below other elements
                const staticIndex = parseInt(id.split('-')[1]) || 0;
                return { x: 0.1, y: 0.5 + (staticIndex * 0.15), width: 'auto', height: 'auto', fontSize: 8, align: 'center' };
            }
            if (id.startsWith('text-')) {
                const textIndex = parseInt(id.split('-')[1]) || 0;
                return { x: 0.1, y: 0.6 + (textIndex * 0.15), width: 'auto', height: 'auto', fontSize: 10, align: 'center' };
            }
            return { x: 0.1, y: 0.5, width: labelWidth - 0.2, height: 0.1, fontSize: 8, align: 'center' };
    }
}

// This function is no longer needed as we use flexbox layout directly

function updateElementPosition(element, config) {
    if (!element || !config) {
        return;
    }
    
    const labelWidth = appState.labelSettings.size === 'custom' 
        ? appState.labelSettings.customWidth 
        : LABEL_SIZES[appState.labelSettings.size].width;
    const labelHeight = appState.labelSettings.size === 'custom' 
        ? appState.labelSettings.customHeight 
        : LABEL_SIZES[appState.labelSettings.size].height;
    
    // Convert inches to pixels
    const x = Math.max(0, config.x * DISPLAY_DPI);
    const y = Math.max(0, config.y * DISPLAY_DPI);
    
    // Set basic positioning
    element.style.position = 'absolute';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.fontSize = `${config.fontSize}px`;
    element.style.textAlign = config.align;
    element.style.boxSizing = 'border-box';
    element.style.cursor = 'move';
    element.style.userSelect = 'none';
    element.style.padding = '2px 4px';
    element.style.whiteSpace = 'nowrap';
    
    // Handle width and height
    if (config.width === 'auto') {
        element.style.width = 'auto';
        element.style.minWidth = '20px';
        element.style.maxWidth = `${(labelWidth - config.x) * DISPLAY_DPI}px`;
    } else {
        const width = Math.max(20, Math.min(config.width * DISPLAY_DPI, labelWidth * DISPLAY_DPI));
        element.style.width = `${width}px`;
    }
    
    if (config.height === 'auto') {
        element.style.height = 'auto';
        element.style.minHeight = `${config.fontSize + 4}px`;
    } else {
        const height = Math.max(15, Math.min(config.height * DISPLAY_DPI, labelHeight * DISPLAY_DPI));
        element.style.height = `${height}px`;
    }
}

function handleElementMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const labelRect = document.getElementById('design-preview-label').getBoundingClientRect();
    
    // Check if clicking on a resize handle
    if (e.target.classList.contains('element-handle')) {
        isResizing = true;
        resizeHandle = e.target.dataset.handle;
        selectedElement = element;
        selectElement(element);
        return;
    }
    
    // Start dragging
    isDragging = true;
    selectedElement = element;
    selectElement(element);
    
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    element.classList.add('dragging');
    
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

function handleMouseMove(e) {
    if (!selectedElement) return;
    
    const labelRect = document.getElementById('design-preview-label').getBoundingClientRect();
    
    if (isDragging) {
        const x = e.clientX - labelRect.left - dragOffset.x;
        const y = e.clientY - labelRect.top - dragOffset.y;
        
        // Convert pixels to inches (using same DPI as print for accuracy)
        const xInches = Math.max(0, Math.min(x / DISPLAY_DPI, getLabelWidth() - getElementWidth(selectedElement)));
        const yInches = Math.max(0, Math.min(y / DISPLAY_DPI, getLabelHeight() - getElementHeight(selectedElement)));
        
        selectedElement.style.left = `${xInches * DISPLAY_DPI}px`;
        selectedElement.style.top = `${yInches * DISPLAY_DPI}px`;
        
        // Update element config
        const elementId = selectedElement.dataset.elementId;
        if (appState.labelSettings.elements[elementId]) {
            appState.labelSettings.elements[elementId].x = xInches;
            appState.labelSettings.elements[elementId].y = yInches;
        }
        
        updateElementProperties();
        
        // Update design cache to preserve changes
        setTimeout(() => cacheDesignConfiguration(), 50);
    } else if (isResizing) {
        // Handle resizing
        const x = e.clientX - labelRect.left;
        const y = e.clientY - labelRect.top;
        
        const elementId = selectedElement.dataset.elementId;
        const config = appState.labelSettings.elements[elementId];
        
        if (config) {
            switch (resizeHandle) {
                case 'se':
                    config.width = Math.max(0.1, (x / DISPLAY_DPI) - config.x);
                    config.height = Math.max(0.1, (y / DISPLAY_DPI) - config.y);
                    break;
                case 'sw':
                    const newWidth = config.width + (config.x - (x / DISPLAY_DPI));
                    const newX = Math.min(config.x + config.width - 0.1, x / DISPLAY_DPI);
                    config.width = Math.max(0.1, newWidth);
                    config.x = newX;
                    config.height = Math.max(0.1, (y / DISPLAY_DPI) - config.y);
                    break;
                case 'ne':
                    config.width = Math.max(0.1, (x / DISPLAY_DPI) - config.x);
                    const newHeight = config.height + (config.y - (y / DISPLAY_DPI));
                    const newY = Math.min(config.y + config.height - 0.1, y / DISPLAY_DPI);
                    config.height = Math.max(0.1, newHeight);
                    config.y = newY;
                    break;
                case 'nw':
                    const newWidthNW = config.width + (config.x - (x / DISPLAY_DPI));
                    const newXNW = Math.min(config.x + config.width - 0.1, x / DISPLAY_DPI);
                    config.width = Math.max(0.1, newWidthNW);
                    config.x = newXNW;
                    const newHeightNW = config.height + (config.y - (y / DISPLAY_DPI));
                    const newYNW = Math.min(config.y + config.height - 0.1, y / DISPLAY_DPI);
                    config.height = Math.max(0.1, newHeightNW);
                    config.y = newYNW;
                    break;
            }
            
            updateElementPosition(selectedElement, config);
            updateElementProperties();
            
            // Update design cache to preserve changes
            setTimeout(() => cacheDesignConfiguration(), 50);
        }
    }
}

function handleMouseUp(e) {
    if (selectedElement) {
        selectedElement.classList.remove('dragging');
    }
    
    isDragging = false;
    isResizing = false;
    resizeHandle = null;
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
}


function deselectAllElements() {
    document.querySelectorAll('.preview-barcode, .preview-text, .preview-static').forEach(el => {
        el.classList.remove('selected');
        removeResizeHandles(el);
    });
    selectedElement = null;
    hideElementProperties();
}

function addResizeHandles(element) {
    const handles = ['nw', 'ne', 'sw', 'se'];
    handles.forEach(handle => {
        const handleEl = document.createElement('div');
        handleEl.className = `element-handle ${handle}`;
        handleEl.dataset.handle = handle;
        element.appendChild(handleEl);
    });
}

function removeResizeHandles(element) {
    element.querySelectorAll('.element-handle').forEach(handle => handle.remove());
}

function showElementProperties(element) {
    const elementId = element.dataset.elementId;
    const config = appState.labelSettings.elements[elementId];
    
    if (config) {
        document.getElementById('element-x').value = config.x.toFixed(2);
        document.getElementById('element-y').value = config.y.toFixed(2);
        document.getElementById('element-width').value = config.width.toFixed(2);
        document.getElementById('element-height').value = config.height.toFixed(2);
        document.getElementById('element-font-size').value = config.fontSize;
        document.getElementById('element-align').value = config.align;
        
        document.getElementById('element-properties').style.display = 'block';
    }
}

function hideElementProperties() {
    document.getElementById('element-properties').style.display = 'none';
}

function updateElementProperties() {
    if (!selectedElement) return;
    
    const elementId = selectedElement.dataset.elementId;
    const config = appState.labelSettings.elements[elementId];
    
    if (config) {
        document.getElementById('element-x').value = config.x.toFixed(2);
        document.getElementById('element-y').value = config.y.toFixed(2);
        document.getElementById('element-width').value = config.width.toFixed(2);
        document.getElementById('element-height').value = config.height.toFixed(2);
    }
}

function setupElementPropertyControls() {
    const controls = ['element-x', 'element-y', 'element-width', 'element-height', 'element-font-size', 'element-align'];
    
    controls.forEach(controlId => {
        const control = document.getElementById(controlId);
        if (control) {
            control.addEventListener('input', updateElementFromProperties);
        }
    });
    
    // Add layout controls
    const textLayout = document.getElementById('text-layout');
    const textGap = document.getElementById('text-gap');
    
    if (textLayout) {
        textLayout.addEventListener('change', updateTextLayout);
    }
    
    if (textGap) {
        textGap.addEventListener('input', updateTextLayout);
    }
}

function updateTextLayout() {
    const textLayout = document.getElementById('text-layout').value;
    const textGap = parseInt(document.getElementById('text-gap').value) || 2;
    
    appState.labelSettings.textLayout = textLayout;
    appState.labelSettings.textGap = textGap;
    
    // Update text container
    const textContainer = document.getElementById('element-textContainer');
    if (textContainer) {
        textContainer.className = `preview-text text-container ${textLayout}`;
        textContainer.style.gap = `${textGap}px`;
    }
    
    // Cache the design configuration for export
    setTimeout(() => cacheDesignConfiguration(), 100); // Small delay to ensure DOM is updated
}

function cacheDesignConfiguration() {
    // Capture the exact design configuration from Step 3
    const designCache = {
        textLayout: appState.labelSettings.textLayout,
        textGap: appState.labelSettings.textGap,
        fontSize: appState.labelSettings.fontSize,
        spacing: appState.labelSettings.spacing,
        elements: {},
        textContainer: null,
        textElements: [],
        staticElements: [],
        barcodeElement: null
    };
    
    // Cache barcode element configuration
    const barcodeElement = document.getElementById('element-barcode');
    if (barcodeElement) {
        const computedStyle = window.getComputedStyle(barcodeElement);
        designCache.barcodeElement = {
            id: barcodeElement.id,
            className: barcodeElement.className,
            display: computedStyle.display,
            fontSize: computedStyle.fontSize,
            textAlign: computedStyle.textAlign,
            padding: computedStyle.padding,
            margin: computedStyle.margin,
            width: computedStyle.width,
            height: computedStyle.height,
            position: computedStyle.position,
            left: computedStyle.left,
            top: computedStyle.top,
            minWidth: computedStyle.minWidth,
            minHeight: computedStyle.minHeight
        };
    }
    
    // Cache text container configuration
    const textContainer = document.getElementById('element-textContainer');
    if (textContainer) {
        const computedStyle = window.getComputedStyle(textContainer);
        designCache.textContainer = {
            className: textContainer.className,
            display: computedStyle.display,
            flexDirection: computedStyle.flexDirection,
            alignItems: computedStyle.alignItems,
            justifyContent: computedStyle.justifyContent,
            gap: computedStyle.gap,
            padding: computedStyle.padding,
            margin: computedStyle.margin,
            width: computedStyle.width,
            height: computedStyle.height,
            position: computedStyle.position,
            left: computedStyle.left,
            top: computedStyle.top
        };
    }
    
    // Cache individual text elements
    const textElements = document.querySelectorAll('[id^="element-text-"]');
    textElements.forEach((element, index) => {
        const computedStyle = window.getComputedStyle(element);
        designCache.textElements.push({
            id: element.id,
            textContent: element.textContent,
            className: element.className,
            display: computedStyle.display,
            fontSize: computedStyle.fontSize,
            textAlign: computedStyle.textAlign,
            padding: computedStyle.padding,
            margin: computedStyle.margin,
            width: computedStyle.width,
            height: computedStyle.height,
            position: computedStyle.position,
            left: computedStyle.left,
            top: computedStyle.top,
            flex: computedStyle.flex,
            minWidth: computedStyle.minWidth,
            minHeight: computedStyle.minHeight
        });
    });
    
    // Cache static text elements
    const staticElements = document.querySelectorAll('[id^="element-static-"]');
    staticElements.forEach((element, index) => {
        const computedStyle = window.getComputedStyle(element);
        designCache.staticElements.push({
            id: element.id,
            textContent: element.textContent,
            className: element.className,
            display: computedStyle.display,
            fontSize: computedStyle.fontSize,
            textAlign: computedStyle.textAlign,
            padding: computedStyle.padding,
            margin: computedStyle.margin,
            width: computedStyle.width,
            height: computedStyle.height,
            position: computedStyle.position,
            left: computedStyle.left,
            top: computedStyle.top,
            minWidth: computedStyle.minWidth,
            minHeight: computedStyle.minHeight
        });
    });
    
    // Store in appState for use during export
    appState.designCache = designCache;
    
    // Also store in localStorage for persistence
    localStorage.setItem('labelDesignCache', JSON.stringify(designCache));
    
    console.log('Design configuration cached:', designCache);
}

function updateElementFromProperties() {
    if (!selectedElement) return;
    
    const elementId = selectedElement.dataset.elementId;
    const config = appState.labelSettings.elements[elementId];
    
    if (config) {
        config.x = parseFloat(document.getElementById('element-x').value) || 0;
        config.y = parseFloat(document.getElementById('element-y').value) || 0;
        config.width = parseFloat(document.getElementById('element-width').value) || 0.1;
        config.height = parseFloat(document.getElementById('element-height').value) || 0.1;
        config.fontSize = parseInt(document.getElementById('element-font-size').value) || 10;
        config.align = document.getElementById('element-align').value;
        
        updateElementPosition(selectedElement, config);
        
        // Update design cache to preserve changes
        setTimeout(() => cacheDesignConfiguration(), 50);
    }
}

function getLabelWidth() {
    return appState.labelSettings.size === 'custom' 
        ? appState.labelSettings.customWidth 
        : LABEL_SIZES[appState.labelSettings.size].width;
}

function getLabelHeight() {
    return appState.labelSettings.size === 'custom' 
        ? appState.labelSettings.customHeight 
        : LABEL_SIZES[appState.labelSettings.size].height;
}

function getElementWidth(element) {
    const config = appState.labelSettings.elements[element.dataset.elementId];
    if (!config) return 0.1;
    
    if (config.width === 'auto') {
        // Get actual rendered width in inches
        return element.offsetWidth / DISPLAY_DPI;
    }
    return config.width;
}

function getElementHeight(element) {
    const config = appState.labelSettings.elements[element.dataset.elementId];
    if (!config) return 0.1;
    
    if (config.height === 'auto') {
        // Get actual rendered height in inches
        return element.offsetHeight / DISPLAY_DPI;
    }
    return config.height;
}

// Static Text Management
function initializeStaticTextManager() {
    updateStaticTextList();
}

function addStaticTextField() {
    const text = prompt('Enter static text:');
    if (text && text.trim()) {
        const staticIndex = appState.labelSettings.staticTexts.length;
        const staticText = {
            id: Date.now(),
            text: text.trim(),
            x: 0.1,
            y: 0.5 + (staticIndex * 0.15),
            width: 'auto',
            height: 'auto',
            fontSize: 8,
            align: 'center'
        };
        
        appState.labelSettings.staticTexts.push(staticText);
        
        // Add to elements config with auto sizing
        const elementId = `static-${appState.labelSettings.staticTexts.length - 1}`;
        appState.labelSettings.elements[elementId] = {
            x: staticText.x,
            y: staticText.y,
            width: 'auto',
            height: 'auto',
            fontSize: staticText.fontSize,
            align: staticText.align
        };
        
        updateStaticTextList();
        updateDesignPreview();
    }
}

function removeStaticTextField(index) {
    appState.labelSettings.staticTexts.splice(index, 1);
    
    // Remove from elements config
    const elementId = `static-${index}`;
    delete appState.labelSettings.elements[elementId];
    
    // Reindex remaining static texts
    const newElements = {};
    Object.keys(appState.labelSettings.elements).forEach(key => {
        if (key.startsWith('static-')) {
            const oldIndex = parseInt(key.split('-')[1]);
            if (oldIndex > index) {
                newElements[`static-${oldIndex - 1}`] = appState.labelSettings.elements[key];
            } else if (oldIndex < index) {
                newElements[key] = appState.labelSettings.elements[key];
            }
        } else {
            newElements[key] = appState.labelSettings.elements[key];
        }
    });
    appState.labelSettings.elements = newElements;
    
    updateStaticTextList();
    updateDesignPreview();
}

function updateStaticTextList() {
    const list = document.getElementById('static-text-list');
    list.innerHTML = '';
    
    appState.labelSettings.staticTexts.forEach((staticText, index) => {
        const item = document.createElement('div');
        item.className = 'static-text-item';
        
        item.innerHTML = `
            <input type="text" class="static-text-input" value="${staticText.text}" 
                   onchange="updateStaticText(${index}, this.value)">
            <button class="static-text-remove" onclick="removeStaticTextField(${index})">×</button>
        `;
        
        list.appendChild(item);
    });
}

function updateStaticText(index, text) {
    if (appState.labelSettings.staticTexts[index]) {
        appState.labelSettings.staticTexts[index].text = text;
        updateDesignPreview();
    }
}

// Grid and Utility Functions
function toggleGrid() {
    const grid = document.getElementById('preview-grid');
    const toggle = document.getElementById('grid-toggle');
    
    gridVisible = !gridVisible;
    
    if (gridVisible) {
        grid.classList.add('visible');
        toggle.innerHTML = '<span class="btn-icon">⊞</span> Hide Grid';
    } else {
        grid.classList.remove('visible');
        toggle.innerHTML = '<span class="btn-icon">⊞</span> Show Grid';
    }
}

function resetElementPositions() {
    if (confirm('Reset all element positions to default?')) {
        // Reset barcode position
        appState.labelSettings.elements.barcode = getDefaultElementConfig('barcode');
        
        // Reset text position
        appState.mappedColumns.text.forEach((col, index) => {
            const elementId = `text-${index}`;
            appState.labelSettings.elements[elementId] = getDefaultElementConfig(elementId);
        });
        
        // Reset static text positions
        appState.labelSettings.staticTexts.forEach((staticText, index) => {
            const elementId = `static-${index}`;
            appState.labelSettings.elements[elementId] = getDefaultElementConfig(elementId);
        });
        
        updateDesignPreview();
        deselectAllElements();
    }
}

function handleLabelSizeChange(e) {
    const size = e.target.value;
    appState.labelSettings.size = size;
    
    const customSizeGroup = document.getElementById('custom-size-group');
    if (size === 'custom') {
        customSizeGroup.classList.remove('hidden');
    } else {
        customSizeGroup.classList.add('hidden');
        if (LABEL_SIZES[size]) {
            appState.labelSettings.customWidth = LABEL_SIZES[size].width;
            appState.labelSettings.customHeight = LABEL_SIZES[size].height;
        }
    }
    
    renderCanvas();
}

function handleCustomSizeChange() {
    const width = parseFloat(document.getElementById('custom-width').value) || 2;
    const height = parseFloat(document.getElementById('custom-height').value) || 1;
    
    appState.labelSettings.customWidth = width;
    appState.labelSettings.customHeight = height;
    
    renderCanvas();
}

function updateDesignPreview() {
    const previewLabel = document.getElementById('design-preview-label');
    if (!previewLabel) {
        console.error('Preview label element not found');
        return;
    }

    // Update label size
    const labelWidth = getLabelWidth();
    const labelHeight = getLabelHeight();
    previewLabel.style.width = `${labelWidth * DISPLAY_DPI}px`;
    previewLabel.style.height = `${labelHeight * DISPLAY_DPI}px`;

    // Clear and rebuild the preview using Step 2's approach
    previewLabel.innerHTML = '';

    // Create barcode element (like Step 2 but draggable)
    const barcodeDiv = document.createElement('div');
    barcodeDiv.className = 'preview-barcode';
    barcodeDiv.id = 'element-barcode';
    barcodeDiv.dataset.elementId = 'barcode';

    const barcodeContainer = document.createElement('div');
    barcodeContainer.className = 'barcode-container';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'design-preview-barcode';
    svg.className = 'barcode-svg';

    const barcodeNumber = document.createElement('div');
    barcodeNumber.className = 'barcode-number';

    barcodeContainer.appendChild(svg);
    barcodeContainer.appendChild(barcodeNumber);
    barcodeDiv.appendChild(barcodeContainer);

    // Add drag functionality
    barcodeDiv.addEventListener('mousedown', handleElementMouseDown);
    barcodeDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(barcodeDiv);
    });

    previewLabel.appendChild(barcodeDiv);
    
    // Cache design configuration after adding barcode
    setTimeout(() => cacheDesignConfiguration(), 100);

    // Position and generate barcode content (same as Step 2 logic)
    let barcodeConfig = appState.labelSettings.elements.barcode;
    if (!barcodeConfig) {
        barcodeConfig = getDefaultElementConfig('barcode');
        appState.labelSettings.elements.barcode = barcodeConfig;
    }
    updateElementPosition(barcodeDiv, barcodeConfig);

    // Generate barcode using Step 2's logic
    if (appState.mappedColumns.barcode && appState.excelData.length > 0) {
        const sampleBarcode = appState.excelData[0][appState.mappedColumns.barcode.index];
        if (sampleBarcode) {
            try {
                JsBarcode(svg, sampleBarcode, {
                    format: appState.labelSettings.barcodeType,
                    width: 2,
                    height: 50,
                    displayValue: false
                });
                barcodeNumber.textContent = sampleBarcode;
            } catch (error) {
                svg.innerHTML = '<text>Invalid barcode</text>';
                barcodeNumber.textContent = 'Invalid Data';
            }
        }
    } else {
        svg.innerHTML = '';
        barcodeNumber.textContent = getSampleBarcodeData(appState.labelSettings.barcodeType);
    }

    // Create individual text elements for each mapped column (like Step 2 but draggable)
    if (appState.mappedColumns.text.length > 0 && appState.excelData.length > 0) {
        appState.mappedColumns.text.forEach((column, index) => {
            const textDiv = document.createElement('div');
            textDiv.className = 'preview-text';
            textDiv.id = `element-text-${index}`;
            textDiv.dataset.elementId = `text-${index}`;

            // Set content using Step 2's logic
            const value = appState.excelData[0][column.index];
            textDiv.textContent = value ? value.toString() : column.name;

            // Add drag functionality
            textDiv.addEventListener('mousedown', handleElementMouseDown);
            textDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                selectElement(textDiv);
            });
            
            // Ensure element is properly styled for dragging
            textDiv.style.cursor = 'move';
            textDiv.style.userSelect = 'none';
            
            console.log('Created draggable text element:', `text-${index}`, textDiv);

            previewLabel.appendChild(textDiv);
            
            // Cache design configuration after adding text element
            setTimeout(() => cacheDesignConfiguration(), 100);

            // Position element
            let textConfig = appState.labelSettings.elements[`text-${index}`];
            if (!textConfig) {
                textConfig = getDefaultElementConfig(`text-${index}`);
                appState.labelSettings.elements[`text-${index}`] = textConfig;
            }
            updateElementPosition(textDiv, textConfig);
        });
    } else if (appState.mappedColumns.text.length > 0) {
        // Handle case where we have mapped columns but no data yet
        appState.mappedColumns.text.forEach((column, index) => {
            const textDiv = document.createElement('div');
            textDiv.className = 'preview-text';
            textDiv.id = `element-text-${index}`;
            textDiv.dataset.elementId = `text-${index}`;
            textDiv.textContent = column.name;

            textDiv.addEventListener('mousedown', handleElementMouseDown);
            textDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                selectElement(textDiv);
            });
            
            // Ensure element is properly styled for dragging
            textDiv.style.cursor = 'move';
            textDiv.style.userSelect = 'none';
            
            console.log('Created draggable text element (no data):', `text-${index}`, textDiv);

            previewLabel.appendChild(textDiv);
            
            // Cache design configuration after adding text element
            setTimeout(() => cacheDesignConfiguration(), 100);

            let textConfig = appState.labelSettings.elements[`text-${index}`];
            if (!textConfig) {
                textConfig = getDefaultElementConfig(`text-${index}`);
                appState.labelSettings.elements[`text-${index}`] = textConfig;
            }
            updateElementPosition(textDiv, textConfig);
        });
    }

    // Add static text elements
    appState.labelSettings.staticTexts.forEach((staticText, index) => {
        const staticDiv = document.createElement('div');
        staticDiv.className = 'preview-static';
        staticDiv.id = `element-static-${index}`;
        staticDiv.dataset.elementId = `static-${index}`;
        staticDiv.textContent = staticText.text;

        staticDiv.addEventListener('mousedown', handleElementMouseDown);
        staticDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            selectElement(staticDiv);
        });

        previewLabel.appendChild(staticDiv);
        
        // Cache design configuration after adding static element
        setTimeout(() => cacheDesignConfiguration(), 100);

        let staticConfig = appState.labelSettings.elements[`static-${index}`];
        if (!staticConfig) {
            staticConfig = getDefaultElementConfig(`static-${index}`);
            appState.labelSettings.elements[`static-${index}`] = staticConfig;
        }
        updateElementPosition(staticDiv, staticConfig);
    });
}

function getBarcodeImageUrl(barcodeType) {
    // Return static barcode image URLs for preview
    const baseUrl = 'https://via.placeholder.com/200x40/000000/FFFFFF?text=';
    switch (barcodeType) {
        case 'EAN13':
            return `${baseUrl}EAN-13+BARCODE`;
        case 'CODE128':
            return `${baseUrl}CODE+128+BARCODE`;
        case 'CODE39':
            return `${baseUrl}CODE+39+BARCODE`;
        case 'UPC':
            return `${baseUrl}UPC-A+BARCODE`;
        case 'ITF':
            return `${baseUrl}ITF-14+BARCODE`;
        default:
            return `${baseUrl}SAMPLE+BARCODE`;
    }
}

function getSampleBarcodeData(barcodeType) {
    switch (barcodeType) {
        case 'EAN13':
            return '1234567890123';
        case 'CODE128':
            return 'SAMPLE123';
        case 'CODE39':
            return 'SAMPLE';
        case 'UPC':
            return '123456789012';
        case 'ITF':
            return '12345678901234';
        default:
            return '1234567890123';
    }
}

function getExampleBarcodeData(barcodeType) {
    // Return appropriate example barcode data based on type
    switch (barcodeType) {
        case 'EAN13':
            return '1234567890123'; // 13-digit EAN-13
        case 'CODE128':
            return 'SAMPLE123'; // Alphanumeric Code 128
        case 'CODE39':
            return 'SAMPLE'; // Alphanumeric Code 39
        case 'UPC':
            return '123456789012'; // 12-digit UPC-A
        case 'ITF':
            return '12345678901234'; // 14-digit ITF-14
        default:
            return '1234567890123';
    }
}

function validateBarcodeData(data, barcodeType) {
    if (!data || typeof data !== 'string') {
        return false;
    }
    
    switch (barcodeType) {
        case 'EAN13':
            return /^\d{13}$/.test(data);
        case 'UPC':
            return /^\d{12}$/.test(data);
        case 'ITF':
            return /^\d{14}$/.test(data);
        case 'CODE128':
        case 'CODE39':
            return data.length > 0 && data.length <= 50;
        default:
            return data.length > 0;
    }
}

function getBarcodeOptions(barcodeType) {
    const baseOptions = {
        width: 2,
        height: 50,
        margin: 10
    };
    
    switch (barcodeType) {
        case 'EAN13':
            return {
                ...baseOptions,
                format: 'EAN13',
                displayValue: true,
                fontSize: 12,
                textMargin: 2
            };
        case 'CODE128':
            return {
                ...baseOptions,
                format: 'CODE128',
                displayValue: true,
                fontSize: 12,
                textMargin: 2
            };
        case 'CODE39':
            return {
                ...baseOptions,
                format: 'CODE39',
                displayValue: true,
                fontSize: 12,
                textMargin: 2
            };
        case 'UPC':
            return {
                ...baseOptions,
                format: 'UPC',
                displayValue: true,
                fontSize: 12,
                textMargin: 2
            };
        case 'ITF':
            return {
                ...baseOptions,
                format: 'ITF',
                displayValue: true,
                fontSize: 12,
                textMargin: 2
            };
        default:
            return {
                ...baseOptions,
                format: 'EAN13',
                displayValue: true,
                fontSize: 12,
                textMargin: 2
            };
    }
}

// Quantity Management
function setupQuantityManagement() {
    updateQuantitySummary();
    setupManualQuantities();
}

function handleQuantityTypeChange(e) {
    const type = e.target.value;
    appState.quantitySettings.type = type;
    
    const manualQuantities = document.getElementById('manual-quantities');
    if (type === 'manual') {
        manualQuantities.classList.remove('hidden');
        setupManualQuantities();
    } else {
        manualQuantities.classList.add('hidden');
    }
    
    updateQuantitySummary();
}

function setupManualQuantities() {
    if (!appState.excelData || appState.excelData.length === 0) {
        return;
    }
    
    const tbody = document.getElementById('quantities-body');
    tbody.innerHTML = '';
    
    appState.excelData.forEach((row, index) => {
        // Skip rows with blank or 0 quantity if quantity column is mapped
        if (appState.mappedColumns.quantity) {
            const qty = parseInt(row[appState.mappedColumns.quantity.index]);
            if (!qty || qty <= 0) {
                return; // Skip this row
            }
        }
        const tr = document.createElement('tr');
        
        // Product info
        const productInfo = appState.mappedColumns.text.map(col => row[col.index]).join(' | ');
        const barcode = appState.mappedColumns.barcode ? row[appState.mappedColumns.barcode.index] : '';
        
        tr.innerHTML = `
            <td>${productInfo || 'Product ' + (index + 1)}</td>
            <td>${barcode || 'N/A'}</td>
            <td>
                <input type="number" class="quantity-input" 
                       value="${appState.quantitySettings.manualQuantities[index] || 1}" 
                       min="1" max="1000" 
                       onchange="updateManualQuantity(${index}, this.value)">
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

function updateManualQuantity(index, value) {
    appState.quantitySettings.manualQuantities[index] = parseInt(value) || 1;
    updateQuantitySummary();
}

function updateQuantitySummary() {
    if (!appState.excelData || appState.excelData.length === 0) {
        return;
    }
    
    const totalProducts = appState.excelData.length;
    let totalLabels = 0;
    
    switch (appState.quantitySettings.type) {
        case 'column':
            if (appState.mappedColumns.quantity) {
                totalLabels = appState.excelData.reduce((sum, row) => {
                    const qty = parseInt(row[appState.mappedColumns.quantity.index]);
                    // Skip rows with blank, 0, or invalid quantity
                    if (!qty || qty <= 0) {
                        return sum;
                    }
                    return sum + qty;
                }, 0);
            } else {
                totalLabels = totalProducts; // Default to 1 per product
            }
            break;
            
        case 'manual':
            totalLabels = Object.values(appState.quantitySettings.manualQuantities)
                .reduce((sum, qty) => sum + (qty || 1), 0);
            break;
            
        case 'fixed':
            const fixedQty = parseInt(document.getElementById('fixed-quantity').value) || 1;
            totalLabels = totalProducts * fixedQty;
            break;
    }
    
    // Estimate pages (assuming 30 labels per page for standard size)
    const labelsPerPage = 30;
    const estimatedPages = Math.ceil(totalLabels / labelsPerPage);
    
    document.getElementById('summary-products').textContent = totalProducts.toLocaleString();
    document.getElementById('summary-labels').textContent = totalLabels.toLocaleString();
    document.getElementById('summary-pages').textContent = estimatedPages.toLocaleString();
}

// Final Summary
function updateFinalSummary() {
    if (!appState.excelData || appState.excelData.length === 0) {
        return;
    }
    
    const fileName = document.getElementById('file-name').textContent;
    const totalProducts = appState.excelData.length;
    
    // Calculate total labels
    let totalLabels = 0;
    switch (appState.quantitySettings.type) {
        case 'column':
            if (appState.mappedColumns.quantity) {
                totalLabels = appState.excelData.reduce((sum, row) => {
                    const qty = parseInt(row[appState.mappedColumns.quantity.index]);
                    // Skip rows with blank, 0, or invalid quantity
                    if (!qty || qty <= 0) {
                        return sum;
                    }
                    return sum + qty;
                }, 0);
            } else {
                totalLabels = totalProducts;
            }
            break;
        case 'manual':
            totalLabels = Object.values(appState.quantitySettings.manualQuantities)
                .reduce((sum, qty) => sum + (qty || 1), 0);
            break;
        case 'fixed':
            const fixedQty = parseInt(document.getElementById('fixed-quantity').value) || 1;
            totalLabels = totalProducts * fixedQty;
            break;
    }
    
    const labelSize = appState.labelSettings.size === 'custom' 
        ? `${appState.labelSettings.customWidth}" x ${appState.labelSettings.customHeight}"`
        : appState.labelSettings.size;
    
    document.getElementById('final-file-name').textContent = fileName;
    document.getElementById('final-products').textContent = totalProducts.toLocaleString();
    document.getElementById('final-labels').textContent = totalLabels.toLocaleString();
    document.getElementById('final-size').textContent = labelSize;
    document.getElementById('final-barcode-type').textContent = appState.labelSettings.barcodeType;
}

// Label Generation
async function generateLabels() {
    if (!appState.excelData || appState.excelData.length === 0) {
        showError('No data', 'Please upload and process an Excel file first');
        return;
    }
    
    if (!appState.mappedColumns.barcode) {
        showError('Missing mapping', 'Please map a barcode column before generating labels');
        return;
    }
    
    showProgress('Generating labels...');
    appState.generatedLabels = [];
    
    let processedCount = 0;
    const totalProducts = appState.excelData.length;
    
    // Process each row
    appState.excelData.forEach((row, index) => {
        const barcode = row[appState.mappedColumns.barcode.index];
        if (!barcode) return;
        
        // Get text fields
        const textFields = appState.mappedColumns.text.map(col => row[col.index]).filter(text => text);
        
        // Get quantity
        let quantity = 1;
        switch (appState.quantitySettings.type) {
            case 'column':
                if (appState.mappedColumns.quantity) {
                    const qty = parseInt(row[appState.mappedColumns.quantity.index]);
                    // Skip rows with blank, 0, or invalid quantity
                    if (!qty || qty <= 0) {
                        return; // Skip this row entirely
                    }
                    quantity = qty;
                }
                break;
            case 'manual':
                quantity = appState.quantitySettings.manualQuantities[index] || 1;
                break;
            case 'fixed':
                quantity = parseInt(document.getElementById('fixed-quantity').value) || 1;
                break;
        }
        
        // Generate labels for this product
        for (let i = 0; i < quantity; i++) {
            // Create individual text elements
            const textElements = appState.mappedColumns.text.map(col => ({
                text: row[col.index] ? row[col.index].toString() : '',
                columnName: col.name,
                columnIndex: col.index
            }));
            
            const label = {
                barcode: barcode.toString(),
                text: textFields.join(' | '),
                textElements: textElements,
                staticTexts: appState.labelSettings.staticTexts,
                barcodeType: appState.labelSettings.barcodeType,
                size: appState.labelSettings.size,
                customWidth: appState.labelSettings.customWidth,
                customHeight: appState.labelSettings.customHeight,
                fontSize: appState.labelSettings.fontSize,
                spacing: appState.labelSettings.spacing,
                textLayout: appState.labelSettings.textLayout,
                textGap: appState.labelSettings.textGap,
                elements: appState.labelSettings.elements
            };
            
            appState.generatedLabels.push(label);
        }
        
        processedCount++;
        updateGenerationProgress(processedCount, totalProducts);
    });
    
    hideProgress();
    document.getElementById('download-section').classList.remove('hidden');
}

function updateGenerationProgress(processed, total) {
    const percentage = (processed / total) * 100;
    const progressFill = document.getElementById('generation-progress-fill');
    const statusText = document.getElementById('generation-status');
    
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
    
    if (statusText) {
        statusText.textContent = `Processing ${processed} of ${total} products...`;
    }
}

// Export Functions
function createLabelCanvas(label) {
    console.log('Creating label canvas for:', label);
    
    // Load cached design configuration
    const designCache = appState.designCache || JSON.parse(localStorage.getItem('labelDesignCache') || '{}');
    console.log('Using cached design configuration:', designCache);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size based on label size (300 DPI for high quality)
    const dpi = 300;
    const width = appState.labelSettings.size === 'custom' 
        ? appState.labelSettings.customWidth * dpi 
        : LABEL_SIZES[appState.labelSettings.size].width * dpi;
    const height = appState.labelSettings.size === 'custom' 
        ? appState.labelSettings.customHeight * dpi 
        : LABEL_SIZES[appState.labelSettings.size].height * dpi;
    
    canvas.width = width;
    canvas.height = height;
    
    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Add border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
    
    // Convert design coordinates (96 DPI) to canvas coordinates (300 DPI)
    const scaleFactor = dpi / DISPLAY_DPI; // 300 / 96 = 3.125
    
    // Render barcode element from cached design
    renderBarcodeFromDesign(ctx, label, designCache, scaleFactor);
    
    // Render text elements from cached design
    renderTextElementsFromDesign(ctx, label, designCache, scaleFactor);
    
    // Render static text elements from cached design
    renderStaticElementsFromDesign(ctx, label, designCache, scaleFactor);
    
    console.log('Canvas created successfully:', canvas);
    return canvas;
}

// Helper function to convert design coordinates to canvas coordinates
function convertDesignToCanvas(designX, designY, designWidth, designHeight, scaleFactor) {
    return {
        x: (parseFloat(designX) || 0) * scaleFactor,
        y: (parseFloat(designY) || 0) * scaleFactor,
        width: (parseFloat(designWidth) || 0) * scaleFactor,
        height: (parseFloat(designHeight) || 0) * scaleFactor
    };
}

// Render barcode element using cached design configuration
function renderBarcodeFromDesign(ctx, label, designCache, scaleFactor) {
    let position;
    let fontSize = '16px';
    
    // Try to get barcode element from DOM first
    const barcodeElement = document.getElementById('element-barcode');
    if (barcodeElement) {
        const computedStyle = window.getComputedStyle(barcodeElement);
        position = convertDesignToCanvas(
            computedStyle.left,
            computedStyle.top,
            computedStyle.width,
            computedStyle.height,
            scaleFactor
        );
        fontSize = computedStyle.fontSize;
    } else if (designCache.barcodeElement) {
        // Fallback to cached design
        const cached = designCache.barcodeElement;
        position = convertDesignToCanvas(
            cached.left,
            cached.top,
            cached.width,
            cached.height,
            scaleFactor
        );
        fontSize = cached.fontSize;
    } else {
        // Final fallback to default position
        const labelWidth = appState.labelSettings.size === 'custom' 
            ? appState.labelSettings.customWidth 
            : LABEL_SIZES[appState.labelSettings.size].width;
        position = convertDesignToCanvas(
            '0.1in',
            '0.1in',
            `${labelWidth - 0.2}in`,
            '0.4in',
            scaleFactor
        );
    }
    
    try {
        const barcodeCanvas = document.createElement('canvas');
        const displayValue = label.barcodeType === 'EAN13';
        JsBarcode(barcodeCanvas, label.barcode, {
            format: label.barcodeType,
            width: 2,
            height: 50,
            displayValue: displayValue
        });
        
        // Draw barcode at cached position
        ctx.drawImage(barcodeCanvas, position.x, position.y, position.width, position.height);
        
        // Add barcode number if not displayed in barcode
        if (!displayValue) {
            ctx.fillStyle = '#000000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label.barcode, position.x + (position.width / 2), position.y + position.height + 15);
        }
    } catch (error) {
        ctx.fillStyle = '#000000';
        ctx.font = fontSize;
        ctx.textAlign = 'center';
        ctx.fillText('Invalid barcode', 
            position.x + (position.width / 2),
            position.y + (position.height / 2));
    }
}

// Render text elements using cached design configuration
function renderTextElementsFromDesign(ctx, label, designCache, scaleFactor) {
    if (!label.textElements || label.textElements.length === 0) return;
    
    // Try to get text elements from DOM first
    const textElements = document.querySelectorAll('[id^="element-text-"]');
    
    label.textElements.forEach((textElement, index) => {
        let position;
        let fontSize = '10px';
        let textAlign = 'center';
        
        if (textElements[index]) {
            // Use live DOM element
            const computedStyle = window.getComputedStyle(textElements[index]);
            position = convertDesignToCanvas(
                computedStyle.left,
                computedStyle.top,
                computedStyle.width,
                computedStyle.height,
                scaleFactor
            );
            fontSize = computedStyle.fontSize;
            textAlign = computedStyle.textAlign || 'center';
        } else if (designCache.textElements && designCache.textElements[index]) {
            // Fallback to cached design
            const cached = designCache.textElements[index];
            position = convertDesignToCanvas(
                cached.left,
                cached.top,
                cached.width,
                cached.height,
                scaleFactor
            );
            fontSize = cached.fontSize;
            textAlign = cached.textAlign || 'center';
        } else {
            // Final fallback to default position
            const labelWidth = appState.labelSettings.size === 'custom' 
                ? appState.labelSettings.customWidth 
                : LABEL_SIZES[appState.labelSettings.size].width;
            position = convertDesignToCanvas(
                '0.1in',
                `${0.6 + (index * 0.15)}in`,
                `${labelWidth - 0.2}in`,
                '0.1in',
                scaleFactor
            );
        }
        
        // Apply element-specific styling
        ctx.fillStyle = '#000000';
        ctx.font = `${fontSize} Arial`;
        ctx.textAlign = textAlign;
        
        // Calculate text position (center of element)
        const textX = position.x + (position.width / 2);
        const textY = position.y + (position.height / 2) + (parseFloat(fontSize) / 3);
        
        // Draw text
        ctx.fillText(textElement.text, textX, textY);
    });
}

// Render static text elements using cached design configuration
function renderStaticElementsFromDesign(ctx, label, designCache, scaleFactor) {
    if (!label.staticTexts || label.staticTexts.length === 0) return;
    
    // Try to get static elements from DOM first
    const staticElements = document.querySelectorAll('[id^="element-static-"]');
    
    label.staticTexts.forEach((staticText, index) => {
        let position;
        let fontSize = '8px';
        let textAlign = 'center';
        
        if (staticElements[index]) {
            // Use live DOM element
            const computedStyle = window.getComputedStyle(staticElements[index]);
            position = convertDesignToCanvas(
                computedStyle.left,
                computedStyle.top,
                computedStyle.width,
                computedStyle.height,
                scaleFactor
            );
            fontSize = computedStyle.fontSize;
            textAlign = computedStyle.textAlign || 'center';
        } else if (designCache.staticElements && designCache.staticElements[index]) {
            // Fallback to cached design
            const cached = designCache.staticElements[index];
            position = convertDesignToCanvas(
                cached.left,
                cached.top,
                cached.width,
                cached.height,
                scaleFactor
            );
            fontSize = cached.fontSize;
            textAlign = cached.textAlign || 'center';
        } else {
            // Final fallback to default position
            const labelWidth = appState.labelSettings.size === 'custom' 
                ? appState.labelSettings.customWidth 
                : LABEL_SIZES[appState.labelSettings.size].width;
            position = convertDesignToCanvas(
                '0.1in',
                `${0.8 + (index * 0.1)}in`,
                `${labelWidth - 0.2}in`,
                '0.1in',
                scaleFactor
            );
        }
        
        // Apply element-specific styling
        ctx.fillStyle = '#000000';
        ctx.font = `${fontSize} Arial`;
        ctx.textAlign = textAlign;
        
        // Calculate text position (center of element)
        const textX = position.x + (position.width / 2);
        const textY = position.y + (position.height / 2) + (parseFloat(fontSize) / 3);
        
        // Draw text
        ctx.fillText(staticText.text, textX, textY);
    });
}


function createFallbackBlob(canvas, width, height) {
    console.log('createFallbackBlob: Creating fallback blob...');
    // Create a simple canvas-based fallback
    const canvasElement = document.createElement('canvas');
    canvasElement.width = width;
    canvasElement.height = height;
    const ctx = canvasElement.getContext('2d');
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Add a simple text indicating this is a fallback
    ctx.fillStyle = '#000000';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Label Preview', width / 2, height / 2);
    ctx.fillText('(Fallback Mode)', width / 2, height / 2 + 30);
    
    return new Promise(resolve => canvasElement.toBlob(resolve, 'image/png', 1.0));
}

// Test function to help debug export issues
function testExport() {
    console.log('=== EXPORT TEST ===');
    console.log('jsPDF available:', typeof window.jspdf !== 'undefined');
    console.log('JSZip available:', typeof JSZip !== 'undefined');
    console.log('html2canvas available:', typeof html2canvas !== 'undefined');
    console.log('Generated labels count:', appState.generatedLabels.length);
    console.log('Offscreen renderer exists:', !!document.getElementById('offscreen-renderer'));
    
    if (appState.generatedLabels.length > 0) {
        console.log('First label structure:', appState.generatedLabels[0]);
    }
    console.log('=== END TEST ===');
}

function showPageSizeSelection() {
    const pageSizeSelection = document.getElementById('page-size-selection');
    pageSizeSelection.style.display = 'block';
    
    // Check if PDF button already exists
    const existingPdfBtn = document.getElementById('generate-pdf-btn');
    if (!existingPdfBtn) {
        // Add generate PDF button
        const generatePdfBtn = document.createElement('button');
        generatePdfBtn.id = 'generate-pdf-btn';
        generatePdfBtn.className = 'btn btn-primary btn-large';
        generatePdfBtn.innerHTML = '<span class="btn-icon">📄</span> Generate PDF';
        generatePdfBtn.onclick = downloadPDF;
        
        const downloadOptions = document.querySelector('.download-options');
        downloadOptions.appendChild(generatePdfBtn);
    }
}

function downloadPDF() {
    console.log('Starting PDF download, labels count:', appState.generatedLabels.length);
    
    if (appState.generatedLabels.length === 0) {
        showError('No labels', 'Please generate labels first');
        return;
    }
    
    showProgress('Creating PDF...');
    
    try {
        const { jsPDF } = window.jspdf;
        
        // Get selected page size
        const selectedPageSize = document.querySelector('input[name="page-size"]:checked').value;

        let pageSize, orientation;
        
        switch (selectedPageSize) {
            case 'letter':
                pageSize = 'letter';
                orientation = 'p';
                break;
            case 'legal':
                pageSize = 'legal';
                orientation = 'p';
                break;
            case 'a4':
            default:
                pageSize = 'a4';
                orientation = 'p';
                break;
        }
        
        const doc = new jsPDF(orientation, 'mm', pageSize);
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        const usableWidth = pageWidth - (margin * 2);
        const usableHeight = pageHeight - (margin * 2);
        
        // Calculate label dimensions in mm (convert inches to mm)
        const labelWidth = appState.labelSettings.size === 'custom' 
            ? appState.labelSettings.customWidth * 25.4 
            : LABEL_SIZES[appState.labelSettings.size].width * 25.4;
        const labelHeight = appState.labelSettings.size === 'custom' 
            ? appState.labelSettings.customHeight * 25.4 
            : LABEL_SIZES[appState.labelSettings.size].height * 25.4;
        
        // Calculate grid
        const labelsPerRow = Math.floor(usableWidth / labelWidth);
        const labelsPerCol = Math.floor(usableHeight / labelHeight);
        const labelsPerPage = labelsPerRow * labelsPerCol;
        
        let currentPage = 0;
        let currentRow = 0;
        let currentCol = 0;
        
        // Process labels sequentially
        for (let index = 0; index < appState.generatedLabels.length; index++) {
            const label = appState.generatedLabels[index];
            
            if (index > 0 && index % labelsPerPage === 0) {
                doc.addPage();
                currentPage++;
                currentRow = 0;
                currentCol = 0;
            }
            
            const x = margin + (currentCol * labelWidth);
            const y = margin + (currentRow * labelHeight);
            
            // Draw label border
            doc.rect(x, y, labelWidth, labelHeight);
            
            // Create canvas for this label
            const canvas = createLabelCanvas(label);
            const imageDataURL = canvas.toDataURL('image/png');
            
            // Add the canvas image to PDF
            doc.addImage(imageDataURL, 'PNG', x, y, labelWidth, labelHeight);
            
            // Update position
            currentCol++;
            if (currentCol >= labelsPerRow) {
                currentCol = 0;
                currentRow++;
            }
        }
        
        doc.save('barcode-labels.pdf');
        hideProgress();
        
    } catch (error) {
        console.error('PDF generation error:', error);
        showError('PDF Error', 'There was an error generating the PDF file');
        hideProgress();
    }
}

function downloadZIP() {
    console.log('Starting ZIP download, labels count:', appState.generatedLabels.length);
    
    if (appState.generatedLabels.length === 0) {
        showError('No labels', 'Please generate labels first');
        return;
    }
    
    showProgress('Creating ZIP file...');
    
    try {
        const zip = new JSZip();
        let processedCount = 0;
        
        // Process labels sequentially
        const processLabels = async () => {
            for (let i = 0; i < appState.generatedLabels.length; i++) {
                try {
                    const label = appState.generatedLabels[i];
                    const canvas = createLabelCanvas(label);
                    const blob = await new Promise((resolve) => {
                        canvas.toBlob(resolve, 'image/png');
                    });
                    zip.file(`label-${i + 1}.png`, blob);
                } catch (error) {
                    console.error(`Error creating label ${i + 1}:`, error);
                }
            }
            
            // Generate and download ZIP
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'barcode-labels.zip';
            a.click();
            URL.revokeObjectURL(url);
            hideProgress();
        };
        
        processLabels();
        
    } catch (error) {
        console.error('ZIP generation error:', error);
        showError('ZIP Error', 'There was an error generating the ZIP file');
        hideProgress();
    }
}

// UI Helper Functions
function showProgress(message) {
    const progress = document.getElementById('generation-progress');
    const status = document.getElementById('generation-status');
    
    if (progress) {
        progress.classList.remove('hidden');
    }
    
    if (status) {
        status.textContent = message;
    }
}

function hideProgress() {
    const progress = document.getElementById('generation-progress');
    if (progress) {
        progress.classList.add('hidden');
    }
}

function showError(title, message) {
    const modal = document.getElementById('error-modal');
    const titleEl = document.getElementById('error-title');
    const messageEl = document.getElementById('error-message');
    
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    if (modal) modal.classList.remove('hidden');
}

function closeErrorModal() {
    const modal = document.getElementById('error-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Font size classes
const style = document.createElement('style');
style.textContent = `
    .font-small { font-size: 8px; }
    .font-medium { font-size: 10px; }
    .font-large { font-size: 12px; }
`;
document.head.appendChild(style);

// Drag and Drop for Element Tree
let draggedElementId = null;

function handleTreeDragStart(e, id) {
    e.stopPropagation();
    draggedElementId = id;
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
}

function handleTreeDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Provide visual feedback
    const targetItem = e.currentTarget.closest('.tree-item');
    if (targetItem) {
        targetItem.classList.add('drag-over');
    }
}

function handleTreeDragLeave(e) {
    e.stopPropagation();
    const targetItem = e.currentTarget.closest('.tree-item');
    if (targetItem) {
        targetItem.classList.remove('drag-over');
    }
}

function handleTreeDrop(e, targetId) {
    e.preventDefault();
    e.stopPropagation();
    
    const targetItem = e.currentTarget.closest('.tree-item');
    if (targetItem) {
        targetItem.classList.remove('drag-over');
    }

    if (!draggedElementId || draggedElementId === targetId) {
        return;
    }

    const draggedElement = getElementById(draggedElementId);
    const targetElement = getElementById(targetId);

    if (!draggedElement || !targetElement || draggedElement.id === 'root') {
        return; // Cannot move root or invalid elements
    }

    // Prevent dropping an element into its own descendant
    let current = targetElement;
    while (current) {
        if (current.id === draggedElement.id) {
            showError('Invalid Move', 'Cannot move an element into one of its own children.');
            return;
        }
        current = getElementById(current.parent);
    }
    
    // Remove from old parent
    const oldParent = getElementById(draggedElement.parent);
    if (oldParent) {
        oldParent.children = oldParent.children.filter(id => id !== draggedElement.id);
    }

    // Add to new parent (if target is a container) or as sibling
    if (targetElement.type === 'container') {
        targetElement.children.push(draggedElement.id);
        draggedElement.parent = targetElement.id;
    } else {
        // Insert as sibling after the target
        const newParent = getElementById(targetElement.parent);
        if (newParent) {
            const targetIndex = newParent.children.indexOf(targetId);
            newParent.children.splice(targetIndex + 1, 0, draggedElement.id);
            draggedElement.parent = newParent.id;
        }
    }

    draggedElementId = null;
    
    // Re-render everything
    renderCanvas();
    renderElementTree();
}