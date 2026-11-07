// Ombak dekoratif (SVG) yang bergerak pelan. Animasi ombaknya CSS murni; satu-satunya JavaScript
// adalah <WaveDolphin /> (lumba-lumba melompat acak). Matikan per ombak dengan dolphins={false}.
import { WaveDolphin } from "@/components/wave-dolphin";

// Dipakai sebagai batas antar section: bagian atas diisi warna section sebelumnya,
// tepi bawahnya bergelombang, dan beberapa lapis ombak transparan bergerak dengan kecepatan berbeda.

const WIDTH = 2880; // 2 periode × 1440, supaya geser -50% menyambung mulus (loop tanpa patahan)
const HEIGHT = 100;

/** Path terisi dari atas (y=0) sampai garis gelombang sinus. `wavelength` harus membagi 1440. */
function wavePath(wavelength: number, amplitude: number, baseline: number, phase = 0) {
  const points: string[] = [];
  for (let x = 0; x <= WIDTH; x += 16) {
    const y = baseline + amplitude * Math.sin(((x / wavelength) * 2 + phase) * Math.PI);
    points.push(`${x} ${y.toFixed(1)}`);
  }
  return `M0 0 L${points.join(" L")} L${WIDTH} 0 Z`;
}

const fills = {
  white: "fill-white",
  tertiary: "fill-tertiary",
  primary: "fill-primary",
} as const;

// Lapisan belakang (aksen biru transparan) lebih dalam, lapisan depan berwarna solid
const layers = [
  { d: wavePath(480, 16, 68, 0.3), cls: "fill-accent/25", duration: "24s" },
  { d: wavePath(360, 13, 58, 1.1), cls: "fill-accent/40", duration: "17s", reverse: true },
];
const front = wavePath(720, 18, 44, 0);

type WaveProps = {
  /** Warna area di atas ombak (warna section sebelumnya) */
  from: keyof typeof fills;
  className?: string;
  /** Lumba-lumba yang sesekali melompat dari ombak ini (default aktif di semua ombak) */
  dolphins?: boolean;
};

export function Wave({ from, className = "", dolphins = true }: WaveProps) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 z-0 h-14 overflow-hidden md:h-24 ${className}`}>
      {layers.map((layer, i) => (
        <svg
          key={i}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className={`animate-wave absolute left-0 top-0 h-full w-[200%] ${layer.cls}`}
          style={{ animationDuration: layer.duration, animationDirection: layer.reverse ? "reverse" : "normal" }}
        >
          <path d={layer.d} />
        </svg>
      ))}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className={`animate-wave absolute left-0 top-0 h-full w-[200%] ${fills[from]}`}
        style={{ animationDuration: "28s" }}
      >
        <path d={front} />
      </svg>
      {dolphins && <WaveDolphin />}
    </div>
  );
}
