/**
 * Script inline yang dijalankan browser saat HTML diparsing (sebelum paint).
 * Di client dirender sebagai type="text/plain" supaya React tidak memperingatkan tag <script>
 * dan script tidak dijalankan ulang (pola dari panduan "Preventing flash before hydration").
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
