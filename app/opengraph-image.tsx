import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "@/lib/site";

// Gambar preview saat link dibagikan (LinkedIn, WhatsApp, X, dll)
export const alt = `${site.brand} | ${site.name}, ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const photo = await readFile(join(process.cwd(), "public", site.photo));
const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;

const COLORS = { primary: "#2a5677", deep: "#1f4562", accent: "#a7d8f2", foam: "#eaf4fa" };

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.deep} 100%)`,
          color: "white",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Ombak di bagian bawah */}
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", left: 0, top: 0 }}>
          <path d="M0 500 C 200 460, 400 560, 600 510 S 1000 450, 1200 500 L1200 630 L0 630 Z" fill={COLORS.accent} fillOpacity="0.14" />
          <path d="M0 550 C 250 510, 450 600, 700 560 S 1050 520, 1200 560 L1200 630 L0 630 Z" fill={COLORS.accent} fillOpacity="0.2" />
        </svg>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: 760 }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 10, fontWeight: 700 }}>{site.brand}</div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 104, letterSpacing: -4, lineHeight: 1 }}>{site.name}</div>
            <div style={{ display: "flex", fontSize: 40, marginTop: 16, color: COLORS.foam }}>{site.role}</div>
            <div style={{ display: "flex", fontSize: 26, marginTop: 20, color: COLORS.accent }}>
              AI Integration · Web Dev · Japanese Culture
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", fontSize: 22 }}>
            <div style={{ display: "flex", width: 14, height: 14, borderRadius: 999, background: COLORS.accent, marginRight: 14 }} />
            {site.availability.open ? `${site.availability.label} · ${site.availability.detail}` : site.location}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", flex: 1, paddingTop: 70 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoSrc}
            alt=""
            width={360}
            height={460}
            style={{ objectFit: "cover", borderTopLeftRadius: 24, borderTopRightRadius: 24, border: `6px solid ${COLORS.accent}`, borderBottom: "none" }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
