/**
 * Kerangka halaman detail (project/artikel) yang tampil seketika saat navigasi,
 * sementara isi yang bergantung pada URL (`params`) dimuat di dalam <Suspense>.
 */
export function PageSkeleton() {
  return (
    <main aria-busy="true" aria-label="Memuat halaman" className="min-h-svh bg-white pb-24 pt-32 md:pt-40">
      <div className="mx-auto max-w-7xl animate-pulse px-6 lg:pl-24">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded-full bg-tertiary" />
          <div className="h-4 w-24 rounded-full bg-tertiary" />
        </div>
        <div className="mt-16 h-4 w-32 rounded-full bg-tertiary md:mt-24" />
        <div className="mt-4 h-[clamp(3rem,10vw,8rem)] w-3/4 rounded-2xl bg-tertiary" />
        <div className="mt-8 h-6 w-full max-w-3xl rounded-full bg-tertiary" />
        <div className="mt-3 h-6 w-2/3 max-w-2xl rounded-full bg-tertiary" />
        <div className="mt-14 grid grid-cols-2 gap-6 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t border-line pt-4">
              <div className="h-3 w-16 rounded-full bg-tertiary" />
              <div className="mt-3 h-4 w-28 rounded-full bg-tertiary" />
            </div>
          ))}
        </div>
        <div className="mt-16 h-[50svh] w-full rounded-2xl bg-tertiary" />
      </div>
    </main>
  );
}
