import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Save, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const DEFAULT_IMAGE = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698beb7c76ba1376ff50d67a/8b2272e72_image.png';

export default function AdminCardiacFoci() {
  const [editingRegion, setEditingRegion] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [diagramImage, setDiagramImage] = useState(DEFAULT_IMAGE);
  const [formData, setFormData] = useState({
    game_type: 'cardiac_foci',
    region_name: '',
    x: 20,
    y: 20,
    width: 12,
    height: 10,
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
      x: 20,
      y: 20,
      width: 12,
      height: 10,
      explanation: '',
      order: regions.length,
      active: true
    });
    setEditingRegion(null);
    setIsCreatingNew(false);
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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDiagramImage(file_url);
      toast.success('Imagem carregada!');
    } catch (error) {
      toast.error('Erro ao carregar imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDiagramClick = (e) => {
    if (!isCreatingNew || editingRegion) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setFormData({
      ...formData,
      x: Math.max(0, Math.min(88, x)),
      y: Math.max(0, Math.min(90, y))
    });
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Gerenciador de Imagem */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-rose-600" />
              Imagem de Fundo do Diagrama
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                  id="diagram-upload"
                />
                <label htmlFor="diagram-upload">
                  <Button 
                    type="button" 
                    variant="outline" 
                    disabled={uploadingImage}
                    className="cursor-pointer"
                    asChild
                  >
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingImage ? 'Carregando...' : 'Trocar Imagem'}
                    </span>
                  </Button>
                </label>
              </div>
              <div className="h-20 w-32 border-2 border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <img 
                  src={diagramImage} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {editingRegion ? 'Editar Foco' : isCreatingNew ? 'Novo Foco - Clique no diagrama' : 'Focos Cardíacos'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isCreatingNew && !editingRegion ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Adicione e posicione visualmente os focos cardíacos no diagrama.
                  </p>
                  <Button 
                    onClick={() => setIsCreatingNew(true)}
                    className="w-full bg-rose-600 hover:bg-rose-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Novo Foco
                  </Button>
                  
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium text-slate-700 mb-3">
                      Focos Cadastrados ({regions.length})
                    </h3>
                    {regions.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">
                        Nenhum foco cadastrado
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {regions.sort((a, b) => (a.order || 0) - (b.order || 0)).map(region => (
                          <div 
                            key={region.id}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-rose-300 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">
                                {region.region_name}
                              </p>
                              <p className="text-xs text-slate-500">
                                ({region.x.toFixed(1)}%, {region.y.toFixed(1)}%)
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
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
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

                <div className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded p-2">
                  💡 Posicione o foco clicando no diagrama ao lado. Arraste para mover, redimensione usando o canto inferior direito.
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700">
                    <Save className="w-4 h-4 mr-2" />
                    {editingRegion ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
              )}
            </CardContent>
          </Card>

          {/* Diagrama Interativo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Diagrama Interativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="relative w-full aspect-[4/3] bg-slate-900 rounded-lg overflow-hidden border-2 border-slate-300 cursor-crosshair"
                onClick={handleDiagramClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img 
                  src={diagramImage}
                  alt="Diagrama torácico"
                  className="w-full h-full object-contain pointer-events-none select-none"
                  draggable={false}
                />
                
                {/* Regiões existentes */}
                {regions.filter(r => !editingRegion || r.id !== editingRegion).map(region => (
                  <div
                    key={region.id}
                    className="absolute border-2 border-slate-400 bg-slate-400/20 rounded transition-all hover:border-slate-500"
                    style={{
                      left: `${region.x}%`,
                      top: `${region.y}%`,
                      width: `${region.width}%`,
                      height: `${region.height}%`,
                    }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[0.65rem] font-bold text-white whitespace-nowrap bg-slate-800/80 px-2 py-0.5 rounded">
                      {region.region_name}
                    </div>
                  </div>
                ))}
                
                {/* Região sendo editada/criada */}
                {(isCreatingNew || editingRegion) && formData.region_name && (
                  <div
                    className="absolute border-3 border-rose-500 bg-rose-500/30 rounded cursor-move shadow-2xl ring-2 ring-rose-400"
                    style={{
                      left: `${formData.x}%`,
                      top: `${formData.y}%`,
                      width: `${formData.width}%`,
                      height: `${formData.height}%`,
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, 'drag');
                    }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-white whitespace-nowrap bg-rose-600 px-2 py-1 rounded shadow-lg pointer-events-none">
                      {formData.region_name}
                    </div>
                    <div 
                      className="absolute bottom-0 right-0 w-4 h-4 bg-rose-600 rounded-tl cursor-nwse-resize hover:bg-rose-700 shadow-lg"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleMouseDown(e, 'resize');
                      }}
                    />
                    
                    {/* Coordenadas */}
                    <div className="absolute -top-6 left-0 text-xs font-mono bg-slate-800 text-white px-2 py-0.5 rounded whitespace-nowrap">
                      x: {formData.x.toFixed(1)}% y: {formData.y.toFixed(1)}%
                    </div>
                    <div className="absolute -bottom-6 right-0 text-xs font-mono bg-slate-800 text-white px-2 py-0.5 rounded whitespace-nowrap">
                      {formData.width.toFixed(1)}% × {formData.height.toFixed(1)}%
                    </div>
                  </div>
                )}
                
                {/* Instruções */}
                {isCreatingNew && !formData.region_name && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-lg p-6 text-center max-w-sm">
                      <p className="text-sm text-slate-700 mb-2">
                        Primeiro, preencha o nome do foco
                      </p>
                      <p className="text-xs text-slate-500">
                        Depois clique no diagrama para posicionar
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Legenda */}
              <div className="mt-3 flex gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-rose-500 bg-rose-500/30 rounded"></div>
                  <span className="text-slate-600">Em edição</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-400 bg-slate-400/20 rounded"></div>
                  <span className="text-slate-600">Cadastrado</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}