import React, { useEffect, useRef, useState } from 'react';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { FaPlay, FaPause, FaVolumeUp, FaExclamationCircle } from 'react-icons/fa';

interface Song {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail?: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function MiniPlayer(): JSX.Element | null {
  const { 
    currentSong, 
    isPlaying, 
    volume, 
    error,
    isPlayerReady,
    togglePlayPause, 
    setVolume,
    clearError 
  } = useMusicPlayer();
  
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Create YouTube player when API is ready and container is mounted
  useEffect(() => {
    if (isPlayerReady && playerContainerRef.current && currentSong) {
      try {
        playerInstanceRef.current = new window.YT.Player(playerContainerRef.current, {
          height: '60',
          width: '100',
          videoId: currentSong.id,
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3, // Disable video annotations
          },
          events: {
            onReady: (event: any) => {
              event.target.setVolume(volume * 100);
              setPlayerError(null);
            },
            onError: (event: any) => {
              console.error('YouTube player error:', event);
              setPlayerError('Failed to load video. Please try another song.');
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                togglePlayPause();
              }
            }
          }
        });
      } catch (err) {
        console.error('Error creating YouTube player:', err);
        setPlayerError('Failed to initialize player');
      }
    }

    return () => {
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy();
        } catch (error) {
          console.error('Error destroying player:', error);
        }
      }
    };
  }, [isPlayerReady, currentSong]);

  // Handle play/pause state changes
  useEffect(() => {
    if (playerInstanceRef.current?.getPlayerState) {
      try {
        if (isPlaying) {
          playerInstanceRef.current.playVideo();
        } else {
          playerInstanceRef.current.pauseVideo();
        }
      } catch (error) {
        console.error('Error controlling playback:', error);
        setPlayerError('Playback control failed');
      }
    }
  }, [isPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (playerInstanceRef.current?.setVolume) {
      try {
        playerInstanceRef.current.setVolume(volume * 100);
      } catch (error) {
        console.error('Error setting volume:', error);
      }
    }
  }, [volume]);

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Song Info */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div ref={playerContainerRef} className="w-[100px] h-[60px] rounded-lg overflow-hidden bg-gray-100" />
            {playerError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
                <FaExclamationCircle className="text-white" />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 line-clamp-1">{currentSong.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-1">{currentSong.channelTitle}</p>
            {(error || playerError) && (
              <p className="text-xs text-red-500 mt-1">{error || playerError}</p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-6">
          <button
            onClick={togglePlayPause}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            disabled={!!playerError}
          >
            {isPlaying ? (
              <FaPause className="w-6 h-6 text-gray-700" />
            ) : (
              <FaPlay className="w-6 h-6 text-gray-700" />
            )}
          </button>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <FaVolumeUp className="w-4 h-4 text-gray-500" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 accent-primary-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 