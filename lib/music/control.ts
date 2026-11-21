"use client";

import { useSyncExternalStore } from "react";
import { site } from "@/lib/site";

/**
 * Pusat kontrol musik latar. Mesin audio (components/music/music-engine.tsx) mendaftarkan
 * pengontrolnya di sini; chat SEA AI dan tombol jeda memanggil playMusic()/pauseMusic() dan
 * membaca status lewat useMusicState().
 */

export type MusicState = { available: boolean; playing: boolean; loading: boolean; error: string | null };

const initial: MusicState = { available: Boolean(site.music.src), playing: false, loading: false, error: null };
let state = initial;
const listeners = new Set<() => void>();

export function setMusicState(patch: Partial<MusicState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function useMusicState(): MusicState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => initial,
  );
}

type Controller = { play: () => void; pause: () => void };
let controller: Controller | null = null;

export function registerMusicController(c: Controller | null) {
  controller = c;
}

// Dipanggil langsung di dalam aksi pengguna (kirim chat / klik) supaya browser mengizinkan audio diputar
export const playMusic = () => controller?.play();
export const pauseMusic = () => controller?.pause();
export const toggleMusic = () => (state.playing ? pauseMusic() : playMusic());

/**
 * Kenali perintah musik di pesan chat, mis. "putar musik", "nyalain lagu dong", "matiin musiknya".
 * Mengembalikan null untuk pertanyaan biasa (mis. "lagu favorit Wayan apa?") supaya tetap dijawab AI.
 */
export function detectMusicIntent(text: string): "play" | "pause" | null {
  const t = text.toLowerCase().trim();
  if (t.length > 80 || !/(musik|music|lagu|song)/.test(t)) return null;
  if (/(matiin|matikan|mati(in)?kan|hentikan|berhenti|stop|pause|jeda|udahan|cukup|\boff\b)/.test(t)) return "pause";
  if (/(putar|puter|nyala|hidupkan|idupin|mainkan|setel|play|dengerin|lanjut|\bon\b)/.test(t)) return "play";
  return null;
}
