'use client';

import { useState, useRef, useEffect } from 'react';

export default function BackgroundMusic() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.5;

    const playAudio = () => {
      // Modern browsers require a user interaction (click, tap) to play audio.
      // Scrolling is often NOT considered a deliberate interaction for audio.
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            // Remove listeners once playing starts
            document.removeEventListener('click', playAudio);
            document.removeEventListener('touchstart', playAudio);
            document.removeEventListener('keydown', playAudio);
          })
          .catch((error) => {
            // Auto-play was prevented
            console.log("Autoplay prevented:", error);
            setIsPlaying(false);
          });
      }
    };

    // Try to play immediately (often blocked)
    playAudio();

    // Add listeners for valid user interactions
    document.addEventListener('click', playAudio);
    // touchstart is usually enough on mobile to trigger "user gesture"
    document.addEventListener('touchstart', playAudio); 
    document.addEventListener('keydown', playAudio);

    return () => {
      document.removeEventListener('click', playAudio);
      document.removeEventListener('touchstart', playAudio);
      document.removeEventListener('keydown', playAudio);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <audio ref={audioRef} loop preload="auto">
        <source src="/cello-circle.m4a" type="audio/mp4" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
