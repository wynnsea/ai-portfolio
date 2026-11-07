"use client";

import { useEffect, useRef } from "react";

/**
 * Efek "bekas air" di belakang kursor: riak yang melebar & memudar di sepanjang jalur kursor,
 * tetesan kecil, dan cipratan saat klik. Digambar di satu <canvas> transparan yang tidak
 * menangkap klik (pointer-events: none).
 *
 * Hanya aktif di perangkat dengan mouse (pointer: fine + hover) dan kalau pengunjung tidak
 * memilih "kurangi animasi". Loop animasi berhenti sendiri saat tidak ada riak.
 */

type Ripple = { x: number; y: number; maxR: number; age: number; life: number; width: number };
type Drop = { x: number; y: number; r: number; age: number; life: number };

const MAX_RIPPLES = 70;
const MAX_DROPS = 50;
const SPAWN_EVERY_PX = 22; // jarak gerak kursor antar riak

// Dua warna supaya terlihat di latar terang (biru tua) maupun gelap (biru muda)
const LIGHT = "167, 216, 242"; // --color-accent
const DARK = "42, 86, 119"; // --color-primary

export function WaterCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reduced.matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ripples: Ripple[] = [];
    const drops: Drop[] = [];
    let last: { x: number; y: number; t: number } | null = null;
    let travelled = 0;
    let frame = 0;
    let prevTime = 0;

    const addRipple = (x: number, y: number, maxR: number, life = 900, width = 1.4) => {
      ripples.push({ x, y, maxR, age: 0, life, width });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
    };
    const addDrop = (x: number, y: number) => {
      drops.push({ x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 10, r: 1 + Math.random() * 2.2, age: 0, life: 700 + Math.random() * 500 });
      if (drops.length > MAX_DROPS) drops.shift();
    };

    const draw = (time: number) => {
      const dt = prevTime ? Math.min(time - prevTime, 50) : 16;
      prevTime = time;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.age += dt;
        const p = rp.age / rp.life;
        if (p >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        // Melebar cepat di awal lalu melambat, memudar perlahan
        const eased = 1 - Math.pow(1 - p, 3);
        const r = 2 + eased * rp.maxR;
        const fade = Math.pow(1 - p, 1.6);

        // Isi lembut di tengah (genangan)
        const fill = ctx.createRadialGradient(rp.x, rp.y, 0, rp.x, rp.y, r);
        fill.addColorStop(0, `rgba(${LIGHT}, ${0.16 * fade})`);
        fill.addColorStop(1, `rgba(${LIGHT}, 0)`);
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Cincin riak: lapis terang tebal + lapis gelap tipis
        ctx.lineWidth = rp.width * 2.4;
        ctx.strokeStyle = `rgba(${LIGHT}, ${0.45 * fade})`;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = rp.width;
        ctx.strokeStyle = `rgba(${DARK}, ${0.22 * fade})`;
        ctx.stroke();

        // Kilau kecil di sisi atas-kiri cincin, biar terasa seperti air
        ctx.lineWidth = rp.width;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * fade})`;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, Math.max(1, r - rp.width * 1.5), Math.PI * 1.1, Math.PI * 1.45);
        ctx.stroke();
      }

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.age += dt;
        const p = d.age / d.life;
        if (p >= 1) {
          drops.splice(i, 1);
          continue;
        }
        const fade = 1 - p;
        ctx.fillStyle = `rgba(${LIGHT}, ${0.55 * fade})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${DARK}, ${0.18 * fade})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      // Berhenti kalau tidak ada yang perlu digambar (hemat baterai)
      if (ripples.length || drops.length) frame = requestAnimationFrame(draw);
      else {
        frame = 0;
        prevTime = 0;
      }
    };
    const start = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const now = performance.now();
      if (!last) {
        last = { x: e.clientX, y: e.clientY, t: now };
        return;
      }
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      const dist = Math.hypot(dx, dy);
      const speed = dist / Math.max(1, now - last.t); // px per ms
      travelled += dist;
      last = { x: e.clientX, y: e.clientY, t: now };

      if (travelled >= SPAWN_EVERY_PX) {
        travelled = 0;
        // Gerakan cepat = riak lebih besar
        addRipple(e.clientX, e.clientY, Math.min(14 + speed * 22, 46));
        if (Math.random() < 0.55) addDrop(e.clientX, e.clientY);
        start();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      // Cipratan: beberapa cincin bertingkat + tetesan
      addRipple(e.clientX, e.clientY, 34, 1000, 1.8);
      addRipple(e.clientX, e.clientY, 58, 1300, 1.4);
      addRipple(e.clientX, e.clientY, 84, 1600, 1);
      for (let i = 0; i < 5; i++) addDrop(e.clientX, e.clientY);
      start();
    };
    const onLeave = () => {
      last = null;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-40 h-full w-full" />;
}
