import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PlaybackInfo } from '../types';
import { PlayIcon, PauseIcon, LoadingIcon } from './icons';

interface WaveformPlayerProps {
  audioUrl: string;
  onTimeUpdate?: (currentTime: number) => void;
}

const WAVE_COLOR = "#94A3B8";
const MASK_COLOR = "#6366F1";
const CURSOR_COLOR = "#F1F5F9";

const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

const formatTime = (seconds: number) => {
    const floorSeconds = Math.floor(seconds);
    const minutes = Math.floor(floorSeconds / 60);
    const remainingSeconds = floorSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export const WaveformPlayer: React.FC<WaveformPlayerProps> = ({ audioUrl, onTimeUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [playbackInfo, setPlaybackInfo] = useState<PlaybackInfo>({
    isPlaying: false,
    progress: 0,
    currentTime: "0:00",
    totalTime: "0:00",
  });
  const [isLoading, setIsLoading] = useState(true);

  const drawWaveform = useCallback((buffer: AudioBuffer, progress: number = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = buffer.getChannelData(0);
    const width = canvas.width;
    const height = canvas.height;
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.clearRect(0, 0, width, height);
    
    ctx.strokeStyle = WAVE_COLOR;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, amp);
    for (let i = 0; i < width; i++) {
        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }
        ctx.lineTo(i, (1 + min) * amp);
        ctx.lineTo(i, (1 + max) * amp);
    }
    ctx.stroke();

    if (progress > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width * progress, height);
        ctx.clip();
        ctx.strokeStyle = MASK_COLOR;
        ctx.stroke();
        ctx.restore();
    }

    if(progress > 0 && progress < 1) {
        ctx.beginPath();
        ctx.moveTo(width * progress, 0);
        ctx.lineTo(width * progress, height);
        ctx.strokeStyle = CURSOR_COLOR;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
  }, []);

  useEffect(() => {
    if (!audioUrl) return;

    setIsLoading(true);
    setAudioBuffer(null); // Reset buffer on new URL

    const fetchAndDecodeAudio = async () => {
        try {
            const response = await fetch(audioUrl);
            const arrayBuffer = await response.arrayBuffer();
            if(audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            const buffer = await audioContext.decodeAudioData(arrayBuffer);
            setAudioBuffer(buffer);
            setPlaybackInfo(prev => ({ ...prev, totalTime: formatTime(buffer.duration), progress: 0, currentTime: '0:00', isPlaying: false }));
        } catch (err) {
            console.error("Error decoding audio data from URL", err);
        } finally {
            setIsLoading(false);
        }
    }

    fetchAndDecodeAudio();

  }, [audioUrl]);
  
  useEffect(() => {
    if (audioBuffer) {
      drawWaveform(audioBuffer, playbackInfo.progress);
    }
  }, [audioBuffer, drawWaveform, playbackInfo.progress]);

  const updateProgress = useCallback(() => {
    if (audioRef.current && audioRef.current.duration) {
      const currentTime = audioRef.current.currentTime;
      const progress = currentTime / audioRef.current.duration;
      setPlaybackInfo(prev => ({
        ...prev,
        progress,
        currentTime: formatTime(currentTime),
      }));
      onTimeUpdate?.(currentTime);
    }
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  }, [onTimeUpdate]);

  const handlePlayPause = () => {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    if (playbackInfo.isPlaying) {
      audioRef.current?.pause();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setPlaybackInfo(prev => ({ ...prev, isPlaying: false }));
    } else {
      audioRef.current?.play();
      animationFrameRef.current = requestAnimationFrame(updateProgress);
      setPlaybackInfo(prev => ({ ...prev, isPlaying: true }));
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioRef.current || !audioBuffer) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));
    const newTime = progress * audioBuffer.duration;
    audioRef.current.currentTime = newTime;
    
    setPlaybackInfo(prev => ({
        ...prev,
        progress,
        currentTime: formatTime(newTime),
    }));
    onTimeUpdate?.(newTime);
  };

  if (isLoading) {
    return (
        <div className="flex items-center gap-4 h-[104px]">
            <div className="p-3 bg-slate-700 rounded-full">
                <LoadingIcon className="w-6 h-6 text-white animate-spin" />
            </div>
            <div className="flex-1">
                <p className="text-text-secondary">Carregando áudio...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <button 
        onClick={handlePlayPause}
        className="p-3 bg-slate-700 rounded-full hover:bg-primary transition-colors"
        aria-label={playbackInfo.isPlaying ? 'Pause' : 'Play'}
    >
        {playbackInfo.isPlaying 
            ? <PauseIcon className="w-6 h-6 text-white" /> 
            : <PlayIcon className="w-6 h-6 text-white" />
        }
      </button>
      <div className="flex-1 flex flex-col justify-center">
        <canvas 
            ref={canvasRef} 
            width="500" 
            height="80" 
            className="cursor-pointer w-full"
            onClick={handleSeek}
        />
        <div className="flex justify-between text-xs text-text-secondary font-mono mt-1">
            <span>{playbackInfo.currentTime}</span>
            <span>{playbackInfo.totalTime}</span>
        </div>
      </div>
      {audioUrl && <audio 
            key={audioUrl} // Force re-render when URL changes
            ref={audioRef} 
            src={audioUrl} 
            onEnded={() => {
                setPlaybackInfo(prev => ({ ...prev, isPlaying: false, progress: 1 }));
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                if(audioRef.current) onTimeUpdate?.(audioRef.current.duration);
            }} 
            hidden 
        />}
    </div>
  );
};