import React from 'react';

export const NutriMindLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M18 33C26.2843 33 33 26.2843 33 18C33 9.71573 26.2843 3 18 3C9.71573 3 3 9.71573 3 18C3 26.2843 9.71573 33 18 33Z" fill="url(#paint0_linear_101_2)" />
    <path d="M21.5 13.5L18 24L14.5 13.5L10.5 18H25.5L21.5 13.5Z" fill="white" fillOpacity="0.9" />
    <defs>
      <linearGradient id="paint0_linear_101_2" x1="3" y1="18" x2="33" y2="18" gradientUnits="userSpaceOnUse">
        <stop stopColor="var(--primary)" />
        <stop offset="1" stopColor="var(--accent)" />
      </linearGradient>
    </defs>
  </svg>
);
