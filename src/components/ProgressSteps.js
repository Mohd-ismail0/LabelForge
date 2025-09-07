import React from 'react';
import { useApp } from '../context/AppContext';

const ProgressSteps = () => {
  const { state, actions } = useApp();
  const { currentStep } = state;

  const steps = [
    { number: 1, label: 'Upload Data' },
    { number: 2, label: 'Map Columns' },
    { number: 3, label: 'Design Labels' },
    { number: 4, label: 'Set Quantities' },
    { number: 5, label: 'Generate & Export' }
  ];

  const handleStepClick = (stepNumber) => {
    // Only allow navigation to completed steps or the next step
    if (stepNumber <= currentStep || stepNumber === currentStep + 1) {
      actions.setStep(stepNumber);
    }
  };

  return (
    <div className="progress-steps">
      {steps.map((step) => {
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;
        
        return (
          <div
            key={step.number}
            className={`step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            onClick={() => handleStepClick(step.number)}
            style={{ cursor: 'pointer' }}
          >
            <div className="step-circle">
              <span className="step-number">{step.number}</span>
            </div>
            <span className="step-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressSteps;