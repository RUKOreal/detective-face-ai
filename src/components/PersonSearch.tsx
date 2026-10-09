import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ImagePlus, Plus, X, Search, SearchX, CheckCircle2, SlidersHorizontal, ChevronDown, Database, RefreshCw, MapPin, Calendar, ExternalLink, Users } from 'lucide-react';
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

  const matchLevel = (c: number) =>
    c >= 75
      ? { label: 'เหมือนมาก', color: '#12a05c', bg: '#e6f6ee' }
      : c >= 50
        ? { label: 'น่าจะใช่', color: '#c27800', bg: '#fff3dc' }
        : { label: 'อาจผิดตัว', color: '#d6364a', bg: '#fde8eb' };

  const presets = [
    { label: 'กว้าง', hint: 'เจอเยอะ อาจมีผิดตัว', value: 60 },
    { label: 'พอดี', hint: 'แนะนำ', value: 70 },
    { label: 'เข้มงวด', hint: 'เจอน้อย แต่แม่นกว่า', value: 85 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
      {/* ───── ซ้าย: ขั้นตอนการค้นหา ───── */}
      <aside className="card p-5 sm:p-6 space-y-6 lg:sticky lg:top-24">
        {/* ขั้นที่ 1 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="step-no">1</span>
            <h2 className="font-semibold text-lg">เลือกรูปคนที่ต้องการหา</h2>
          </div>

          {targetImages.length === 0 ? (
            <label className="dropzone relative rounded-2xl flex flex-col items-center justify-center gap-2 text-center py-10 px-4 cursor-pointer">
              <ImagePlus size={40} className="text-[#3b5bdb]" />
              <span className="font-semibold text-[#3b5bdb]">กดเพื่อเลือกรูป</span>
              <span className="text-sm text-[#5d6882]">เลือกได้หลายรูป (สูงสุด 12 รูป)<br />ใช้รูปที่เห็นหน้าตรงและชัดเจน</span>
              <input type="file" accept="image/*" multiple onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
            </label>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-[#eef1f8] aspect-[4/3]">
                <img src={targetImages[0]} alt="รูปเป้าหมาย" className="w-full h-full object-cover" />
                <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/65 text-white text-xs max-w-[85%] truncate">
                  {targetName || 'รูปเป้าหมาย'}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                {targetImages.map((t, i) => (
                  <div key={i} className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 ${i === 0 ? 'border-[#3b5bdb]' : 'border-[#e2e7f1]'}`}>
                    <img src={t} alt={`รูปที่ ${i + 1}`} className="w-full h-full object-cover" />
                    <button onClick={() => removeTarget(i)} title="ลบรูปนี้"
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 hover:bg-[#d6364a] text-white grid place-items-center transition">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {targetImages.length < 12 && (
                  <label title="เพิ่มรูปอีก"
                    className="relative w-14 h-14 rounded-xl border-2 border-dashed border-[#b9c4e6] text-[#3b5bdb] hover:bg-[#eef2ff] grid place-items-center cursor-pointer transition">
                    <Plus size={22} />
                    <input type="file" accept="image/*" multiple onChange={handleFile} className="hidden" />
                  </label>
                )}
              </div>
              <p className="text-sm text-[#5d6882]">เลือกแล้ว {targetImages.length} รูป · ยิ่งมีหลายมุมยิ่งแม่นยำ</p>
            </div>
          )}
        </section>

        {/* ขั้นที่ 2 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="step-no">2</span>
            <h2 className="font-semibold text-lg">เลือกความละเอียดในการค้น</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((p) => {
              const active = threshold === p.value;
              return (
                <button key={p.value} type="button" onClick={() => setThreshold(p.value)}
                  className={`rounded-xl border-2 px-2 py-2.5 text-center transition ${active
                    ? 'border-[#3b5bdb] bg-[#eef2ff] text-[#2f49b3]'
                    : 'border-[#e2e7f1] hover:border-[#c9d2e8] text-[#1b2437]'}`}>
                  <span className="block font-semibold">{p.label}</span>
                  <span className="block text-[11px] text-[#5d6882] leading-tight mt-0.5">{p.hint}</span>
                </button>
              );
            })}
          </div>

          <details className="group text-sm">
            <summary className="cursor-pointer text-[#3b5bdb] font-medium inline-flex items-center gap-1.5 select-none list-none">
              <SlidersHorizontal size={15} /> ตั้งค่าเพิ่มเติม
              <ChevronDown size={15} className="group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-3 space-y-4 p-4 rounded-xl bg-[#f4f6fb]">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">ความเหมือนขั้นต่ำ</span>
                  <span className="font-semibold text-[#3b5bdb]">{threshold}%</span>
                </div>
                <input type="range" min={50} max={99} value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="simple-range w-full cursor-pointer" />
                <div className="flex justify-between text-xs text-[#5d6882] mt-1"><span>เจอเยอะ</span><span>แม่นกว่า</span></div>
              </div>
              <div>
                <label htmlFor="topk" className="font-medium block mb-2">แสดงผลสูงสุด</label>
                <select id="topk" value={topK} onChange={(e) => setTopK(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#e2e7f1] bg-white px-3 py-2">
                  {[30, 50, 100, 200, 500, 2000].map((k) => (
                    <option key={k} value={k}>{k.toLocaleString()} รูป</option>
                  ))}
                </select>
              </div>
            </div>
          </details>
        </section>

        {/* ขั้นที่ 3 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="step-no">3</span>
            <h2 className="font-semibold text-lg">เริ่มค้นหา</h2>
          </div>
          <button onClick={handleSearch} disabled={targetImages.length === 0 || isSearching}
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2.5">
            {isSearching ? <><span className="spinner" /> กำลังค้นหา...</> : <><Search size={22} /> ค้นหาในภาพกิจกรรม</>}
          </button>
          {targetImages.length === 0 && (
            <p className="text-sm text-[#5d6882] text-center">โปรดเลือกรูปในขั้นที่ 1 ก่อน</p>
          )}
          {searchInfo && <p className="text-xs text-[#5d6882] text-center">{searchInfo}</p>}
        </section>

        <div className="flex items-center justify-between text-xs text-[#5d6882] pt-4 border-t border-[#e2e7f1]">
          <span className="inline-flex items-center gap-1.5">
            <Database size={14} />
            {idxStatus ? `ในระบบ ${idxStatus.images.toLocaleString()} รูป · ${idxStatus.faces.toLocaleString()} ใบหน้า` : 'กำลังเชื่อมต่อระบบ...'}
          </span>
          <button onClick={fetchIndexStatus} title="รีเฟรช" className="p-1.5 rounded-lg hover:bg-[#f4f6fb]"><RefreshCw size={14} /></button>
        </div>
      </aside>

      {/* ───── ขวา: ผลลัพธ์ ───── */}
      <section className="min-w-0 space-y-4">
        {!searched && !isSearching && (
          <div className="card px-6 py-16 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-[#eef2ff] text-[#3b5bdb] grid place-items-center mb-4">
              <Search size={36} />
            </div>
            <h2 className="text-xl font-semibold">ผลการค้นหาจะแสดงที่นี่</h2>
            <p className="text-[#5d6882] mt-2 max-w-md mx-auto">
              ทำตาม 3 ขั้นตอนทางซ้าย: เลือกรูป → เลือกความละเอียด → กดค้นหา
            </p>
          </div>
        )}

        {isSearching && (
          <div className="card px-6 py-16 text-center">
            <span className="spinner spinner-dark mx-auto block" style={{ width: 44, height: 44, borderWidth: 4 }} />
            <h2 className="text-xl font-semibold mt-5">กำลังค้นหาในภาพกิจกรรม...</h2>
            <p className="text-[#5d6882] mt-1">ใช้เวลาไม่กี่วินาที โปรดรอสักครู่</p>
          </div>
        )}

        {searched && !isSearching && (
          <>
            <div className="card px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {matches.length > 0
                    ? <><CheckCircle2 className="text-[#12a05c]" size={22} /> พบ {matches.length} รูป</>
                    : <><SearchX className="text-[#5d6882]" size={22} /> ไม่พบรูปที่ตรงกัน</>}
                </h2>
                <p className="text-sm text-[#5d6882]">
                  {matches.length > 0
                    ? 'เรียงจากเหมือนมากไปน้อย · คลิกรูปเพื่อดูรายละเอียด'
                    : 'ลองเลือก "กว้าง" ในขั้นที่ 2 หรือใช้รูปที่เห็นหน้าชัดกว่าเดิม'}
                </p>
              </div>
              {matches.length > 0 && (
                <div className="flex items-center gap-3 text-xs text-[#5d6882]">
                  <span className="inline-flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm border-2 border-[#12a05c] inline-block" />คนที่ค้นหา</span>
                  <span className="inline-flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm border-2 border-[#d6364a] inline-block" />คนอื่น</span>
                </div>
              )}
            </div>
            {scanningCards && (
              <p className="text-sm text-[#3b5bdb] flex items-center gap-2"><span className="spinner spinner-dark" style={{ width: 16, height: 16, borderWidth: 2 }} /> กำลังทำกรอบใบหน้าในรูปทั้งหมด...</p>
            )}
            {!scanningCards && matches.length > Math.min(topK, 30) && (
              <p className="text-sm text-[#5d6882]">ทำกรอบอัตโนมัติ {Math.min(topK, 30)} รูปแรก · คลิกรูปอื่นเพื่อดูกรอบเพิ่ม</p>
            )}
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {matches.map((m, i) => {
            const scanned = scanMap[m.image_url];
            const lv = matchLevel(m.match_confidence);
            return (
              <figure key={`${m.image_url}-${i}`} onClick={() => setSelected(m)}
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                className="rise card overflow-hidden cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lg"
                title="คลิกเพื่อดูรายละเอียด">
                <div className="relative aspect-[4/3] bg-[#eef1f8] overflow-hidden">
                  {(imgRetry[m.image_url] ?? 0) > 2 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                      <p className="text-[#5d6882] text-sm">โหลดรูปไม่ได้ชั่วคราว</p>
                      <a href={m.image_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                        className="text-[#3b5bdb] text-sm underline">เปิดรูปต้นฉบับ</a>
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
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-sm font-semibold shadow-sm"
                    style={{ background: lv.bg, color: lv.color }}>
                    {lv.label} {m.match_confidence}%
                  </span>
                </div>
                <figcaption className="p-4 space-y-2">
                  <p className="font-semibold leading-snug line-clamp-2">{m.title || 'กิจกรรม มหาวิทยาลัยสวนดุสิต'}</p>
                  <div className="flex flex-col gap-1 text-sm text-[#5d6882]">
                    <span className="flex items-center gap-1.5"><MapPin size={14} className="shrink-0" /><span className="truncate">{m.where || 'ม.สวนดุสิต'}</span></span>
                    <span className="flex items-center gap-1.5"><Calendar size={14} className="shrink-0" />{m.date || `พ.ศ. ${m.year}`}</span>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </section>

      {/* ───── หน้าต่างรายละเอียด ───── */}
      {selected && (() => {
        const m = selected;
        const postUrl = sourcePostUrl(m);
        const lv = matchLevel(m.match_confidence);
        const targetCount = (allFaces || []).filter(f => f.is_target).length;
        const otherCount = (allFaces || []).length - targetCount;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0f172a]/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelected(null)}>
            <div className="card relative w-full max-w-5xl my-auto grid lg:grid-cols-[1fr_340px] overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelected(null)} title="ปิด (Esc)"
                className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/95 hover:bg-[#f1f4fb] text-[#1b2437] shadow border border-[#e2e7f1]">
                <X size={20} />
              </button>

              <div className="relative bg-[#0f172a] min-h-[300px] lg:min-h-[540px]">
                <FacePhoto
                  src={proxied(m.image_url)}
                  alt={m.title}
                  fit="contain"
                  eager
                  boxes={allFaces ? allFaces : [{ ...m, is_target: false }]}
                  className="absolute inset-0 w-full h-full"
                />
                {loadingAll && (
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-white/95 text-sm text-[#3b5bdb] flex items-center gap-2">
                    <span className="spinner spinner-dark" style={{ width: 16, height: 16, borderWidth: 2 }} /> กำลังนับคนในรูป...
                  </div>
                )}
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                <div className="pr-10">
                  <h3 className="font-semibold text-lg leading-snug">{m.title || 'กิจกรรม มหาวิทยาลัยสวนดุสิต'}</h3>
                </div>

                <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: lv.bg }}>
                  <span className="font-semibold" style={{ color: lv.color }}>{lv.label}</span>
                  <span className="text-2xl font-bold" style={{ color: lv.color }}>{m.match_confidence}%</span>
                </div>

                {allFaces ? (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-[#f4f6fb] py-2.5"><p className="text-xl font-bold">{allFaces.length}</p><p className="text-xs text-[#5d6882]">คนในรูป</p></div>
                    <div className="rounded-xl bg-[#e6f6ee] py-2.5"><p className="text-xl font-bold text-[#12a05c]">{targetCount}</p><p className="text-xs text-[#5d6882]">คนที่ค้นหา</p></div>
                    <div className="rounded-xl bg-[#fde8eb] py-2.5"><p className="text-xl font-bold text-[#d6364a]">{otherCount}</p><p className="text-xs text-[#5d6882]">คนอื่น</p></div>
                  </div>
                ) : !loadingAll && (
                  <p className="text-sm text-[#5d6882]">ระบบจะแสดงกรอบและนับคนในรูปให้เมื่อมีรูปเป้าหมายที่เลือกไว้</p>
                )}

                <button onClick={() => showAllFaces(m)} disabled={loadingAll}
                  className="btn-ghost w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  <Users size={16} /> {allFaces ? 'นับคนในรูปใหม่' : 'นับคนในรูปนี้'}
                </button>

                <div className="space-y-3 text-sm pt-1">
                  <p className="flex gap-2.5"><MapPin size={17} className="text-[#3b5bdb] mt-0.5 shrink-0" /><span><span className="block text-xs text-[#5d6882]">สถานที่</span>{m.where || 'มหาวิทยาลัยสวนดุสิต'}</span></p>
                  <p className="flex gap-2.5"><Calendar size={17} className="text-[#3b5bdb] mt-0.5 shrink-0" /><span><span className="block text-xs text-[#5d6882]">วันที่</span>{m.date || `พ.ศ. ${m.year}`}</span></p>
                </div>

                <div className="flex flex-col gap-2">
                  <a href={m.image_url} target="_blank" rel="noreferrer"
                    className="btn-ghost px-4 py-2.5 text-sm flex items-center justify-between">
                    เปิดรูปต้นฉบับ <ExternalLink size={15} />
                  </a>
                  {postUrl && (
                    <a href={postUrl} target="_blank" rel="noreferrer"
                      className="btn-ghost px-4 py-2.5 text-sm flex items-center justify-between">
                      เปิดโพสต์ต้นทาง <ExternalLink size={15} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
