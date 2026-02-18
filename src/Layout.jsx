import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0eeff' }}>
      <style>{`
        :root {
          --primary: 262 80% 50%;
          --primary-foreground: 0 0% 100%;
          --secondary: 230 60% 35%;
          --secondary-foreground: 0 0% 100%;
          --accent: 262 80% 50%;
          --accent-foreground: 0 0% 100%;
          --background: 250 60% 95%;
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