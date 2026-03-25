'use client';

import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';

export default function BackgroundMusic() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.5;

    const playAudio = () => {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            document.removeEventListener('click', playAudio);
            document.removeEventListener('touchstart', playAudio);
            document.removeEventListener('keydown', playAudio);
          })
          .catch((error) => {
            console.log("Autoplay prevented:", error);
            setIsPlaying(false);
          });
      }
    };

    playAudio();
    document.addEventListener('click', playAudio);
    document.addEventListener('touchstart', playAudio);
    document.addEventListener('keydown', playAudio);

    // Listen for journey-start event to fade out
    const handleFadeOut = () => {
      gsap.to(audio, { volume: 0, duration: 4, ease: 'power2.inOut', onComplete: () => {
        audio.pause();
        setIsPlaying(false);
      }});
    };
    window.addEventListener('journey-start', handleFadeOut);

    return () => {
      document.removeEventListener('click', playAudio);
      document.removeEventListener('touchstart', playAudio);
      document.removeEventListener('keydown', playAudio);
      window.removeEventListener('journey-start', handleFadeOut);
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
