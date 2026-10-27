/**
 * Kerangka halaman (skeleton) yang disesuaikan persis dengan bentuk asli
 * dari masing-masing tampilan (Beranda, Detail Proyek, dan Detail Artikel).
 */

export function HomeSkeleton() {
  return (
    <main aria-busy="true" aria-label="Memuat beranda" className="min-h-svh bg-white">
      {/* 1. Hero Skeleton */}
      <section className="relative min-h-svh overflow-hidden px-6 pt-28 lg:pl-24 lg:pt-24">
        {/* Outline text watermark */}
        <div className="pointer-events-none absolute right-[2vw] top-[10vh] text-[38vw] font-semibold leading-none tracking-[-0.08em] text-line/40 lg:text-[26vw]">
          AI
        </div>

        <div className="mx-auto grid min-h-svh max-w-7xl grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-6">
          {/* Kiri: Foto */}
          <div className="order-2 flex items-end justify-center lg:order-1 lg:justify-start">
            <div className="aspect-4/5 w-full max-w-md animate-pulse rounded-2xl bg-tertiary lg:h-[82svh] lg:max-w-none lg:w-auto" />
          </div>

          {/* Kanan: Teks & Stats */}
          <div className="order-1 flex flex-col justify-center animate-pulse lg:order-2 lg:pb-16">
            {/* Availability Pill */}
            <div className="mb-8 h-8 w-44 rounded-full bg-tertiary" />

            {/* 3 Stats */}
            <div className="mb-8 flex gap-10 lg:mb-10">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-10 w-16 rounded-xl bg-tertiary" />
                  <div className="h-3 w-12 rounded-full bg-tertiary" />
                </div>
              ))}
            </div>

            {/* Giant "Hello" Title */}
            <div className="h-[clamp(5rem,18vw,11rem)] w-4/5 rounded-3xl bg-tertiary" />

            {/* Subtitle & Role */}
            <div className="mt-6 h-5 w-60 rounded-full bg-tertiary" />
            <div className="mt-4 space-y-2.5">
              <div className="h-4 w-full max-w-md rounded-full bg-tertiary" />
              <div className="h-4 w-4/5 max-w-sm rounded-full bg-tertiary" />
            </div>

            {/* CTA Buttons */}
            <div className="mt-10 flex gap-4">
              <div className="h-11 w-36 rounded-full bg-tertiary" />
              <div className="h-11 w-28 rounded-full bg-tertiary" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Statement Skeleton */}
      <section className="bg-white py-32 md:py-48">
        <div className="mx-auto max-w-7xl animate-pulse px-6 lg:pl-24">
          <div className="h-4 w-28 rounded-full bg-tertiary" />
          <div className="mt-8 space-y-4">
            <div className="h-12 w-full max-w-4xl rounded-2xl bg-tertiary" />
            <div className="h-12 w-5/6 max-w-3xl rounded-2xl bg-tertiary" />
            <div className="h-12 w-2/3 max-w-2xl rounded-2xl bg-tertiary" />
          </div>
        </div>
      </section>

      {/* 3. About Section Skeleton */}
      <section className="bg-tertiary py-28 md:py-40">
        <div className="mx-auto max-w-7xl animate-pulse px-6 lg:pl-24">
          <div className="h-4 w-32 rounded-full bg-white/70" />
          <div className="mt-6 flex justify-between border-b border-line pb-10">
            <div className="h-14 w-64 rounded-2xl bg-white/70" />
            <div className="h-6 w-24 rounded-full bg-white/70" />
          </div>

          <div className="mt-16 grid gap-16 md:grid-cols-12 md:gap-10">
            {/* Story */}
            <div className="space-y-4 md:col-span-7">
              <div className="h-7 w-full rounded-xl bg-white/70" />
              <div className="h-7 w-5/6 rounded-xl bg-white/70" />
              <div className="mt-6 space-y-3">
                <div className="h-4 w-full rounded-full bg-white/60" />
                <div className="h-4 w-full rounded-full bg-white/60" />
                <div className="h-4 w-3/4 rounded-full bg-white/60" />
              </div>
            </div>

            {/* Education & Experience */}
            <div className="space-y-8 md:col-span-5 md:pl-6">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="h-3 w-20 rounded-full bg-tertiary" />
                <div className="mt-4 h-6 w-48 rounded-xl bg-tertiary" />
                <div className="mt-2 h-4 w-36 rounded-full bg-tertiary" />
              </div>
              <div className="space-y-4">
                <div className="h-3 w-24 rounded-full bg-white/70" />
                {[0, 1].map((i) => (
                  <div key={i} className="flex justify-between border-b border-line pb-3">
                    <div className="space-y-1.5">
                      <div className="h-4 w-36 rounded-full bg-white/70" />
                      <div className="h-3 w-24 rounded-full bg-white/60" />
                    </div>
                    <div className="h-3 w-20 rounded-full bg-white/60" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3 Skill Columns */}
          <div className="mt-24 grid gap-10 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-t border-primary/20 pt-5">
                <div className="h-3 w-8 rounded-full bg-white/70" />
                <div className="mt-2 h-6 w-32 rounded-xl bg-white/70" />
                <div className="mt-5 flex flex-wrap gap-2">
                  {[0, 1, 2, 3].map((j) => (
                    <div key={j} className="h-8 w-20 rounded-full bg-white/80" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Projects Section Skeleton */}
      <section className="bg-white py-28 md:py-40">
        <div className="mx-auto max-w-7xl animate-pulse px-6 lg:pl-24">
          <div className="h-4 w-24 rounded-full bg-tertiary" />
          <div className="mt-6 flex justify-between border-b border-line pb-10">
            <div className="h-14 w-52 rounded-2xl bg-tertiary" />
            <div className="h-4 w-40 rounded-full bg-tertiary" />
          </div>

          <div className="mt-16 space-y-12">
            {[0, 1].map((i) => (
              <div key={i} className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
                <div className="aspect-[16/10] rounded-2xl bg-tertiary md:col-span-7" />
                <div className="space-y-4 md:col-span-5">
                  <div className="h-4 w-32 rounded-full bg-tertiary" />
                  <div className="h-8 w-3/4 rounded-xl bg-tertiary" />
                  <div className="h-4 w-full rounded-full bg-tertiary" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-7 w-20 rounded-full bg-tertiary" />
                    <div className="h-7 w-20 rounded-full bg-tertiary" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <main aria-busy="true" aria-label="Memuat proyek" className="min-h-svh bg-white">
      {/* Header Proyek */}
      <section className="relative overflow-hidden pb-16 pt-32 md:pb-24 md:pt-40">
        <div className="mx-auto max-w-7xl animate-pulse px-6 lg:pl-24">
          {/* Nav back & counter */}
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 rounded-full bg-tertiary" />
            <div className="h-4 w-24 rounded-full bg-tertiary" />
          </div>

          {/* Judul Jepang & Judul Utama */}
          <div className="mt-16 h-5 w-28 rounded-full bg-tertiary md:mt-24" />
          <div className="mt-3 h-[clamp(3.5rem,10vw,8rem)] w-4/5 rounded-3xl bg-tertiary" />

          {/* Ringkasan */}
          <div className="mt-8 space-y-3">
            <div className="h-7 w-full max-w-3xl rounded-xl bg-tertiary" />
            <div className="h-7 w-2/3 max-w-2xl rounded-xl bg-tertiary" />
          </div>

          {/* Bar 4 Kolom Meta (Tahun, Peran, Durasi, Kategori) */}
          <div className="mt-16 grid grid-cols-2 gap-6 border-t border-line pt-8 md:grid-cols-4 md:gap-10">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 rounded-full bg-tertiary" />
                <div className="h-5 w-28 rounded-xl bg-tertiary" />
              </div>
            ))}
          </div>

          {/* Tech Stack Pills */}
          <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-24 rounded-full bg-tertiary" />
            ))}
          </div>
        </div>
      </section>

      {/* Cover Image Banner */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:pl-24">
        <div className="aspect-[16/10] w-full animate-pulse rounded-3xl bg-tertiary md:aspect-[21/9]" />
      </section>

      {/* Konten Proyek (Overview, Challenge, Approach, Results) */}
      <section className="mx-auto max-w-7xl px-6 pb-32 lg:pl-24">
        <div className="grid gap-16 md:grid-cols-12 md:gap-12">
          <div className="space-y-12 md:col-span-8">
            <div className="space-y-4">
              <div className="h-3 w-28 rounded-full bg-tertiary" />
              <div className="h-5 w-full rounded-xl bg-tertiary" />
              <div className="h-5 w-5/6 rounded-xl bg-tertiary" />
            </div>
            <div className="space-y-4">
              <div className="h-3 w-28 rounded-full bg-tertiary" />
              <div className="h-5 w-full rounded-xl bg-tertiary" />
              <div className="h-5 w-4/5 rounded-xl bg-tertiary" />
            </div>
          </div>

          {/* Kolom Kanan: Explainer Box Placeholder */}
          <div className="md:col-span-4">
            <div className="h-64 rounded-3xl border border-line bg-tertiary/50 p-6" />
          </div>
        </div>
      </section>
    </main>
  );
}

export function BlogDetailSkeleton() {
  return (
    <main aria-busy="true" aria-label="Memuat artikel" className="min-h-svh bg-white">
      {/* Header Artikel */}
      <section className="relative overflow-hidden pb-14 pt-32 md:pb-20 md:pt-40">
        <div className="mx-auto max-w-7xl animate-pulse px-6 lg:pl-24">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 rounded-full bg-tertiary" />
            <div className="h-4 w-32 rounded-full bg-tertiary" />
          </div>

          {/* Kategori, Tanggal, Read Time */}
          <div className="mt-14 flex items-center gap-3 md:mt-20">
            <div className="h-6 w-24 rounded-full bg-tertiary" />
            <div className="h-4 w-28 rounded-full bg-tertiary" />
            <div className="h-4 w-20 rounded-full bg-tertiary" />
          </div>

          {/* Judul Jepang & Judul Artikel */}
          <div className="mt-6 h-5 w-24 rounded-full bg-tertiary" />
          <div className="mt-3 h-[clamp(2.5rem,8vw,6rem)] w-4/5 rounded-3xl bg-tertiary" />

          {/* Ringkasan Pembuka */}
          <div className="mt-8 space-y-3">
            <div className="h-6 w-full max-w-3xl rounded-xl bg-tertiary" />
            <div className="h-6 w-2/3 max-w-2xl rounded-xl bg-tertiary" />
          </div>
        </div>
      </section>

      {/* TL;DR Box Skeleton */}
      <section className="mx-auto max-w-4xl px-6 pb-12 lg:pl-24">
        <div className="animate-pulse rounded-2xl border border-line p-6">
          <div className="flex justify-between">
            <div className="h-3 w-16 rounded-full bg-tertiary" />
            <div className="h-4 w-20 rounded-full bg-tertiary" />
          </div>
          <div className="mt-6 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1 size-2 rounded-full bg-tertiary" />
                <div className="h-4 flex-1 rounded-full bg-tertiary" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Konten Paragraf Artikel */}
      <section className="mx-auto max-w-4xl px-6 pb-32 lg:pl-24">
        <div className="space-y-6 animate-pulse">
          <div className="h-4 w-full rounded-full bg-tertiary" />
          <div className="h-4 w-full rounded-full bg-tertiary" />
          <div className="h-4 w-3/4 rounded-full bg-tertiary" />
          <div className="my-8 h-8 w-1/2 rounded-xl bg-tertiary" />
          <div className="h-4 w-full rounded-full bg-tertiary" />
          <div className="h-4 w-5/6 rounded-full bg-tertiary" />
          <div className="my-6 rounded-2xl bg-tertiary/60 p-6">
            <div className="h-4 w-3/4 rounded-full bg-tertiary" />
          </div>
        </div>
      </section>
    </main>
  );
}

// Kompatibilitas default ke HomeSkeleton
export const PageSkeleton = HomeSkeleton;
