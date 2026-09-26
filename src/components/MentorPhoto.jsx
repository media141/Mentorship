import { useRef, useState } from "react";

// Finds where real photo content (not blank/background) starts vertically,
// so a plain headshot and a transparent floating cutout both crop sensibly
// under object-fit: cover instead of using one fixed guess for every photo.
function detectContentStart(img) {
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, w, h).data;
    const alphaMode = data[3] < 250;
    const bgR = data[0], bgG = data[1], bgB = data[2];
    const step = Math.max(1, Math.floor(w / 50));
    for (let y = 0; y < h; y++) {
      const rowOffset = y * w * 4;
      for (let x = 0; x < w; x += step) {
        const i = rowOffset + x * 4;
        const isContent = alphaMode
          ? data[i + 3] > 15
          : Math.abs(data[i] - bgR) + Math.abs(data[i + 1] - bgG) + Math.abs(data[i + 2] - bgB) > 45;
        if (isContent) return Math.max(0, y / h - 0.01);
      }
    }
  } catch (e) {
    // canvas access denied (CORS) — fall back to a plain top-aligned crop
  }
  return 0;
}

export default function MentorPhoto({ src, alt }) {
  const imgRef = useRef(null);
  const [objectPosition, setObjectPosition] = useState("center top");

  function handleLoad() {
    const el = imgRef.current;
    if (!el) return;
    const boxW = el.clientWidth, boxH = el.clientHeight;
    if (!boxW || !boxH) return;
    const measure = new Image();
    measure.crossOrigin = "anonymous";
    measure.onload = () => {
      const skip = detectContentStart(measure);
      const coverScale = Math.max(boxW / measure.naturalWidth, boxH / measure.naturalHeight);
      const scaledH = measure.naturalHeight * coverScale;
      const overflowFrac = Math.max(0.0001, 1 - boxH / scaledH);
      const y = Math.min(1, skip / overflowFrac) * 100;
      setObjectPosition(`center ${y.toFixed(1)}%`);
    };
    measure.src = src;
  }

  return <img ref={imgRef} src={src} alt={alt} onLoad={handleLoad} style={{ objectPosition }} />;
}
