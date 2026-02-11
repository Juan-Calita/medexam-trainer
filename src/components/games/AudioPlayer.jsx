import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export default function AudioPlayer({ audioUrl, onEnded }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      onEnded?.();
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, onEnded]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Waveform visualization placeholder */}
      <div className="h-16 mb-4 flex items-center justify-center gap-1">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-150 ${
              isPlaying ? 'bg-teal-400' : 'bg-slate-600'
            }`}
            style={{
              height: `${Math.random() * 50 + 20}%`,
              opacity: progress > (i / 40) * 100 ? 1 : 0.4,
              animation: isPlaying ? `pulse ${0.3 + Math.random() * 0.5}s ease-in-out infinite alternate` : 'none'
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-slate-400">
          <span>{formatTime(audioRef.current?.currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={restart}
          className="text-slate-400 hover:text-white hover:bg-slate-700"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
        
        <Button
          onClick={togglePlay}
          className="w-14 h-14 rounded-full bg-teal-500 hover:bg-teal-400 text-white"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-1" />
          )}
        </Button>

        <div className="flex items-center gap-2 ml-2">
          <Volume2 className="w-4 h-4 text-slate-400" />
          <Slider
            value={[volume * 100]}
            onValueChange={([val]) => setVolume(val / 100)}
            max={100}
            step={1}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
}