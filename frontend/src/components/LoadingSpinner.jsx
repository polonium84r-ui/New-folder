import React from 'react';
import BloodCellAI from './icons/BloodCellAI';

const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Loading...', 
  fullScreen = false,
  medical = false 
}) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-20 h-20'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className="relative">
          {medical ? (
            <div className="relative">
              <BloodCellAI className={`${sizeClasses[size]} text-medical-500 mx-auto animate-pulse`} />
              <div className="absolute inset-0 border-4 border-medical-200 border-t-medical-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-medical-500 rounded-full animate-spin mx-auto`}></div>
          )}
        </div>
        
        {message && (
          <p className="mt-4 text-gray-600 font-medium animate-pulse">
            {message}
          </p>
        )}
        
        {medical && (
          <div className="mt-2 flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-medical-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-medical-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-medical-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;