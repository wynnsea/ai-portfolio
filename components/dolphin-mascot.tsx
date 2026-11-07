import { useId } from "react";

/**
 * Maskot lumba-lumba Wynnsea, mengikuti gaya logo (public/brand/logo-v3.png): badan ramping
 * melengkung tanpa garis tepi, gradien toska di ekor & ujung sirip ke biru tua di kepala,
 * sirip tajam menyapu ke belakang, ekor bulan sabit, dan garis terang tipis di sepanjang badan.
 * Menghadap kanan, posisi horizontal (dipakai animasi lompat di components/wave-dolphin.tsx).
 * Versi file statis: public/brand/maskot-lumba.svg (dibuat dari komponen ini).
 */
export function DolphinMascot({ className = "" }: { className?: string }) {
  // ID unik supaya gradien tidak bentrok kalau ada beberapa maskot di halaman
  const id = useId().replace(/:/g, "");
  const body = `${id}-body`;
  const finUp = `${id}-fin-up`;
  const finDown = `${id}-fin-down`;
  const tail = `${id}-tail`;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -6 152 66" fill="none" aria-hidden className={className}>
      <defs>
        {/* Toska di ekor → biru di badan → biru tua di kepala, seperti logo */}
        <linearGradient id={body} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0%" stopColor="#34d3cf" />
          <stop offset="45%" stopColor="#22a2d8" />
          <stop offset="100%" stopColor="#1763ad" />
        </linearGradient>
        <linearGradient id={finUp} x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#3ad8d2" />
          <stop offset="100%" stopColor="#1c86c9" />
        </linearGradient>
        <linearGradient id={finDown} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1763ad" />
          <stop offset="100%" stopColor="#25a8d6" />
        </linearGradient>
        <linearGradient id={tail} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#25a8d6" />
          <stop offset="100%" stopColor="#40dcd4" />
        </linearGradient>
      </defs>

      {/* Sirip ekor bulan sabit di ujung pangkal ekor yang melengkung turun */}
      <path d="M28 38 C22 36.5 16 36.6 10.5 38 C15 41 18.6 43.6 21.8 46.2 C23.6 50.2 25.4 54.4 27.4 58.4 C29.6 51.6 30.8 46.4 32 41.4 Z" fill={`url(#${tail})`} />
      {/* Sirip punggung seperti bilah, menyapu ke belakang */}
      <path d="M91 11.6 C85 4 76.5 -1 63 -4.4 C69 -0.2 72 4.8 73.6 10.4 Z" fill={`url(#${finUp})`} />
      {/* Badan melengkung seperti busur: dahi menonjol, paruh pendek, pangkal ekor ramping */}
      <path
        d="M146.5 52.5 C142.5 49.6 138.6 46.6 135.2 43 C132.6 37 129 31.6 123 26.2 C112 16.2 97 10.6 80 10.1 C62 9.6 45 16.2 33 30 C30.2 33.2 28.2 36 26.6 39 L31.4 41.6 C42 35 58 29.6 78 28.6 C96 28 110 31.2 120 38.6 C126 43.2 131 48.4 137 52 C140.2 53.6 143.6 53.6 146.5 52.5 Z"
        fill={`url(#${body})`}
      />
      {/* Garis terang di sisi bawah badan & kilau punggung (seperti lekuk terang di logo) */}
      <path d="M44 36.4 C60 31.2 84 29.8 106 33.6" stroke="#8ae6ec" strokeOpacity="0.65" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M58 15.2 C74 11.8 94 12.2 112 19.4" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="1.8" strokeLinecap="round" />
      {/* Sirip dada tajam ke belakang */}
      <path d="M118 38 C113 44.4 106.6 48.6 98 51.6 C103.4 45.4 106 40.8 108.6 35.6 Z" fill={`url(#${finDown})`} />
      {/* Garis mulut di paruh */}
      <path d="M146.2 52.4 C142.4 51.6 139.2 50.6 136 48.6" stroke="#0f4e8c" strokeOpacity="0.75" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
