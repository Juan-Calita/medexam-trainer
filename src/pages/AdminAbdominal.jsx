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

export default function AdminAbdominal() {
  const [editingRegion, setEditingRegion] = useState(null);
  const [formData, setFormData] = useState({
    game_type: 'abdominal_regions',
    region_name: '',
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    explanation: '',
    order: 0,
    active: true
  });

  const queryClient = useQueryClient();

  const { data: regions = [] } = useQuery({
    queryKey: ['regions', 'abdominal_regions'],
    queryFn: () => base44.entities.GameRegion.filter({ game_type: 'abdominal_regions' }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GameRegion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      resetForm();
      toast.success('Região criada!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GameRegion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      setEditingRegion(null);
      resetForm();
      toast.success('Região atualizada!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GameRegion.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      toast.success('Região removida!');
    },
  });

  const resetForm = () => {
    setFormData({
      game_type: 'abdominal_regions',
      region_name: '',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
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
            <h1 className="text-lg font-semibold text-slate-800">Regiões - Abdominais</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {editingRegion ? 'Editar Região' : 'Nova Região'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Nome da Região *
                  </label>
                  <Input
                    value={formData.region_name}
                    onChange={(e) => setFormData({ ...formData, region_name: e.target.value })}
                    placeholder="Ex: Hipocôndrio Direito"
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
                    placeholder="Descrição anatômica da região"
                    rows={3}
                  />
                </div>

                {/* Preview */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <p className="text-xs font-medium text-slate-600 mb-2">Preview da Região</p>
                  <div className="relative w-full aspect-square bg-white rounded border border-slate-200">
                    <img 
                      src="https://raw.githubusercontent.com/leomartins1999/anatomical-visualization/master/src/assets/abdomen.png"
                      alt="Diagrama abdominal"
                      className="w-full h-full object-contain"
                    />
                    <div
                      className="absolute border-2 border-teal-500 bg-teal-500/20 rounded"
                      style={{
                        left: `${formData.x}%`,
                        top: `${formData.y}%`,
                        width: `${formData.width}%`,
                        height: `${formData.height}%`,
                      }}
                    >
                      {formData.region_name && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-teal-700 whitespace-nowrap bg-white/90 px-1 rounded">
                          {formData.region_name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700">
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
              Regiões Cadastradas ({regions.length})
            </h2>

            {regions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-slate-500">
                  Nenhuma região cadastrada ainda
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
                            {!region.active && <Badge variant="outline">Inativa</Badge>}
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