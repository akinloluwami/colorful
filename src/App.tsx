import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import randomColor from "randomcolor";
import namer from "color-namer";
import posthog from "posthog-js";

type ColorInfo = {
  hex: string;
  name: string;
};

type Point = {
  x: number;
  y: number;
};

function getTextColor(bg: string) {
  const r = parseInt(bg.slice(1, 3), 16);
  const g = parseInt(bg.slice(3, 5), 16);
  const b = parseInt(bg.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "black" : "white";
}

function generateColor(): ColorInfo {
  const hex = randomColor({ hue: "random", luminosity: "bright" });
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
  const [showDownload, setShowDownload] = useState(false);
  const pointerStart = useRef<Point | null>(null);
  const ignoreNextClick = useRef(false);

  useEffect(() => {
    const initial = generateColor();
    setColors([initial]);
    setIndex(0);
    posthog.capture("page_load", {
      hex: initial.hex,
      name: initial.name,
    });
  }, []);

  const current = colors[index];
  const textColor = getTextColor(current?.hex || "#000");

  useEffect(() => {
    if (current?.hex) {
      setFaviconColor(current.hex);
    }
  }, [current]);

  useEffect(() => {
    setShowDownload(false);

    if (!current?.hex) return;

    const timeout = window.setTimeout(() => {
      setShowDownload(true);
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [current]);

  const next = () => {
    const newColor = generateColor();
    const updated = [...colors.slice(0, index + 1), newColor];
    setColors(updated);
    setIndex((i) => i + 1);
    localStorage.setItem("viewedColors", JSON.stringify(updated));
    posthog.capture("next_color", {
      hex: newColor.hex,
      name: newColor.name,
      index: index + 1,
    });
  };

  const prev = () => {
    if (index > 0) setIndex((i) => i - 1);
    if (index > 0) {
      posthog.capture("prev_color", {
        hex: colors[index - 1]?.hex,
        name: colors[index - 1]?.name,
        index: index - 1,
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(current.hex);

    const copiedColorsRaw = localStorage.getItem("copiedColors");
    let copiedColors: ColorInfo[] = copiedColorsRaw
      ? JSON.parse(copiedColorsRaw)
      : [];

    if (!copiedColors.some((c) => c.hex === current.hex)) {
      copiedColors.push(current);
      localStorage.setItem("copiedColors", JSON.stringify(copiedColors));
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
    posthog.capture("color_copied", {
      hex: current.hex,
      name: current.name,
      index,
    });
  };

  const downloadColor = () => {
    if (!current) return;

    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = current.hex;
    ctx.fillRect(0, 0, size, size);

    const link = document.createElement("a");
    const filenameName = current.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    link.download = `${filenameName}-${current.hex.slice(1)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    posthog.capture("color_downloaded", {
      hex: current.hex,
      name: current.name,
      index,
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStart.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current) return;

    const deltaX = event.clientX - pointerStart.current.x;
    const deltaY = event.clientY - pointerStart.current.y;
    pointerStart.current = null;

    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    ignoreNextClick.current = true;

    if (deltaX < 0) {
      next();
    } else {
      prev();
    }
  };

  const handleClick = () => {
    if (ignoreNextClick.current) {
      ignoreNextClick.current = false;
      return;
    }

    next();
  };

  return (
    <div
      className="w-full h-screen flex flex-col items-center justify-center transition-all duration-500 p-5 touch-pan-y"
      style={{ backgroundColor: current?.hex }}
      onClick={handleClick}
      onDoubleClick={prev}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <h1
        className="text-center font-bold mb-2 text-6xl lg:text-8xl"
        style={{
          color: textColor,
        }}
      >
        {current?.name}
      </h1>

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
          className="text-3xl lg:text-5xl underline mt-5 font-extralight cursor-pointer"
          style={{ color: textColor }}
        >
          {current?.hex}
        </button>
      </div>

      {showDownload && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            downloadColor();
          }}
          className="fixed bottom-5 right-5 rounded-md border px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{
            borderColor: textColor,
            color: textColor,
          }}
        >
          Download
        </button>
      )}
    </div>
  );
}
