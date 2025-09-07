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
        staticText: '',
        fontSize: 'medium',
        spacing: 'normal'
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
        barcodeType.addEventListener('change', updatePreview);
    }
    
    if (staticText) {
        staticText.addEventListener('input', updatePreview);
    }
    
    if (fontSize) {
        fontSize.addEventListener('change', updatePreview);
    }
    
    if (spacing) {
        spacing.addEventListener('change', updatePreview);
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
                staticText: '',
                fontSize: 'medium',
                spacing: 'normal'
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
    updateDesignPreview();
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
    const previewLabel = document.getElementById('design-preview-label');
    const previewBarcode = document.getElementById('design-preview-barcode');
    const previewText = document.getElementById('design-preview-text');
    const previewStatic = document.getElementById('design-preview-static');
    
    // Update barcode
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
    
    // Update text
    if (appState.mappedColumns.text.length > 0 && appState.excelData.length > 0) {
        const textParts = appState.mappedColumns.text.map(col => {
            const value = appState.excelData[0][col.index];
            return value ? value.toString() : '';
        }).filter(text => text.length > 0);
        
        previewText.textContent = textParts.join(' | ') || 'Sample Product Information';
    } else {
        previewText.textContent = 'Sample Product Information';
    }
    
    // Update static text
    const staticText = document.getElementById('static-text').value;
    if (staticText) {
        previewStatic.textContent = staticText;
        previewStatic.classList.remove('hidden');
    } else {
        previewStatic.classList.add('hidden');
    }
    
    // Apply font size
    const fontSize = document.getElementById('font-size').value;
    previewText.className = `preview-text font-${fontSize}`;
    
    // Update label size
    const size = appState.labelSettings.size;
    if (size === 'custom') {
        const width = appState.labelSettings.customWidth;
        const height = appState.labelSettings.customHeight;
        previewLabel.style.width = `${width * 100}px`;
        previewLabel.style.height = `${height * 100}px`;
    } else if (LABEL_SIZES[size]) {
        const { width, height } = LABEL_SIZES[size];
        previewLabel.style.width = `${width * 100}px`;
        previewLabel.style.height = `${height * 100}px`;
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
            const label = {
                barcode: barcode.toString(),
                text: textFields.join(' | '),
                staticText: appState.labelSettings.staticText,
                barcodeType: appState.labelSettings.barcodeType,
                size: appState.labelSettings.size,
                customWidth: appState.labelSettings.customWidth,
                customHeight: appState.labelSettings.customHeight,
                fontSize: appState.labelSettings.fontSize,
                spacing: appState.labelSettings.spacing
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
function downloadPDF() {
    if (appState.generatedLabels.length === 0) {
        showError('No labels', 'Please generate labels first');
        return;
    }
    
    showProgress('Creating PDF...');
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        const usableWidth = pageWidth - (margin * 2);
        const usableHeight = pageHeight - (margin * 2);
        
        // Calculate label dimensions in mm
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
            
            // Add barcode
            try {
                const canvas = document.createElement('canvas');
                JsBarcode(canvas, label.barcode, {
                    format: label.barcodeType,
                    width: 2,
                    height: 30,
                    displayValue: false
                });
                
                const barcodeDataURL = canvas.toDataURL();
                doc.addImage(barcodeDataURL, 'PNG', x + 2, y + 2, labelWidth - 4, 15);
            } catch (error) {
                doc.text('Invalid barcode', x + 2, y + 10);
            }
            
            // Add text
            if (label.text) {
                doc.setFontSize(8);
                doc.text(label.text, x + 2, y + 20, { maxWidth: labelWidth - 4 });
            }
            
            // Add static text
            if (label.staticText) {
                doc.setFontSize(6);
                doc.text(label.staticText, x + 2, y + labelHeight - 4);
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
                
                // Set canvas size based on label size
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
                
                // Add barcode
                try {
                    const barcodeCanvas = document.createElement('canvas');
                    JsBarcode(barcodeCanvas, label.barcode, {
                        format: label.barcodeType,
                        width: 3,
                        height: 60,
                        displayValue: false
                    });
                    
                    const barcodeX = (width - barcodeCanvas.width) / 2;
                    const barcodeY = 20;
                    ctx.drawImage(barcodeCanvas, barcodeX, barcodeY);
                } catch (error) {
                    ctx.fillStyle = '#000000';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('Invalid barcode', width / 2, height / 2);
                }
                
                // Add text
                if (label.text) {
                    ctx.fillStyle = '#000000';
                    ctx.font = '14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(label.text, width / 2, height - 30);
                }
                
                // Add static text
                if (label.staticText) {
                    ctx.fillStyle = '#666666';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(label.staticText, width / 2, height - 10);
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