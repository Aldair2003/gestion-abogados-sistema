import React from 'react';

interface IconProps {
  className?: string;
}

const HashtagIcon: React.FC<IconProps> = ({ className = "h-6 w-6" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth="1.5" 
    stroke="currentColor" 
    className={className}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" 
    />
  </svg>
);

export default HashtagIcon; 