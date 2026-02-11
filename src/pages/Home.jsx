import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Stethoscope, Grid3X3, HeartPulse, GraduationCap } from 'lucide-react';
import GameCard from '@/components/dashboard/GameCard';
import StatsOverview from '@/components/dashboard/StatsOverview';

export default function Home() {
  const { data: progressData = [] } = useQuery({
    queryKey: ['gameProgress'],
    queryFn: () => base44.entities.GameProgress.list('-created_date', 100),
  });

  const abdominalStats = React.useMemo(() => {
    const games = progressData.filter(p => p.game_type === 'abdominal_regions');
    if (games.length === 0) return null;
    return {
      gamesPlayed: games.length,
      bestScore: Math.max(...games.map(g => g.score || 0)),
      bestAccuracy: Math.max(...games.map(g => g.accuracy || 0)),
    };
  }, [progressData]);

  const auscultationStats = React.useMemo(() => {
    const games = progressData.filter(p => p.game_type === 'auscultation');
    if (games.length === 0) return null;
    return {
      gamesPlayed: games.length,
      bestScore: Math.max(...games.map(g => g.score || 0)),
      bestAccuracy: Math.max(...games.map(g => g.accuracy || 0)),
    };
  }, [progressData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">MedExam Trainer</h1>
              <p className="text-xs text-slate-500">Physical Examination Training</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-5 h-5 text-teal-600" />
            <span className="text-sm font-medium text-teal-600">Learning Hub</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Master Clinical Skills
          </h2>
          <p className="text-slate-600 max-w-2xl">
            Interactive games designed to help medical students develop expertise in 
            physical examination techniques through hands-on practice.
          </p>
        </motion.div>

        {/* Stats Overview */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Your Progress
          </h3>
          <StatsOverview progressData={progressData} />
        </div>

        {/* Games Grid */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Training Modules
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <GameCard
              title="Abdominal Regions"
              description="Learn the 9 anatomical regions of the abdomen through drag-and-drop"
              icon={Grid3X3}
              pageName="AbdominalGame"
              color="teal"
              stats={abdominalStats}
            />
            <GameCard
              title="Auscultation Quiz"
              description="Identify breath and heart sounds through audio challenges"
              icon={HeartPulse}
              pageName="AuscultationGame"
              color="indigo"
              stats={auscultationStats}
            />
          </div>
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white"
        >
          <h3 className="text-lg font-semibold mb-2">Why Practice Matters</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Repetitive practice with immediate feedback is proven to enhance pattern recognition 
            and clinical reasoning. These games are designed to reinforce your knowledge of 
            anatomy and diagnostic skills essential for physical examination.
          </p>
        </motion.div>
      </main>
    </div>
  );
}