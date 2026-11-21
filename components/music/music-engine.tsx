"use client";

import { useEffect } from "react";
import { site } from "@/lib/site";
import { registerMusicController, setMusicState } from "@/lib/music/control";

/**
 * Mesin musik latar tanpa tampilan: satu <audio> yang diputar berulang dari file di public/music/.
 * Dikontrol lewat lib/music/control.ts (chat SEA AI & tombol jeda). Dipasang di SiteChrome,
 * jadi musik tetap jalan saat pindah halaman.
 */
export function MusicEngine() {
  useEffect(() => {
    const src = site.music.src;
    if (!src) return;

    const audio = new Audio();
    audio.src = src;
    audio.loop = true;
    audio.preload = "none"; // file baru diunduh saat pertama kali diputar
    audio.volume = 0.6;

    const onPlaying = () => setMusicState({ playing: true, loading: false, error: null });
    const onPause = () => setMusicState({ playing: false, loading: false });
    const onWaiting = () => setMusicState({ loading: true });
    const onError = () => setMusicState({ playing: false, loading: false, error: "File musik tidak bisa diputar." });
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("error", onError);

    registerMusicController({
      play: () => {
        setMusicState({ loading: true, error: null });
        audio.play().catch(() => setMusicState({ playing: false, loading: false, error: "Browser menahan musik, coba lagi ya." }));
      },
      pause: () => audio.pause(),
    });

    return () => {
      registerMusicController(null);
      audio.pause();
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("error", onError);
      audio.src = "";
    };
  }, []);

  return null;
}
