/* js/database.js - TỰ ĐỘNG THÊM ĐƯỜNG DẪN */

const CSV_FILE_PATH = './js/database.csv';

// CẤU HÌNH ĐƯỜNG DẪN THƯ MỤC CỐ ĐỊNH
const PATH_CONFIG = {
    models: './assets/models/',
    videos: './assets/videos/',
    audio: './assets/audio/'
};

async function fetchDatabase() {
  try {
    const response = await fetch(CSV_FILE_PATH);
    if (!response.ok) throw new Error("Không tìm thấy file database.csv");
    const csvText = await response.text();
    return csvToJSON(csvText);
  } catch (error) {
    console.error("Lỗi tải dữ liệu:", error);
    return [];
  }
}

function csvToJSON(csvText) {
  const lines = csvText.split("\n");
  const result = [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/\r/g, ""));

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Tách CSV (Logic đơn giản: tách bằng dấu phẩy)
    const currentline = lines[i].split(",");
    const obj = {};
    headers.forEach((header, index) => {
      let val = (currentline[index] || "").trim().replace(/\r/g, "");
      obj[header] = val;
    });

    if (obj.type) {
        // --- LOGIC TỰ ĐỘNG GẮN ĐƯỜNG DẪN ---
        // 1. Xử lý File Chính (Video hoặc Model)
        let mainFile = undefined;
        if (obj.file_main) {
            if (obj.type.includes('video') || obj.type.includes('webm')) {
                mainFile = PATH_CONFIG.videos + obj.file_main;
            } else if (obj.type.includes('model')) {
                mainFile = PATH_CONFIG.models + obj.file_main;
            }
        }

        // 2. Xử lý File Phụ (Model nữ)
        let subFile = undefined;
        if (obj.file_sub && obj.type === 'dual-model') {
            subFile = PATH_CONFIG.models + obj.file_sub;
        }

        // 3. Xử lý Audio
        let audioFile = undefined;
        if (obj.audio_desc) {
            audioFile = PATH_CONFIG.audio + obj.audio_desc;
        }
        // -------------------------------------

        const item = {
            type: obj.type,
            targetIndex: parseInt(obj.targetIndex),
            title: obj.title || "",
            desc: obj.desc || "",
            color: "#FFD700",
            
            // Map dữ liệu đã xử lý đường dẫn
            videoSrc: (obj.type.includes('video') || obj.type.includes('webm')) ? mainFile : undefined,
            modelSrc: (obj.type === 'model') ? mainFile : undefined,
            modelSrc_male: (obj.type === 'dual-model') ? mainFile : undefined,
            modelSrc_female: (obj.type === 'dual-model') ? subFile : undefined,
            
            videoId: obj.video_id || `vid_${obj.targetIndex}`,
            
            audio_desc: audioFile,
            audio_3d: (obj.type.includes('model')) ? PATH_CONFIG.audio + "3d_ra.mp3" : undefined,
            audio_text: PATH_CONFIG.audio + "text_ra.mp3"
        };
        result.push(item);
    }
  }
  return result;
}