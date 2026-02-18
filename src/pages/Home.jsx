import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Stethoscope, Grid3X3, Wind, Heart, GraduationCap, MapPin, Settings, Eye, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
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

  const pulmonarStats = React.useMemo(() => {
    const games = progressData.filter(p => p.game_type === 'auscultation_pulmonar');
    if (games.length === 0) return null;
    return {
      gamesPlayed: games.length,
      bestScore: Math.max(...games.map(g => g.score || 0)),
      bestAccuracy: Math.max(...games.map(g => g.accuracy || 0)),
    };
  }, [progressData]);

  const cardiacaStats = React.useMemo(() => {
    const games = progressData.filter(p => p.game_type === 'auscultation_cardiaca');
    if (games.length === 0) return null;
    return {
      gamesPlayed: games.length,
      bestScore: Math.max(...games.map(g => g.score || 0)),
      bestAccuracy: Math.max(...games.map(g => g.accuracy || 0)),
    };
  }, [progressData]);

  const cardiacFociStats = React.useMemo(() => {
    const games = progressData.filter(p => p.game_type === 'cardiac_foci');
    if (games.length === 0) return null;
    return {
      gamesPlayed: games.length,
      bestScore: Math.max(...games.map(g => g.score || 0)),
      bestAccuracy: Math.max(...games.map(g => g.accuracy || 0)),
    };
  }, [progressData]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0eeff' }}>
      {/* Header */}
      <header className="sticky top-0 z-40" style={{ backgroundColor: '#f0eeff', borderBottom: '1px solid #ddd6fe' }}>
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#4c1d95' }}>MedExam Trainer</h1>
                <p className="text-xs" style={{ color: '#7c3aed' }}>Treinamento em Exame Físico</p>
              </div>
            </div>
            <Link to={createPageUrl('Admin')}>
              <Button variant="outline" size="sm" style={{ borderColor: '#7c3aed', color: '#7c3aed' }}>
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
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
            <GraduationCap className="w-5 h-5" style={{ color: '#7c3aed' }} />
            <span className="text-sm font-medium" style={{ color: '#7c3aed' }}>Central de Aprendizado</span>
          </div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#3b0764' }}>
            Domine Habilidades Clínicas
          </h2>
          <p className="max-w-2xl" style={{ color: '#6b7280' }}>
            Jogos interativos desenvolvidos para ajudar estudantes de medicina a desenvolver 
            expertise em técnicas de exame físico através de prática hands-on.
          </p>
        </motion.div>

        {/* Stats Overview */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#7c3aed' }}>
            Seu Progresso
          </h3>
          <StatsOverview progressData={progressData} />
        </div>

        {/* Games Grid */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#7c3aed' }}>
            Módulos de Treinamento
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GameCard
              title="Regiões Abdominais"
              description="Aprenda as 9 regiões anatômicas do abdome"
              icon={Grid3X3}
              pageName="AbdominalGame"
              color="purple"
              stats={abdominalStats}
            />
            <GameCard
              title="Focos Cardíacos"
              description="Identifique os pontos de ausculta cardíaca"
              icon={Stethoscope}
              pageName="CardiacFociGame"
              color="purple"
              stats={cardiacFociStats}
            />
            <GameCard
              title="Ausculta Pulmonar"
              description="Identifique sons respiratórios e suas patologias"
              icon={Wind}
              pageName="AuscultationPulmonar"
              color="purple"
              stats={pulmonarStats}
            />
            <GameCard
              title="Ausculta Cardíaca"
              description="Reconheça bulhas, sopros e ritmos cardíacos"
              icon={Heart}
              pageName="AuscultationCardiaca"
              color="purple"
              stats={cardiacaStats}
            />
            <GameCard
              title="Musculatura Extraocular"
              description="Identifique músculos extraoculares e nervos cranianos afetados"
              icon={Eye}
              pageName="ExtraocularGame"
              color="purple"
              stats={null}
            />
            <GameCard
              title="Nervos Periféricos"
              description="Nervos periféricos, dermátomos, plexos e síndromes de compressão"
              icon={Brain}
              pageName="NeuroPeripheralGame"
              color="purple"
              stats={null}
            />
          </div>
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-6 text-white"
          style={{ background: 'linear-gradient(135deg, #4c1d95, #3b0764)' }}
        >
          <h3 className="text-lg font-semibold mb-2">Por Que a Prática Importa</h3>
          <p className="text-sm leading-relaxed" style={{ color: '#ddd6fe' }}>
            A prática repetitiva com feedback imediato é comprovadamente eficaz para melhorar o reconhecimento 
            de padrões e o raciocínio clínico. Estes jogos são projetados para reforçar seu conhecimento de 
            anatomia e habilidades diagnósticas essenciais para o exame físico.
          </p>
        </motion.div>
      </main>
    </div>
  );
}