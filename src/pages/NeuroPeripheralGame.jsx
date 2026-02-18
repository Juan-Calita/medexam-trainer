import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { createPageUrl } from '@/utils';
import NeuroMenuScreen from '@/components/neuroperipheral/NeuroMenuScreen';
import NeuroGameEngine from '@/components/neuroperipheral/NeuroGameEngine';

export default function NeuroPeripheralGame() {
  const [selectedLevel, setSelectedLevel] = useState(null);

  if (!selectedLevel) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f0eeff' }}>
        <header className="sticky top-0 z-40" style={{ backgroundColor: '#7c3aed' }}>
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div />
            <Link to={createPageUrl('Home')} className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
              <Home className="w-5 h-5" />
              <span className="text-sm font-medium">Home</span>
            </Link>
          </div>
        </header>
        <NeuroMenuScreen onSelectLevel={setSelectedLevel} />
      </div>
    );
  }

  return (
    <NeuroGameEngine
      level={selectedLevel}
      onBackToMenu={() => setSelectedLevel(null)}
    />
  );
}