import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, 
  Heart, 
  Wind, 
  Stethoscope, 
  Upload,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

const adminSections = [
  {
    title: 'Regiões Abdominais',
    description: 'Gerenciar áreas de arrastar e soltar',
    icon: LayoutGrid,
    page: 'AdminAbdominal',
    color: 'teal'
  },
  {
    title: 'Focos Cardíacos',
    description: 'Gerenciar áreas de arrastar e soltar',
    icon: Heart,
    page: 'AdminCardiacFoci',
    color: 'rose'
  },
  {
    title: 'Questões Pulmonares',
    description: 'Gerenciar questões de múltipla escolha',
    icon: Wind,
    page: 'AdminPulmonar',
    color: 'indigo'
  },
  {
    title: 'Questões Cardíacas',
    description: 'Gerenciar questões de múltipla escolha',
    icon: Stethoscope,
    page: 'AdminCardiaca',
    color: 'rose'
  },
  {
    title: 'Biblioteca de Áudios',
    description: 'Upload e gerenciamento de áudios',
    icon: Upload,
    page: 'AudioLibrary',
    color: 'amber'
  }
];

export default function Admin() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Painel Administrativo</h1>
                <p className="text-xs text-slate-500">Gerenciamento de jogos e conteúdo</p>
              </div>
            </div>
            <Link to={createPageUrl('Home')}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Central de Gerenciamento
          </h2>
          <p className="text-slate-600">
            Configure e gerencie todos os jogos, questões e recursos do sistema
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section, index) => {
            const Icon = section.icon;
            const colorClasses = {
              teal: 'from-teal-500 to-emerald-600',
              rose: 'from-rose-500 to-pink-600',
              indigo: 'from-indigo-500 to-blue-600',
              amber: 'from-amber-500 to-orange-600'
            };

            return (
              <motion.div
                key={section.page}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={createPageUrl(section.page)}>
                  <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                    <CardHeader>
                      <div className={`p-3 bg-gradient-to-br ${colorClasses[section.color]} rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}