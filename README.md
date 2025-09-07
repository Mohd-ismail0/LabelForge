# Professional Barcode Label Generator - React Version

A modern, fully-featured React application for generating professional barcode labels from Excel data. This application has been completely rewritten from vanilla JavaScript to React with improved UI, better state management, and enhanced functionality.

## Features

### 🚀 Modern React Architecture
- **Component-based design** with reusable UI components
- **Context API** for centralized state management
- **Hooks** for functional programming patterns
- **Responsive design** that works on all devices

### 📊 Excel Data Processing
- **Drag & drop file upload** with progress indicators
- **Support for .xlsx, .xls, and .csv files**
- **Real-time data preview** with table display
- **Automatic column detection** and mapping

### 🏷️ Advanced Label Design
- **Visual label designer** with drag-and-drop interface
- **Multiple label sizes** (2x1, 3x1, 2.5x1, 4x2, custom)
- **Flexible element positioning** with real-time preview
- **Multiple barcode formats** (EAN-13, Code 128, Code 39, UPC-A, ITF-14)

### 📦 Smart Quantity Management
- **Column-based quantities** from Excel data
- **Manual quantity setting** for individual products
- **Fixed quantity** for all products
- **Real-time summary** with page estimates

### 🎨 Enhanced UI/UX
- **Step-by-step wizard** with progress tracking
- **Modern design system** with consistent styling
- **Loading states** and error handling
- **Accessibility features** and keyboard navigation

### 📄 Export Options
- **ZIP download** with individual high-resolution images
- **PDF generation** with multiple page sizes (A4, Letter, Legal)
- **Print-ready layouts** with proper margins and spacing
- **Batch processing** for large datasets

## Installation

1. **Clone or download** the project files
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## Usage

### Step 1: Upload Data
- Drag and drop your Excel file or click to browse
- Supported formats: .xlsx, .xls, .csv
- File size limit: 10MB
- Preview your data before proceeding

### Step 2: Map Columns
- **Required**: Map barcode column (EAN, UPC, etc.)
- **Optional**: Map text columns for product information
- **Optional**: Map quantity column for label duplication
- Real-time preview shows how your labels will look

### Step 3: Design Labels
- Choose label size (standard or custom)
- Select barcode type based on your needs
- Add and position text elements
- Customize fonts, colors, and alignment
- Visual canvas shows real-time preview

### Step 4: Set Quantities
- Use quantities from Excel column
- Set manual quantities for each product
- Use fixed quantity for all products
- View generation summary with estimates

### Step 5: Generate & Export
- Generate all labels with progress tracking
- Download as ZIP (individual images)
- Download as PDF (print-ready format)
- Choose page size for PDF export

## Technical Improvements

### State Management
- **Centralized state** using React Context
- **Reducer pattern** for complex state updates
- **Immutable updates** for predictable behavior
- **Error boundaries** for graceful error handling

### Performance
- **Lazy loading** of components
- **Memoization** for expensive calculations
- **Efficient re-renders** with proper dependency arrays
- **Optimized bundle size** with code splitting

### Code Quality
- **ES6+ features** and modern JavaScript
- **Functional components** with hooks
- **PropTypes** for type checking
- **Consistent naming** and code organization

### UI/UX Enhancements
- **Modern design system** with CSS custom properties
- **Responsive grid layouts** for all screen sizes
- **Smooth animations** and transitions
- **Loading states** and progress indicators
- **Error handling** with user-friendly messages

## File Structure

```
src/
├── components/           # Reusable UI components
│   ├── Header.js        # Application header
│   ├── ProgressSteps.js # Step navigation
│   ├── FileUpload.js    # File upload with drag & drop
│   ├── ColumnMapping.js # Column mapping interface
│   ├── LabelDesign.js   # Visual label designer
│   ├── QuantityManagement.js # Quantity configuration
│   ├── Generation.js    # Label generation and export
│   ├── LoadingModal.js  # Loading state modal
│   └── ErrorModal.js    # Error display modal
├── context/             # React Context for state
│   └── AppContext.js    # Main application state
├── App.js              # Main application component
├── index.js            # Application entry point
└── index.css           # Global styles and design system
```

## Dependencies

- **React 18** - Modern React with hooks
- **XLSX** - Excel file processing
- **JsBarcode** - Barcode generation
- **jsPDF** - PDF generation
- **JSZip** - ZIP file creation
- **html2canvas** - Canvas rendering

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Testing

The application includes a test CSV file (`test-data.csv`) with sample product data for testing the label generation functionality.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.