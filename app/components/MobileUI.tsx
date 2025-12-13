import React from "react";

export default function MobileUI() {
  return (
    <div className="w-screen h-screen bg-pink-50 flex flex-col">
      {/* スマホ用ヘッダー */}
      <header className="bg-pink-200 p-3 text-lg font-bold text-center shadow">
        推しコラージュ（スマホ版）
      </header>

      {/* ボトムメニュー（スマホ用UIは下にボタンがあると操作しやすい） */}
      <main className="flex-1 flex items-center justify-center p-4">
        {/* ここにあなたのキャンバスのモバイルレイアウトを入れる */}
        <div className="text-pink-500">
          スマホ版キャンバス領域（ここにスマホUIを作る）
        </div>
      </main>

      <nav className="bg-white p-3 border-t border-pink-200 flex justify-around">
        {["新規", "開く", "保存", "設定"].map((label) => (
          <button key={label} className="text-center text-sm">
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}