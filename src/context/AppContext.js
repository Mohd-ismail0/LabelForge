import React, { createContext, useContext, useReducer } from 'react';

// Initial state
const initialState = {
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
    elements: [],
    selectedElementId: null,
    nextElementId: 1
  },
  generatedLabels: [],
  quantitySettings: {
    type: 'column',
    fixedQuantity: 1,
    manualQuantities: {}
  },
  loading: false,
  error: null
};

// Action types
export const ActionTypes = {
  SET_STEP: 'SET_STEP',
  SET_EXCEL_DATA: 'SET_EXCEL_DATA',
  SET_COLUMN_HEADERS: 'SET_COLUMN_HEADERS',
  SET_MAPPED_COLUMNS: 'SET_MAPPED_COLUMNS',
  SET_LABEL_SETTINGS: 'SET_LABEL_SETTINGS',
  SET_QUANTITY_SETTINGS: 'SET_QUANTITY_SETTINGS',
  SET_GENERATED_LABELS: 'SET_GENERATED_LABELS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  RESET_APP: 'RESET_APP'
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_STEP:
      return { ...state, currentStep: action.payload };
    
    case ActionTypes.SET_EXCEL_DATA:
      return { ...state, excelData: action.payload };
    
    case ActionTypes.SET_COLUMN_HEADERS:
      return { ...state, columnHeaders: action.payload };
    
    case ActionTypes.SET_MAPPED_COLUMNS:
      return { ...state, mappedColumns: { ...state.mappedColumns, ...action.payload } };
    
    case ActionTypes.SET_LABEL_SETTINGS:
      return { ...state, labelSettings: { ...state.labelSettings, ...action.payload } };
    
    case ActionTypes.SET_QUANTITY_SETTINGS:
      return { ...state, quantitySettings: { ...state.quantitySettings, ...action.payload } };
    
    case ActionTypes.SET_GENERATED_LABELS:
      return { ...state, generatedLabels: action.payload };
    
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    
    case ActionTypes.RESET_APP:
      return initialState;
    
    default:
      return state;
  }
};

// Context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const actions = {
    setStep: (step) => dispatch({ type: ActionTypes.SET_STEP, payload: step }),
    setExcelData: (data) => dispatch({ type: ActionTypes.SET_EXCEL_DATA, payload: data }),
    setColumnHeaders: (headers) => dispatch({ type: ActionTypes.SET_COLUMN_HEADERS, payload: headers }),
    setMappedColumns: (columns) => dispatch({ type: ActionTypes.SET_MAPPED_COLUMNS, payload: columns }),
    setLabelSettings: (settings) => dispatch({ type: ActionTypes.SET_LABEL_SETTINGS, payload: settings }),
    setQuantitySettings: (settings) => dispatch({ type: ActionTypes.SET_QUANTITY_SETTINGS, payload: settings }),
    setGeneratedLabels: (labels) => dispatch({ type: ActionTypes.SET_GENERATED_LABELS, payload: labels }),
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    resetApp: () => dispatch({ type: ActionTypes.RESET_APP })
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};