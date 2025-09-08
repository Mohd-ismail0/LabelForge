import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const QuantityManagement = () => {
  const { state, actions } = useApp();
  const { excelData, mappedColumns, quantitySettings } = state;
  const [manualQuantities, setManualQuantities] = useState({});

  useEffect(() => {
    if (quantitySettings.type === 'manual' && excelData) {
      const initialQuantities = {};
      excelData.rows.forEach((row, index) => {
        initialQuantities[index] = 0;
      });
      setManualQuantities(initialQuantities);
    }
  }, [quantitySettings.type, excelData]);

  const handleQuantityTypeChange = (type) => {
    actions.setQuantitySettings({ type });
  };

  const handleFixedQuantityChange = (value) => {
    actions.setQuantitySettings({ fixedQuantity: parseInt(value) || 1 });
  };

  const handleManualQuantityChange = (rowIndex, value) => {
    const newQuantities = { ...manualQuantities, [rowIndex]: Math.max(0, parseInt(value) || 0) };
    setManualQuantities(newQuantities);
    actions.setQuantitySettings({ manualQuantities: newQuantities });
  };

  const calculateSummary = () => {
    if (!excelData) return { products: 0, labels: 0, pages: 0 };

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
      totalLabels = Object.values(manualQuantities).reduce((sum, qty) => sum + qty, 0);
    }

    // Estimate pages (assuming 30 labels per page)
    const pages = Math.ceil(totalLabels / 30);

    return { products, labels: totalLabels, pages };
  };

  const summary = calculateSummary();

  const handlePrevious = () => {
    actions.setStep(3);
  };

  const handleNext = () => {
    actions.setStep(5);
  };

  const getProductInfo = (row, index) => {
    const barcodeColumnIndex = mappedColumns.barcode ? 
      excelData.columnHeaders.indexOf(mappedColumns.barcode) : -1;
    const textColumns = mappedColumns.text.map(col => 
      excelData.columnHeaders.indexOf(col)
    ).filter(index => index !== -1);

    const barcode = barcodeColumnIndex !== -1 ? row[barcodeColumnIndex] : '';
    const text = textColumns.map(colIndex => row[colIndex]).filter(val => val).join(' - ');

    return { barcode, text: text || `Product ${index + 1}` };
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Step 4: Set Label Quantities</h2>
        <p className="card-description">
          Configure how many labels to generate for each product
        </p>
      </div>
      <div className="card-body">
        <div className="quantity-options">
          <div className="option-group">
            <input
              type="radio"
              id="qty-column"
              name="quantity-type"
              value="column"
              checked={quantitySettings.type === 'column'}
              onChange={(e) => handleQuantityTypeChange(e.target.value)}
            />
            <label htmlFor="qty-column">
              <span className="option-title">Use quantity from Excel column</span>
              <span className="option-description">
                Generate labels based on quantity values in your data
              </span>
            </label>
          </div>

          <div className="option-group">
            <input
              type="radio"
              id="qty-manual"
              name="quantity-type"
              value="manual"
              checked={quantitySettings.type === 'manual'}
              onChange={(e) => handleQuantityTypeChange(e.target.value)}
            />
            <label htmlFor="qty-manual">
              <span className="option-title">Set quantity manually for each row</span>
              <span className="option-description">
                Specify custom quantities for individual products
              </span>
            </label>
          </div>

          <div className="option-group">
            <input
              type="radio"
              id="qty-fixed"
              name="quantity-type"
              value="fixed"
              checked={quantitySettings.type === 'fixed'}
              onChange={(e) => handleQuantityTypeChange(e.target.value)}
            />
            <label htmlFor="qty-fixed">
              <span className="option-title">Use fixed quantity for all products</span>
              <span className="option-description">
                Generate the same number of labels for every product
              </span>
            </label>
            <div className="fixed-quantity-input">
              <input
                type="number"
                className="form-control"
                id="fixed-quantity"
                value={quantitySettings.fixedQuantity}
                min="1"
                max="1000"
                onChange={(e) => handleFixedQuantityChange(e.target.value)}
              />
              <span className="input-label">labels per product</span>
            </div>
          </div>
        </div>

        {quantitySettings.type === 'manual' && (
          <div className="manual-quantities">
            <h4>Set Quantities for Each Product</h4>
            <div className="quantities-table-container">
              <table className="quantities-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Barcode</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {excelData.rows.map((row, index) => {
                    const productInfo = getProductInfo(row, index);
                    return (
                      <tr key={index}>
                        <td>{productInfo.text}</td>
                        <td>{productInfo.barcode}</td>
                        <td>
                          <input
                            type="number"
                            className="quantity-input"
                            value={manualQuantities[index] || 0}
                            min="0"
                            max="1000"
                            onChange={(e) => handleManualQuantityChange(index, e.target.value)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="quantity-summary">
          <div className="summary-card">
            <h4>Generation Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Total Products:</span>
                <span className="summary-value">{summary.products}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Labels:</span>
                <span className="summary-value">{summary.labels}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Estimated Pages:</span>
                <span className="summary-value">{summary.pages}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="step-actions">
          <button className="btn btn-outline" onClick={handlePrevious}>
            Previous
          </button>
          <button className="btn btn-primary" onClick={handleNext}>
            Continue to Generation
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuantityManagement;