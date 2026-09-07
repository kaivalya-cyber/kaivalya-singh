"use client"

// AsciiArt — "Asthetic", made with the 21st ASCII editor and baked
// to its exact rendered output (looping video + poster). Zero dependencies:
// one <video> that fills its parent. Drop it behind or inside your content:
// <div className="relative h-96"><AsciiArt className="absolute inset-0" /></div>
// Remix the source recipe (styles, animation, palette) in the editor:
// https://21st.dev/community/ascii/editor?from=760fc3a8-588b-41bb-ba94-13ebc3e69f31
export function AsciiArt({ className }: { className?: string }) {
  return (
    <video
      className={className}
      src={"https://assets.21st.dev/ascii-recipes/videos/user_3I8QRgdp7zi7Xf4OJ7kQvS751Nn/8c29b54c-cc32-44d2-aa79-d76e0265e080.mp4"}
      poster={"https://assets.21st.dev/ascii-recipes/thumbnails/user_3I8QRgdp7zi7Xf4OJ7kQvS751Nn/92dbb983-c391-47d6-b9fe-fd341ce3a291.webp"}
      autoPlay
      loop
      muted
      playsInline
      aria-label={"Asthetic — animated ASCII art"}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  )
}
