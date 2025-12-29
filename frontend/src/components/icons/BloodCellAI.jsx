import React from 'react';

const BloodCellAI = ({ className = "w-6 h-6", ...props }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Main blood cell (circular with slight indentation) */}
      <circle cx="12" cy="12" r="8" fill="currentColor" fillOpacity="0.1" />
      <circle cx="12" cy="12" r="8" />
      
      {/* Blood cell characteristic indentation */}
      <path d="M8 12 Q12 8 16 12 Q12 16 8 12" fill="currentColor" fillOpacity="0.05" />
      
      {/* AI Network Nodes - Small connected dots around the cell */}
      <circle cx="6" cy="6" r="1.5" fill="currentColor" />
      <circle cx="18" cy="6" r="1.5" fill="currentColor" />
      <circle cx="6" cy="18" r="1.5" fill="currentColor" />
      <circle cx="18" cy="18" r="1.5" fill="currentColor" />
      
      {/* AI Network Connections */}
      <path d="M6 6 L12 12 L18 6" strokeWidth="1" opacity="0.6" />
      <path d="M6 18 L12 12 L18 18" strokeWidth="1" opacity="0.6" />
      <path d="M6 6 L6 18" strokeWidth="1" opacity="0.4" />
      <path d="M18 6 L18 18" strokeWidth="1" opacity="0.4" />
      
      {/* Central AI processing indicator */}
      <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.3" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
};

export default BloodCellAI;