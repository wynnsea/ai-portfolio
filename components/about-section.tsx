import { about } from "@/lib/site";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";

// Offset parallax berbeda untuk tiap kartu minat agar susunannya terasa hidup
const interestOffsets = [40, -50, 70, -30];

export function AboutSection() {
  return (
    <section id="about" className="relative overflow-hidden bg-tertiary py-28 md:py-40">
      <Parallax
        offset={200}
        className="text-outline pointer-events-none absolute -right-[6vw] top-[6%] select-none font-jp text-[46vw] leading-none md:text-[34vw]"
      >
        <span aria-hidden>私</span>
      </Parallax>

      <div className="relative mx-auto max-w-7xl px-6 lg:pl-24">
        <Reveal>
          <p className="mb-6 text-xs uppercase tracking-[0.25em] text-secondary">02 / About Me</p>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-col gap-4 border-b border-line pb-10 md:flex-row md:items-end md:justify-between">
          <h2 className="text-[clamp(3rem,9vw,7rem)] font-light leading-none tracking-[-0.05em]">About Me</h2>
          <p className="font-jp text-lg text-secondary">私について</p>
        </Reveal>

        <div className="mt-16 grid gap-16 md:grid-cols-12 md:gap-10">
          <div className="space-y-8 md:col-span-7">
            {about.story.map((p, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <p className={i === 0 ? "text-2xl font-light leading-snug tracking-tight md:text-3xl" : "text-base leading-relaxed text-secondary md:text-lg"}>
                  {p}
                </p>
              </Reveal>
            ))}
          </div>

          <div className="space-y-10 md:col-span-5 md:pl-6">
            <Reveal className="bg-white p-6 shadow-[0_20px_50px_-30px_rgba(34,34,34,0.3)] md:p-8">
              <p className="text-xs uppercase tracking-[0.25em] text-secondary">Education</p>
              <p className="mt-4 text-2xl font-light tracking-tight">{about.education.school}</p>
              <p className="mt-1 text-sm">{about.education.degree}</p>
              <p className="mt-1 text-sm text-secondary">{about.education.period}</p>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="text-xs uppercase tracking-[0.25em] text-secondary">Experience</p>
              <ul className="mt-4">
                {about.experience.map((e) => (
                  <li key={e.role} className="flex items-baseline justify-between gap-4 border-b border-line py-4">
                    <div>
                      <p className="font-medium">{e.role}</p>
                      <p className="text-sm text-secondary">{e.company}</p>
                    </div>
                    <p className="shrink-0 text-xs text-secondary">{e.period}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>

        {/* Skill */}
        <div className="mt-24 grid gap-10 md:grid-cols-3">
          {about.skills.map((s, i) => (
            <Reveal key={s.group} delay={i * 0.1} className="border-t border-primary pt-5">
              <p className="text-xs uppercase tracking-[0.25em] text-secondary">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-2 text-xl font-light tracking-tight">{s.group}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {s.items.map((item) => (
                  <li key={item} className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>

        {/* Minat: kartu kanji dengan parallax berbeda-beda */}
        <div className="mt-28">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.25em] text-secondary">Interests</p>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {about.interests.map((it, i) => (
              <Parallax key={it.jp} offset={interestOffsets[i % interestOffsets.length]}>
                <Reveal delay={i * 0.08}>
                  <div className={`group flex aspect-[3/4] flex-col justify-between p-5 transition-colors duration-500 ${i % 2 ? "bg-white text-primary hover:bg-primary hover:text-white" : "bg-primary text-white hover:bg-white hover:text-primary"}`}>
                    <span className="text-xs opacity-50">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-jp text-5xl md:text-6xl">{it.jp}</span>
                    <span className="text-sm">{it.label}</span>
                  </div>
                </Reveal>
              </Parallax>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
