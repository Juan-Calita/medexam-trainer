import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0eeff' }}>
      <style>{`
        :root {
          --primary: 263 70% 50%;
          --primary-foreground: 0 0% 100%;
        }
        body {
          background-color: #f0eeff;
        }
        @keyframes pulse {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
      `}</style>
      {children}
    </div>
  );
}