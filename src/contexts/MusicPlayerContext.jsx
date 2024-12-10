import { createContext, useContext, useState, useRef, useEffect } from 'react';

const MusicPlayerContext = createContext();

export function useMusicPlayer() {
  return useContext(MusicPlayerContext);
}

export function MusicPlayerProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [error, setError] = useState(null);
  const playerRef = useRef(null);
  const initializationTimeout = useRef(null);

  // Initialize YouTube API with timeout
  useEffect(() => {
    const initializeYouTubeAPI = () => {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // Set a timeout for initialization
      initializationTimeout.current = setTimeout(() => {
        if (!isPlayerReady) {
          setError('Failed to initialize YouTube player. Please refresh the page.');
        }
      }, 10000); // 10 second timeout
    };

    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(initializationTimeout.current);
      setIsPlayerReady(true);
      setError(null);
    };

    initializeYouTubeAPI();

    return () => {
      clearTimeout(initializationTimeout.current);
      window.onYouTubeIframeAPIReady = null;
    };
  }, []);

  const playSong = async (song) => {
    try {
      if (!song?.id) {
        throw new Error('Invalid song data');
      }

      if (currentSong?.id === song.id) {
        // Toggle play/pause if same song
        setIsPlaying(!isPlaying);
      } else {
        // Play new song
        setCurrentSong(song);
        setIsPlaying(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error playing song:', err);
      setError('Failed to play song. Please try again.');
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (!currentSong) {
      setError('No song selected');
      return;
    }
    setIsPlaying(prev => !prev);
  };

  const handleVolumeChange = (newVolume) => {
    if (newVolume < 0 || newVolume > 1) {
      console.error('Invalid volume value:', newVolume);
      return;
    }
    setVolume(newVolume);
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    currentSong,
    isPlaying,
    volume,
    error,
    isPlayerReady,
    playSong,
    togglePlayPause,
    setVolume: handleVolumeChange,
    clearError,
    playerRef
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
} 