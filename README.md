# 🕵️‍♂️ Detective Face AI (แฟ้มสืบสวนใบหน้าอัจฉริยะ)

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.3-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/InsightFace-ArcFace%20%2B%20SCRFD-FF6F00?style=for-the-badge" alt="InsightFace" />
  <img src="https://img.shields.io/badge/CUDA-Accelerated-76B900?style=for-the-badge&logo=nvidia&logoColor=white" alt="CUDA" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License" />
</p>

> **ระบบสืบค้นและจับคู่ใบหน้าบุคคลระดับลึกจากคลังภาพกิจกรรมมหาวิทยาลัยกว่า 55,000+ ภาพ (1,246 กิจกรรม พ.ศ. 2556–2569)**  
> อินเทอร์เฟซใหม่ Clean & Modern ใช้งานง่ายใน 3 ขั้นตอน ขับเคลื่อนด้วยโมเดล AI Face Recognition ระดับ State-of-the-Art (**InsightFace SCRFD** ตรวจจับพิกัดใบหน้าความเร็วสูง และ **ArcFace 512-D Deep Feature Embeddings**)

---

## 📸 ภาพตัวอย่างการใช้งานระบบ (System Showcase)

### 1. 🔍 หน้าจอค้นหาบุคคลจากภาพกิจกรรม (Latest Clean 3-Step UI)
อินเทอร์เฟซเวอร์ชันล่าสุด ออกแบบให้ค้นหาได้สะดวกและรวดเร็วใน 3 ขั้นตอน:
1. **เลือกรูปคนที่ต้องการหา**: รองรับรูปเป้าหมายได้สูงสุด 12 มุมมอง เพื่อเพิ่มความแม่นยำ
2. **เลือกความละเอียดในการค้น**: พรีเซ็ตด่วน *กว้าง (60%)*, *พอดี (70%)*, และ *เข้มงวด (85%)* พร้อมตัวเลือกตั้งค่าเกณฑ์ลึก (Threshold & Top-K สูงสุด 200 รายการ)
3. **เริ่มค้นหา**: AI ประมวลผลและเทียบเวกเตอร์ใบหน้า 512 มิติ กับภาพกิจกรรมทั้งมหาวิทยาลัยในเสี้ยววินาที

![Latest Search Interface](image/latest_screen.png)

---

### 2. 🎯 รายการผลการจับคู่และระดับความเหมือน (Search Matches & Confidence Ranking)
แสดงการ์ดผลลัพธ์ภาพที่ตรวจพบใบหน้าบุคคลเป้าหมาย จัดอันดับตามเปอร์เซ็นต์ความเหมือน (Cosine Similarity) พร้อมกรอบระบุตำแหน่งใบหน้า (Bounding Box):
- 🟢 **ป้ายกำกับระดับความเหมือน**: ไฮไลต์ตามความมั่นใจ (เช่น เหมือนมาก 90%+, น่าจะใช่ 70%+)
- 📍 **ข้อมูลบริบทกิจกรรม**: แสดงชื่องาน, วันที่จัดกิจกรรม, และสถานที่จัดงาน
- ⚡ **Turbo Face Scanning**: ประมวลผลและค้นหาภาพกิจกรรมกว่า 55,000+ ภาพ ภายใน 1-2 วินาที

![Search Matches Grid](image/latest_search_results.png)

---

### 3. 📑 แฟ้มตรวจพิสูจน์หลักฐาน (Evidence Detail & Detection Inspector)
คลิกดูรายละเอียดของหลักฐานแต่ละชิ้น แสดงกรอบพิกัดใบหน้าแบบเรียลไทม์ พร้อมสถิติจำแนกบุคคล:
- 🟢 **ใบหน้าเป้าหมาย (Match Target)** แสดงกรอบสีเขียวพร้อมเปอร์เซ็นต์ความคล้ายคลึง
- 🔴 **บุคคลอื่นที่ตรวจพบในภาพ (Other Detected Faces)** แสดงกรอบสีแดงสำหรับบุคคลแวดล้อม
- 📊 **สถิติจำแนกจำนวนคน**: สรุปจำนวนคนในรูป, คนที่ค้นหา, และคนอื่น
- 🔗 **การเข้าถึงแหล่งข้อมูล**: มีปุ่มเปิดภาพความละเอียดสูง และลิงก์ไปยังโพสต์กิจกรรมต้นฉบับ

![Evidence Inspector Modal](image/latest_detail_modal.png)

---

## ✨ ฟีเจอร์เด่น (Key Features)

* **Multi-Angle Target Search**: รองรับการปักหมุดรูปเป้าหมายได้สูงสุด **12 ภาพ** (หน้าตรง, มุมเอียง, สวมแว่น, แสงแตกต่างกัน) เพื่อเพิ่มความแม่นยำในการจับคู่
* **512-Dimensional Deep Embeddings**: ใช้ InsightFace (ArcFace ResNet-50) สกัดอัตลักษณ์ใบหน้าเชิงลึก 512 มิติ ทนทานต่อการเอียง แสงเงา และระยะโฟกัส
* **Ultra-Fast Vector Search**: คำนวณ Cosine Similarity เทียบกับฐานข้อมูลใบหน้าหลายหมื่นตำแหน่งได้ภายใน **< 1-2 วินาที**
* **Flexible Threshold & Preset Modes**: 
  - สไลเดอร์ปรับค่าความเหมือนได้ตั้งแต่ 50% - 99% (ค่าเริ่มต้นแนะนำที่ 60%)
  - พรีเซ็ตด่วน: *กว้าง (60%)*, *พอดี (70%)*, และ *เข้มงวด (85%)*
  - เลือกแสดงผลลัพธ์หลักฐานได้สูงสุดถึง **200 รายการ (Top-K)**
* **Visual Face Inspector**: วาดกรอบ Bounding Box จำแนกบุคคลเป้าหมายและผู้ร่วมกิจกรรม พร้อมคำนวณสเกลพิกัดอัตโนมัติตามขนาดภาพจริง
* **Built-in Image Proxy Engine**: มี Dev Proxy ป้องกันปัญหา Cross-Origin (CORS) ในการดึงภาพกิจกรรมความละเอียดสูงจากเซิร์ฟเวอร์ภายนอก
* **Hardware Acceleration**: รองรับ GPU Acceleration (NVIDIA CUDA ผ่าน ONNX Runtime) พร้อม Fallback สลับไปใช้ CPU ได้อัตโนมัติ

---

## 🛠️ สถาปัตยกรรมและเทคโนโลยี (Tech Stack)

| ส่วนประกอบ | เทคโนโลยีที่เลือกใช้ | รายละเอียดการทำงาน |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite 6 | โครงสร้าง SPA ความเร็วสูง ตอบสนองทันที |
| **Styling & UI** | Tailwind CSS, Lucide React, Framer Motion | ธีม Detective Glassmorphism และ Micro-animations |
| **Backend API** | FastAPI (Python 3.10+), Uvicorn | RESTful API ประสิทธิภาพสูงสำหรับการค้นหาและวิเคราะห์ |
| **Face Detection** | InsightFace (`buffalo_l` SCRFD 10G) | ตรวจจับตำแหน่งและ Landmarks ใบหน้าอย่างรวดเร็ว |
| **Face Recognition**| ArcFace (ResNet-50 512-D) | สกัด Face Feature Vector 512 มิติความแม่นยำสูง |
| **Acceleration** | ONNX Runtime (CUDA Execution Provider) | เร่งการประมวลผลโมเดลด้วย GPU NVIDIA |
| **Image & Math** | OpenCV, NumPy | จัดการ Image Preprocessing และคำนวณเวกเตอร์ |

---

## 🚀 วิธีติดตั้งและเริ่มใช้งาน (Getting Started)

### 1. ความต้องการของระบบ (Prerequisites)
- **Node.js**: เวอร์ชั่น 18.0 ขึ้นไป ([ดาวน์โหลด Node.js](https://nodejs.org/))
- **Python**: เวอร์ชั่น 3.10 ขึ้นไป (แนะนำให้ติ๊ก `Add python.exe to PATH` ตอนติดตั้ง)
- **GPU (แนะนำ)**: NVIDIA GPU พร้อม CUDA Toolkit (หากไม่มีจะรันด้วย CPU ให้อัตโนมัติ)

---

### 2. ติดตั้ง Dependencies

#### 📦 ฝั่ง Backend (Python):
```bash
cd backend
pip install -r requirements.txt
```

#### 📦 ฝั่ง Frontend (Node.js):
```bash
cd ..
npm install
```

---

### 3. รันระบบ (Run Application)

#### ⚡ วิธีที่ 1: รันด่วนในคลิกเดียว (แนะนำสำหรับ Windows)
ดับเบิลคลิกไฟล์ **`start_all.bat`**  
ระบบจะเปิดหน้าต่าง Terminal ขึ้นมา 2 หน้าต่างอัตโนมัติ (Backend พอร์ต `8000` และ Frontend พอร์ต `5174`)

#### 🛠️ วิธีที่ 2: รันแยกทีละส่วน (Manual)
เปิด Terminal 2 หน้าต่าง:

**Terminal 1 — Backend (FastAPI):**
```bash
cd backend
python main.py
```
> เซิร์ฟเวอร์จะพร้อมใช้งานที่: `http://localhost:8000` (ตรวจสอบสถานะโมเดลได้ที่ `http://localhost:8000/face-status`)

**Terminal 2 — Frontend (Vite):**
```bash
npm run dev
```
> เข้าใช้งานเว็บที่: **`http://localhost:5174`**

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

```text
detective-face-ai/
├── backend/
│   ├── main.py                  # API Server หลัก (FastAPI Endpoints)
│   ├── face_registry.py         # โมดูลจัดการทะเบียนใบหน้า
│   ├── build_gallery_index.py   # เครื่องมือสร้างดัชนีใบหน้ากิจกรรม (Turbo Indexer)
│   ├── scanner/                 # โมดูล Detector & Recognizer
│   └── requirements.txt         # รายการแพ็กเกจ Python
├── src/
│   ├── components/
│   │   ├── PersonSearch.tsx     # ระบบค้นหาบุคคล 3 สเต็ป พร้อมโมดอลตรวจหลักฐานเจาะลึก
│   │   ├── FacePhoto.tsx        # แสดงภาพพร้อมคำนวณและวาด Bounding Box อัตโนมัติ
│   │   └── DetailModal.tsx      # โมดอลตรวจพิสูจน์หลักฐานและพิกัดใบหน้า
│   ├── pages/                   # หน้าเว็บหลัก (Security.tsx)
│   ├── data/                    # ไฟล์ข้อมูลกิจกรรมและแหล่งอ้างอิงภาพ
│   └── index.css                # การตั้งค่าสไตล์และธีม
├── image/                       # ภาพประกอบและ Screenshots ในเอกสาร
├── start_all.bat                # สคริปต์ 1-Click รัน Backend + Frontend พร้อมกัน
├── vite.config.ts               # การตั้งค่า Vite และ Reverse Proxy ดึงภาพข้าม Origin
└── README.md                    # เอกสารแนะนำและคู่มือการใช้งานระบบ
```

---

## ❓ การแก้ไขปัญหาที่พบบ่อย (Troubleshooting & FAQ)

| อาการ / ข้อผิดพลาด | สาเหตุที่เป็นไปได้ | แนวทางแก้ไข |
| :--- | :--- | :--- |
| **`Port 5174 is already in use`** | มีโปรเซส Node.js หรือ Vite เดิมเปิดค้างอยู่ | เข้าใช้งานผ่านลิงก์เดิม หรือปิดโปรเซสเดิมด้วยคำสั่ง `taskkill /F /IM node.exe` ใน PowerShell แล้วรันใหม่ |
| **เว็บบอก `ติดต่อ Backend ไม่ได้`** | Backend ดับ หรือยังโหลดโมเดลไม่เสร็จสมบูรณ์ | รัน `python main.py` ในโฟลเดอร์ `backend/` หรือตรวจสอบ URL `http://localhost:8000/face-status` |
| **`No face detected in target image`** | ภาพบุคคลเป้าหมายไม่เห็นใบหน้าชัดเจน มืดเกินไป หรือเอียงมากเกิน | เลือกภาพใหม่ที่มีใบหน้าตรง แสงสว่างเพียงพอ และไม่มีสิ่งบดบังใบหน้า |
| **ผลการค้นหาไม่พบ หรือพบน้อยเกินไป** | เกณฑ์ความเหมือน (Threshold) ตั้งไว้สูงเกินไป | ปรับสไลเดอร์ลดเกณฑ์ความเหมือนลงมาที่ระดับ 55% - 60% ในโหมด "กว้าง" |
| **ภาพกิจกรรมบางรูปโหลดไม่ขึ้น** | URL ต้นทางของเว็บกิจกรรมอาจมีการย้ายไฟล์หรือบล็อกการเข้าถึง | ระบบมี Dev Proxy ช่วยเลี่ยงปัญหา CORS แล้ว แต่หากภาพถูกลบจากเซิร์ฟเวอร์หลักให้ข้ามรายการนั้นไปได้ |
| **Backend เริ่มต้นครั้งแรกใช้เวลานาน** | โมเดล InsightFace กำลังดาวน์โหลด weights (~500MB) | รอประมาณ 1-2 นาทีในครั้งแรก ครั้งต่อไปจะโหลดได้เร็วทันทีจากแคช |

---

## 📜 ใบอนุญาต (License)

โปรเจกต์นี้เผยแพร่ภายใต้สัญญาอนุญาต **MIT License**  
พัฒนาขึ้นเพื่อการศึกษา วิจัย และพัฒนาระบบสืบค้นใบหน้าจากคลังภาพกิจกรรมขนาดใหญ่
