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
  };

  return (
    <div
      className="w-full h-screen flex flex-col items-center justify-center transition-all duration-500"
      style={{ backgroundColor: current?.hex }}
      onClick={next}
      onDoubleClick={prev}
    >
      <h1 className="text-8xl font-bold mb-2" style={{ color: textColor }}>
        {current?.name}
      </h1>
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
  );
}
