import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Music, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const EXPECTED_SOUNDS = {
  auscultation_pulmonar: [
    'Murmúrio vesicular',
    'Sibilos',
    'Estertores finos',
    'Estertores grossos',
    'Roncos',
    'Estridor',
    'Atrito pleural',
    'Broncovesicular',
    'Som traqueal',
    'Pectoriloquia',
    'Egofonia',
    'Som vocal normal',
    'Egofonia normal',
    'Grasmido'
  ],
  auscultation_cardiaca: [
    'B1 e B2 normais',
    'Desdobramento de B1',
    'Desdobramento de B2',
    'B3',
    'B4',
    'Clique mesossistólico',
    'Sopro protossistólico',
    'Sopro mesossistólico',
    'Sopro telessistólico',
    'Sopro holossistólico',
    'Sopro protodiastólico'
  ]
};

export default function AudioLibrary() {
  const queryClient = useQueryClient();

  const { data: audioFiles = [], isLoading } = useQuery({
    queryKey: ['audioFiles'],
    queryFn: () => base44.entities.AudioFile.list('-created_date', 100),
  });

  const deleteAudioMutation = useMutation({
    mutationFn: (id) => base44.entities.AudioFile.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audioFiles'] });
      toast.success('Áudio removido!');
    },
  });

  const pulmonarFiles = audioFiles.filter(f => f.game_type === 'auscultation_pulmonar');
  const cardiacaFiles = audioFiles.filter(f => f.game_type === 'auscultation_cardiaca');

  const getMissingSounds = (gameType, files) => {
    const uploadedTypes = files.map(f => f.sound_type);
    return EXPECTED_SOUNDS[gameType].filter(type => !uploadedTypes.includes(type));
  };

  const renderGameSection = (gameType, files, title) => {
    const missingSounds = getMissingSounds(gameType, files);
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant="outline">
              {files.length} / {EXPECTED_SOUNDS[gameType].length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {missingSounds.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 mb-1">
                    Sons faltando ({missingSounds.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {missingSounds.map(sound => (
                      <Badge key={sound} variant="outline" className="text-xs">
                        {sound}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {files.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum áudio carregado ainda</p>
          ) : (
            <div className="space-y-2">
              {files.map(file => (
                <div key={file.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Music className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-700 truncate">
                          {file.sound_type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{file.name}</p>
                      {file.description && (
                        <p className="text-xs text-slate-600 mt-1">{file.description}</p>
                      )}
                      <audio controls className="w-full mt-2" style={{ height: '32px' }}>
                        <source src={file.file_url} />
                      </audio>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteAudioMutation.mutate(file.id)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to={createPageUrl('Home')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </Link>
            <Link to={createPageUrl('AudioUpload')}>
              <Button className="bg-teal-600 hover:bg-teal-700">
                Fazer Upload
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Biblioteca de Áudios</h1>
          <p className="text-slate-600">
            Gerencie os áudios para os jogos de ausculta. Cada som precisa ter o tipo exato esperado.
          </p>
        </div>

        <div className="space-y-6">
          {renderGameSection('auscultation_pulmonar', pulmonarFiles, 'Ausculta Pulmonar')}
          {renderGameSection('auscultation_cardiaca', cardiacaFiles, 'Ausculta Cardíaca')}
        </div>
      </main>
    </div>
  );
}