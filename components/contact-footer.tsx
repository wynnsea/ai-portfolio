import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import type { SiteSettings } from "@/lib/public-api";
import { Wave } from "@/components/wave";

export function ContactFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer id="contact" className="relative overflow-hidden bg-primary py-28 text-white md:py-40">
      <Wave from="white" />
      <Parallax offset={-80} className="pointer-events-none absolute bottom-0 left-0 right-0 select-none">
        <p aria-hidden className="whitespace-nowrap text-[22vw] font-semibold leading-none tracking-[-0.06em] text-white/[0.04]">
          Let&apos;s talk
        </p>
      </Parallax>

      <div className="relative mx-auto max-w-7xl px-6 lg:pl-24">
        <Reveal>
          <p className="mb-6 text-xs uppercase tracking-[0.25em] text-accent">08 / Kontak</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="max-w-4xl text-[clamp(2.5rem,7vw,6rem)] font-light leading-[1.02] tracking-[-0.05em]">
            Punya ide seru? Yuk bikin sesuatu yang pinter bareng.
          </h2>
        </Reveal>
        <Reveal delay={0.2} className="mt-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <a
            href={`mailto:${settings.email}`}
            className="w-fit border-b border-white/40 pb-1 text-xl transition-colors hover:border-white md:text-2xl"
          >
            {settings.email} <span aria-hidden>↗</span>
          </a>
          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {settings.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-white/60 transition-colors hover:text-white">
                  {s.label} <span aria-hidden>↗</span>
                </a>
              </li>
            ))}
            {settings.cvUrl && (
              <li>
                <a href={settings.cvUrl} download className="text-white/60 transition-colors hover:text-white">
                  Download CV <span aria-hidden>↓</span>
                </a>
              </li>
            )}
          </ul>
        </Reveal>
        <div className="mt-24 flex flex-col justify-between gap-2 border-t border-white/10 pt-6 text-xs text-white/40 md:flex-row">
          <span className="font-semibold tracking-[0.3em] text-white/70">{settings.brand}</span>
          <span>
            {settings.name} · {settings.role}, {settings.location}
          </span>
        </div>
      </div>
    </footer>
  );
}
