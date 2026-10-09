import React, { useMemo } from 'react';
import { PersonSearch } from '../components/PersonSearch';
import DetailModal from '../components/DetailModal';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { ScanFace, Images, CalendarRange, FolderOpen } from 'lucide-react';

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
    <div className="min-h-screen">
      {/* แถบบน */}
      <header className="bg-white border-b border-[#e2e7f1] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#3b5bdb] text-white grid place-items-center shrink-0">
              <ScanFace size={22} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[#1b2437] leading-tight truncate">ค้นหาบุคคลจากภาพกิจกรรม</p>
              <p className="text-xs text-[#5d6882] truncate">มหาวิทยาลัยสวนดุสิต · ดร.วิชชา ฉิมพลี</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-[#5d6882]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f4f6fb]">
              <FolderOpen size={15} className="text-[#3b5bdb]" /> {stats.totalActivities} กิจกรรม
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f4f6fb]">
              <Images size={15} className="text-[#3b5bdb]" /> {stats.totalImages.toLocaleString()} รูป
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f4f6fb]">
              <CalendarRange size={15} className="text-[#3b5bdb]" /> พ.ศ. {stats.minYear}–{stats.maxYear}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1b2437]">ใครอยู่ในภาพกิจกรรมบ้าง?</h1>
          <p className="text-[#5d6882] mt-1">
            อัปโหลดรูปใบหน้าของคนที่ต้องการหา แล้วระบบจะค้นในภาพกิจกรรมทั้งหมดให้อัตโนมัติ
          </p>
        </div>
        <PersonSearch />
      </main>

      <DetailModal />
    </div>
  );
};

export default Security;
