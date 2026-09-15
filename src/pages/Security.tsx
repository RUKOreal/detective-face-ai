import React, { useMemo } from 'react';
import { PersonSearch } from '../components/PersonSearch';
import DetailModal from '../components/DetailModal';
import { motion } from 'framer-motion';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { Award, Image as ImageIcon, Calendar, ShieldCheck, Home, Fingerprint } from 'lucide-react';

/** แถบลายไทยประยุกต์ (เรขาคณิต) — เอกลักษณ์ของหน้านี้ */
const ThaiBand: React.FC<{ flip?: boolean }> = ({ flip }) => (
  <svg className={`w-full h-6 block ${flip ? 'rotate-180' : ''}`} preserveAspectRatio="none" viewBox="0 0 1200 24">
    <defs>
      <pattern id="thai-pat" x="0" y="0" width="48" height="24" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="48" height="24" fill="#2a1152" />
        <path d="M24 2 L34 12 L24 22 L14 12 Z" fill="none" stroke="#d4af37" strokeWidth="1.6" />
        <circle cx="24" cy="12" r="2.4" fill="#d4af37" />
        <path d="M0 12 L8 12 M40 12 L48 12" stroke="#d4af37" strokeWidth="1.2" />
      </pattern>
    </defs>
    <rect x="0" y="0" width="1200" height="24" fill="url(#thai-pat)" />
  </svg>
);

const Security: React.FC = () => {
  const { activitiesList } = usePortfolioStore();

  const stats = useMemo(() => {
    const totalActivities = activitiesList.length;
    const totalImages = activitiesList.reduce((acc, curr) => acc + (curr.images ? curr.images.length : 0), 0);
    const years = activitiesList.map(a => a.year).filter(Boolean);
    const minYear = years.length ? Math.min(...years) : 2556;
    const maxYear = years.length ? Math.max(...years) : 2569;

    return { totalActivities, totalImages, minYear, maxYear };
  }, [activitiesList]);

  return (
    <div className="min-h-screen bg-[#efeaf7] font-['Prompt',_sans-serif]">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-[#2a1152]/95 backdrop-blur-xl border-b-2 border-[#d4af37] shadow-lg shadow-purple-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex items-center gap-2 group"
              title="กลับขึ้นด้านบน"
            >
              <div className="w-9 h-9 rounded-xl bg-[#d4af37] flex items-center justify-center shadow-md group-hover:rotate-6 transition-transform">
                <Home size={18} className="text-[#2a1152]" />
              </div>
              <span className="hidden sm:block font-bold text-white text-sm">หน้าแรก</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-[#d4af37] text-[#2a1152] shadow-md"
              >
                <Fingerprint size={16} />
                <span className="hidden sm:inline">แฟ้มสืบสวนใบหน้า AI</span>
                <span className="sm:hidden">แฟ้มสืบสวน</span>
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section — โต๊ะแฟ้มสืบสวน */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#1d0b3d] via-[#2a1152] to-[#4c1d95]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-[8%] w-24 h-24 rounded-full border-[10px] border-[#d4af37]/15 rotate-12" />
          <div className="absolute bottom-10 right-[6%] w-36 h-36 rounded-full border-[14px] border-[#d4af37]/10 -rotate-12" />
          <div className="absolute top-1/3 right-[22%] text-[#d4af37]/10 rotate-12">
            <Fingerprint size={120} />
          </div>
        </div>

        <div className="relative z-10 px-4 max-w-4xl mx-auto pt-10 pb-12 sm:pt-14 sm:pb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* ป้ายเลขแฟ้ม */}
            <div className="flex justify-center mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white text-[#2a1152] text-xs font-black tracking-widest rounded-sm shadow-lg -rotate-1 border-l-8 border-[#d4af37]">
                แฟ้มสืบสวนเลขที่ SDU-FACE / มหาวิทยาลัยสวนดุสิต
              </span>
            </div>
            <h1 className="text-center text-3xl sm:text-5xl font-black text-white mb-3 tracking-tight leading-tight">
              กระดานสืบหาร่องรอย<span className="text-[#f3d27a]">ใบหน้า</span>
            </h1>
            <p className="text-center text-base sm:text-lg text-purple-200 font-medium mb-8">
              ปักหมุดรูปผู้ต้องสงสัย แล้วให้ AI พลิกแฟ้มภาพกิจกรรมทั้งหมดหาหลักฐาน
            </p>

            <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-lg shadow-purple-950/40 text-[#2a1152] text-xs sm:text-sm font-bold rotate-1">
                <Award size={18} className="text-[#b8860b]" />
                <span>{stats.totalActivities} กิจกรรม</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-lg shadow-purple-950/40 text-[#2a1152] text-xs sm:text-sm font-bold -rotate-1">
                <ImageIcon size={18} className="text-[#6d28d9]" />
                <span>{stats.totalImages.toLocaleString()} รูปภาพ</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-lg shadow-purple-950/40 text-[#2a1152] text-xs sm:text-sm font-bold rotate-1">
                <Calendar size={18} className="text-emerald-600" />
                <span>พ.ศ. {stats.minYear} - {stats.maxYear}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#d4af37] rounded-xl shadow-lg shadow-purple-950/40 text-[#2a1152] text-xs sm:text-sm font-black -rotate-1">
                <ShieldCheck size={18} />
                <span>InsightFace · ArcFace</span>
              </div>
            </div>
          </motion.div>
        </div>
        <ThaiBand />
      </header>

      {/* Main Content — กระดานไม้ก๊อก */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 pb-24 relative z-20">
        <div className="rounded-[28px] p-3 sm:p-5 shadow-inner border-4 border-[#8a5a2b]/40"
          style={{ backgroundColor: '#6b4a2f', backgroundImage: 'radial-gradient(rgba(0,0,0,0.18) 1px, transparent 1px)', backgroundSize: '14px 14px' }}>
          <div className="bg-[#faf7ef] rounded-[20px] p-4 sm:p-8 md:p-10 shadow-2xl">
            <PersonSearch />
          </div>
        </div>
      </main>

      <footer className="bg-[#1d0b3d] pt-0">
        <ThaiBand flip />
        <div className="max-w-7xl mx-auto px-4 text-center py-8">
          <p className="text-[#f3d27a] text-sm font-semibold">
            © แฟ้มสืบสวนใบหน้า AI: ดร.วิชชา ฉิมพลี | มหาวิทยาลัยสวนดุสิต
          </p>
        </div>
      </footer>

      {/* Modal สำหรับดูภาพอื่นๆ ในกิจกรรม (คลิกการ์ดเพื่อเปิด) */}
      <DetailModal />
    </div>
  );
};

export default Security;
