import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, Target, MapPin, Calendar, Database, RefreshCw, Pin, ScanSearch, X, ExternalLink, Users } from 'lucide-react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { FacePhoto } from './FacePhoto';

interface SearchMatch {
  image_url: string;
  activity_id: string;
  title: string;
  date: string;
  where: string;
  year: number;
  center_x_pct: number;
  center_y_pct: number;
  width_pct: number;
  height_pct: number;
  similarity: number;
  match_confidence: number;
}

const proxied = (url: string) => `/img-proxy?url=${encodeURIComponent(url)}`;

/** ใบหน้าทุกหน้าในรูปเดียวจาก /recognize-face */
interface FullFace {
  face_id: number;
  center_x_pct: number;
  center_y_pct: number;
  width_pct: number;
  height_pct: number;
  is_target: boolean;
  match_confidence: number;
  match_name: string | null;
}

/** เลขหลักฐานจาก URL รูป */
const evidenceNo = (url: string, i: number) => {
  let h = 0;
  for (let k = 0; k < url.length; k++) h = (h * 31 + url.charCodeAt(k)) >>> 0;
  return `EV-${(h % 90000 + 10000)}-${i + 1}`;
};

/**
 * PersonSearch — กระดานแฟ้มสืบสวน: ปักหมุดรูปผู้ต้องสงสัย แล้วให้ AI
 * พลิกแฟ้มภาพกิจกรรม (gallery face index) หาหลักฐาน
 */
export const PersonSearch: React.FC = () => {
  const [targetImages, setTargetImages] = useState<string[]>([]);
  const [targetName, setTargetName] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(70);
  const [topK, setTopK] = useState<number>(50);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [searched, setSearched] = useState<boolean>(false);
  const [searchInfo, setSearchInfo] = useState<string>('');
  const [idxStatus, setIdxStatus] = useState<{ images: number; faces: number } | null>(null);
  const [selected, setSelected] = useState<SearchMatch | null>(null);
  const [allFaces, setAllFaces] = useState<FullFace[] | null>(null);
  const [loadingAll, setLoadingAll] = useState<boolean>(false);
  const [scanMap, setScanMap] = useState<Record<string, FullFace[]>>({});
  const [scanningCards, setScanningCards] = useState<boolean>(false);
  const [imgRetry, setImgRetry] = useState<Record<string, number>>({});
  const { activitiesList } = usePortfolioStore();

  /** ลิงก์โพสต์ต้นทางของกิจกรรม (ถ้ามีในคลัง) */
  const sourcePostUrl = (m: SearchMatch): string | null => {
    const act = activitiesList.find(a => a.id === m.activity_id);
    const urls = act?.sourceUrls;
    return urls && urls.length > 0 ? urls[0] : null;
  };

  /** ขอใบหน้าทุกหน้าในรูปเดียวจาก backend (เขียว=เป้าหมาย แดง=คนอื่น) */
  const showAllFaces = async (m: SearchMatch) => {
    if (targetImages.length === 0 || loadingAll) return;
    setLoadingAll(true);
    setAllFaces(null);
    try {
      const res = await fetch('http://localhost:8000/recognize-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: m.image_url,
          target_images_base64: targetImages,
          target_name: targetName,
          threshold: threshold / 100,
        }),
      });
      const data = await res.json();
      if (data.success) setAllFaces(data.face_matches || []);
    } catch { /* backend offline */ }
    setLoadingAll(false);
  };

  // เปลี่ยนรูปที่เลือก -> ล้างผลนับทั้งรูปเดิม
  useEffect(() => { setAllFaces(null); }, [selected]);

  /** สแกนทั้งรูปทุกใบหลังค้นหา (batch เดียว) -> การ์ดขึ้นกรอบเขียว/แดงเอง */
  const autoScanCards = async (list: SearchMatch[], tImages: string[], tName: string, thr: number, maxAutoScan = 20) => {
    const urls = list.slice(0, maxAutoScan).map(m => m.image_url);
    if (urls.length === 0 || tImages.length === 0) return;
    setScanningCards(true);
    try {
      const res = await fetch('http://localhost:8000/recognize-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_urls: urls,
          target_images_base64: tImages,
          target_name: tName,
          threshold: thr / 100,
          max_images: maxAutoScan,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const map: Record<string, FullFace[]> = {};
        for (const r of data.results || []) {
          if (r.success && r.face_matches) map[r.image_url] = r.face_matches;
        }
        setScanMap(map);
      }
    } catch { /* เงียบไว้ การ์ดยังโชว์กรอบเดี่ยวได้ */ }
    setScanningCards(false);
  };

  // เปิด modal ปุ๊บ นับทุกคนในรูปทันที (ใช้ผล batch ถ้ามี ไม่ต้องยิงซ้ำ)
  const showAllRef = useRef(showAllFaces);
  showAllRef.current = showAllFaces;
  useEffect(() => {
    if (!selected) return;
    const cached = scanMap[selected.image_url];
    if (cached) {
      setAllFaces(cached);
      return;
    }
    if (targetImages.length > 0) {
      showAllRef.current(selected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, scanMap]);

  // ปิด modal ด้วยปุ่ม Escape
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const fetchIndexStatus = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/gallery-index-status');
      if (res.ok) {
        const d = await res.json();
        setIdxStatus({ images: d.images_indexed || 0, faces: d.faces_total || 0 });
      }
    } catch { /* backend offline */ }
  }, []);

  useEffect(() => { fetchIndexStatus(); }, [fetchIndexStatus]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 12);
    if (files.length === 0) return;
    e.target.value = '';
    files.forEach((file, fi) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setTargetImages(prev => (prev.length >= 12 ? prev : [...prev, url]));
        if (fi === 0) {
          setTargetName(prev => prev || file.name.replace(/\.[^/.]+$/, ''));
        }
        setSearched(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeTarget = (idx: number) => {
    setTargetImages(prev => prev.filter((_, i) => i !== idx));
    setSearched(false);
  };

  const handleSearch = async () => {
    if (targetImages.length === 0 || isSearching) return;
    setIsSearching(true);
    setSearched(false);
    try {
      const res = await fetch('http://localhost:8000/search-person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_images_base64: targetImages,
          target_name: targetName,
          threshold: threshold / 100,
          top_k: topK,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const list: SearchMatch[] = data.matches || [];
        setMatches(list);
        setImgRetry({});
        setScanMap({});
        setSearchInfo(`พลิกแฟ้ม ${data.faces_compared} ใบหน้าใน ${data.images_searched} รูป ใช้เวลา ${data.processing_ms}ms · ใช้ ${data.target_views || targetImages.length} มุมมองเป้าหมาย`);
        // สแกนทั้งรูปทุกใบอัตโนมัติ (สแกน 20 ใบแรก หรือตาม topK หากเลือกน้อย)
        const autoCount = Math.min(topK, 30);
        autoScanCards(list, targetImages, targetName, threshold, autoCount);
      } else {
        setMatches([]);
        setSearchInfo(data.error || 'ค้นหาไม่สำเร็จ');
      }
    } catch {
      setMatches([]);
      setSearchInfo('ติดต่อ Backend ไม่ได้ (รัน python main.py หรือยัง?)');
    }
    setSearched(true);
    setIsSearching(false);
    fetchIndexStatus();
  };

  return (
    <div className="relative">
      {/* แฟ้มเอกสาร */}
      <div className="rounded-2xl bg-[#fffdf6] border border-[#d8c690] shadow-[0_10px_30px_rgba(59,29,110,0.15)] overflow-hidden">
        {/* สันแฟ้ม */}
        <div className="flex items-stretch">
          <div className="w-3 sm:w-4 bg-gradient-to-b from-[#d4af37] via-[#b8860b] to-[#d4af37] shrink-0" />
          <div className="flex-1 p-5 sm:p-7 space-y-5">
            {/* หัวแฟ้ม */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <p className="text-[11px] font-black tracking-[0.25em] text-[#8a6d1b]">SUSPECT BOARD · แฟ้มสืบสวน</p>
                <h3 className="text-xl sm:text-2xl font-black text-[#2a1152] flex items-center gap-2 mt-1">
                  <Pin size={22} className="text-red-700 -rotate-12" />
                  ปักหมุดผู้ต้องสงสัย แล้วพลิกแฟ้ม
                </h3>
              </div>
              <button onClick={fetchIndexStatus} title="รีเฟรชสถานะ index"
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#2a1152] bg-white border-2 border-[#d4af37] rounded-lg hover:bg-[#faf3dd] transition-colors shadow-sm">
                <Database size={13} />
                {idxStatus ? `แฟ้ม: ${idxStatus.images} รูป / ${idxStatus.faces} ใบหน้า` : 'แฟ้ม: ...'}
                <RefreshCw size={12} />
              </button>
            </div>

            {/* บาร์โค้ดแฟ้ม */}
            <div className="h-8 rounded bg-white border border-[#d8c690] px-3 flex items-center gap-3 overflow-hidden">
              <div className="flex-1 h-5 opacity-70"
                style={{ background: 'repeating-linear-gradient(90deg,#2a1152 0 2px,transparent 2px 5px,#2a1152 5px 6px,transparent 6px 10px)' }} />
              <span className="text-[10px] font-mono font-bold text-[#2a1152] whitespace-nowrap">SDU-FACE-{idxStatus ? idxStatus.faces : '0000'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-5">
              {/* รูปผู้ต้องสงสัย (สูงสุด 12 มุม ยิ่งหลายมุมยิ่งแม่น) */}
              <div>
                <p className="text-[11px] font-black tracking-widest text-red-800 mb-2">① รูปผู้ต้องสงสัย ({targetImages.length}/12 มุม)</p>
                <div className="relative bg-white p-2 pb-8 shadow-lg rotate-[-1.5deg] border border-slate-200">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#f3d27a]/85 shadow-sm rotate-[-2deg] border-x border-[#b8860b]/40" />
                  <div className="relative aspect-square overflow-hidden bg-slate-100">
                    {targetImages.length > 0 ? (
                      <img src={targetImages[0]} alt="target" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#6d28d9]/60 p-3 text-center">
                        <Upload size={28} />
                        <p className="text-xs font-bold">แตะเพื่อปักหมุดรูป</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" multiple onChange={handleFile} title="เลือกได้หลายรูป (สูงสุด 12)"
                      className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <p className="absolute bottom-1.5 left-0 right-0 text-center text-[11px] font-mono font-bold text-slate-600 truncate px-2">
                    {targetName || 'ยังไม่ปักหมุดรูป'}
                  </p>
                </div>
                {targetImages.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap items-center">
                    {targetImages.map((t, i) => (
                      <div key={i} className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 ${i === 0 ? 'border-red-700' : 'border-[#d8c690]'}`}>
                        <img src={t} alt={`มุม ${i + 1}`} className="w-full h-full object-cover" />
                        <button onClick={() => removeTarget(i)} title="ลบมุมนี้"
                          className="absolute top-0 right-0 w-4 h-4 bg-red-800 text-white text-[10px] leading-none rounded-bl-md">×</button>
                      </div>
                    ))}
                    {targetImages.length < 12 && (
                      <label title="เพิ่มรูปมุมอื่นอีก"
                        className="relative w-12 h-12 rounded-lg border-2 border-dashed border-red-700/60 bg-red-50/50 hover:bg-red-100/60 flex flex-col items-center justify-center cursor-pointer transition-colors text-red-800">
                        <span className="text-lg font-black leading-none">+</span>
                        <span className="text-[9px] font-bold">เพิ่ม</span>
                        <input type="file" accept="image/*" multiple onChange={handleFile} className="hidden" />
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* ขั้นตอน + ปุ่ม */}
              <div className="flex flex-col justify-between gap-4">
                <ol className="space-y-2 text-xs sm:text-sm text-[#2a1152]/80 font-medium">
                  <li className="flex gap-2"><span className="font-black text-red-800">②</span> ตั้งเกณฑ์ความเหมือน — ยิ่งสูงยิ่งเข้ม ผิดตัวน้อยลง</li>
                  <li className="flex gap-2"><span className="font-black text-red-800">③</span> กดพลิกแฟ้ม — AI เทียบลายเซ็นใบหน้ากับแฟ้มทั้งหมดในไม่กี่วินาที</li>
                </ol>
                <div className="space-y-3 bg-white p-4 rounded-xl border-2 border-[#2a1152]/15">
                  <div className="flex justify-between items-center text-xs font-black text-[#2a1152]">
                    <span>เกณฑ์ความเหมือน</span>
                    <span className="font-mono bg-red-800 text-white px-2 py-0.5 rounded-md -rotate-2 inline-block">{threshold}%</span>
                  </div>
                  <input type="range" min={50} max={99} value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full accent-red-800 cursor-pointer" />

                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#2a1152]">จำนวนหลักฐานที่ดึง</span>
                    <div className="inline-flex flex-wrap rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs font-bold gap-0.5">
                      {[30, 50, 100, 200, 500, 2000].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setTopK(k)}
                          className={`px-2.5 py-1 rounded-md transition-colors ${
                            topK === k
                              ? 'bg-red-800 text-white shadow-sm'
                              : 'text-slate-600 hover:text-[#2a1152]'
                          }`}
                        >
                          {k.toLocaleString()} ชิ้น
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={handleSearch} disabled={targetImages.length === 0 || isSearching}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-800 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base rounded-xl shadow-[0_6px_0_#7f1d1d] hover:shadow-[0_4px_0_#7f1d1d] hover:translate-y-[2px] active:shadow-none active:translate-y-[6px] transition-all tracking-wide">
                  <ScanSearch size={20} className="text-[#f3d27a]" />
                  {isSearching ? 'กำลังพลิกแฟ้ม...' : 'พลิกแฟ้มหาหลักฐาน'}
                </button>
                {searchInfo && <p className="text-[11px] text-[#2a1152]/60 font-mono">{searchInfo}</p>}
              </div>
            </div>

            {/* หลักฐาน */}
            {searched && (
              <div className="space-y-4 pt-3 border-t-2 border-dashed border-[#d8c690]">
                <h4 className="text-sm font-black text-[#2a1152] flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-white text-xs -rotate-2 inline-block ${matches.length > 0 ? 'bg-red-800' : 'bg-slate-400'}`}>
                    {matches.length > 0 ? `หลักฐาน ${matches.length} ชิ้น` : 'ไม่พบหลักฐาน'}
                  </span>
                  {matches.length > 0 && <span className="font-medium">เรียงตามความเหมือน</span>}
                  {matches.length === 0 && <span className="font-medium">ลองลดเกณฑ์ความเหมือนลง</span>}
                </h4>
                {scanningCards && (
                  <p className="text-[11px] text-[#2a1152]/60 font-bold animate-pulse">⏳ กำลังสแกนทั้งรูปทุกใบ กรอบ 🟢/🔴 จะขึ้นเองทีละใบ...</p>
                )}
                {!scanningCards && matches.length > Math.min(topK, 30) && (
                  <p className="text-[11px] text-[#2a1152]/60 font-medium">สแกนกรอบอัตโนมัติ {Math.min(topK, 30)} ใบแรก (คลิกใบอื่นเพื่อสแกนเพิ่มใน modal)</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matches.map((m, i) => {
                    const tilt = i % 2 === 0 ? 'rotate-[0.8deg]' : '-rotate-[0.8deg]';
                    const scanned = scanMap[m.image_url];
                    const gCount = scanned ? scanned.filter(f => f.is_target).length : 0;
                    const rCount = scanned ? scanned.length - gCount : 0;
                    const lowConfidence = m.match_confidence < 40;
                    return (
                      <figure key={`${m.image_url}-${i}`} onClick={() => setSelected(m)}
                        className={`relative bg-white p-2 pb-3 shadow-xl border ${lowConfidence ? 'border-amber-400 opacity-50' : 'border-slate-200'} ${tilt} hover:rotate-0 hover:scale-[1.02] transition-transform cursor-pointer`}
                        title="คลิกเพื่อดูรายละเอียดหลักฐาน">
                        {/* เทปกาว */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#f3d27a]/85 shadow-sm rotate-[3deg] border-x border-[#b8860b]/40 z-10" />
                        <div className="relative aspect-[4/3] bg-purple-950 overflow-hidden">
                          {(imgRetry[m.image_url] ?? 0) > 2 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                              <p className="text-purple-200 text-xs font-bold">โหลดรูปไม่ได้ชั่วคราว</p>
                              <a href={m.image_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                                className="text-[#f3d27a] text-xs font-bold underline">เปิดรูปต้นฉบับ</a>
                            </div>
                          ) : (
                            <FacePhoto
                              src={proxied(m.image_url) + ((imgRetry[m.image_url] ?? 0) > 0 ? `&r=${imgRetry[m.image_url]}` : '')}
                              alt={m.title}
                              fit="cover"
                              boxes={scanned || [{ ...m, is_target: false }]}
                              onError={() => setImgRetry(prev => ({ ...prev, [m.image_url]: (prev[m.image_url] ?? 0) + 1 }))}
                              className="absolute inset-0 w-full h-full"
                            />
                          )}
                          {scanned ? (
                            <div className="absolute top-2 left-2 flex gap-1 text-[10px] font-black pointer-events-none">
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-700/95 text-white">🟢{gCount}</span>
                              <span className="px-1.5 py-0.5 rounded-md bg-red-700/95 text-white">🔴{rCount}</span>
                            </div>
                          ) : (
                          <>
                          {/* ตราประทับ MATCH */}
                          <div className="absolute top-2 right-2 rotate-12 rounded-full border-[3px] border-red-700 bg-red-700/15 backdrop-blur-[1px] w-16 h-16 flex flex-col items-center justify-center shadow-lg">
                            <span className="text-red-700 font-black text-[13px] leading-none">MATCH</span>
                            <span className="text-red-700 font-black text-[13px] leading-none">{m.match_confidence}%</span>
                          </div>
                          {scanningCards && (
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-purple-950/85 text-[#f3d27a] text-[10px] font-bold animate-pulse pointer-events-none">
                              ⏳ กำลังสแกนทั้งรูป...
                            </div>
                          )}
                          </>
                          )}
                        </div>
                        <figcaption className="pt-2 px-1 space-y-1">
                          <p className="text-[10px] font-mono font-bold text-red-800">{evidenceNo(m.image_url, i)}</p>
                          {lowConfidence && (
                            <p className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-300 rounded px-1.5 py-0.5 inline-block">⚠ อาจผิดตัว (ความเหมือนต่ำ)</p>
                          )}
                          <p className="text-xs font-bold text-[#2a1152] line-clamp-1">{m.title || 'กิจกรรม มหาวิทยาลัยสวนดุสิต'}</p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1"><MapPin size={12} className="text-[#6d28d9]" />{m.where || 'ม.สวนดุสิต'}</span>
                            <span className="flex items-center gap-1"><Calendar size={12} className="text-[#b8860b]" />{m.date || `พ.ศ. ${m.year}`}</span>
                          </div>
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal รายละเอียดหลักฐาน */}
      {selected && (() => {
        const m = selected;
        const postUrl = sourcePostUrl(m);
        const targetCount = (allFaces || []).filter(f => f.is_target).length;
        const otherCount = (allFaces || []).length - targetCount;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1d0b3d]/85 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelected(null)}>
            <div className="relative w-full max-w-4xl bg-[#fffdf6] rounded-2xl overflow-hidden shadow-2xl border-t-8 border-[#d4af37] my-auto"
              onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelected(null)} title="ปิด (Esc)"
                className="absolute top-3 right-3 z-10 p-2 bg-[#2a1152] hover:bg-[#4c1d95] text-white rounded-full transition-colors shadow-lg">
                <X size={18} />
              </button>
              <div className="px-5 pt-4 pb-3 border-b-2 border-dashed border-[#d8c690] flex items-start justify-between gap-3 flex-wrap">
                <div className="pr-8">
                  <p className="text-[11px] font-mono font-bold text-red-800">{evidenceNo(m.image_url, matches.indexOf(m))} · กิจกรรม {m.activity_id}</p>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#2a1152] line-clamp-2">{m.title || 'กิจกรรม มหาวิทยาลัยสวนดุสิต'}</h3>
                </div>
                <button onClick={() => showAllFaces(m)} disabled={loadingAll}
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-[#2a1152] hover:bg-[#4c1d95] disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow transition-colors">
                  <Users size={14} className="text-[#f3d27a]" />
                  {loadingAll ? 'กำลังนับ...' : allFaces ? 'นับใหม่' : 'แสดงทุกคนในรูปนี้'}
                </button>
              </div>
              {allFaces && (
                <div className="mx-5 mt-3 flex items-center gap-2 flex-wrap text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-950 text-white">พบ {allFaces.length} คน</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white">🟢 เป้าหมาย {targetCount} คน</span>
                  <span className="px-2.5 py-1 rounded-lg bg-red-700 text-white">🔴 คนอื่น {otherCount} คน</span>
                </div>
              )}
              {!allFaces && !loadingAll && (
                <p className="mx-5 mt-2 text-[11px] text-[#2a1152]/60 font-medium">💡 เปิดการ์ดระบบจะนับทุกคนให้อัตโนมัติ (ต้องปักหมุดรูปเป้าหมายไว้ก่อน) — กรอบ 🟢เป้าหมาย / 🔴คนอื่น</p>
              )}
              {loadingAll && !allFaces && (
                <p className="mx-5 mt-2 text-[11px] text-[#2a1152]/60 font-medium animate-pulse">⏳ กำลังนับใบหน้าทั้งรูป...</p>
              )}
              <div className="relative bg-purple-950 overflow-hidden m-5 rounded-xl" style={{ height: '55vh' }}>
                <FacePhoto
                  src={proxied(m.image_url)}
                  alt={m.title}
                  fit="contain"
                  eager
                  boxes={allFaces ? allFaces : [{ ...m, is_target: false }]}
                  className="absolute inset-0 w-full h-full"
                />
                {!allFaces && (
                  <div className="absolute top-3 right-3 rotate-12 rounded-full border-[3px] border-red-700 bg-red-700/15 w-20 h-20 flex flex-col items-center justify-center shadow-lg pointer-events-none">
                    <span className="text-red-700 font-black text-sm leading-none">MATCH</span>
                    <span className="text-red-700 font-black text-sm leading-none">{m.match_confidence}%</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 text-xs">
                <div className="p-3 bg-white rounded-xl border border-[#d8c690] space-y-1">
                  <span className="text-slate-500 font-bold flex items-center gap-1"><MapPin size={13} className="text-[#6d28d9]" /> สถานที่</span>
                  <p className="text-[#2a1152] font-bold">{m.where || 'มหาวิทยาลัยสวนดุสิต'}</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#d8c690] space-y-1">
                  <span className="text-slate-500 font-bold flex items-center gap-1"><Calendar size={13} className="text-[#b8860b]" /> วันที่</span>
                  <p className="text-[#2a1152] font-bold">{m.date || `พ.ศ. ${m.year}`}</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#d8c690] space-y-1">
                  <span className="text-slate-500 font-bold">ความเหมือน</span>
                  <p className="text-red-800 font-black">{m.match_confidence}% <span className="font-mono font-medium text-slate-400">({m.similarity})</span></p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#d8c690] space-y-1">
                  <span className="text-slate-500 font-bold">ลิงก์</span>
                  <p className="flex flex-col gap-1">
                    <a href={m.image_url} target="_blank" rel="noreferrer" className="text-[#6d28d9] font-bold hover:underline flex items-center gap-1">
                      เปิดรูปต้นฉบับ <ExternalLink size={12} />
                    </a>
                    {postUrl && (
                      <a href={postUrl} target="_blank" rel="noreferrer" className="text-[#6d28d9] font-bold hover:underline flex items-center gap-1">
                        เปิดโพสต์ต้นทาง <ExternalLink size={12} />
                      </a>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
