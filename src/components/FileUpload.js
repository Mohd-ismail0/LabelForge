import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';

const FileUpload = () => {
  const { state, actions } = useApp();
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(file.type)) {
      actions.setError('Please select a valid Excel file (.xlsx, .xls, or .csv)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      actions.setError('File size must be less than 10MB');
      return;
    }

    try {
      actions.setLoading(true);
      setUploadProgress(0);

      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
        }
      };

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length === 0) {
            actions.setError('The Excel file appears to be empty');
            return;
          }

          const headers = jsonData[0];
          const rows = jsonData.slice(1);

          actions.setExcelData({ headers, rows, fileName: file.name });
          actions.setColumnHeaders(headers);
          actions.setStep(2);
        } catch (error) {
          actions.setError('Error reading Excel file: ' + error.message);
        } finally {
          actions.setLoading(false);
          setUploadProgress(0);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      actions.setError('Error processing file: ' + error.message);
      actions.setLoading(false);
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Step 1: Upload Excel Data</h2>
        <p className="card-description">
          Upload your Excel file containing product data with barcodes, descriptions, and quantities
        </p>
      </div>
      <div className="card-body">
        <div
          className={`upload-area ${dragOver ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadAreaClick}
        >
          <div className="upload-icon">📊</div>
          <h3>Drag & Drop Excel File Here or Click to Browse</h3>
          <p className="upload-hint">Supports .xlsx and .xls files up to 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>

        {state.loading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p>Processing file...</p>
          </div>
        )}

        {state.excelData && (
          <div className="file-info">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">File Name:</span>
                <span className="info-value">{state.excelData.fileName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Total Rows:</span>
                <span className="info-value">{state.excelData.rows.length}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Columns:</span>
                <span className="info-value">{state.excelData.headers.length}</span>
              </div>
            </div>
            <div className="preview-table-container">
              <h4>Data Preview</h4>
              <div className="table-wrapper">
                <table className="preview-table">
                  <thead>
                    <tr>
                      {state.excelData.headers.map((header, index) => (
                        <th key={index}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.excelData.rows.slice(0, 5).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <button
              className="btn btn-primary btn-large"
              onClick={() => actions.setStep(2)}
            >
              Continue to Column Mapping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;