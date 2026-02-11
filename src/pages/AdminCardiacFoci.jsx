import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function AdminCardiacFoci() {
  const [editingRegion, setEditingRegion] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [formData, setFormData] = useState({
    game_type: 'cardiac_foci',
    region_name: '',
    x: 0,
    y: 0,
    width: 9,
    height: 7,
    explanation: '',
    order: 0,
    active: true
  });

  const queryClient = useQueryClient();

  const { data: regions = [] } = useQuery({
    queryKey: ['regions', 'cardiac_foci'],
    queryFn: () => base44.entities.GameRegion.filter({ game_type: 'cardiac_foci' }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GameRegion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      resetForm();
      toast.success('Foco criado!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GameRegion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      setEditingRegion(null);
      resetForm();
      toast.success('Foco atualizado!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GameRegion.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      toast.success('Foco removido!');
    },
  });

  const resetForm = () => {
    setFormData({
      game_type: 'cardiac_foci',
      region_name: '',
      x: 0,
      y: 0,
      width: 9,
      height: 7,
      explanation: '',
      order: regions.length,
      active: true
    });
    setEditingRegion(null);
  };

  const handleEdit = (region) => {
    setEditingRegion(region.id);
    setFormData({
      game_type: region.game_type,
      region_name: region.region_name,
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
      explanation: region.explanation || '',
      order: region.order || 0,
      active: region.active !== false
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.region_name || !formData.explanation) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (editingRegion) {
      updateMutation.mutate({ id: editingRegion, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleMouseDown = (e, type) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (type === 'drag') {
      setIsDragging(true);
      setDragStart({ x: x - formData.x, y: y - formData.y });
    } else if (type === 'resize') {
      setIsResizing(true);
      setDragStart({ x, y });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging && !isResizing) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (isDragging) {
      setFormData({
        ...formData,
        x: Math.max(0, Math.min(100 - formData.width, x - dragStart.x)),
        y: Math.max(0, Math.min(100 - formData.height, y - dragStart.y))
      });
    } else if (isResizing) {
      const width = Math.max(5, Math.min(50, x - formData.x));
      const height = Math.max(5, Math.min(50, y - formData.y));
      setFormData({ ...formData, width, height });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to={createPageUrl('Admin')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Painel Admin</span>
            </Link>
            <h1 className="text-lg font-semibold text-slate-800">Focos - Cardíacos</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {editingRegion ? 'Editar Foco' : 'Novo Foco'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Nome do Foco *
                  </label>
                  <Input
                    value={formData.region_name}
                    onChange={(e) => setFormData({ ...formData, region_name: e.target.value })}
                    placeholder="Ex: Foco Aórtico"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Posição X (%)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.x}
                      onChange={(e) => setFormData({ ...formData, x: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Posição Y (%)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.y}
                      onChange={(e) => setFormData({ ...formData, y: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Largura (%)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.width}
                      onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Altura (%)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Explicação *
                  </label>
                  <Textarea
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    placeholder="Descrição anatômica do foco cardíaco"
                    rows={3}
                  />
                </div>

                {/* Preview Interativo */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <p className="text-xs font-medium text-slate-600 mb-3">
                    Preview do Jogo - Arraste a label para testar
                  </p>
                  
                  {/* Diagrama */}
                  <div 
                    className="relative w-full aspect-[4/3] bg-white rounded border border-slate-200 overflow-hidden mb-3"
                  >
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698beb7c76ba1376ff50d67a/4a49ca2e4_image.png"
                      alt="Diagrama torácico"
                      className="w-full h-full object-contain pointer-events-none select-none"
                      draggable={false}
                    />
                    
                    {/* Todas as regiões cadastradas */}
                    {regions.map(region => (
                      <div
                        key={region.id}
                        className="absolute border-2 border-rose-400 bg-rose-400/10 rounded transition-all"
                        style={{
                          left: `${region.x}%`,
                          top: `${region.y}%`,
                          width: `${region.width}%`,
                          height: `${region.height}%`,
                        }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[0.6rem] font-bold text-rose-600 whitespace-nowrap bg-white/90 px-1 rounded">
                          {region.region_name}
                        </div>
                      </div>
                    ))}
                    
                    {/* Região em edição com destaque */}
                    {formData.region_name && (
                      <div
                        className="absolute border-2 border-rose-600 bg-rose-600/20 rounded cursor-move shadow-lg"
                        style={{
                          left: `${formData.x}%`,
                          top: `${formData.y}%`,
                          width: `${formData.width}%`,
                          height: `${formData.height}%`,
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'drag')}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-rose-700 whitespace-nowrap bg-white px-1.5 py-0.5 rounded pointer-events-none">
                          {formData.region_name}
                        </div>
                        <div 
                          className="absolute bottom-0 right-0 w-3 h-3 bg-rose-600 rounded-tl cursor-nwse-resize"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleMouseDown(e, 'resize');
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Labels Disponíveis */}
                  {formData.region_name && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-600">Label de Exemplo:</p>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border-2 border-slate-200 w-fit">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                        <span className="text-sm font-medium text-slate-700">{formData.region_name}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-slate-500 flex justify-between pt-2 border-t">
                    <span>Pos: ({formData.x.toFixed(1)}%, {formData.y.toFixed(1)}%)</span>
                    <span>Tam: {formData.width.toFixed(1)}% × {formData.height.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700">
                    <Save className="w-4 h-4 mr-2" />
                    {editingRegion ? 'Atualizar' : 'Criar'}
                  </Button>
                  {editingRegion && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Focos Cadastrados ({regions.length})
            </h2>

            {regions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-slate-500">
                  Nenhum foco cadastrado ainda
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {regions.sort((a, b) => (a.order || 0) - (b.order || 0)).map(region => (
                  <Card key={region.id} className={!region.active ? 'opacity-50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-medium text-slate-800">
                              {region.region_name}
                            </p>
                            {!region.active && <Badge variant="outline">Inativo</Badge>}
                          </div>
                          <p className="text-xs text-slate-600 mb-2">
                            Posição: ({region.x}%, {region.y}%) | Tamanho: {region.width}% x {region.height}%
                          </p>
                          <p className="text-xs text-slate-500">
                            {region.explanation}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(region)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(region.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}