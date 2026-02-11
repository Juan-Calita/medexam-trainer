import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function AdminPulmonar() {
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    game_type: 'auscultation_pulmonar',
    difficulty: 'easy',
    audio_description: '',
    correct_answer: '',
    options: ['', '', ''],
    explanation: '',
    order: 0,
    active: true
  });

  const queryClient = useQueryClient();

  const { data: questions = [] } = useQuery({
    queryKey: ['questions', 'auscultation_pulmonar'],
    queryFn: () => base44.entities.Question.filter({ game_type: 'auscultation_pulmonar' }),
  });

  const { data: audioFiles = [] } = useQuery({
    queryKey: ['audioFiles', 'auscultation_pulmonar'],
    queryFn: () => base44.entities.AudioFile.filter({ game_type: 'auscultation_pulmonar' }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Question.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      resetForm();
      toast.success('Questão criada!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Question.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setEditingQuestion(null);
      resetForm();
      toast.success('Questão atualizada!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Question.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Questão removida!');
    },
  });

  const resetForm = () => {
    setFormData({
      game_type: 'auscultation_pulmonar',
      difficulty: 'easy',
      audio_description: '',
      correct_answer: '',
      options: ['', '', ''],
      explanation: '',
      order: questions.length,
      active: true
    });
    setEditingQuestion(null);
  };

  const handleEdit = (question) => {
    setEditingQuestion(question.id);
    setFormData({
      game_type: question.game_type,
      difficulty: question.difficulty,
      audio_description: question.audio_description || '',
      correct_answer: question.correct_answer,
      options: question.options,
      explanation: question.explanation,
      order: question.order || 0,
      active: question.active !== false
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.correct_answer || !formData.explanation || formData.options.some(o => !o)) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const removeOption = (index) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const soundType = prompt('Digite o nome/tipo deste som (ex: Sibilos, Roncos):');
      if (!soundType) {
        toast.error('Nome do som é obrigatório');
        setUploading(false);
        return;
      }

      await base44.entities.AudioFile.create({
        name: file.name,
        file_url,
        game_type: 'auscultation_pulmonar',
        sound_type: soundType,
        description: ''
      });

      queryClient.invalidateQueries({ queryKey: ['audioFiles'] });
      setFormData({ ...formData, correct_answer: soundType });
      toast.success('Áudio enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar áudio');
    } finally {
      setUploading(false);
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
            <h1 className="text-lg font-semibold text-slate-800">Questões - Ausculta Pulmonar</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {editingQuestion ? 'Editar Questão' : 'Nova Questão'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Dificuldade
                  </label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Descrição do Áudio / Contexto Clínico
                  </label>
                  <Input
                    value={formData.audio_description}
                    onChange={(e) => setFormData({ ...formData, audio_description: e.target.value })}
                    placeholder="Ex: Sons musicais agudos durante a expiração"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Resposta Correta *
                  </label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.correct_answer}
                      onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o som" />
                      </SelectTrigger>
                      <SelectContent>
                        {audioFiles.map(audio => (
                          <SelectItem key={audio.id} value={audio.sound_type}>
                            {audio.sound_type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('audio-upload-input').click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </Button>
                    <input
                      id="audio-upload-input"
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Opções de Resposta *
                  </label>
                  <div className="space-y-2">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Opção ${index + 1}`}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant={formData.correct_answer === option ? "default" : "outline"}
                          onClick={() => setFormData({ ...formData, correct_answer: option })}
                          disabled={!option}
                          className={formData.correct_answer === option ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                        >
                          {formData.correct_answer === option ? '✓ Correta' : 'Marcar'}
                        </Button>
                        {formData.options.length > 2 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeOption(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Opção
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Explicação *
                  </label>
                  <Textarea
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    placeholder="Explicação detalhada da resposta correta"
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                    <Save className="w-4 h-4 mr-2" />
                    {editingQuestion ? 'Atualizar' : 'Criar'}
                  </Button>
                  {editingQuestion && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Questões Cadastradas ({questions.length})
              </h2>
            </div>

            {questions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-slate-500">
                  Nenhuma questão cadastrada ainda
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {questions.sort((a, b) => (a.order || 0) - (b.order || 0)).map(question => (
                  <Card key={question.id} className={!question.active ? 'opacity-50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={
                              question.difficulty === 'easy' ? 'default' :
                              question.difficulty === 'medium' ? 'secondary' : 'destructive'
                            }>
                              {question.difficulty === 'easy' ? 'Fácil' :
                               question.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                            </Badge>
                            {!question.active && <Badge variant="outline">Inativa</Badge>}
                          </div>
                          <p className="text-sm font-medium text-slate-800 mb-1">
                            {question.correct_answer}
                          </p>
                          <p className="text-xs text-slate-600 mb-2">
                            {question.audio_description}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {question.explanation}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(question)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(question.id)}
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