import { certifications } from "@/lib/certifications";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { CertCard } from "@/components/certifications/cert-card";
import { Wave } from "@/components/wave";

export function CertificationsSection() {
  return (
    <section id="certifications" className="relative overflow-hidden bg-tertiary py-28 md:py-40">
      <Wave from="white" />
      {/* Kanji 資格 ("kualifikasi") di latar belakang */}
      <Parallax
        offset={200}
        className="text-outline pointer-events-none absolute -right-[4vw] top-[6%] select-none font-jp text-[40vw] leading-none md:text-[28vw]"
      >
        <span aria-hidden>資格</span>
      </Parallax>

      <div className="relative mx-auto max-w-7xl px-6 lg:pl-24">
        <Reveal>
          <p className="mb-6 text-xs uppercase tracking-[0.25em] text-secondary">04 / Kredensial</p>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-col gap-6 border-b border-line pb-10 md:flex-row md:items-end md:justify-between">
          <h2 className="text-[clamp(3rem,9vw,7rem)] font-light leading-none tracking-[-0.05em]">
            Sertifikasi
            <sup className="ml-2 align-top text-lg font-normal tracking-normal text-secondary md:text-2xl">
              ({String(certifications.length).padStart(2, "0")})
            </sup>
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-secondary">
            Sertifikat bahasa dan kompetensi yang saya kumpulin sejauh ini, dari bahasa Inggris, bahasa Jepang, sampai web development.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-8 md:mt-24 lg:grid-cols-4 lg:pb-4">
          {certifications.map((cert, i) => (
            <CertCard key={cert.title} cert={cert} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
