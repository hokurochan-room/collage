"use client";  //このコンポーネントはブラウザで動かすよ宣言

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { HsvColorPicker} from "react-colorful";
import { removeBackground } from "@imgly/background-removal";

type HSV = { h: number; s: number; v: number };
type RGB = { r: number; g: number; b: number };

<head>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?
    family=Noto+Sans+JP
    &family=Noto+Serif+JP
    &family=Roboto
    &family=Inter
    &family=Great+Vibes
    &family=Noto+Sans+KR
    &family=Orbitron
    &display=swap"
  />
</head>

// キャンバス上の文字や素材の共通アイテム型
export type TextItem  = {
  id: string;
  type: "text";
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  font: string;
  bold: boolean;
  writingMode: "horizontal" | "vertical";
  align: "left" | "center" | "right";
  width: number;    
  height: number;
  rotation?: number;
  preview?: string;
};

// カテゴリ名の型
export type MaterialCategory =
  | "flower"
  | "ribbon"
  | "sparkle"
  | "heart"
  | "silver"
  | "animal"
  | "pattern"
  | "other";

type TextSettings = {
  text: string;
  color: string;
  font: string;
  bold: boolean;
  writingMode: "vertical" | "horizontal";
  align: "left" | "center" | "right";
  fontSize: number;
};

interface ColorPickerProps {
  selectedMaterial: MaterialItem | null;
  onConfirm: (rgb: RGB) => void;
  onBack: () => void;
}

// 1素材の型
interface MaterialItem {
  id: string;
  name: string;
  category: MaterialCategory;
  thumbnail: string;
  colorable: boolean;
  layers: {
    line: string;
    fill: string;
  };
}

//文字入力
interface TextPanelProps {
  onConfirmText: (settings: TextSettings) => void;
  onChangeTextSettings: (settings: TextSettings) => void;
  textSettings: TextSettings;
}

// HEX → HSV
const hexToHsv = (hex: string) => {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : d / max;
  const v = max;

  return { h, s, v };
};

export function ColorPickerPanel({
  selectedMaterial,
  onConfirm,
  onBack,
}: ColorPickerProps) {

  if (!selectedMaterial) return null;
  
  const [color, setColor] = useState<HSV>({ h: 0, s: 1, v: 1 });
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const imageRef = useRef<{ line?: HTMLImageElement; fill?: HTMLImageElement }>({});
  const [imageReady, setImageReady] = useState(0);

  // HSV → RGB 
  const hsvToRgb = ({ h, s, v }: HSV): RGB => {
    let c = v * s;
    let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    let m = v - c;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) [r, g, b] = [c, x, 0];
    else if (60 <= h && h < 120) [r, g, b] = [x, c, 0];
    else if (120 <= h && h < 180) [r, g, b] = [0, c, x];
    else if (180 <= h && h < 240) [r, g, b] = [0, x, c];
    else if (240 <= h && h < 300) [r, g, b] = [x, 0, c];
    else if (300 <= h && h < 360) [r, g, b] = [c, 0, x];

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  };

  // HSV → HEX
  const hsvToHex = (h: number, s: number, v: number) => {
    s /= 100;
    v /= 100;

    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) [r, g, b] = [c, x, 0];
    else if (60 <= h && h < 120) [r, g, b] = [x, c, 0];
    else if (120 <= h && h < 180) [r, g, b] = [0, c, x];
    else if (180 <= h && h < 240) [r, g, b] = [0, x, c];
    else if (240 <= h && h < 300) [r, g, b] = [x, 0, c];
    else if (300 <= h && h < 360) [r, g, b] = [c, 0, x];

    const toHex = (n: number) =>
      Math.round((n + m) * 255).toString(16).padStart(2, "0");

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const rgb = hsvToRgb(color);
  const [, setRenderedImage] = useState<string | null>(null);

  // RGB 入力変更
  const updateRGB = (key: keyof RGB, value: string) => {
    const num = Math.min(255, Math.max(0, Number(value)));
    const newRGB: RGB = { ...rgb, [key]: num };
    setColor(rgbToHsv(newRGB.r, newRGB.g, newRGB.b));
  };
  
  // preload 用の画像オブジェクトを保持
  const [, setPreloadedImages] = useState<{
    line: HTMLImageElement | null;
    fill: HTMLImageElement | null;
  }>({ line: null, fill: null });

  const pickerColor = useMemo(() => {
    if (!color) {
      return { h: 0, s: 0, v: 100 };
    }

    return {
      h: color.h,
      s: Math.round(color.s * 100),
      v: Math.round(color.v * 100),
    };
  }, [color]);

  //色履歴
  const [colorHistory, setColorHistory] = useState<string[]>([]);
  const addColorToHistory = (color: string) => {
    setColorHistory(prev => {
      // 同じ色は先頭に移動
      const filtered = prev.filter(c => c !== color);
      const updated = [color, ...filtered].slice(0, 10);

      localStorage.setItem("color-history", JSON.stringify(updated));
      return updated;
    });
  };
    
  // RGB → HSV
  function rgbToHsv(r: number, g: number, b: number): HSV {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const v = max, c = max - min;
    let h = 0;

    if (c !== 0) {
      if (max === r) h = ((g - b) / c) % 6;
      else if (max === g) h = (b - r) / c + 2;
      else h = (r - g) / c + 4;
    }

    const s = v === 0 ? 0 : c / v;
    return { h: h * 60, s, v };
  }

  useEffect(() => {
    const saved = localStorage.getItem("color-history");
    if (saved) {
      setColorHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (!selectedMaterial) return;

    const lineImg = new Image();
    const fillImg = new Image();
    let loaded = 0;

    const onLoad = () => {
      loaded++;
      if (loaded < 2) return;

      imageRef.current = {
        line: lineImg,
        fill: fillImg,
      };

      setPreloadedImages({
        line: lineImg,
        fill: fillImg,
      });

      setImageReady(prev => prev + 1);
    };

    lineImg.onload = onLoad;
    fillImg.onload = onLoad;

    lineImg.src = selectedMaterial.layers.line;
    fillImg.src = selectedMaterial.layers.fill;

  }, [selectedMaterial]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !color) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lineImg = imageRef.current.line;
    const fillImg = imageRef.current.fill;

    if (!lineImg || !fillImg) return;

    const { r, g, b } = hsvToRgb(color);

    canvas.width = lineImg.width;
    canvas.height = lineImg.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(fillImg, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(lineImg, 0, 0);

    const newImage = canvas.toDataURL();
    setRenderedImage(prev => (prev === newImage ? prev : newImage));

  },  [color?.h, color?.s, color?.v, imageReady]);


  return (
    <div className="p-5">
      {/* ← 戻る */}
      <button
        onClick={onBack}
        className="mb-3 text-purple-600 font-bold text-lg"
      >
        ← 戻る
      </button>

      {/* 選択中サムネ */}
      <div className="w-full flex justify-center mb-4">
        <canvas ref={previewCanvasRef} className="w-40 h-auto" />
      </div>

      {/* カラーピッカー */}
      <HsvColorPicker
        color={pickerColor}
        onChange={(newColor) => {
          const next = {
            h: newColor.h,
            s: newColor.s / 100,
            v: newColor.v / 100,
          };

          setColor(prev => {
            if (
              prev.h === next.h &&
              prev.s === next.s &&
              prev.v === next.v
            ) {
              return prev;
            }
            return next;
          });
          const hex = hsvToHex(newColor.h, newColor.s, newColor.v);
        }}
      />

      {/* RGB入力 */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {(["r", "g", "b"] as const).map((key) => (
          <input
            key={key}
            type="number"
            min={0}
            max={255}
            value={rgb[key]}
            onChange={(e) => updateRGB(key, e.target.value)}
            className="border p-2 rounded"
          />
        ))}
      </div>

      {/* 🎨 色履歴 */}
      <div className="flex gap-2 mt-2 flex-wrap">
        {colorHistory.map((color, index) => (
          <button
            key={index}
            onClick={() => {
              setColor(hexToHsv(color));
            }}
            className="w-6 h-6 rounded-full border border-gray-400 hover:scale-110 transition"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* 決定 */}
      <button
        onClick={() => {
          onConfirm(rgb);
          const hex = `#${[rgb.r, rgb.g, rgb.b]
            .map(v => v.toString(16).padStart(2, "0"))
            .join("")}`;
          addColorToHistory(hex);
        }}
        className="mt-4 w-full bg-purple-400 text-white py-2 rounded-lg"
      >
        キャンバスに追加
      </button>
    </div>
  );
}

export function TextPanel({
  onConfirmText,
  onChangeTextSettings,
  textSettings,
}: TextPanelProps) {
  const [text, setText] = useState(textSettings.text);
  const [writingMode, setWritingMode] = useState(textSettings.writingMode);
  const [align, setAlign] = useState(textSettings.align);
  const [bold, setBold] = useState(textSettings.bold);
  const [color, setColor] = useState<HSV>({ h: 0, s: 1, v: 1 });
  const [fontSize, setFontSize] = useState(textSettings.fontSize);
  const updateSettings = (partial: Partial<TextSettings>) => {
    onChangeTextSettings({ ...textSettings, ...partial });
  };

  //フォント管理
  const fontOptions = [
    { label: "Noto Sans JP", value: "Noto Sans JP" },
    { label: "Noto Serif JP", value: "Noto Serif JP" },
    { label: "Roboto", value: "Roboto" },
    { label: "Inter", value: "Inter" },
    { label: "Great Vibes", value: "Great Vibes" },
    { label: "Noto Sans KR", value: "Noto Sans KR" },
    { label: "Noto Serif KR", value: "Noto Serif KR" },
    { value: "Orbitron", label: "Orbitron" },
  ]

  const [fontOpen, setFontOpen] = useState(false);

  // HSV → RGB 
  const hsvToRgb = ({ h, s, v }: HSV): RGB => {
    let c = v * s;
    let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    let m = v - c;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) [r, g, b] = [c, x, 0];
    else if (60 <= h && h < 120) [r, g, b] = [x, c, 0];
    else if (120 <= h && h < 180) [r, g, b] = [0, c, x];
    else if (180 <= h && h < 240) [r, g, b] = [0, x, c];
    else if (240 <= h && h < 300) [r, g, b] = [x, 0, c];
    else if (300 <= h && h < 360) [r, g, b] = [c, 0, x];

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  };

  if (!color) return;

  //色履歴
  const [colorHistory, setColorHistory] = useState<string[]>([]);
  const addColorToHistory = (color: string) => {
    setColorHistory(prev => {
      // 同じ色は先頭に移動
      const filtered = prev.filter(c => c !== color);
      const updated = [color, ...filtered].slice(0, 10);

      localStorage.setItem("color-history", JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const { r, g, b } = hsvToRgb(color!);
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

    updateSettings({ color: hex });
  }, [color]);
  

  return (
    <div>
      <div>
        {/*--- 方向 ---*/}
        <div className="flex items-start gap-6 mb-4"> 
          <div>
            <p className="text-sm font-medium mb-1">方向</p>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 rounded ${
                  writingMode === "horizontal" ? "bg-purple-300" : "bg-gray-200"
                }`}
                onClick={() => {
                  setWritingMode("horizontal");
                  updateSettings({ writingMode: "horizontal" });
                }}
              >
                横書き
              </button>

              <button
                className={`px-3 py-1 rounded ${
                  writingMode === "vertical" ? "bg-purple-300" : "bg-gray-200"
                }`}
                onClick={() => {
                  setWritingMode("vertical");
                  updateSettings({ writingMode: "vertical" });
                }}
              >
                縦書き
              </button>
            </div>
          </div>

          {/*--- 配置 ---*/}
          <div>
            <p className="text-sm font-medium mb-1">配置</p>
            <div className="flex gap-2">
              {["left", "center", "right"].map((pos) => (
                <button
                  key={pos}
                  className={`px-3 py-1 rounded ${
                    align === pos ? "bg-purple-300" : "bg-gray-200"
                  }`}
                  onClick={() => {
                    const value = pos as "left" | "center" | "right";
                    setAlign(value);
                    updateSettings({ align: value });
                  }}
                >
                  {pos === "left"
                    ? "左(上)寄せ"
                    : pos === "center"
                    ? "中央"
                    : "右(下)寄せ"}
                </button>
              ))}
            </div>
          </div>

          {/*--- 太字 ---*/}
          <div>
            <p className="text-sm font-medium mb-1">太字</p>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 rounded ${
                  bold ? "bg-purple-300" : "bg-gray-200"
                }`}
                onClick={() => {
                  setBold(!bold);
                  updateSettings({ bold: !bold });
                }}
              >
                太字
              </button>
            </div>
          </div>
        </div>
      </div>

      {/*--- 文字サイズ ---*/}
      <div className="mt-3">
        <p className="text-sm font-medium mb-1">文字サイズ</p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={10}
            max={120}
            value={fontSize}
            onChange={(e) => {
              const size = Number(e.target.value);
              setFontSize(size);
              updateSettings({ fontSize: size });
            }}
            className="flex-1"
          />
          <span className="w-12 text-right">{fontSize}px</span>
        </div>
      </div>

      {/*--- フォント選択 ---*/}
      <div className="relative">
        <p className="text-sm font-medium mb-1">フォント</p>

        {/* ▼ ボタン */}
        <button
          className="w-full border rounded px-3 py-2 bg-white flex justify-between items-center"
          onClick={() => setFontOpen((o) => !o)}
          >
          <span style={{ fontFamily: textSettings.font }}>
            {textSettings.font || "フォントを選択"}
          </span>
          <span>▼</span>
        </button>

        {/* ▼ フォントリスト */}
        {fontOpen && (
          <div className="absolute left-0 right-0 mt-1 border rounded bg-white shadow-lg max-h-60 overflow-y-auto z-10">
            {fontOptions.map((f) => (
              <button
                key={f.value}
                className={`w-full text-left px-3 py-2 border-b last:border-none 
                  ${textSettings.font === f.value ? "bg-purple-100" : ""}`}
                style={{ fontFamily: f.value }}
                onClick={() => {
                  updateSettings({ font: f.value });
                  setFontOpen(false);
                }}
                >
                <div className="font-medium">{f.label}</div>
                <div className="text-xs opacity-70">Aaあア</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/*--- 入力欄 ---*/}
      <div className="flex-1">
        <p className="text-sm font-medium mb-1">テキスト内容</p>
        <textarea
          className="w-full h-16 border rounded p-2"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            updateSettings({ text: e.target.value });
          }}
        />
      </div>

      {/*--- プレビュー ---*/}
      <div className="flex-1 border rounded p-3 bg-white">
        <p className="text-sm font-medium mb-2">プレビュー</p>

          <div
            style={{
              color: textSettings.color, 
              fontFamily: textSettings.font,
              fontWeight: textSettings.bold ? "bold" : "normal",
              writingMode: textSettings.writingMode === "vertical" ? "vertical-rl" : "horizontal-tb",
              textAlign: textSettings.align as React.CSSProperties["textAlign"],
              whiteSpace: "pre-wrap",
              fontSize: `${textSettings.fontSize}px`,
            }}
          >
          {textSettings.text || "ここにテキストが表示されます"}
        </div>
      </div>  

      {/* カラーピッカー本体 */}
      <div className="mt-2 p-2 border rounded bg-white shadow">
        <HsvColorPicker
          color={{
            h: color.h,
            s: color.s * 100,
            v: color.v * 100,
          }}
          onChange={(newColor) =>
            setColor({
              h: newColor.h,
              s: newColor.s / 100,
              v: newColor.v / 100,
            })
          }
        />      
      </div>

      {/* 🎨 色履歴 */}
      <div className="flex gap-2 mt-2 flex-wrap">
        {colorHistory.map((color, index) => (
          <button
            key={index}
            onClick={() => {
              setColor(hexToHsv(color));
            }}
            className="w-6 h-6 rounded-full border border-gray-400 hover:scale-110 transition"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      
      <button
        onClick={() => {
          onConfirmText(textSettings);

          const rgb = hsvToRgb(color);
          const hex = `#${[rgb.r, rgb.g, rgb.b]
            .map(v => v.toString(16).padStart(2, "0"))
            .join("")}`;

          addColorToHistory(hex);
        }}
        className="w-full mt-4 py-2 bg-purple-400 text-white rounded-md hover:bg-purple-500"
      >
        キャンバスに追加
      </button>
    </div>
  );
}

// ---- ベースとなるレイアウトコンポーネント ----
export default function AppBase() {
  //サイドパネル
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelWidth, ] = useState(450); // サイドパネル幅
  const [, setIsResizing] = useState(false);
  const startResize = () => {
    setIsResizing(true);
  };

  //メニューボタン関連
  const [activePanel, setActivePanel] = useState<string | null>(null);

  //キャンパス操作
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const clearCanvas = () => {
    setItems([]);          // ✅ これが本体！！！
    setSelectedId(null);  // ✅ 選択も解除（安全）
  };

  //キャンパスサイズ変更
  const canvasSettings = {
    "トレカ":      { w: 630,  h: 880,  aspect: "aspect-[63/88]" },
    "A4用紙":     { w: 2100, h: 2970, aspect: "aspect-[210/297]" },
    "PC壁紙":     { w: 1920, h: 1080, aspect: "aspect-[192/108]" },
    "スマホ壁紙": { w: 1080, h: 1920, aspect: "aspect-[108/192]" },
  };
  //手動設定用
  const [manualWidth, setManualWidth] = useState<number | "">("");
  const [manualHeight, setManualHeight] = useState<number | "">("");
  const [showManualInput, setShowManualInput] = useState(false);

  const [canvasName, setCanvasName] = useState<keyof typeof canvasSettings>("トレカ"); // 型推論付き
  const size = canvasSettings[canvasName];

  
  //キャンパス拡大
  const [zoom, setZoom] = useState(1); // 1 = 100%
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const resetCanvasPosition = () => {
    setOffset({ x: 0, y: 0 });
    setZoom(1); // ← ズームも一緒に戻したいなら（不要なら消してOK）
  };
  
  // 画像追加
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  //素材追加
  //カテゴリ名の型宣言
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: "flower", name: "花" },
    { id: "ribbon", name: "リボン" },
    { id: "sparkle", name: "キラキラ" },
    { id: "heart", name: "ハート" },
    { id: "silver", name: "シルバー" },
    { id: "animal", name: "動物" },
    { id: "pattern", name: "柄もの" },
    { id: "other", name: "その他" },
  ] as const;

  //素材のIDリスト
  type MaterialCategory = keyof typeof materialIds;

  interface MaterialItem {
    id: string;
    name: string;
    category: MaterialCategory;
    thumbnail: string;
    colorable: boolean;
    layers: {
      line: string;
      fill: string;
    };
  }

  //素材の個々名称（素材追加したらここに追記）
  const materialIds = {
    flower: ["flower1","flower2","flower3","flower4","flower5","flower6","flower7","flower8","flower9","flower10"
      ,"flower11","flower12","flower13","flower14","flower15","flower16","flower17","flower18","flower19","flower20"
      ,"flower21","flower22","flower23","flower24","flower25","flower26","flower27","flower28","flower29","flower30"
      ,"flower31","flower32","flower33","flower34","flower35","flower36","flower37","flower38","flower39","flower40"
      ,"flower41","flower42","flower43","flower44","flower45","flower46","flower47","flower48","flower49","flower50"
    ], 
    ribbon: ["ribbon1","ribbon2","ribbon3","ribbon4","ribbon5","ribbon6","ribbon7","ribbon8","ribbon9","ribbon10",
      "ribbon11","ribbon12","ribbon13","ribbon14","ribbon15",
    ],
    sparkle: ["sparkle1","sparkle2","sparkle3","sparkle4","sparkle5",],
    heart: ["heart1","heart2","heart3","heart4","heart5","heart6","heart7","heart8","heart9","heart10",
      "heart11",
    ],
    silver: ["silver1","silver2","silver3","silver4",],
    animal: ["animal1","animal2","animal3","animal4","animal5","animal6","animal7","animal8","animal9","animal10",
      "animal11","animal12","animal13","animal14","animal15","animal16","animal17","animal18","animal19","animal20",
      "animal21","animal22","animal23","animal24","animal25","animal26","animal27","animal28","animal29","animal30",
      "animal31",
    ],
    pattern: ["pattern1","pattern2","pattern3","pattern4","pattern5","pattern6","pattern7","pattern8",],
    other: ["other1","other2","other3","other4","other5","other6","other7","other8",],
  };

  const createMaterial = (id: string, category: MaterialCategory): MaterialItem => ({
    id,
    name: `${category}_${id}`,
    category,
    thumbnail: `/materials/${category}/${id}.png`,
    colorable: true,
    layers: {
      line: `/materials/${category}/${id}_line.png`,
      fill: `/materials/${category}/${id}_fill.png`,
    },
  });

  // materialsByCategory を自動生成
  const materialsByCategory: Record<MaterialCategory, MaterialItem[]> = {} as Record<MaterialCategory, MaterialItem[]>;

  for (const category in materialIds) {
    const ids = materialIds[category as MaterialCategory];
    materialsByCategory[category as MaterialCategory] = ids.map(id =>
      createMaterial(id, category as MaterialCategory)
    );
  }

  //素材の色選択
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
    
  type ImageItem = {
    id: string;
    type: "image";
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    preview?: string;
  };

  type CanvasItem = TextItem | ImageItem;

  //レイヤー管理配列
  const [items, setItems] = useState<CanvasItem[]>([]);

  //レイヤー
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  //レイヤー並び替え用関数
  const moveLayer = (fromIndex: number, toIndex: number) => {
    setItems(prev => {
      const newItems = [...prev];
      // reverse 前提なので index を元に戻す
      const realFrom = prev.length - 1 - fromIndex;
      const realTo = prev.length - 1 - toIndex;

      const [moved] = newItems.splice(realFrom, 1);
      newItems.splice(realTo, 0, moved);

      return newItems;
    });
  };

  const drawMultilineText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    lineHeight: number,
    item: any
  ) => {
    ctx.textBaseline = "top";

    const lines = text.split("\n");
    let maxWidth = 0;

    lines.forEach((line, i) => {
      const m = ctx.measureText(line);
      maxWidth = Math.max(maxWidth, m.width);
      ctx.fillText(line, x, y + i * lineHeight);
    });

    const height = lines.length * lineHeight;

    item.width = maxWidth;
    item.height = height;
  };

  const imageCache = useRef<{ [key: string]: HTMLImageElement }>({});

  const handleAddText = (settings: TextSettings) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    ctx.font = `${textSettings.fontSize}px ${textSettings.font}`;

    const textWidth = ctx.measureText(settings.text).width;
    const textHeight = settings.fontSize; // フォントサイズを高さとみなす

    const newText: TextItem = {
      id: crypto.randomUUID(),
      type: "text",
      text: settings.text,
      x: 100,
      y: 100,
      fontSize: settings.fontSize,
      color: settings.color,
      font: settings.font,
      bold: settings.bold,
      writingMode: settings.writingMode,
      align: settings.align,
      width: textWidth,
      height: textHeight,
    };

    setItems(prev => [...prev, newText]);
  };
  
  const handleColorConfirm = (rgb: RGB) => {
    if (!selectedMaterial) {
      console.warn("selectedMaterial がまだセットされていません");
      return;
    }

    // RGB チェック
    if (!rgb) {
      console.warn("RGB が未定義です");
      return;
    }

    // 色付き素材をキャンバスに描画
    drawColoredMaterialOnCanvas(selectedMaterial, rgb);
  };

  //文字設定
  const [textSettings, setTextSettings] = useState<TextSettings>({
    text: "",
    writingMode: "horizontal",
    align: "left",
    font: "serif",
    bold: false,
    color: "#000000",
    fontSize: 30,
  });

  //キャンパス内操作
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [, setIsDragging] = useState(false);

  const getCanvasPos = (
    canvas: HTMLCanvasElement,
    e: React.MouseEvent
  ) => {
    const rect = canvas.getBoundingClientRect();

    // スケールを計算（CSSと実サイズの比率）
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const [currentMode, setCurrentMode] =
    useState<"move" | "resize" | "rotate" | null>(null);

  //回転用の ref
  const startAngleRef = useRef(0);
  const originalRotationRef = useRef(0);
  
  
  //複製処理関数
  const duplicateItem = (id: string) => {
    setItems(prev => {
      const target = prev.find(i => i.id === id);
      if (!target) return prev;

      const newItem = {
        ...target,
        id: crypto.randomUUID(),
        x: target.x + 30,
        y: target.y + 30,
      };
      return [...prev, newItem];
    });
    setSelectedId(null);
  };

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startWidthRef = useRef(0);
  const startHeightRef = useRef(0);

  const startLocalXRef = useRef(0);
  const startLocalYRef = useRef(0);

  //アイテムをクリックしたら選択する関数
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    
    if (!canvas) return;
      
    setIsDragging(true);
    window.addEventListener("mouseup", handleCanvasMouseUp);

    const { x: mouseX, y: mouseY } = getCanvasPos(canvas, e);
    const item = items.find(i => i.id === selectedId);

    // ====== 1) 回転ハンドル ======
    if (item && getRotateHandleUnderCursor(mouseX, mouseY, item)) {
      setCurrentMode("rotate");

      const cx = item.x + item.width / 2;
      const cy = item.y + item.height / 2;

      startAngleRef.current = Math.atan2(mouseY - cy, mouseX - cx);
      originalRotationRef.current = item.rotation ?? 0;
      return;
    }

    // ====== 2) リサイズハンドル ======
    if (item) {
      const handleName = getHandleUnderCursor(mouseX, mouseY, item);

      if (handleName) {
      setCurrentMode("resize");

        // 方向をセットする（既存の resizeDirX / resizeDirY に合わせる）
        const xDir = handleName.includes("l") ? "l" : "r";
        const yDir = handleName.includes("t") ? "t" : "b";

        setResizeDirX(xDir);
        setResizeDirY(yDir);

        const local = toLocalPoint(mouseX, mouseY, item);
        startWidthRef.current = item.width;
        startHeightRef.current = item.height;
        startLocalXRef.current = local.x;
        startLocalYRef.current = local.y;

        return;
      }
    }

    // ====== ★ × 削除ボタン判定（回転対応） ======
    if (item) {
      const deleteSize = 20;

      // 回転ノブの右隣（描画と同じ座標にする）
      const deleteX = item.x + item.width / 2 + 30;
      const deleteY = item.y - 30;

      // マウス座標を回転前に戻す
      const cx = item.x + item.width / 2;
      const cy = item.y + item.height / 2;
      const rad = -(item.rotation ?? 0);

      const dx = mouseX - cx;
      const dy = mouseY - cy;

      const rotatedMouseX = dx * Math.cos(rad) - dy * Math.sin(rad) + cx;
      const rotatedMouseY = dx * Math.sin(rad) + dy * Math.cos(rad) + cy;

      // 円の中に入っているか判定
      const isDeleteHit =
        Math.hypot(rotatedMouseX - deleteX, rotatedMouseY - deleteY) <=
        deleteSize / 2;

      if (isDeleteHit) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setSelectedId(null);
        setCurrentMode(null);
        return;
      }
    }

    // ====== ★ 複製ボタン判定（回転対応） ======
    if (item) {
      const duplicateHitSize = 36;

      // 回転ノブの左隣（描画と同じ座標）
      const duplicateX = item.x + item.width / 2 - 30;
      const duplicateY = item.y - 30;

      // マウス座標を回転前に戻す（削除と同じ処理）
      const cx = item.x + item.width / 2;
      const cy = item.y + item.height / 2;
      const rad = -(item.rotation ?? 0);

      const dx = mouseX - cx;
      const dy = mouseY - cy;

      const rotatedMouseX = dx * Math.cos(rad) - dy * Math.sin(rad) + cx;
      const rotatedMouseY = dx * Math.sin(rad) + dy * Math.cos(rad) + cy;

      const isDuplicateHit =
        Math.hypot(rotatedMouseX - duplicateX, rotatedMouseY - duplicateY) <=
        duplicateHitSize / 2;

      if (isDuplicateHit) {
        duplicateItem(item.id);
        setCurrentMode(null);
        return;
      }
    }

  // ====== 3) 通常のアイテム選択 → move ======
    for (let i = items.length - 1; i >= 0; i--) {
      const target = items[i];
      if (isPointInRotatedRect(mouseX, mouseY, target)) {
        setSelectedId(target.id);
        setCurrentMode("move");
        setIsDragging(true);

        // つかんだ位置をローカル座標で正確に保存（これが超重要）
        const local = toLocalPoint(mouseX, mouseY, target);
        setDragOffsetLocal({
          x: local.x,
          y: local.y
        });

        return;
      }
    }


    // ====== 4) 何もクリックしなかった ======
    setSelectedId(null);
    setCurrentMode(null);
  };

  //ドラッグ中に位置を更新する
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x: mouseX, y: mouseY } = getCanvasPos(canvas, e);
    const active = items.find(i => i.id === selectedId);
    if (!active) return;

    const cx = active.x + active.width / 2;
    const cy = active.y + active.height / 2;

    // ====== 回転中 ======
    if (currentMode === "rotate") {
      const angle = Math.atan2(mouseY - cy, mouseX - cx);
      const newRot = originalRotationRef.current + (angle - startAngleRef.current);

      setItems(prev => prev.map(it =>
        it.id === active.id ? { ...it, rotation: newRot } : it
      ));
      return;
    }

    /// ====== リサイズ中 ======
    if (currentMode === "resize") {
      const lp = toLocalPoint(mouseX, mouseY, active);

      let newW = active.width;
      let newH = active.height;
      let newX = active.x;
      let newY = active.y;

      // ---- 横方向 ----
      if (resizeDirX === "r") {
        newW = Math.max(20, lp.x); 
      } 
      else if (resizeDirX === "l") {
        newW = Math.max(20, active.width - lp.x);
        newX = active.x + (active.width - newW);
      }

      // ---- 縦方向 ----
      if (resizeDirY === "b") {
        newH = Math.max(20, lp.y);
      }
      else if (resizeDirY === "t") {
        newH = Math.max(20, active.height - lp.y);
        newY = active.y + (active.height - newH);
      }

      setItems(prev =>
        prev.map(it =>
          it.id === active.id
            ? { ...it, width: newW, height: newH, x: newX, y: newY }
            : it
        )
      );

      return;
    } 

    // ====== 移動中 ======
    if (currentMode === "move" && dragOffsetLocal) {
      // マウスのローカル座標
      const local = toLocalPoint(mouseX, mouseY, active);

      // 現在のローカル座標との差分を取る
      const dx = local.x - dragOffsetLocal.x;
      const dy = local.y - dragOffsetLocal.y;

      // 回転を考慮してローカル→ワールドへ差分を変換
      const cos = Math.cos(active.rotation ?? 0);
      const sin = Math.sin(active.rotation ?? 0);

      const worldDX = dx * cos - dy * sin;
      const worldDY = dx * sin + dy * cos;

      // 新しい位置を適用
      setItems(prev =>
        prev.map(it =>
          it.id === active.id
            ? { ...it, x: active.x + worldDX, y: active.y + worldDY }
            : it
        )
      );

      return;
    }

  };

  //マウスを離したらドラック終了
  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setResizingHandle(null);
    setCurrentMode(null);

    // 特にリセットする必要はないが一応
    startXRef.current = 0;
    startYRef.current = 0;
    startWidthRef.current = 0;
    startHeightRef.current = 0;
    startLocalXRef.current = 0;
    startLocalYRef.current = 0;

    setDragOffsetLocal(null);
      
    setIsDragging(false);
    window.removeEventListener("mouseup", handleCanvasMouseUp);
  };

  //拡大、縮小ノブ
  const HANDLE_SIZE = 8;

  // 選択中アイテムの拡大縮小ノブを描画
  const drawResizeHandles = (ctx: CanvasRenderingContext2D, item: CanvasItem) => {
    const { x, y, width, height } = item;

    // 回転している空間内なので「そのままの座標」でOK
    const points = [
      [x, y],               // 左上
      [x + width, y],       // 右上
      [x, y + height],      // 左下
      [x + width, y + height], // 右下
    ];

    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";

    points.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(px, py, HANDLE_SIZE, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  };

  const [resizeDirX, setResizeDirX] = useState<"l" | "r" | null>(null);
  const [resizeDirY, setResizeDirY] = useState<"t" | "b" | null>(null);
  const [, setResizingHandle] = useState<"tl"|"tr"|"bl"|"br"|null>(null);

  //回転ハンドル
  const ROTATE_HANDLE_OFFSET = 30;

  //回転描画関数
  const drawRotateHandle = (ctx: CanvasRenderingContext2D, item: CanvasItem) => {
    const cx = item.x + item.width / 2;
    const cy = item.y + item.height / 2;

    // ここはもう回転済みの空間なので rotate はしない！
    const handleX = cx;
    const handleY = cy - (item.height / 2 + ROTATE_HANDLE_OFFSET);

    ctx.beginPath();
    ctx.arc(handleX, handleY, HANDLE_SIZE, 0, Math.PI * 2);
    ctx.fillStyle = "#00aaff";
    ctx.fill();
  };

  const getRotateHandleUnderCursor = (
    mouseX: number,
    mouseY: number,
    item: CanvasItem
  ): boolean => {
    const cx = item.x + item.width / 2;
    const cy = item.y + item.height / 2;
    const rad = item.rotation ?? 0;

    const rawX = item.x + item.width / 2;
    const rawY = item.y - ROTATE_HANDLE_OFFSET;

    const pos = rotatePoint(rawX, rawY, cx, cy, rad);

    const dist = Math.hypot(mouseX - pos.x, mouseY - pos.y);
    return dist <= HANDLE_SIZE + 2;
  };

  const deleteSelectedItem = () => {
    if (!selectedId) return;
    setItems((prev) => prev.filter((item) => item.id !== selectedId));
    setSelectedId(null);
  };

  const [dragOffsetLocal, setDragOffsetLocal] = useState<{ x: number; y: number } | null>(null);
  const [, setPreview] = useState<string | null>(null);
  const selectedItem = items.find(item => item.id === selectedId);

  // 長押し移動用
  const moveIntervalRef = useRef<number | null>(null);
  const startMove = (dir: "up" | "down" | "left" | "right") => {
    // すでに動いてたら二重起動しない
    if (moveIntervalRef.current !== null) return;

    moveIntervalRef.current = window.setInterval(() => {
      setOffset(o => {
        const speed = 6; // ← 移動スピード（好みで調整OK）

        if (dir === "up") return { ...o, y: o.y + speed };
        if (dir === "down") return { ...o, y: o.y - speed };
        if (dir === "left") return { ...o, x: o.x + speed };
        if (dir === "right") return { ...o, x: o.x - speed };

        return o;
      });
    }, 16); 
  };

  const stopMove = () => {
    if (moveIntervalRef.current !== null) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
  };

  //背景透過
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [transparentImage, setTransparentImage] = useState<string | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [panelStep, setPanelStep] = useState<1 | 2 | 3>(1);

  //ファイル保存
  type SavedCanvas = {
    id: string;
    image: string;
    items: CanvasItem[];
    createdAt: number;
  };

  const [savedList, setSavedList] = useState<SavedCanvas[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<any | null>(null);

  const loadCanvasFromSaved = (data: SavedCanvas) => {
    setItems(data.items);     // ✅ キャンバス内容復元
    setSelectedId(null);      // ✅ 選択解除
    setPanelOpen(false);     // ✅ パネル閉じる
    setActivePanel(null);

    // ✅ 元の保存データを削除する場合
    const updatedList = savedList.filter(item => item.id !== data.id);
    setSavedList(updatedList);
    localStorage.setItem("savedCanvasList", JSON.stringify(updatedList));
  };

  //デバイスに画像を保存
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ✅ 今の選択状態を一時保存
    const prevSelectedId = selectedId;

    // ✅ 選択解除（＝青枠を消す）
    setSelectedId(null);

    // ✅ 1フレーム待ってから保存（再描画が反映されてから）
    requestAnimationFrame(() => {
      const dataUrl = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "hokurochan.png";
      link.click();

      // ✅ 選択状態を元に戻す
      setSelectedId(prevSelectedId);
    });
  };

  // --- フッター内に入れたいポップアップを操作する state ---
  const [popup, setPopup] = useState<"guide" | "terms" | "instagram" | null>(null);
  const [guideContent, setGuideContent] = useState("");   //ポップアップウィンドウステータス　使い方ガイド
  const [termsContent, setTermsContent] = useState("");   //ポップアップウィンドウステータス　利用規約　

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelectedItem();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  useEffect(() => {
    items.forEach(item => {
      if (item.type !== "image") return;

      if (!imageCache.current[item.id]) {
        const img = new Image();
        img.src = item.src;
        imageCache.current[item.id] = img;
      }
    });
  }, [items]);

  useEffect(() => {
    // ============================
    // 1) 画像キャッシュ
    // ============================
    items.forEach(item => {
      if (item.type !== "image") return;

      if (!imageCache.current[item.id]) {
        const img = new Image();
        img.src = item.src;
        imageCache.current[item.id] = img;
      }
    });

    // ============================
    // 2) Canvas 描画処理
    // ============================
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = size.w;
    canvas.height = size.h;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = "top";

    items.forEach(item => {
      // 文字描画
      if (item.type === "text") {
        ctx.fillStyle = item.color;
        ctx.font = `${textSettings.fontSize}px ${textSettings.font}`;
        // ========= 回転開始 =========
        ctx.save();
        const cx = item.x + item.width / 2;
        const cy = item.y + item.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate(item.rotation ?? 0);
        ctx.translate(-cx, -cy);

        // ★ 回転させた状態でテキスト描画
        drawMultilineText(ctx, item.text, item.x, item.y, 32, item);

        // ========= 回転終了 =========
        ctx.restore();
      }

      // 画像描画
      if (item.type === "image") {
        const img = imageCache.current[item.id];
        if (img) {
          // ========= 回転開始 =========
          ctx.save();
          const cx = item.x + item.width / 2;
          const cy = item.y + item.height / 2;
          ctx.translate(cx, cy);
          ctx.rotate(item.rotation ?? 0);
          ctx.translate(-cx, -cy);


          // ★ 回転させた状態で画像描画
          ctx.drawImage(img, item.x, item.y, item.width, item.height);

          // ✅ 次の描画に影響しないよう戻す（超重要）
          ctx.globalAlpha = 1;

          // ========= 回転終了 =========
          ctx.restore();
        }
      }

      // ============================
      // 3) ★ 選択枠を描画する ★
      // ============================
      if (item.id === selectedId) {
        // ========= 回転開始（枠とノブも回す） =========
        ctx.save();
        const cx = item.x + item.width / 2;
        const cy = item.y + item.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate(item.rotation ?? 0);
        ctx.translate(-cx, -cy);

        // ======== 回転した状態で枠を描く ========
        ctx.strokeStyle = "rgba(0, 132, 255, 1)";
        ctx.lineWidth = 2;
        ctx.strokeRect(item.x, item.y, item.width, item.height);

        // ======== 回転した状態でノブを描く ========
        if (item.type !== "text") {
          drawResizeHandles(ctx, item);
        }
        drawRotateHandle(ctx, item);

        // ======== 複製ボタン（＋）を描画 ========
        const duplicateVisualSize = 20;

        // 🔽 回転ノブの「左隣」に配置
        const duplicateX = item.x + item.width / 2 - 40;
        const duplicateY = item.y - 30;

        ctx.fillStyle = "rgba(34, 197, 94, 0.9)"; // 緑
        ctx.beginPath();
        ctx.arc(duplicateX, duplicateY, duplicateVisualSize / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("+", duplicateX, duplicateY);

        // ======== 削除ボタン（×）を描画 ========
        const deleteVisualSize = 20; // 見た目の大きさ（今のまま）
        const deleteX = item.x + item.width / 2 + 40;
        const deleteY = item.y - 30;

        ctx.fillStyle = "rgba(220, 38, 38, 0.9)";
        ctx.beginPath();
        ctx.arc(deleteX, deleteY, deleteVisualSize / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("×", deleteX, deleteY);

        // ========= 回転終了 =========
        ctx.restore();
        }
      });

  }, [items, size, selectedId, size.w, size.h]);

  useEffect(() => {
    // =========================
    // ✅ 保存ファイル 初期化
    // =========================
    if (activePanel === "保存ファイル") {
      setSelectedPreview(null);
    }

    // =========================
    // ✅ 画像パネル 初期化
    // =========================
    if (activePanel === "画像") {
      setPanelStep(1);
      setSelectedImage(null);
      setTransparentImage(null);
    }

    // =========================
    // ✅ 素材パネル 初期化
    // =========================
    if (activePanel === "素材") {
      // カテゴリを最初に戻したいならここも
      setSelectedCategory(categories[0].id); 
      setSelectedMaterial(null);
    }

  }, [activePanel]);


  useEffect(() => {
    const handleWindowMouseUp = () => {
    setIsDragging(false);
  };
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, []);

  useEffect(() => {
    if (!selectedItem) return;

    if (selectedItem.type === "image") {
      setPreview(selectedItem.src);
    } else if (selectedItem.type === "text") {
      setPreview(selectedItem.text);
    }
  }, [selectedItem]);

  //使い方ガイドのポップアップ
  useEffect(() => {
    if (popup === "guide") {
      const fetchGuide = async () => {
        try {
          const res = await fetch("/guide.html");
          const text = await res.text();
          setGuideContent(text);
        } catch (err) {
          console.error("読み込みに失敗:", err);
        }
      };
      fetchGuide();
    }
  }, [popup]);

  //利用規約のポップアップ
  useEffect(() => {
    if (popup === "terms") {
      const fetchTerms = async () => {
        try {
          const res = await fetch("/terms.html");
          const text = await res.text();
          setTermsContent(text);
        } catch (err) {
          console.error("読み込みに失敗:", err);
        }
      };
      fetchTerms();
    }
  }, [popup]);

  //サイト閉じた時の保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (items.length > 0) {
        saveCanvasToLocalStorage();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [items]);

  useEffect(() => {
  const data = localStorage.getItem("savedCanvasList");
  if (data) {
    setSavedList(JSON.parse(data));
  }
}, []);

  //ロード時に復元
  useEffect(() => {
    const data = localStorage.getItem("savedCanvasList");
    if (data) {
      setSavedList(JSON.parse(data));
    }
  }, []);

//キャンパスサイズ手動設定範囲制限アラーム
  function handleManualApply() {
    if (!manualWidth || !manualHeight) {
      alert("縦と横の両方を入力してください！");
      return;
    }
    if (manualWidth < 100 || manualHeight < 100　|| manualWidth > 5000 || manualHeight > 5000) {
      alert("サイズは100～5000pxの範囲で入力してください");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = manualWidth;
    canvas.height = manualHeight;

    alert(`キャンバスを ${manualWidth} × ${manualHeight} px に変更しました！`);
  }

  //キャンパスに画像配置する関数
  function handleAddToCanvas(imgSrc: string) {
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const x = (canvas.width - img.width) / 2;
      const y = (canvas.height - img.height) / 2;
      const scale = 0.3;
      const newImageItem: ImageItem = {
        id: crypto.randomUUID(),
        type: "image",
        src: imgSrc,
        x: canvas.width / 3,
        y: canvas.height / 3,
        width: img.width * scale,
        height: img.height * scale,
        rotation: 0,
      };
      setItems(prev => [...prev, newImageItem]);
    };
  }
    
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          setUploadedImages((prev) => [result, ...prev]);
        }
      };
      reader.readAsDataURL(file); // 画像をDataURLに変換
    });
  }


  //色付き素材を描画する関数
  function drawColoredMaterialOnCanvas(material?: MaterialItem, rgb?: RGB) {
    if (!material || !material.layers?.line || !material.layers?.fill || !rgb) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

      (async () => {
      try {
        const lineImg = await loadImage(material.layers.line);
        const fillImg = await loadImage(material.layers.fill);

        const w = lineImg.naturalWidth;
        const h = lineImg.naturalHeight;

        tempCanvas.width = w;
        tempCanvas.height = h;

        tempCtx.clearRect(0, 0, w, h);
        tempCtx.drawImage(fillImg, 0, 0);

        tempCtx.globalCompositeOperation = "source-in";
        tempCtx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        tempCtx.fillRect(0, 0, w, h);

        tempCtx.globalCompositeOperation = "source-over";
        tempCtx.drawImage(lineImg, 0, 0);

        const dataURL = tempCanvas.toDataURL();
        const scale = 0.2;

        const newItem: ImageItem = {
          id: crypto.randomUUID(),
          type: "image",
          src: dataURL,
          x: canvas.width / 2 - (w * scale) / 2,
          y: canvas.height / 2 - (h * scale) / 2,
          width: w * scale,
          height: h * scale,
          rotation: 0,
        };

        // 1回目から描画されるようにキャッシュに入れる
        const img = new Image();
        img.src = newItem.src;
        imageCache.current[newItem.id] = img;

        setItems(prev => [...prev, newItem]);
      } catch (e) {
        console.error("画像の読み込みに失敗しました", e);
      }
   })();
  } 

  //逆回転してマウス座標を補正する関数
  function toLocalPoint(mouseX: number, mouseY: number, item: CanvasItem) {
    const cx = item.x + item.width / 2;
    const cy = item.y + item.height / 2;
    const rad = item.rotation ?? 0;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const rx = dx * Math.cos(-rad) - dy * Math.sin(-rad);
    const ry = dx * Math.sin(-rad) + dy * Math.cos(-rad);
    // 左上基準に変換（中心 → 左上）
    return {
      x: rx + item.width / 2,
      y: ry + item.height / 2,
    };
  }


  //回転したアイテムの当たり判定関数
  function isPointInRotatedRect(mouseX: number, mouseY: number, item: CanvasItem) {
    const p = toLocalPoint(mouseX, mouseY, item);
    return (
      p.x >= 0 &&
      p.y >= 0 &&
      p.x <= item.width &&
      p.y <= item.height
    );
  }

  function getHandlePositions(item: CanvasItem) {
    const { x, y, width, height, rotation = 0 } = item;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const corners = [
      { name: "lt", px: x,         py: y },
      { name: "rt", px: x + width, py: y },
      { name: "lb", px: x,         py: y + height },
      { name: "rb", px: x + width, py: y + height },
    ];

    return corners.map(c => {
      const dx = c.px - cx;
      const dy = c.py - cy;
      const rx = dx * Math.cos(rotation) - dy * Math.sin(rotation);
      const ry = dx * Math.sin(rotation) + dy * Math.cos(rotation);
      return {
        name: c.name,
        x: cx + rx,
        y: cy + ry
      };
    });
  }

  function getHandleUnderCursor(mouseX: number, mouseY: number, item: CanvasItem) {
    const handles = getHandlePositions(item);

    for (const h of handles) {
      const dist = Math.hypot(mouseX - h.x, mouseY - h.y);
      if (dist < HANDLE_SIZE + 4) {
        return h.name;
      }
    }
    return null;
  }

 //回転後のノブ位置計算
  function rotatePoint(px: number, py: number, cx: number, cy: number, rad: number) {
    const dx = px - cx;
    const dy = py - cy;

    return {
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
    };
  }

  //背景透過関数
  async function handleRemoveBackground(imageSrc: string) {
    try {
      console.log("✅ 背景透過 開始");
      setIsRemovingBg(true); // ← ボタン切り替え開始

      const response = await fetch(imageSrc);
      const blob = await response.blob();

      const bitmap = await createImageBitmap(blob);

      // ✅ 画像を小さくする
      const maxSize = 512;

      let width = bitmap.width;
      let height = bitmap.height;

      if (width > maxSize || height > maxSize) {
        const scale = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0, width, height);

      const resizedBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png");
      });

      console.log("✅ リサイズ後サイズ", resizedBlob.size);

      const transparentBlob = await removeBackground(resizedBlob);

      console.log("✅✅✅ 背景透過 完了！！！");

      const url = URL.createObjectURL(transparentBlob);
      setTransparentImage(url);
      setPanelStep(3);

    } catch (err) {
      console.error("❌ 背景透過エラー", err);
      alert("❌ 背景透過に失敗しました！");
    } finally {
      setIsRemovingBg(false); // ← ボタンを元に戻す
    }
  }

  //ファイル保存用
  function saveCanvasToLocalStorage() {
    const data = {
      items,
      size,
    };
    localStorage.setItem("my-canvas-save", JSON.stringify(data));
  }

  const saveCanvas = () => {
    if (items.length === 0) return; // 何もなければ保存しない

    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = canvas.toDataURL("image/png"); // ✅ ここで image を作る！

    const newData: SavedCanvas = {
      id: crypto.randomUUID(),
      image,
      items,
      createdAt: Date.now(),
    };

    setSavedList(prev => {
      console.log("✅ 保存成功:", newData);
      return [newData, ...prev]; // 新しいのを先頭に追加
    });
  };



  return (
    <div className="w-screen h-screen overflow-hidden bg-pink-50 text-gray-700 flex flex-col font-sans">
      {/* ヘッダー */}
      <header className="w-full bg-pink-200 p-4 text-xl font-bold shadow-md flex items-center gap-2">
        <img
          src="/icon.png"
          alt="icon"
          className="w-16 h-16 rounded-full object-cover"
        />
        推しコラージュ作成サイト
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* 各メニューボタン */}
        <nav className="w-40 bg-pink-100 border-r border-pink-200 p-3 flex flex-col gap-3">
          {[
            "新規ファイル",
            "保存ファイル",
            "キャンパスサイズ",
            "画像",
            "素材",
            "文字",
            "レイヤー",
          ].map((label: string) => (
             <button
              key={label}
              onClick={() => {
                setActivePanel(label);

                if (label === "新規ファイル") {
                  // ✅ アイテムが1つ以上あるときだけ保存＆通知
                  if (items.length > 0) {
                    saveCanvasToLocalStorage();
                    alert("前の編集内容は自動保存されました。\n保存ファイルから確認できます！");
                  } else{
                    alert("新しいファイルになりました！");
                  }
                    saveCanvas();
                    clearCanvas();
                    setItems([]);           // ✅ これ超重要（描画の元データを消す）
                    setSelectedId(null);   // ✅ 選択状態もリセット
                    setActivePanel(null);
                    setPanelOpen(false);
                  return;
                }

                setPanelOpen(true);
              }}
              className="w-full py-2 bg-pink-300 rounded-2xl text-sm shadow hover:bg-pink-400 transition"
            >
              {label}
            </button>
          ))}
        </nav>

        {/* サイドパネル */}
        {panelOpen && (
          <motion.aside
            initial={{ x: panelWidth }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            style={{ width: panelWidth }}
            className="bg-white border-l border-pink-200 shadow-lg h-full relative top-0 flex flex-col overflow-hidden"
          >
              <div className="p-4 font-bold bg-pink-100 border-b border-pink-200 flex justify-between items-center">
                {activePanel || "機能パネル"}
                <button
                  onClick={() => setPanelOpen(false)}
                  className="text-sm bg-pink-300 px-2 py-1 rounded-xl"
                >
                  閉じる
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto text-sm">
                {activePanel === "保存ファイル" && (
                <>
                  {/* ✅ デバッグ表示 */}
                  <div className="text-xs text-gray-500">
                    保存数：{savedList.length}
                  </div>

                  {selectedPreview ? (
                    <div className="flex flex-col gap-4">
                      
                      <button
                        onClick={() => {
                          if (!selectedPreview) return;
                          loadCanvasFromSaved(selectedPreview);
                        }}
                        className="w-full py-2 bg-pink-400 text-white rounded-xl"
                      >
                        編集する
                      </button>

                      <button
                        onClick={() => setSelectedPreview(null)}
                        className="w-full py-2 bg-gray-200 rounded-xl"
                      >
                        戻る
                      </button>
                      <img
                        src={selectedPreview.image}
                        className="w-full rounded-xl shadow"
                      />

                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {savedList.map(data => (
                        <button
                          key={data.id}
                          onClick={() => {
                            console.log("選択した", data);
                            setSelectedPreview(data);
                          }}
                          className="bg-white rounded-xl shadow p-1"
                        >
                          <img
                            src={data.image}
                            className="w-full h-auto rounded-lg"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

                {activePanel === "キャンパスサイズ" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: "トレカ", id: "button-toreca" },
                        { name: "A4用紙", id: "button-a4" },
                        { name: "PC壁紙", id: "button-pc" },
                        { name: "スマホ壁紙", id: "button-smartphone" },
                        { name: "手動設定", id: "button-manual" },
                      ].map((btn) => (
                        <button
                          key={btn.id}
                          id={btn.id}
                          onClick={() => {
                            if (btn.name === "手動設定") {
                              setShowManualInput(true);
                              return;
                            }
                            setShowManualInput(false);
                            setCanvasName(btn.name as keyof typeof canvasSettings);
                          }}
                          className="w-full aspect-[4/3] bg-purple-200 rounded-xl flex items-center justify-center text-3xl font-semibold hover:bg-purple-300 transition"
                        >
                          {btn.name}
                        </button>
                      ))}
                    </div>
                    
                    {showManualInput && (
                      <div className="mt-4 space-y-4">
                        {/* 横 */}
                        <div>
                          <label className="block text-sm font-semibold mb-1">横</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={manualWidth}
                              onChange={(e) => setManualWidth(Number(e.target.value))}
                              className="w-full p-2 border rounded-lg"
                              placeholder="例：1000"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                              px
                            </span>
                          </div>
                        </div>

                        {/* 縦 */}
                        <div>
                          <label className="block text-sm font-semibold mb-1">縦</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={manualHeight}
                              onChange={(e) => setManualHeight(Number(e.target.value))}
                              className="w-full p-2 border rounded-lg"
                              placeholder="例：1500"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                              px
                            </span>
                          </div>
                        </div>

                        {/* 決定ボタン */}
                        <button
                          onClick={handleManualApply}
                          className="w-full bg-purple-300 text-white py-2 rounded-xl font-semibold hover:bg-purple-400 transition"
                        >
                          決定する
                        </button>
                      </div>
                    )}
                  </>
                )}   

                
                {activePanel === "画像" && (
                  <div className="space-y-3">

                    {/* hidden の file input */}
                    <input
                      type="file"
                      accept="image/*"
                      id="image-upload"
                      className="hidden"
                      onChange={handleImageUpload}
                    />

                    {/* 見た目のボタン */}
                    {panelStep === 1 && (
                      <button
                        onClick={() => document.getElementById("image-upload")?.click()}
                        className="w-full py-2 bg-purple-300 text-white rounded-xl font-semibold hover:bg-purple-400 transition"
                      >
                        ファイルを選択
                      </button>
                    )}

                    {/* 選択画像一覧 */}
                    {panelStep === 1 && (
                      <div className="grid grid-cols-2 gap-3">
                        {uploadedImages.map((src, index) => (
                          <div
                            key={index}
                            className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden border cursor-pointer"
                            onClick={() => {
                              setSelectedImage(src);
                              setPanelStep(2); // 画面②へ
                            }}
                          >
                            <img src={src} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {panelStep === 2 && selectedImage && (
                    <div className="space-y-3">
                      <img src={selectedImage} className="w-[60%] mx-auto rounded-xl border" />

                      <button
                        onClick={() => handleAddToCanvas(selectedImage)}
                        className="w-full py-2 bg-purple-400 text-white rounded-xl"
                      >
                        キャンパスに追加
                      </button>

                      <button
                        onClick={() => handleRemoveBackground(selectedImage)}
                        disabled={isRemovingBg}
                        className="w-full py-2 rounded bg-pink-500 text-white rounded-xl"
                      >
                        {isRemovingBg ? "透過中..." : "背景透過"}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedImage(null);
                          setPanelStep(1); // ✅ 画面①に戻る
                        }}
                        className="w-full py-2 bg-gray-300 rounded-xl"
                      >
                        戻る
                      </button>
                    </div>
                  )}

                  {panelStep === 3 && transparentImage && (
                    <div className="space-y-3">
                      <img
                        src={transparentImage}
                        className="w-[60%] mx-auto rounded-xl border bg-checkered"
                      />

                      <button
                        onClick={() => handleAddToCanvas(transparentImage)}
                        className="w-full py-2 bg-purple-500 text-white rounded-xl"
                      >
                        キャンパスに追加
                      </button>

                      <button
                        onClick={() => {
                          setTransparentImage(null);
                          setSelectedImage(null);
                          setPanelStep(1); // ✅ 画面①に戻る
                        }}
                        className="w-full py-2 bg-gray-300 rounded-xl"
                      >
                        戻る
                      </button>
                    </div>
                  )}
                </div>
                )}

                {activePanel === "素材" && (
                  <div className="flex h-full">

                    {/* 左側：カテゴリボタン */}
                    <div className="w-28 bg-gray-100 border-r p-2 flex flex-col gap-2">
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setSelectedMaterial(null); // ← 戻った時に素材も解除できるように
                          }}
                          className={`p-2 rounded-lg shadow-sm transition ${
                            selectedCategory === cat.id
                              ? "bg-purple-300 text-white"
                              : "bg-purple-100 hover:bg-purple-200 text-purple-700"
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>

                    {/* メインエリア：素材一覧 OR カラー変更画面 */}
                    <div className="flex-1 p-3 overflow-auto">

                      {/* =========================== */}
                      {/* ------- 画面切替 ---------- */}
                      {/* =========================== */}

                      {/* ▼▼ 素材一覧（selectedMaterial が null のときだけ表示） ▼▼ */}
                      {!selectedMaterial && (
                        <>
                          <p className="text-lg font-bold mb-2">
                            {selectedCategory}
                          </p>

                          <div className="grid grid-cols-3 gap-2">
                            {materialsByCategory[selectedCategory as MaterialCategory]?.map(
                              (material: MaterialItem) => (
                                <img
                                  key={material.id}
                                  src={material.thumbnail}
                                  alt={material.name}
                                  className="cursor-pointer hover:opacity-80"
                                  onClick={() => setSelectedMaterial(material)} // ← 素材選択
                                />
                              )
                            )}
                          </div>
                        </>
                      )}

                      {/* ▼▼ カラー変更画面（selectedMaterial が存在する時だけ表示） ▼▼ */}
                      {selectedMaterial && (
                        <ColorPickerPanel
                          selectedMaterial={selectedMaterial}
                          onConfirm={handleColorConfirm}
                          onBack={() => setSelectedMaterial(null)}

                        />
                      )}
                    </div>
                  </div>
                )}

                {activePanel === "文字" && (
                  <TextPanel
                    onConfirmText={handleAddText}
                    onChangeTextSettings={setTextSettings}
                    textSettings={textSettings}
                  />
                )}
                {/* レイヤー */}
                {activePanel === "レイヤー" && (
                  <div className="w-64 bg-white border-l p-2 overflow-y-auto">
                    {items
                      .slice()
                      .reverse()
                      .map((item, index) => (
                        <div
                          key={item.id}
                          draggable
                          onClick={() => setSelectedId(item.id)} // ✅ これだけ追加！！
                          onDragStart={() => setDragIndex(index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (dragIndex === null) return;
                            moveLayer(dragIndex, index);
                            setDragIndex(null);
                          }}
                          className={`flex items-center gap-2 p-2 mb-2 border rounded cursor-move
                            ${selectedId === item.id ? "bg-blue-100 border-blue-400" : "bg-gray-50"}
                          `}
                        >
                          {/* ✅ プレビュー */}
                          {item.type === "image" ? (
                            <img
                              src={item.preview ?? item.src}
                              className="w-12 h-12 object-contain border"
                              alt=""
                            />
                          ) : (
                            <div className="w-12 h-12 flex items-center justify-center border text-[10px] bg-gray-200">
                              テキスト
                            </div>
                          )}

                          {/* ✅ 種類表示 */}
                          <div className="text-xs">
                            {item.type === "image" ? "画像" : "テキスト"}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

              </div>

            {/* リサイズバー */}
            <div
              onMouseDown={startResize}
              className="w-2 cursor-col-resize bg-pink-300 absolute left-0 top-0 h-full"
            />
          </motion.aside>
        )}


        {/* キャンバス領域 デフォはトレカサイズ */}  
        <main className="flex-1 flex items-center justify-center bg-white shadow-inner relative overflow-hidden">
          <div className="w-full h-full flex items-center justify-center">        {/* ズーム用UI */}
          <div className="absolute top-4 right-4 z-50 bg-white p-2 rounded-xl shadow flex gap-2 items-center">
            <button
              onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))}
              className="px-2 py-1 bg-pink-300 rounded"
            >
              −
            </button>

            <span className="text-sm w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>

            <button
              onClick={() => setZoom(z => Math.min(z + 0.1, 3))}
              className="px-2 py-1 bg-pink-300 rounded"
            >
              ＋
            </button>
          </div> 

          {/* 十字移動UI（長押し対応） */}
          <div className="absolute top-20 right-4 bg-white p-2 rounded-xl shadow grid grid-cols-3 gap-1 place-items-center z-50">
            <div />

            {/* ↑ */}
            <button
              onMouseDown={() => startMove("up")}
              onMouseUp={stopMove}
              onMouseLeave={stopMove}
              onTouchStart={() => startMove("up")}
              onTouchEnd={stopMove}
              className="px-2 py-1 bg-purple-200 rounded"
            >
              ↑
            </button>

            <div />

            {/* ← */}
            <button
              onMouseDown={() => startMove("left")}
              onMouseUp={stopMove}
              onMouseLeave={stopMove}
              onTouchStart={() => startMove("left")}
              onTouchEnd={stopMove}
              className="px-2 py-1 bg-purple-200 rounded"
            >
              ←
            </button>

            {/* ✅ 中央リセットボタン */}
            <button
              onClick={resetCanvasPosition}
              className="px-2 py-1 bg-pink-400 text-white rounded text-xs font-bold flex flex-col items-center leading-tight"
            >
              <span>位置</span>
              <span>リセット</span>
            </button>

            {/* → */}
            <button
              onMouseDown={() => startMove("right")}
              onMouseUp={stopMove}
              onMouseLeave={stopMove}
              onTouchStart={() => startMove("right")}
              onTouchEnd={stopMove}
              className="px-2 py-1 bg-purple-200 rounded"
            >
              →
            </button>

            <div />

            {/* ↓ */}
            <button
              onMouseDown={() => startMove("down")}
              onMouseUp={stopMove}
              onMouseLeave={stopMove}
              onTouchStart={() => startMove("down")}
              onTouchEnd={stopMove}
              className="px-2 py-1 bg-purple-200 rounded"
            >
              ↓
            </button>

            <div />
          </div>


            {/* ズーム＋移動用ラッパー */}
            <div
              style={{
                transform: `
                  translate(${offset.x}px, ${offset.y}px)
                  scale(${zoom})
                `,
                transformOrigin: "center",
                transition: "transform 0.2s ease",
              }}
            >
              <div className="max-w-full max-h-full flex items-center justify-center">
                <canvas
                  key={`${size.w}-${size.h}`}
                  ref={canvasRef}
                  width={size.w}
                  height={size.h}
                  className="bg-gray-100 border border-gray-300 rounded-xl transition-all duration-300 ease-in-out"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain"
                  }}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                />
              </div>
            </div>
          </div>
        </main>



        {/* 広告スペース */}
        <aside className="w-56 bg-pink-100 border-r border-pink-200 p-2 text-sm flex flex-col justify-between">
          <div>
            
          </div>

          {/* 画像保存ボタン */}
          <button
            onClick={handleDownloadImage}
            className="mt-4 px-2 py-1 bg-pink-300 text-white rounded-lg text-sm shadow"
          >
            デバイスに保存する
          </button>
        </aside>

      </div>

      {/* 使い方ガイド・利用規約・お問い合わせ */}
      <footer className="w-full bg-pink-100 p-4 text-xs text-gray-600 border-t border-pink-200 flex justify-center gap-6">
        <span
          onClick={() => setPopup("guide")}
          className="cursor-pointer hover:text-pink-500 transition">
          使い方ガイド
        </span>

        <span
          onClick={() => setPopup("terms")}
          className="cursor-pointer hover:text-pink-500 transition">
          利用規約
        </span>

         <span
          onClick={() => setPopup("instagram")}
          className="cursor-pointer hover:text-pink-500 transition"
        >
          Instagram
        </span>

              
      </footer>

      {/* ポップアップウィンドウ */}
      {popup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-white w-[600px] p-6 rounded-xl shadow-xl border border-pink-200 relative"
          >
            {/* 閉じるボタン */}
            <button
              onClick={() => setPopup(null)}
              className="absolute top-2 right-2 bg-pink-300 text-white px-2 py-1 rounded-lg text-xs"
            >
              閉じる
            </button>

            {/* 内容切り替え */}
            {popup === "guide" && (
              <div>
                <div
                  className="text-sm text-gray-700"
                  dangerouslySetInnerHTML={{ __html: guideContent }}
                />
              </div>
            )}

            {popup === "terms" && (
              <div>
                <div
                  className="text-sm text-gray-700"
                  dangerouslySetInnerHTML={{ __html: termsContent }}
                />
              </div>
            )}

            {/* ▼▼ Instagram ポップアップ追加部分 ▼▼ */}
            {popup === "instagram" && (
              <div className="text-sm text-gray-700 space-y-4">

                <p className="font-semibold text-gray-800 text-lg">Instagram</p>

                {/* URL 表示 */}
                <a
                  href="https://www.instagram.com/hokurochan_room?igsh=OXkwbGViaXU1b21h&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-500 underline break-all"
                >
                  ほくろちゃんの部屋　Instagram
                </a>

                {/* QRコード画像 */}
                <div className="flex justify-center">
                  <img
                    src="/qr-instagram.png"  // ← public フォルダに置いた画像
                    alt="Instagram QR"
                    className="w-40 h-auto rounded-lg shadow"
                  />
                </div>

              </div>
            )}
            {/* ▲▲ Instagram ポップアップここまで ▲▲ */}

          </motion.div>
        </motion.div>
      )} 

    </div>
  );
}
