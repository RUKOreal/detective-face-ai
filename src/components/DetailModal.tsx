import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Info, 
  Target, 
  UserCheck, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon,
  Trash2,
  Edit3,
  Save,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { Activity } from '../data/activities';

const DetailModal: React.FC = () => {
  const { 
    selectedActivity, 
    isModalOpen, 
    setModalOpen, 
    setSelectedActivity, 
    deleteImage, 
    updateActivity, 
    deleteActivity 
  } = usePortfolioStore();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Activity>>({});

  useEffect(() => {
    setCurrentImageIndex(0);
    setIsEditing(false);
    if (selectedActivity) {
      setEditForm({ ...selectedActivity });
    }
  }, [selectedActivity]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen || !selectedActivity) return;
      if (isEditing) return; // Don't trigger shortcuts while typing in inputs
      if (e.key === 'ArrowRight' && selectedActivity.images.length > 0) {
        setCurrentImageIndex((prev) => (prev + 1) % selectedActivity.images.length);
      } else if (e.key === 'ArrowLeft' && selectedActivity.images.length > 0) {
        setCurrentImageIndex((prev) => (prev - 1 + selectedActivity.images.length) % selectedActivity.images.length);
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, selectedActivity, isEditing]);

  const handleClose = () => {
    setModalOpen(false);
    setIsEditing(false);
    setTimeout(() => {
      setSelectedActivity(null);
      setCurrentImageIndex(0);
    }, 300);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedActivity || selectedActivity.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % selectedActivity.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedActivity || selectedActivity.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + selectedActivity.images.length) % selectedActivity.images.length);
  };

  // Delete current photo handler
  const handleDeleteCurrentPhoto = () => {
    if (!selectedActivity || selectedActivity.images.length === 0) return;
    if (window.confirm(`คุณต้องการลบรูปภาพลำดับที่ ${currentImageIndex + 1} นี้ใช่หรือไม่?`)) {
      deleteImage(selectedActivity.id, currentImageIndex);
      if (currentImageIndex >= selectedActivity.images.length - 1) {
        setCurrentImageIndex(Math.max(0, selectedActivity.images.length - 2));
      }
    }
  };

  // Save edited fields handler
  const handleSaveEdit = () => {
    if (!selectedActivity) return;
    const updated: Activity = {
      ...selectedActivity,
      title: editForm.title || selectedActivity.title,
      year: Number(editForm.year) || selectedActivity.year,
      date: editForm.date || selectedActivity.date,
      where: editForm.where || selectedActivity.where,
      context: editForm.context || selectedActivity.context,
      what: editForm.what || selectedActivity.what,
      how: editForm.how || selectedActivity.how,
    };

    updateActivity(updated);
    setIsEditing(false);
  };

  // Delete whole activity handler
  const handleDeleteEntireActivity = () => {
    if (!selectedActivity) return;
    if (window.confirm(`คุณต้องการลบกิจกรรม "${selectedActivity.title}" ออกจากระบบทั้งหมดใช่หรือไม่?`)) {
      deleteActivity(selectedActivity.id);
    }
  };

  if (!selectedActivity) return null;

  const images = selectedActivity.images || [];
  const currentImage = images[currentImageIndex] || images[0] || 'https://www.dusit.ac.th/home/wp-content/uploads/2020/08/1.jpg';

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 transition-opacity"
          />

          {/* Modal Content Wrapper */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              className="pointer-events-auto w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col relative border border-slate-100 font-['Prompt',_sans-serif]"
            >
              {/* Top Control Bar (Edit / Delete / Close) */}
              <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-full shadow-lg transition-all"
                  >
                    <Edit3 size={15} />
                    <span>แก้ไขรายละเอียด</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-lg transition-all"
                  >
                    <Save size={15} />
                    <span>บันทึกการแก้ไข</span>
                  </button>
                )}

                <button
                  onClick={handleClose}
                  className="p-2.5 bg-slate-900/70 hover:bg-slate-950 text-white backdrop-blur-md rounded-full shadow-lg transition-all"
                  title="ปิด (Esc)"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar">
                {/* Main Image Viewport & Controls */}
                <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden group/slider">
                  {images.length > 0 ? (
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentImageIndex}
                        src={currentImage}
                        alt={`${selectedActivity.title} - รูปที่ ${currentImageIndex + 1}`}
                        initial={{ opacity: 0, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.25 }}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://www.dusit.ac.th/home/wp-content/uploads/2020/08/1.jpg';
                        }}
                      />
                    </AnimatePresence>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                      <ImageIcon size={48} />
                      <span>ไม่มีรูปภาพในกิจกรรมนี้</span>
                    </div>
                  )}

                  {/* Slider Controls */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 p-3 bg-slate-900/70 hover:bg-blue-600 backdrop-blur-md text-white rounded-full transition-all opacity-80 sm:opacity-0 group-hover/slider:opacity-100 hover:scale-110 shadow-lg z-20"
                        title="รูปก่อนหน้า"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 p-3 bg-slate-900/70 hover:bg-blue-600 backdrop-blur-md text-white rounded-full transition-all opacity-80 sm:opacity-0 group-hover/slider:opacity-100 hover:scale-110 shadow-lg z-20"
                        title="รูปถัดไป"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}

                  {/* Image Counter & Delete Photo Action */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                    {images.length > 0 && (
                      <div className="px-3.5 py-1.5 bg-slate-900/70 backdrop-blur-md text-white text-xs font-semibold rounded-full flex items-center gap-1.5 border border-white/10">
                        <ImageIcon size={14} className="text-amber-400" />
                        <span>รูปที่ {currentImageIndex + 1} จาก {images.length}</span>
                      </div>
                    )}

                    {/* Delete Current Photo Button */}
                    {images.length > 0 && (
                      <button
                        onClick={handleDeleteCurrentPhoto}
                        className="px-3.5 py-1.5 bg-red-600/90 hover:bg-red-600 backdrop-blur-md text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg transition-all hover:scale-105"
                        title="ลบรูปภาพที่แสดงอยู่นี้"
                      >
                        <Trash2 size={14} />
                        <span>ลบรูปนี้</span>
                      </button>
                    )}
                  </div>

                  {/* Gradient Overlay for Title */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none opacity-90" />

                  {/* Title and Date Display / Edit */}
                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 z-20">
                    {!isEditing ? (
                      <>
                        <div className="flex items-center gap-2 text-amber-300 text-xs sm:text-sm font-semibold mb-1.5">
                          <Calendar size={14} />
                          <span>{selectedActivity.date} (พ.ศ. {selectedActivity.year})</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-md">
                          {selectedActivity.title}
                        </h2>
                      </>
                    ) : (
                      <div className="space-y-2 bg-slate-900/90 p-4 rounded-2xl border border-slate-700">
                        <label className="text-xs text-amber-300 font-bold">แก้ไขชื่นกิจกรรม:</label>
                        <input
                          type="text"
                          value={editForm.title || ''}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 font-bold"
                        />
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="text-[11px] text-slate-400">วันที่:</label>
                            <input
                              type="text"
                              value={editForm.date || ''}
                              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400">ปี พ.ศ.:</label>
                            <input
                              type="number"
                              value={editForm.year || 2566}
                              onChange={(e) => setEditForm({ ...editForm, year: Number(e.target.value) })}
                              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Thumbnails Row */}
                {images.length > 1 && (
                  <div className="bg-slate-900 px-4 py-3 border-t border-slate-800 flex gap-2.5 overflow-x-auto custom-scrollbar">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`relative flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === currentImageIndex
                            ? 'border-amber-400 scale-105 shadow-md shadow-amber-400/20'
                            : 'border-transparent opacity-50 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Article Content & Editable Fields */}
                <div className="p-6 sm:p-8 space-y-6 bg-white">
                  {/* Context / Overview */}
                  <section className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="mt-0.5 p-2.5 bg-blue-500/10 text-blue-600 rounded-xl h-fit shrink-0">
                      <Info size={22} />
                    </div>
                    <div className="space-y-1 w-full">
                      <h4 className="font-bold text-slate-900 text-lg">รายละเอียดกิจกรรม / ภาพรวม</h4>
                      {!isEditing ? (
                        <p className="text-slate-600 leading-relaxed text-base">{selectedActivity.context}</p>
                      ) : (
                        <textarea
                          rows={3}
                          value={editForm.context || ''}
                          onChange={(e) => setEditForm({ ...editForm, context: e.target.value })}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* What Section */}
                    <section className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="mt-0.5 p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl h-fit shrink-0">
                        <Target size={20} />
                      </div>
                      <div className="space-y-1 w-full">
                        <h4 className="font-bold text-slate-900 text-base">หัวข้อ / วัตถุประสงค์</h4>
                        {!isEditing ? (
                          <p className="text-slate-600 text-sm leading-relaxed">{selectedActivity.what}</p>
                        ) : (
                          <textarea
                            rows={2}
                            value={editForm.what || ''}
                            onChange={(e) => setEditForm({ ...editForm, what: e.target.value })}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs"
                          />
                        )}
                      </div>
                    </section>

                    {/* Where Section */}
                    <section className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="mt-0.5 p-2.5 bg-amber-500/10 text-amber-600 rounded-xl h-fit shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div className="space-y-1 w-full">
                        <h4 className="font-bold text-slate-900 text-base">สถานที่ดำเนินกิจกรรม</h4>
                        {!isEditing ? (
                          <p className="text-slate-600 text-sm leading-relaxed">{selectedActivity.where}</p>
                        ) : (
                          <input
                            type="text"
                            value={editForm.where || ''}
                            onChange={(e) => setEditForm({ ...editForm, where: e.target.value })}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs"
                          />
                        )}
                      </div>
                    </section>
                  </div>

                  {/* How Section */}
                  <section className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="mt-0.5 p-2.5 bg-purple-500/10 text-purple-600 rounded-xl h-fit shrink-0">
                      <UserCheck size={20} />
                    </div>
                    <div className="space-y-1 w-full">
                      <h4 className="font-bold text-slate-900 text-base">บทบาทในการขับเคลื่อนกิจกรรม</h4>
                      {!isEditing ? (
                        <p className="text-slate-600 text-sm leading-relaxed">{selectedActivity.how}</p>
                      ) : (
                        <textarea
                          rows={2}
                          value={editForm.how || ''}
                          onChange={(e) => setEditForm({ ...editForm, how: e.target.value })}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs"
                        />
                      )}
                    </div>
                  </section>
                </div>
              </div>

              {/* Footer Actions Bar */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={handleDeleteEntireActivity}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-red-200 transition-colors"
                >
                  <Trash2 size={14} />
                  <span>ลบกิจกรรมนี้ทั้งหมด</span>
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  {isEditing && (
                    <button
                      onClick={handleSaveEdit}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Save size={15} />
                      <span>บันทึกการแก้ไข</span>
                    </button>
                  )}
                  <button
                    onClick={handleClose}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-md"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DetailModal;
