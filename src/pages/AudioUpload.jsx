import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Upload, Check, Copy, ArrowLeft, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function AudioUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate audio file
    if (!file.type.startsWith('audio/')) {
      toast.error('Por favor, selecione um arquivo de áudio válido');
      return;
    }

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setUploadedUrl(result.file_url);
      toast.success('Arquivo enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar arquivo');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(uploadedUrl);
    setCopied(true);
    toast.success('URL copiada!');
    setTimeout(() => setCopied(false), 2000);
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
              />
              <label htmlFor="audio-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-700 font-medium mb-1">
                  {uploading ? 'Enviando...' : 'Clique para selecionar um arquivo de áudio'}
                </p>
                <p className="text-sm text-slate-500">
                  MP3, WAV, OGG, etc.
                </p>
              </label>
            </div>

            {uploadedUrl && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">URL do Arquivo:</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-emerald-600" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg break-all text-sm text-slate-700">
                  {uploadedUrl}
                </div>
                <audio controls className="w-full mt-3">
                  <source src={uploadedUrl} />
                  Seu navegador não suporta o elemento de áudio.
                </audio>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}