/* js/main.js - LOGIC FREEZE AR (ĐÓNG BĂNG NỀN - HIỆU ỨNG VẪN CHẠY) */

document.addEventListener("DOMContentLoaded", () => {
  const scene = document.querySelector('a-scene');
  const assetsContainer = document.querySelector('a-assets');

  // --- 1. GIỮ NGUYÊN LOGIC DATABASE CŨ ---
  function createOverlay(item, delay) {
    const el = document.createElement('a-entity');
    el.setAttribute('html-overlay-controller', `delay: ${delay}; soundText: ${item.audio_text}`);
    el.setAttribute('data-title', item.title);
    el.setAttribute('data-desc', item.desc);
    el.setAttribute('data-color', item.color);
    return el;
  }

  AR_DATABASE.forEach(item => {
    const targetEl = document.createElement('a-entity');
    targetEl.setAttribute('mindar-image-target', `targetIndex: ${item.targetIndex}`);

    // LOẠI 1: ẢNH
    if (item.type === 'image') {
      targetEl.appendChild(createOverlay(item, 500));
    }
    // LOẠI 2: MÔ HÌNH
    else if (item.type === 'model') {
      const modelContainer = document.createElement('a-entity');
      modelContainer.setAttribute('reveal-model', `duration: 3000; sound3D: ${item.audio_3d}; startScale: 0.001 0.001 0.001; finalScale: 0.6 0.6 0.6; startPos: 0 0.08 0; finalPos: 0 0.32 0`);
      modelContainer.setAttribute('slow-spin', '');

      const model = document.createElement('a-entity');
      model.setAttribute('gltf-model', `url(${item.modelSrc})`);
      model.setAttribute('rotation', '90 0 0');
      model.setAttribute('transparent-model', 'opacity: 0.8');
      
      modelContainer.appendChild(model);
      targetEl.appendChild(modelContainer);
      targetEl.appendChild(createOverlay(item, 2000));
    }
    // LOẠI 3: VIDEO
    else if (item.type === 'video') {
      const vidAsset = document.createElement('video');
      vidAsset.setAttribute('id', item.videoId);
      vidAsset.setAttribute('src', item.videoSrc);
      vidAsset.setAttribute('preload', 'auto');
      vidAsset.setAttribute('loop', 'true');
      vidAsset.setAttribute('muted', 'true');
      vidAsset.setAttribute('playsinline', '');
      vidAsset.setAttribute('webkit-playsinline', '');
      vidAsset.setAttribute('crossorigin', 'anonymous');
      assetsContainer.appendChild(vidAsset);

      targetEl.appendChild(createOverlay(item, 500));

      const vidControl = document.createElement('a-entity');
      vidControl.setAttribute('video-control', `video: #${item.videoId}; delay: 1500`);
      targetEl.appendChild(vidControl);

      const vidPlane = document.createElement('a-video');
      vidPlane.setAttribute('src', `#${item.videoId}`);
      vidPlane.setAttribute('width', '1');
      vidPlane.setAttribute('height', '0.5625');
      vidPlane.setAttribute('position', '0 0 0.001');
      vidPlane.setAttribute('opacity', '0');
      vidPlane.setAttribute('video-fx', 'opacity: 0.9; softness: 0.3');
      vidPlane.setAttribute('animation', 'property: material.opacity; from: 0; to: 0.9; dur: 2000; easing: linear; startEvents: fade-in');
      
      targetEl.appendChild(vidPlane);
    }

    // ÂM THANH CHUNG (Phát sau 3s)
    if (item.audio_desc) {
      const audioEntity = document.createElement('a-entity');
      audioEntity.setAttribute('delayed-audio', `sound: ${item.audio_desc}; delay: 3000`);
      targetEl.appendChild(audioEntity);
    }

    scene.appendChild(targetEl);
  });

  // --- 2. LOGIC MỚI: CHẾ ĐỘ ĐÓNG BĂNG ---
  const btnCapture = document.getElementById('btn-capture');
  const btnExit = document.getElementById('btn-exit');
  const bgFreeze = document.getElementById('background-freeze');

  // Hàm: Chụp lại nền camera hiện tại
  function captureVideoBackground() {
    const video = document.querySelector('video'); // Video gốc của MindAR
    if (!video) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Vẽ lại đúng khung hình video hiện tại
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
  }

  // KHI ẤN NÚT CHỤP
  btnCapture.addEventListener('click', () => {
    // Bước 1: Chụp ảnh nền và hiển thị lên thẻ IMG
    const bgData = captureVideoBackground();
    if (bgData) {
        bgFreeze.src = bgData;
        bgFreeze.style.display = 'block'; // Che đi camera thật
    }

    // Bước 2: Dừng hệ thống Tracking
    // Lệnh này làm cho AR "đứng yên" tại chỗ, không cần cầm điện thoại soi nữa
    // Nhưng các hiệu ứng (xoay, phát nhạc) vẫn chạy tiếp
    if (scene.systems['mindar-image-system']) {
      scene.systems['mindar-image-system'].pause();
    }

    // Bước 3: Đổi nút bấm
    btnCapture.style.display = 'none';
    btnExit.style.display = 'block';
  });

  // KHI ẤN NÚT THOÁT
  btnExit.addEventListener('click', () => {
    // Bước 1: Ẩn ảnh tĩnh -> Lộ ra camera thật
    bgFreeze.style.display = 'none';
    bgFreeze.src = ""; // Giải phóng bộ nhớ

    // Bước 2: Bật lại Tracking
    if (scene.systems['mindar-image-system']) {
      scene.systems['mindar-image-system'].unpause();
    }

    // Bước 3: Đổi nút bấm
    btnExit.style.display = 'none';
    // Lưu ý: Nút capture sẽ tự hiện lại khi tìm thấy ảnh (do code trong components.js xử lý)
  });
});
