import React from 'react';

export default function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        <linearGradient id="gold-gradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="purple-gradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Shield Background */}
      <path 
        d="M50 5 L90 20 V50 C90 75 50 95 50 95 C50 95 10 75 10 50 V20 L50 5 Z" 
        fill="url(#purple-gradient)" 
        stroke="url(#gold-gradient)" 
        strokeWidth="2"
      />
      
      {/* Inner Border */}
      <path 
        d="M50 12 L82 24 V50 C82 70 50 86 50 86 C50 86 18 70 18 50 V24 L50 12 Z" 
        stroke="rgba(255,255,255,0.1)" 
        strokeWidth="1" 
        fill="none"
      />

      {/* Book Icon */}
      <path 
        d="M30 40 C30 40 40 42 50 40 C60 42 70 40 70 40 V65 C70 65 60 67 50 65 C40 67 30 65 30 65 V40 Z" 
        fill="rgba(255,255,255,0.9)" 
      />
      <path 
        d="M50 40 V65" 
        stroke="url(#purple-gradient)" 
        strokeWidth="1"
      />

      {/* Monogram */}
      <text 
        x="50" 
        y="32" 
        textAnchor="middle" 
        fill="url(#gold-gradient)" 
        fontFamily="serif" 
        fontWeight="bold" 
        fontSize="14"
        style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}
      >
        JBLC
      </text>

      {/* Laurel Wreath (Simplified) */}
      <path 
        d="M25 70 Q 15 50 25 30" 
        stroke="url(#gold-gradient)" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        fill="none" 
        opacity="0.6"
      />
      <path 
        d="M75 70 Q 85 50 75 30" 
        stroke="url(#gold-gradient)" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        fill="none" 
        opacity="0.6"
      />
    </svg>
  );
}
