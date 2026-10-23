import { Reveal } from "@/components/motion/reveal";

type EmptyStateProps = {
  kanji: string;
  title: string;
  description?: string;
  className?: string;
};

/** Tampilan saat sebuah section belum punya data (mis. belum ada artikel). */
export function EmptyState({ kanji, title, description, className = "" }: EmptyStateProps) {
  return (
    <Reveal className={className}>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-white/60 px-6 py-16 text-center md:py-24">
        <span aria-hidden className="font-jp text-6xl text-primary/25 md:text-7xl">
          {kanji}
        </span>
        <p className="mt-6 text-xl font-light tracking-tight md:text-2xl">{title}</p>
        {description && <p className="mt-2 max-w-md text-sm leading-relaxed text-secondary">{description}</p>}
      </div>
    </Reveal>
  );
}
