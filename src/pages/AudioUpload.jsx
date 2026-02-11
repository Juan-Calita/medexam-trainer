import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Upload, Check, Copy, ArrowLeft, Music, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function AudioUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [editingFile, setEditingFile] = useState({});
  const queryClient = useQueryClient();

  const saveAudioMutation = useMutation({
    mutationFn: (audioData) => base44.entities.AudioFile.create(audioData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audioFiles'] });
      toast.success('Áudio salvo na biblioteca!');
    },
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate audio files
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    if (audioFiles.length === 0) {
      toast.error('Nenhum arquivo de áudio válido encontrado');
      return;
    }

    setUploading(true);
    const results = [];
    
    try {
      for (const file of audioFiles) {
        const result = await base44.integrations.Core.UploadFile({ file });
        results.push({ name: file.name, url: result.file_url });
      }
      setUploadedFiles(prev => [...prev, ...results]);
      toast.success(`${results.length} arquivo(s) enviado(s) com sucesso!`);
    } catch (error) {
      toast.error('Erro ao enviar arquivos');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiada!');
  };

  const handleSaveAudio = (index) => {
    const file = uploadedFiles[index];
    const metadata = editingFile[index] || {};
    
    if (!metadata.game_type || !metadata.sound_type) {
      toast.error('Preencha o tipo de jogo e tipo de som');
      return;
    }

    saveAudioMutation.mutate({
      name: file.name,
      file_url: file.url,
      game_type: metadata.game_type,
      sound_type: metadata.sound_type,
      description: metadata.description || '',
    });
  };

  const updateMetadata = (index, field, value) => {
    setEditingFile(prev => ({
      ...prev,
      [index]: { ...prev[index], [field]: value }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Link 
          to={createPageUrl('Home')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </Link>

        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-6 h-6 text-teal-600" />
              Upload de Áudio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id="audio-upload"
                disabled={uploading}
                multiple
                webkitdirectory=""
                directory=""
              />
              <label htmlFor="audio-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-700 font-medium mb-1">
                  {uploading ? 'Enviando...' : 'Clique para selecionar arquivos ou pasta'}
                </p>
                <p className="text-sm text-slate-500">
                  MP3, WAV, OGG, etc. (múltiplos arquivos suportados)
                </p>
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <span className="text-sm font-medium text-slate-700">
                  Arquivos Enviados ({uploadedFiles.length}):
                </span>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="p-4 bg-slate-100 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 truncate flex-1">
                          {file.name}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(file.url)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <audio controls className="w-full">
                        <source src={file.url} />
                      </audio>

                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={editingFile[index]?.game_type || ''}
                          onValueChange={(value) => updateMetadata(index, 'game_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de jogo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auscultation_pulmonar">Ausculta Pulmonar</SelectItem>
                            <SelectItem value="auscultation_cardiaca">Ausculta Cardíaca</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          placeholder="Tipo de som"
                          value={editingFile[index]?.sound_type || ''}
                          onChange={(e) => updateMetadata(index, 'sound_type', e.target.value)}
                        />
                      </div>

                      <Input
                        placeholder="Descrição (opcional)"
                        value={editingFile[index]?.description || ''}
                        onChange={(e) => updateMetadata(index, 'description', e.target.value)}
                      />

                      <Button
                        size="sm"
                        className="w-full bg-teal-600 hover:bg-teal-700"
                        onClick={() => handleSaveAudio(index)}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Salvar na Biblioteca
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}