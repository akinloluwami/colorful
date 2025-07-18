import { useEffect, useState } from "react";
import randomColor from "randomcolor";
import namer from "color-namer";

type ColorInfo = {
  hex: string;
  name: string;
};

function getTextColor(bg: string) {
  const r = parseInt(bg.slice(1, 3), 16);
  const g = parseInt(bg.slice(3, 5), 16);
  const b = parseInt(bg.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "black" : "white";
}

function generateColor(): ColorInfo {
  const hex = randomColor();
  const name = namer(hex).ntc[0].name;
  return { hex, name };
}

function setFaviconColor(hex: string) {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, size, size);

  const link =
    document.querySelector("link[rel*='icon']") ||
    document.createElement("link");
  link.setAttribute("rel", "icon");
  link.setAttribute("type", "image/png");
  link.setAttribute("href", canvas.toDataURL("image/png"));
  document.head.appendChild(link);
}

export default function App() {
  const [colors, setColors] = useState<ColorInfo[]>([]);
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const initial = generateColor();
    setColors([initial]);
    setIndex(0);
  }, []);

  const current = colors[index];
  const textColor = getTextColor(current?.hex || "#000");

  useEffect(() => {
    if (current?.hex) {
      setFaviconColor(current.hex);
    }
  }, [current]);

  const next = () => {
    const newColor = generateColor();
    const updated = [...colors.slice(0, index + 1), newColor];
    setColors(updated);
    setIndex((i) => i + 1);
    localStorage.setItem("viewedColors", JSON.stringify(updated));
  };

  const prev = () => {
    if (index > 0) setIndex((i) => i - 1);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(current.hex);
    // Track copied colors in localStorage
    const copiedColorsRaw = localStorage.getItem("copiedColors");
    let copiedColors: ColorInfo[] = copiedColorsRaw
      ? JSON.parse(copiedColorsRaw)
      : [];
    // Avoid duplicates by hex
    if (!copiedColors.some((c) => c.hex === current.hex)) {
      copiedColors.push(current);
      localStorage.setItem("copiedColors", JSON.stringify(copiedColors));
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div
      className="w-full h-screen flex flex-col items-center justify-center transition-all duration-500 p-5"
      style={{ backgroundColor: current?.hex }}
      onClick={next}
      onDoubleClick={prev}
    >
      <h1
        className="text-center font-bold mb-2"
        style={{
          color: textColor,
          fontSize: `clamp(2rem, ${Math.max(
            8 - (current?.name?.length || 0) * 0.2,
            3
          )}rem, 8rem)`,
        }}
      >
        {current?.name}
      </h1>
      {/* Wrap the button and copied text in a relative container */}
      <div className="relative flex flex-col items-center w-full">
        {copied && (
          <div
            className="select-none text-xs font-semibold absolute -top-1 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              color: textColor,
              animation: "popFade 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
              zIndex: 10,
            }}
          >
            Copied
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard();
          }}
          className="text-5xl underline mt-5 font-extralight cursor-pointer"
          style={{ color: textColor }}
        >
          {current?.hex}
        </button>
      </div>
    </div>
  );
}
