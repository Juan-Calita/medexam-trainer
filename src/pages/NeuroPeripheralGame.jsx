import React, { useState } from 'react';
import NeuroMenuScreen from '@/components/neuroperipheral/NeuroMenuScreen';
import NeuroGameEngine from '@/components/neuroperipheral/NeuroGameEngine';

export default function NeuroPeripheralGame() {
  const [selectedLevel, setSelectedLevel] = useState(null);

  if (!selectedLevel) {
    return <NeuroMenuScreen onSelectLevel={setSelectedLevel} />;
  }

  return (
    <NeuroGameEngine
      level={selectedLevel}
      onBackToMenu={() => setSelectedLevel(null)}
    />
  );
}