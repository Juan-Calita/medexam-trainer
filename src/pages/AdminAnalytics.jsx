import React, { useState, useRef, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Users, Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import UserTable from '@/components/admin/UserTable';
import { Globe } from 'lucide-react';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';
import { groupProgressByUser, aggregateStats, statsByModule, weeklyStats } from '@/lib/analyticsUtils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const MODULE_LABELS = {
  abdominal_regions: 'Regiões Abdominais',
  auscultation_pulmonar: 'Ausculta Pulmonar',
  auscultation_cardiaca: 'Ausculta Cardíaca',
  cardiac_foci: 'Focos Cardíacos',
};

export default function AdminAnalytics() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const chartsRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
    }).catch(() => {});
  }, []);

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: progressData = [], isLoading: loadingProgress, refetch } = useQuery({
    queryKey: ['adminProgress'],
    queryFn: () => base44.entities.GameProgress.list('-created_date', 500),
  });

  const usersWithRecords = useMemo(() => {
    return groupProgressByUser(progressData, users);
  }, [progressData, users]);

  const activeUser = selectedUser ?? (usersWithRecords.length > 0 ? usersWithRecords[0] : null);

  const userStats = useMemo(() => {
    if (!activeUser) return null;
    return {
      overall: aggregateStats(activeUser.records || []),
      byModule: statsByModule(activeUser.records || []),
      weekly: weeklyStats(activeUser.records || []),
    };
  }, [activeUser]);

  const globalStats = useMemo(() => aggregateStats(progressData), [progressData]);

  const generatePDF = async () => {
    if (!chartsRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(chartsRef.current, { scale: 1.5, useCORS: true, backgroundColor: '#f8fafc' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;

      pdf.setFillColor(44, 27, 78);
      pdf.rect(0, 0, pdfW, 18, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Anamnes.ia — Relatório de Desempenho', 10, 12);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Usuário: ${activeUser?.full_name || activeUser?.email || 'Geral'}   |   Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 10, 17);

      const availH = pdf.internal.pageSize.getHeight() - 22;
      if (pdfH <= availH) {
        pdf.addImage(imgData, 'PNG', 0, 20, pdfW, pdfH);
      } else {
        // Multi-page
        let yOffset = 0;
        let firstPage = true;
        while (yOffset < canvas.height) {
          const sliceH = Math.min((availH / pdfH) * canvas.height, canvas.height - yOffset);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceH;
          const ctx = sliceCanvas.getContext('2d');
          ctx.drawImage(canvas, 0, -yOffset);
          const sliceImg = sliceCanvas.toDataURL('image/png');
          if (!firstPage) pdf.addPage();
          pdf.addImage(sliceImg, 'PNG', 0, firstPage ? 20 : 5, pdfW, (sliceH / canvas.height) * pdfH);
          yOffset += sliceH;
          firstPage = false;
        }
      }

      pdf.save(`relatorio_${(activeUser?.email || 'geral').replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Access control
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0eeff' }}>
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-sm">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Acesso Restrito</h2>
          <p className="text-slate-500 text-sm mb-4">Esta área é exclusiva para administradores.</p>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline">Voltar ao Início</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isLoading = loadingUsers || loadingProgress;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0eeff' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 shadow-sm" style={{ background: 'linear-gradient(135deg, #2D1B4E 0%, #3D2463 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <button className="p-2 rounded-lg hover:bg-white/10 text-white/60 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <div>
              <h1 className="text-base font-bold text-white">Painel Administrativo</h1>
              <p className="text-xs text-white/50">Analytics & Relatórios</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Global stats pills */}
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                <Users className="w-4 h-4 text-white/60" />
                <span className="text-sm text-white font-medium">{users.length} usuários</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                <Activity className="w-4 h-4 text-white/60" />
                <span className="text-sm text-white font-medium">{globalStats.total} jogos totais</span>
              </div>
            </div>
            <button onClick={() => refetch()} className="p-2 rounded-lg hover:bg-white/10 text-white/60 transition-colors" title="Atualizar dados">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-[320px_1fr] gap-6">
            {/* Left: User list */}
            <div>
              <UserTable
                users={usersWithRecords}
                onSelectUser={setSelectedUser}
                selectedUserId={activeUser?.email}
              />
            </div>

            {/* Right: Charts */}
            <div>
              {activeUser ? (
                <div>
                  {/* User header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        {activeUser.isAnonymous && <Globe className="w-4 h-4 text-slate-400" />}
                        {activeUser.full_name || activeUser.email}
                      </h2>
                      <p className="text-sm text-slate-500">{activeUser.isAnonymous ? `IP: ${activeUser.ip_address}` : activeUser.email} · {activeUser.records?.length || 0} jogos registrados</p>
                    </div>
                    <Button
                      onClick={generatePDF}
                      disabled={isGeneratingPDF}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 text-white flex items-center gap-2"
                    >
                      {isGeneratingPDF ? (
                        <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Gerando...</>
                      ) : (
                        <><Download className="w-4 h-4" /> Exportar PDF</>
                      )}
                    </Button>
                  </div>

                  {/* Stats summary cards */}
                  {userStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      {[
                        { label: 'Total de Jogos', value: userStats.overall.total, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Tempo Total', value: `${Math.round(userStats.overall.totalTime / 60)}min`, color: 'text-teal-600', bg: 'bg-teal-50' },
                        { label: 'Pontuação Total', value: userStats.overall.totalScore, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Precisão Média', value: `${userStats.overall.avgAccuracy}%`, color: 'text-rose-600', bg: 'bg-rose-50' },
                      ].map(c => (
                        <div key={c.label} className={`${c.bg} rounded-xl p-4 border border-white`}>
                          <p className="text-xs text-slate-500 mb-1">{c.label}</p>
                          <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Charts area (captured for PDF) */}
                  <div ref={chartsRef} className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                      Análise por módulo e evolução semanal — {activeUser.full_name || activeUser.email}
                    </p>
                    {userStats && (
                      <AnalyticsCharts
                        moduleStats={userStats.byModule}
                        weeklyData={userStats.weekly}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-400">
                  Selecione um usuário para ver os dados
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}