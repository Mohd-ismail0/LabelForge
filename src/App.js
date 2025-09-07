import React from 'react';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import ProgressSteps from './components/ProgressSteps';
import FileUpload from './components/FileUpload';
import ColumnMapping from './components/ColumnMapping';
import LabelDesign from './components/LabelDesign';
import QuantityManagement from './components/QuantityManagement';
import Generation from './components/Generation';
import LoadingModal from './components/LoadingModal';
import ErrorModal from './components/ErrorModal';
import { useApp } from './context/AppContext';

function AppContent() {
  const { state } = useApp();
  const { currentStep } = state;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <FileUpload />;
      case 2:
        return <ColumnMapping />;
      case 3:
        return <LabelDesign />;
      case 4:
        return <QuantityManagement />;
      case 5:
        return <Generation />;
      default:
        return <FileUpload />;
    }
  };

  return (
    <div className="container">
      <Header />
      <ProgressSteps />
      {renderStep()}
      <LoadingModal />
      <ErrorModal />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;