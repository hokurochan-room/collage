import React from "react";
import { motion } from "framer-motion";

export default function DesktopUI() {
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
          <main className="flex-1 h-full flex items-center justify-center bg-white shadow-inner relative overflow-hidden">
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
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                  <canvas
                    key={`${size.w}-${size.h}`}
                    ref={canvasRef}
                    width={size.w}
                    height={size.h}
                    className="bg-gray-100 border border-gray-300 rounded-xl transition-all duration-300 ease-in-out"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "70vh",
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
            使い方ガイドsetPopup
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
              className="
                  bg-white w-[600px] p-6 rounded-xl shadow-xl border border-pink-200 relative
                  max-h-[80vh] overflow-y-auto
                "
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
