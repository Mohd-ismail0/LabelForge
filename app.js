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
        barcodeType.addEventListener('change', updateDesignPreview);
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
            break;
        case 3:
            updateDesignPreview();
            break;
        case 4:
            setupQuantityManagement();
            break;
        case 5:
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
        continueBtn.disabled = appState.mappedColumns.barcode === null;
    }
}

// Label Design
function setupLabelDesign() {
    // Initialize with default values
    initializeLabelDesigner();
    updateDesignPreview();
}

// Global variables for drag and drop
let selectedElement = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let isResizing = false;
let resizeHandle = null;
let gridVisible = false;

function initializeLabelDesigner() {
    const previewLabel = document.getElementById('design-preview-label');
    const previewGrid = document.getElementById('preview-grid');
    
    // Add design mode class
    previewLabel.classList.add('design-mode');
    
    // Setup event listeners for drag and drop
    setupDragAndDrop();
    
    // Initialize static text management
    initializeStaticTextManager();
    
    // Setup element property controls
    setupElementPropertyControls();
    
    // Create initial elements
    createLabelElements();
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
}

function createLabelElements() {
    const previewLabel = document.getElementById('design-preview-label');
    previewLabel.innerHTML = '';
    
    // Create barcode element with proper preview
    createBarcodeElement();
    
    // Create text container with individual text elements
    createTextContainer();
    
    // Create static text elements
    appState.labelSettings.staticTexts.forEach((staticText, index) => {
        createStaticTextElement(index, staticText);
    });
}

function createBarcodeElement() {
    const previewLabel = document.getElementById('design-preview-label');
    const barcodeElement = document.createElement('div');
    barcodeElement.className = 'preview-barcode';
    barcodeElement.id = 'element-barcode';
    barcodeElement.dataset.elementId = 'barcode';
    
    // Create barcode container
    const barcodeContainer = document.createElement('div');
    barcodeContainer.className = 'barcode-container';
    
    // Create SVG for barcode
    const svg = document.createElement('svg');
    svg.id = 'design-preview-barcode';
    svg.className = 'barcode-svg';
    
    // Create barcode number display
    const barcodeNumber = document.createElement('div');
    barcodeNumber.className = 'barcode-number';
    barcodeNumber.id = 'barcode-number-display';
    
    barcodeContainer.appendChild(svg);
    barcodeContainer.appendChild(barcodeNumber);
    barcodeElement.appendChild(barcodeContainer);
    
    // Set position and size
    const elementConfig = appState.labelSettings.elements.barcode || getDefaultElementConfig('barcode');
    updateElementPosition(barcodeElement, elementConfig);
    
    // Add event listeners
    barcodeElement.addEventListener('mousedown', handleElementMouseDown);
    barcodeElement.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(barcodeElement);
    });
    
    previewLabel.appendChild(barcodeElement);
}

function createTextContainer() {
    const previewLabel = document.getElementById('design-preview-label');
    const textContainer = document.createElement('div');
    textContainer.className = 'preview-text text-container';
    textContainer.id = 'element-textContainer';
    textContainer.dataset.elementId = 'textContainer';
    
    // Set layout direction
    textContainer.classList.add(appState.labelSettings.textLayout);
    textContainer.style.gap = `${appState.labelSettings.textGap}px`;
    
    // Create individual text elements for each mapped column
    if (appState.mappedColumns.text && appState.mappedColumns.text.length > 0) {
        appState.mappedColumns.text.forEach((column, index) => {
            const textElement = document.createElement('div');
            textElement.className = 'text-element';
            textElement.id = `text-element-${index}`;
            textElement.dataset.elementId = `text-${index}`;
            textElement.dataset.columnIndex = column.index;
            textElement.dataset.columnName = column.name;
            
            // Set sample text
            if (appState.excelData && appState.excelData.length > 0) {
                const sampleValue = appState.excelData[0][column.index];
                textElement.textContent = sampleValue ? sampleValue.toString() : column.name;
            } else {
                textElement.textContent = column.name;
            }
            
            // Add event listeners
            textElement.addEventListener('mousedown', handleElementMouseDown);
            textElement.addEventListener('click', (e) => {
                e.stopPropagation();
                selectElement(textElement);
            });
            
            textContainer.appendChild(textElement);
        });
    } else {
        // Default text element
        const textElement = document.createElement('div');
        textElement.className = 'text-element';
        textElement.id = 'text-element-default';
        textElement.dataset.elementId = 'text-default';
        textElement.textContent = 'Sample Product Information';
        
        textElement.addEventListener('mousedown', handleElementMouseDown);
        textElement.addEventListener('click', (e) => {
            e.stopPropagation();
            selectElement(textElement);
        });
        
        textContainer.appendChild(textElement);
    }
    
    // Set position and size
    const elementConfig = appState.labelSettings.elements.textContainer || getDefaultElementConfig('textContainer');
    updateElementPosition(textContainer, elementConfig);
    
    // Add event listeners for container
    textContainer.addEventListener('mousedown', handleElementMouseDown);
    textContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(textContainer);
    });
    
    previewLabel.appendChild(textContainer);
}

function createStaticTextElement(index, staticText) {
    const previewLabel = document.getElementById('design-preview-label');
    const staticElement = document.createElement('div');
    staticElement.className = 'preview-static';
    staticElement.id = `element-static-${index}`;
    staticElement.dataset.elementId = `static-${index}`;
    staticElement.textContent = staticText.text;
    
    // Set position and size
    const elementConfig = appState.labelSettings.elements[`static-${index}`] || getDefaultElementConfig(`static-${index}`);
    updateElementPosition(staticElement, elementConfig);
    
    // Add event listeners
    staticElement.addEventListener('mousedown', handleElementMouseDown);
    staticElement.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(staticElement);
    });
    
    previewLabel.appendChild(staticElement);
}

function createDraggableElement(id, content, className) {
    const previewLabel = document.getElementById('design-preview-label');
    const element = document.createElement('div');
    element.className = className;
    element.id = `element-${id}`;
    element.dataset.elementId = id;
    
    // Set content
    if (id === 'barcode') {
        const svg = document.createElement('svg');
        svg.id = 'design-preview-barcode';
        element.appendChild(svg);
    } else {
        element.textContent = content;
    }
    
    // Set position and size
    const elementConfig = appState.labelSettings.elements[id] || getDefaultElementConfig(id);
    updateElementPosition(element, elementConfig);
    
    // Add event listeners
    element.addEventListener('mousedown', handleElementMouseDown);
    element.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(element);
    });
    
    previewLabel.appendChild(element);
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
                return { x: 0.1, y: 0.9, width: labelWidth - 0.2, height: 0.1, fontSize: 8, align: 'center' };
            }
            return { x: 0.1, y: 0.9, width: labelWidth - 0.2, height: 0.1, fontSize: 8, align: 'center' };
    }
}

function updateElementPosition(element, config) {
    const labelWidth = appState.labelSettings.size === 'custom' 
        ? appState.labelSettings.customWidth 
        : LABEL_SIZES[appState.labelSettings.size].width;
    const labelHeight = appState.labelSettings.size === 'custom' 
        ? appState.labelSettings.customHeight 
        : LABEL_SIZES[appState.labelSettings.size].height;
    
    // Convert inches to pixels (assuming 100 DPI for preview)
    const dpi = 100;
    const x = config.x * dpi;
    const y = config.y * dpi;
    const width = config.width * dpi;
    const height = config.height * dpi;
    
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.fontSize = `${config.fontSize}px`;
    element.style.textAlign = config.align;
    
    // Update label size
    const previewLabel = document.getElementById('design-preview-label');
    previewLabel.style.width = `${labelWidth * dpi}px`;
    previewLabel.style.height = `${labelHeight * dpi}px`;
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
        
        // Convert pixels to inches
        const dpi = 100;
        const xInches = Math.max(0, Math.min(x / dpi, getLabelWidth() - getElementWidth(selectedElement)));
        const yInches = Math.max(0, Math.min(y / dpi, getLabelHeight() - getElementHeight(selectedElement)));
        
        selectedElement.style.left = `${xInches * dpi}px`;
        selectedElement.style.top = `${yInches * dpi}px`;
        
        // Update element config
        const elementId = selectedElement.dataset.elementId;
        if (appState.labelSettings.elements[elementId]) {
            appState.labelSettings.elements[elementId].x = xInches;
            appState.labelSettings.elements[elementId].y = yInches;
        }
        
        updateElementProperties();
    } else if (isResizing) {
        // Handle resizing
        const x = e.clientX - labelRect.left;
        const y = e.clientY - labelRect.top;
        
        const dpi = 100;
        const elementId = selectedElement.dataset.elementId;
        const config = appState.labelSettings.elements[elementId];
        
        if (config) {
            switch (resizeHandle) {
                case 'se':
                    config.width = Math.max(0.1, (x / dpi) - config.x);
                    config.height = Math.max(0.1, (y / dpi) - config.y);
                    break;
                case 'sw':
                    const newWidth = config.width + (config.x - (x / dpi));
                    const newX = Math.min(config.x + config.width - 0.1, x / dpi);
                    config.width = Math.max(0.1, newWidth);
                    config.x = newX;
                    config.height = Math.max(0.1, (y / dpi) - config.y);
                    break;
                case 'ne':
                    config.width = Math.max(0.1, (x / dpi) - config.x);
                    const newHeight = config.height + (config.y - (y / dpi));
                    const newY = Math.min(config.y + config.height - 0.1, y / dpi);
                    config.height = Math.max(0.1, newHeight);
                    config.y = newY;
                    break;
                case 'nw':
                    const newWidthNW = config.width + (config.x - (x / dpi));
                    const newXNW = Math.min(config.x + config.width - 0.1, x / dpi);
                    config.width = Math.max(0.1, newWidthNW);
                    config.x = newXNW;
                    const newHeightNW = config.height + (config.y - (y / dpi));
                    const newYNW = Math.min(config.y + config.height - 0.1, y / dpi);
                    config.height = Math.max(0.1, newHeightNW);
                    config.y = newYNW;
                    break;
            }
            
            updateElementPosition(selectedElement, config);
            updateElementProperties();
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

function selectElement(element) {
    deselectAllElements();
    element.classList.add('selected');
    selectedElement = element;
    
    // Show element properties
    showElementProperties(element);
    
    // Add resize handles
    addResizeHandles(element);
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
    return config ? config.width : 0.1;
}

function getElementHeight(element) {
    const config = appState.labelSettings.elements[element.dataset.elementId];
    return config ? config.height : 0.1;
}

// Static Text Management
function initializeStaticTextManager() {
    updateStaticTextList();
}

function addStaticTextField() {
    const text = prompt('Enter static text:');
    if (text && text.trim()) {
        const staticText = {
            id: Date.now(),
            text: text.trim(),
            x: 0.1,
            y: 0.9,
            width: 1.8,
            height: 0.1,
            fontSize: 8,
            align: 'center'
        };
        
        appState.labelSettings.staticTexts.push(staticText);
        
        // Add to elements config
        const elementId = `static-${appState.labelSettings.staticTexts.length - 1}`;
        appState.labelSettings.elements[elementId] = {
            x: staticText.x,
            y: staticText.y,
            width: staticText.width,
            height: staticText.height,
            fontSize: staticText.fontSize,
            align: staticText.align
        };
        
        updateStaticTextList();
        createLabelElements();
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
    createLabelElements();
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
        createLabelElements();
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
        appState.labelSettings.elements.text = getDefaultElementConfig('text');
        
        // Reset static text positions
        appState.labelSettings.staticTexts.forEach((staticText, index) => {
            const elementId = `static-${index}`;
            appState.labelSettings.elements[elementId] = getDefaultElementConfig(`static-${index}`);
        });
        
        createLabelElements();
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
    
    updateDesignPreview();
}

function handleCustomSizeChange() {
    const width = parseFloat(document.getElementById('custom-width').value) || 2;
    const height = parseFloat(document.getElementById('custom-height').value) || 1;
    
    appState.labelSettings.customWidth = width;
    appState.labelSettings.customHeight = height;
    
    updateDesignPreview();
}

function updateDesignPreview() {
    // Update barcode content with example barcodes
    const barcodeElement = document.getElementById('element-barcode');
    if (barcodeElement) {
        const svg = barcodeElement.querySelector('svg');
        const barcodeNumber = barcodeElement.querySelector('.barcode-number');
        
        if (svg) {
            // Get example barcode data based on selected type
            let barcodeData = getExampleBarcodeData(appState.labelSettings.barcodeType);
            
            // If we have mapped data, use the first row's barcode data
            if (appState.mappedColumns.barcode && appState.excelData.length > 0) {
                const sampleBarcode = appState.excelData[0][appState.mappedColumns.barcode.index];
                if (sampleBarcode && sampleBarcode.toString().length >= 8) {
                    barcodeData = sampleBarcode.toString();
                }
            }
            
            try {
                // Generate barcode with appropriate settings
                const barcodeOptions = getBarcodeOptions(appState.labelSettings.barcodeType);
                JsBarcode(svg, barcodeData, barcodeOptions);
                
                // Update barcode number display
                if (barcodeNumber) {
                    barcodeNumber.textContent = barcodeData;
                }
            } catch (error) {
                console.error('Barcode generation error:', error);
                svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="12">Invalid Barcode</text>';
                if (barcodeNumber) {
                    barcodeNumber.textContent = 'Invalid';
                }
            }
        }
    }
    
    // Update text elements in container
    if (appState.mappedColumns.text && appState.mappedColumns.text.length > 0) {
        appState.mappedColumns.text.forEach((column, index) => {
            const textElement = document.getElementById(`text-element-${index}`);
            if (textElement && appState.excelData && appState.excelData.length > 0) {
                const sampleValue = appState.excelData[0][column.index];
                textElement.textContent = sampleValue ? sampleValue.toString() : column.name;
            }
        });
    }
    
    // Update static text elements
    appState.labelSettings.staticTexts.forEach((staticText, index) => {
        const element = document.getElementById(`element-static-${index}`);
        if (element) {
            element.textContent = staticText.text;
        }
    });
    
    // Update label size
    const size = appState.labelSettings.size;
    const labelWidth = size === 'custom' ? appState.labelSettings.customWidth : LABEL_SIZES[size].width;
    const labelHeight = size === 'custom' ? appState.labelSettings.customHeight : LABEL_SIZES[size].height;
    
    // Update all element positions when size changes
    createLabelElements();
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
                    const qty = parseInt(row[appState.mappedColumns.quantity.index]) || 1;
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
                    const qty = parseInt(row[appState.mappedColumns.quantity.index]) || 1;
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
function generateLabels() {
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
                    quantity = parseInt(row[appState.mappedColumns.quantity.index]) || 1;
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
                columnName: col.name
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
function showPageSizeSelection() {
    const pageSizeSelection = document.getElementById('page-size-selection');
    pageSizeSelection.style.display = 'block';
    
    // Add generate PDF button
    const generatePdfBtn = document.createElement('button');
    generatePdfBtn.className = 'btn btn-primary btn-large';
    generatePdfBtn.innerHTML = '<span class="btn-icon">📄</span> Generate PDF';
    generatePdfBtn.onclick = downloadPDF;
    
    const downloadOptions = document.querySelector('.download-options');
    downloadOptions.appendChild(generatePdfBtn);
}

function downloadPDF() {
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
        
        appState.generatedLabels.forEach((label, index) => {
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
            
            // Add elements based on positioning
            const elements = label.elements || appState.labelSettings.elements;
            
            // Add barcode with number display
            if (elements.barcode) {
                try {
                    const canvas = document.createElement('canvas');
                    const displayValue = label.barcodeType === 'EAN13';
                    JsBarcode(canvas, label.barcode, {
                        format: label.barcodeType,
                        width: 2,
                        height: 30,
                        displayValue: displayValue
                    });
                    
                    const barcodeDataURL = canvas.toDataURL();
                    const barcodeX = x + (elements.barcode.x * 25.4);
                    const barcodeY = y + (elements.barcode.y * 25.4);
                    const barcodeWidth = elements.barcode.width * 25.4;
                    const barcodeHeight = elements.barcode.height * 25.4;
                    
                    doc.addImage(barcodeDataURL, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight);
                    
                    // Add barcode number if not displayed in barcode
                    if (!displayValue) {
                        doc.setFontSize(6);
                        doc.text(label.barcode, barcodeX + (barcodeWidth / 2), barcodeY + barcodeHeight + 3, { align: 'center' });
                    }
                } catch (error) {
                    doc.setFontSize(8);
                    doc.text('Invalid barcode', x + (elements.barcode.x * 25.4), y + (elements.barcode.y * 25.4) + 5);
                }
            }
            
            // Add product text elements
            if (label.textElements && label.textElements.length > 0) {
                label.textElements.forEach((textElement, index) => {
                    const elementId = `text-${index}`;
                    if (elements[elementId]) {
                        doc.setFontSize(elements[elementId].fontSize || 8);
                        doc.text(textElement.text, x + (elements[elementId].x * 25.4), y + (elements[elementId].y * 25.4) + 5, { 
                            maxWidth: elements[elementId].width * 25.4,
                            align: elements[elementId].align || 'left'
                        });
                    }
                });
            } else if (label.text && elements.textContainer) {
                // Fallback to single text element
                doc.setFontSize(elements.textContainer.fontSize || 8);
                doc.text(label.text, x + (elements.textContainer.x * 25.4), y + (elements.textContainer.y * 25.4) + 5, { 
                    maxWidth: elements.textContainer.width * 25.4,
                    align: elements.textContainer.align || 'left'
                });
            }
            
            // Add static texts
            if (label.staticTexts && label.staticTexts.length > 0) {
                label.staticTexts.forEach((staticText, index) => {
                    const elementId = `static-${index}`;
                    if (elements[elementId]) {
                        doc.setFontSize(elements[elementId].fontSize || 6);
                        doc.text(staticText.text, x + (elements[elementId].x * 25.4), y + (elements[elementId].y * 25.4) + 3, {
                            maxWidth: elements[elementId].width * 25.4,
                            align: elements[elementId].align || 'left'
                        });
                    }
                });
            }
            
            // Update position
            currentCol++;
            if (currentCol >= labelsPerRow) {
                currentCol = 0;
                currentRow++;
            }
        });
        
        doc.save('barcode-labels.pdf');
        hideProgress();
        
    } catch (error) {
        console.error('PDF generation error:', error);
        showError('PDF Error', 'There was an error generating the PDF file');
        hideProgress();
    }
}

function downloadZIP() {
    if (appState.generatedLabels.length === 0) {
        showError('No labels', 'Please generate labels first');
        return;
    }
    
    showProgress('Creating ZIP file...');
    
    try {
        const zip = new JSZip();
        let processedCount = 0;
        
        appState.generatedLabels.forEach((label, index) => {
            try {
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
                
                // Add elements based on positioning
                const elements = label.elements || appState.labelSettings.elements;
                
                // Add barcode with number display
                if (elements.barcode) {
                    try {
                        const barcodeCanvas = document.createElement('canvas');
                        const displayValue = label.barcodeType === 'EAN13';
                        JsBarcode(barcodeCanvas, label.barcode, {
                            format: label.barcodeType,
                            width: 3,
                            height: 60,
                            displayValue: displayValue
                        });
                        
                        const barcodeX = elements.barcode.x * dpi;
                        const barcodeY = elements.barcode.y * dpi;
                        const barcodeWidth = elements.barcode.width * dpi;
                        const barcodeHeight = elements.barcode.height * dpi;
                        
                        // Scale barcode to fit the element size
                        ctx.drawImage(barcodeCanvas, barcodeX, barcodeY, barcodeWidth, barcodeHeight);
                        
                        // Add barcode number if not displayed in barcode
                        if (!displayValue) {
                            ctx.fillStyle = '#000000';
                            ctx.font = '12px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText(label.barcode, barcodeX + (barcodeWidth / 2), barcodeY + barcodeHeight + 15);
                        }
                    } catch (error) {
                        ctx.fillStyle = '#000000';
                        ctx.font = `${elements.barcode.fontSize || 16}px Arial`;
                        ctx.textAlign = elements.barcode.align || 'center';
                        ctx.fillText('Invalid barcode', 
                            elements.barcode.x * dpi + (elements.barcode.width * dpi) / 2, 
                            elements.barcode.y * dpi + (elements.barcode.height * dpi) / 2);
                    }
                }
                
                // Add product text elements
                if (label.textElements && label.textElements.length > 0) {
                    label.textElements.forEach((textElement, index) => {
                        const elementId = `text-${index}`;
                        if (elements[elementId]) {
                            ctx.fillStyle = '#000000';
                            ctx.font = `${elements[elementId].fontSize || 14}px Arial`;
                            ctx.textAlign = elements[elementId].align || 'center';
                            ctx.fillText(textElement.text, 
                                elements[elementId].x * dpi + (elements[elementId].width * dpi) / 2, 
                                elements[elementId].y * dpi + (elements[elementId].height * dpi) / 2);
                        }
                    });
                } else if (label.text && elements.textContainer) {
                    // Fallback to single text element
                    ctx.fillStyle = '#000000';
                    ctx.font = `${elements.textContainer.fontSize || 14}px Arial`;
                    ctx.textAlign = elements.textContainer.align || 'center';
                    ctx.fillText(label.text, 
                        elements.textContainer.x * dpi + (elements.textContainer.width * dpi) / 2, 
                        elements.textContainer.y * dpi + (elements.textContainer.height * dpi) / 2);
                }
                
                // Add static texts
                if (label.staticTexts && label.staticTexts.length > 0) {
                    label.staticTexts.forEach((staticText, staticIndex) => {
                        const elementId = `static-${staticIndex}`;
                        if (elements[elementId]) {
                            ctx.fillStyle = '#666666';
                            ctx.font = `${elements[elementId].fontSize || 10}px Arial`;
                            ctx.textAlign = elements[elementId].align || 'center';
                            ctx.fillText(staticText.text, 
                                elements[elementId].x * dpi + (elements[elementId].width * dpi) / 2, 
                                elements[elementId].y * dpi + (elements[elementId].height * dpi) / 2);
                        }
                    });
                }
                
                // Convert to blob and add to ZIP
                canvas.toBlob((blob) => {
                    zip.file(`label-${index + 1}.png`, blob);
                    processedCount++;
                    
                    if (processedCount === appState.generatedLabels.length) {
                        zip.generateAsync({ type: 'blob' }).then((content) => {
                            const url = URL.createObjectURL(content);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'barcode-labels.zip';
                            a.click();
                            URL.revokeObjectURL(url);
                            hideProgress();
                        });
                    }
                }, 'image/png');
                
            } catch (error) {
                console.error('Error creating label image:', error);
                processedCount++;
            }
        });
        
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