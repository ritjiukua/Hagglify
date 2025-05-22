import React from 'react';
import './LoadingSpinner.scss';

const LoadingSpinner = () => {
  return (
    <div className="loading-container">
      <div className="spinner">
        <div className="double-bounce1"></div>
        <div className="double-bounce2"></div>
      </div>
      <p>Loading...</p>
    </div>
  );
};

export default LoadingSpinner; 