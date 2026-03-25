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
    audio.loop = false; // manually loop with fade
    let journeyStarted = false;
    let bgmFading = false;
    let bgmTween = null;
    const targetVol = 0.5;

    const onTimeUpdate = () => {
      if (journeyStarted) return;
      if (!bgmFading && audio.duration && audio.currentTime >= audio.duration - 2) {
        bgmFading = true;
        bgmTween = gsap.to(audio, { volume: 0, duration: 2, ease: 'power2.inOut' });
      }
    };
    const onEnded = () => {
      if (journeyStarted) return;
      if (bgmTween) bgmTween.kill();
      bgmFading = false;
      audio.currentTime = 0;
      audio.volume = 0;
      audio.play().catch(() => {});
      bgmTween = gsap.to(audio, { volume: targetVol, duration: 2, ease: 'power2.inOut' });
    };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    const playAudio = () => {
      if (journeyStarted) return;
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
      journeyStarted = true;
      document.removeEventListener('click', playAudio);
      document.removeEventListener('touchstart', playAudio);
      document.removeEventListener('keydown', playAudio);
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
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
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
      <audio ref={audioRef} preload="auto">
        <source src="/cello-circle.m4a" type="audio/mp4" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
