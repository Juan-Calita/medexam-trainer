import React from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { MODULE_COLORS, formatTime } from '@/lib/analyticsUtils';

const COLORS = Object.values(MODULE_COLORS);

function ChartSection({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

export default function AnalyticsCharts({ moduleStats, weeklyData }) {
  const hasData = moduleStats.some(m => m.total > 0);
  const hasWeekly = weeklyData.length > 0;

  if (!hasData) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-lg">Sem dados de jogo para este usuário.</p>
      </div>
    );
  }

  const barData = moduleStats.map(m => ({
    name: m.label.split(' ').slice(-1)[0], // short label
    fullName: m.label,
    Acessos: m.total,
    Tempo: Math.round(m.totalTime / 60),
    Pontuação: m.totalScore,
    fill: m.color,
  }));

  const pieAccessos = moduleStats.filter(m => m.total > 0).map(m => ({
    name: m.label,
    value: m.total,
    color: m.color,
  }));

  const pieTempo = moduleStats.filter(m => m.totalTime > 0).map(m => ({
    name: m.label,
    value: Math.round(m.totalTime / 60),
    color: m.color,
  }));

  const piePontuacao = moduleStats.filter(m => m.totalScore > 0).map(m => ({
    name: m.label,
    value: m.totalScore,
    color: m.color,
  }));

  const CustomTooltipBar = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const full = barData.find(d => d.name === label)?.fullName || label;
      return (
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-xs">
          <p className="font-semibold text-slate-700 mb-1">{full}</p>
          {payload.map(p => (
            <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}{p.name === 'Tempo' ? 'min' : ''}</strong></p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* BAR CHARTS */}
      <div className="grid md:grid-cols-3 gap-4">
        <ChartSection title="Acessos por Módulo (Barra)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltipBar />} />
              <Bar dataKey="Acessos" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>

        <ChartSection title="Tempo por Módulo — min (Barra)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltipBar />} />
              <Bar dataKey="Tempo" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>

        <ChartSection title="Pontuação por Módulo (Barra)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltipBar />} />
              <Bar dataKey="Pontuação" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>
      </div>

      {/* PIE CHARTS */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { title: 'Acessos por Módulo (Pizza)', data: pieAccessos, unit: '' },
          { title: 'Tempo por Módulo — min (Pizza)', data: pieTempo, unit: 'min' },
          { title: 'Pontuação por Módulo (Pizza)', data: piePontuacao, unit: 'pts' },
        ].map(({ title, data, unit }) => (
          <ChartSection key={title} title={title}>
            {data.length === 0 ? (
              <p className="text-center text-slate-300 text-xs py-8">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v}${unit}`, n]} />
                  <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartSection>
        ))}
      </div>

      {/* LINE CHARTS (weekly) */}
      {hasWeekly && (
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: 'Evolução Semanal — Acessos', key: 'acessos', color: '#7c3aed' },
            { title: 'Evolução Semanal — Tempo (min)', key: 'tempo', color: '#0d9488', transform: v => Math.round(v / 60) },
            { title: 'Evolução Semanal — Pontuação', key: 'pontuacao', color: '#f97316' },
          ].map(({ title, key, color, transform }) => {
            const chartData = weeklyData.map(w => ({
              ...w,
              [key]: transform ? transform(w[key]) : w[key],
            }));
            return (
              <ChartSection key={title} title={title}>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={{ r: 4, fill: color }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartSection>
            );
          })}
        </div>
      )}
    </div>
  );
}