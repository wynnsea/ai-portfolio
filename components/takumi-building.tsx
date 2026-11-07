/**
 * Siluet gedung Politeknik Takumi (digambar ulang dari public/images/gedung-takumi.webp):
 * sayap kiri, badan utama 3 lantai dengan kanopi pintu masuk, dan blok kanan yang lebih tinggi
 * dengan baliho, plus awan tradisional Jepang (瑞雲 zuiun) di langit atasnya.
 * Memakai currentColor supaya warnanya mengikuti kelas teks.
 */

/**
 * Awan gaya Jepang: gumpalan bergerigi dengan garis tepi ganda, pusaran besar di kedua ujung,
 * dan ekor garis yang ujungnya melengkung. Koordinat lokal ±160×52, diposisikan lewat transform.
 */
const CLOUD_PATH =
  "M22 52 C6 52 2 36 15 30 C10 17 27 9 40 16 C45 3 66 -1 78 10 C88 -1 112 1 117 15 C131 8 150 17 146 30 C158 34 156 52 140 52 Z";

function JapaneseCloud({ transform }: { transform: string }) {
  return (
    <g transform={transform} strokeLinecap="round" strokeLinejoin="round">
      {/* Badan awan + garis tepi kedua di dalam (ciri awan gaya Jepang) */}
      <path d={CLOUD_PATH} fill="currentColor" fillOpacity="0.07" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.3" />
      <path d={CLOUD_PATH} transform="translate(13 8) scale(0.84)" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.4" />
      {/* Pusaran besar di kedua ujung & di tengah */}
      <g stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.3" fill="none">
        <path d="M30 46 c-9 0 -12 -10 -5 -13 c7 -3 13 4 8 9 c-3 3 -7 1 -6 -2" />
        <path d="M128 46 c9 0 12 -10 5 -13 c-7 -3 -13 4 -8 9 c3 3 7 1 6 -2" />
        <path d="M78 30 c-8 0 -11 -9 -4 -12 c7 -3 12 4 7 8" />
      </g>
      {/* Ekor garis dengan ujung melengkung */}
      <g stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.2" fill="none">
        <path d="M140 52 H172 c5 0 5 -7 0 -7 c-3 0 -3 4 0 4" />
        <path d="M22 52 H-8 c-5 0 -5 -7 0 -7 c3 0 3 4 0 4" />
        <path d="M150 44 H164" />
      </g>
    </g>
  );
}

// Pilar (pita vertikal) dan jendela per bay, mengikuti ritme fasad di foto
const PILLARS = [60, 96, 140, 200, 260, 320, 380, 440, 500, 560];
const FLOORS = [
  { top: 78, bottom: 116 },
  { top: 120, bottom: 158 },
  { top: 162, bottom: 200 },
];

function windowsFor(left: number, right: number, floor: { top: number; bottom: number }) {
  const width = right - left;
  const count = width > 50 ? 3 : 2;
  const w = 7;
  const gap = (width - count * w) / (count + 1);
  return Array.from({ length: count }, (_, i) => ({ x: left + gap + i * (w + gap), y: floor.top + 12, w, h: 14 }));
}

export function TakumiBuilding({ className = "" }: { className?: string }) {
  const bays: [number, number][] = [];
  for (let i = 0; i < PILLARS.length - 1; i++) {
    const [l, r] = [PILLARS[i] + 3, PILLARS[i + 1] - 3];
    // Blok kanan (440–560) diisi baliho & panel besar, bukan jendela kecil
    if (PILLARS[i] >= 440) continue;
    bays.push([l, r]);
  }

  return (
    <svg viewBox="0 -46 640 260" fill="none" aria-hidden className={className} preserveAspectRatio="xMidYMax meet">
      {/* Awan Jepang di langit atas gedung */}
      <JapaneseCloud transform="translate(60 -32) scale(0.8)" />
      <JapaneseCloud transform="translate(290 -44) scale(0.95)" />
      <JapaneseCloud transform="translate(600 2) scale(-0.62 0.62)" />

      {/* Pohon latar kiri & kanan */}
      <g fill="currentColor" fillOpacity="0.07" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1">
        <circle cx="22" cy="150" r="26" />
        <circle cx="44" cy="132" r="22" />
        <circle cx="16" cy="178" r="20" />
        <circle cx="598" cy="140" r="28" />
        <circle cx="622" cy="164" r="22" />
        <circle cx="576" cy="170" r="18" />
      </g>

      {/* Massa bangunan */}
      <g fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1">
        <rect x="60" y="70" width="80" height="130" />
        <rect x="140" y="74" width="300" height="126" />
        <rect x="440" y="58" width="120" height="142" />
      </g>

      {/* Pilar & pita lantai (rangka biru di fasad) */}
      <g fill="currentColor" fillOpacity="0.2">
        {PILLARS.map((x) => {
          // Pilar tengah blok kanan dimulai di bawah baliho supaya tidak memotongnya
          const top = x === 500 ? 128 : x >= 440 ? 58 : x <= 96 ? 70 : 74;
          return <rect key={x} x={x - 2} y={top} width="4" height={200 - top} />;
        })}
        <rect x="60" y="116" width="500" height="4" />
        <rect x="60" y="158" width="500" height="4" />
      </g>

      {/* Jendela */}
      <g fill="currentColor" fillOpacity="0.24">
        {bays.flatMap(([l, r]) =>
          FLOORS.map((floor) =>
            windowsFor(l, r, floor)
              // ruang kanopi & pintu masuk di lantai dasar bay 140–200
              .filter(() => !(floor.top === 162 && l < 200 && r > 140))
              .map((win, i) => <rect key={`${l}-${floor.top}-${i}`} x={win.x} y={win.y} width={win.w} height={win.h} rx="0.5" />),
          ),
        )}
        {/* Panel di blok kanan, di bawah baliho */}
        <rect x="508" y="166" width="10" height="12" />
        <rect x="448" y="132" width="44" height="22" fillOpacity="0.1" />
        <rect x="448" y="166" width="44" height="30" fillOpacity="0.1" />
        <rect x="524" y="132" width="30" height="22" fillOpacity="0.1" />
      </g>

      {/* Kanopi & pintu masuk */}
      <g stroke="currentColor" strokeOpacity="0.45" strokeWidth="1">
        <rect x="134" y="160" width="72" height="6" fill="currentColor" fillOpacity="0.22" />
        <line x1="140" y1="166" x2="140" y2="200" />
        <line x1="200" y1="166" x2="200" y2="200" />
        <rect x="152" y="172" width="36" height="28" fill="currentColor" fillOpacity="0.1" />
        <line x1="170" y1="172" x2="170" y2="200" />
        {/* Pintu blok kanan */}
        <rect x="505" y="180" width="10" height="20" fill="currentColor" fillOpacity="0.2" />
      </g>

      {/* Baliho */}
      <g stroke="currentColor" strokeOpacity="0.5" strokeWidth="1">
        <rect x="446" y="78" width="110" height="46" fill="currentColor" fillOpacity="0.1" />
        <line x1="456" y1="90" x2="490" y2="90" strokeOpacity="0.3" />
        <line x1="456" y1="98" x2="482" y2="98" strokeOpacity="0.3" />
        <line x1="500" y1="104" x2="546" y2="104" strokeOpacity="0.3" />
        <line x1="506" y1="112" x2="540" y2="112" strokeOpacity="0.3" />
      </g>

      {/* Tanaman depan & tanah */}
      <g fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1">
        <ellipse cx="116" cy="196" rx="14" ry="8" />
        <ellipse cx="300" cy="197" rx="40" ry="6" />
        <ellipse cx="420" cy="197" rx="22" ry="6" />
        <ellipse cx="540" cy="196" rx="14" ry="7" />
      </g>
      <line x1="0" y1="200.5" x2="640" y2="200.5" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
    </svg>
  );
}
