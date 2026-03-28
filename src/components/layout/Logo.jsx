import React from 'react';

const Logo = ({ className = "w-8 h-8" }) => (
  <svg 
    viewBox="0 0 512 512" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="120" y="120" width="60" height="272" rx="30" fill="currentColor"/>
    <rect x="332" y="120" width="60" height="272" rx="30" fill="currentColor"/>
    <path d="M180 150L256 290L332 150" stroke="currentColor" stroke-width="60" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
);

export default Logo;
