import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --primary: 203 89% 53%;
          --primary-foreground: 0 0% 100%;
          --secondary: 217 91% 60%;
          --secondary-foreground: 0 0% 100%;
          --accent: 166 84% 39%;
          --accent-foreground: 0 0% 100%;
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