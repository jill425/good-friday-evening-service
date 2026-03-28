'use client';

import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';

export default function BackgroundMusic() {
  const audioRef = useRef(null);
  const gainRef = useRef(null);
  const audioCtxRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = false;
    let journeyStarted = false;
    let bgmFading = false;
    let bgmTween = null;
    const targetVol = 0.5;
    const vol = { value: targetVol };

    // Use Web Audio API GainNode for volume control (iOS ignores audio.volume)
    const setupGain = () => {
      if (audioCtxRef.current) return;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaElementSource(audio);
      const gain = ctx.createGain();
      gain.gain.value = targetVol;
      source.connect(gain);
      gain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      gainRef.current = gain;
    };

    const syncGain = () => {
      if (gainRef.current) gainRef.current.gain.value = vol.value;
    };

    const onTimeUpdate = () => {
      if (journeyStarted) return;
      if (!bgmFading && audio.duration && audio.currentTime >= audio.duration - 2) {
        bgmFading = true;
        bgmTween = gsap.to(vol, { value: 0, duration: 2, ease: 'power2.inOut', onUpdate: syncGain });
      }
    };
    const onEnded = () => {
      if (journeyStarted) return;
      if (bgmTween) bgmTween.kill();
      bgmFading = false;
      audio.currentTime = 0;
      vol.value = 0;
      syncGain();
      audio.play().catch(() => {});
      bgmTween = gsap.to(vol, { value: targetVol, duration: 2, ease: 'power2.inOut', onUpdate: syncGain });
    };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    const playAudio = () => {
      if (journeyStarted) return;
      setupGain();
      const tryPlay = () => {
        audio.play()
          .then(() => {
            setIsPlaying(true);
            document.removeEventListener('click', playAudio);
            document.removeEventListener('touchstart', playAudio);
            document.removeEventListener('keydown', playAudio);
          })
          .catch(() => {});
      };
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume().then(tryPlay);
      } else {
        tryPlay();
      }
    };

    // Retry play on every interaction / scroll if audio is not playing
    const retryPlay = () => {
      if (journeyStarted || !audio.paused) return;
      playAudio();
    };

    playAudio();
    document.addEventListener('click', playAudio);
    document.addEventListener('touchstart', playAudio);
    document.addEventListener('keydown', playAudio);
    document.addEventListener('touchstart', retryPlay, { passive: true });
    document.addEventListener('scroll', retryPlay, { passive: true });
    document.addEventListener('mousedown', retryPlay);

    // Listen for journey-start event to fade out (1.5s — faster than before)
    const handleFadeOut = () => {
      journeyStarted = true;
      document.removeEventListener('click', playAudio);
      document.removeEventListener('touchstart', playAudio);
      document.removeEventListener('keydown', playAudio);
      document.removeEventListener('touchstart', retryPlay);
      document.removeEventListener('scroll', retryPlay);
      document.removeEventListener('mousedown', retryPlay);
      gsap.to(vol, { value: 0, duration: 1.5, ease: 'power2.inOut', onUpdate: syncGain, onComplete: () => {
        audio.pause();
        setIsPlaying(false);
      }});
    };
    window.addEventListener('journey-start', handleFadeOut);

    return () => {
      document.removeEventListener('click', playAudio);
      document.removeEventListener('touchstart', playAudio);
      document.removeEventListener('keydown', playAudio);
      document.removeEventListener('touchstart', retryPlay);
      document.removeEventListener('scroll', retryPlay);
      document.removeEventListener('mousedown', retryPlay);
      window.removeEventListener('journey-start', handleFadeOut);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <audio ref={audioRef} preload="auto">
        <source src="/cello-circle.m4a" type="audio/mp4" />
      </audio>
    </div>
  );
}
