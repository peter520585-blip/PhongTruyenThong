/* js/main.js - ĐÃ FIX */

document.addEventListener("DOMContentLoaded", () => {
  const scene = document.querySelector('a-scene');
  const assetsContainer = document.querySelector('a-assets');

  // Hàm tạo Overlay Text (Fix: Truyền string trực tiếp, không dùng url())
  function createOverlay(item, delay) {
    const el = document.createElement('a-entity');
    // CHÚ Ý: Đã bỏ chữ 'url(...)' đi
    el.setAttribute('html-overlay-controller', `delay: ${delay}; soundText: ${item.audio_text}`);
    el.setAttribute('data-title', item.title);
    el.setAttribute('data-desc', item.desc);
    el.setAttribute('data-color', item.color);
    return el;
  }

  AR_DATABASE.forEach(item => {
    const targetEl = document.createElement('a-entity');
    targetEl.setAttribute('mindar-image-target', `targetIndex: ${item.targetIndex}`);

    // === LOẠI 1: ẢNH ===
    if (item.type === 'image') {
      targetEl.appendChild(createOverlay(item, 500));
      // ĐÃ XÓA logic audio riêng ở đây để chuyển xuống dưới dùng chung
    }

    // === LOẠI 2: MÔ HÌNH ===
    else if (item.type === 'model') {
      const modelContainer = document.createElement('a-entity');
      // Logic mô hình giữ nguyên
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

    // === LOẠI 3: VIDEO ===
    else if (item.type === 'video') {
      const vidAsset = document.createElement('video');
      vidAsset.setAttribute('id', item.videoId);
      vidAsset.setAttribute('src', item.videoSrc);
      vidAsset.setAttribute('preload', 'auto');
      vidAsset.setAttribute('loop', 'true');
      vidAsset.setAttribute('muted', 'true'); // Video mặc định tắt tiếng
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

    // === [MỚI] LOGIC PHÁT THUYẾT MINH DÙNG CHUNG CHO CẢ 3 LOẠI ===
    // Đặt ở đây để Model hay Video đều nhận được
    if (item.audio_desc) {
      const audioEntity = document.createElement('a-entity');
      // Delay 2000ms (2 giây) để tránh đè lên âm thanh xuất hiện 3D hoặc Video lúc đầu
      audioEntity.setAttribute('delayed-audio', `sound: ${item.audio_desc}; delay: 3000`);
      targetEl.appendChild(audioEntity);
    }

    scene.appendChild(targetEl);
  });

  // === LOGIC CHỤP ẢNH (SNAPSHOT) ===
  const btnCapture = document.getElementById('btn-capture');
  const previewContainer = document.getElementById('preview-container');
  const previewImage = document.getElementById('preview-image');
  const btnSave = document.getElementById('btn-save');
  const btnExit = document.getElementById('btn-exit');

  // Hàm chụp ảnh (Ghép Video nền + WebGL 3D)
  function takeScreenshot() {
    const video = document.querySelector('video'); // Video feed của MindAR
    const aScene = document.querySelector('a-scene');
    const glCanvas = aScene.canvas; // Canvas 3D

    if (!video || !glCanvas) return;

    // Tạo canvas tạm để vẽ đè lên nhau
    const captureCanvas = document.createElement('canvas');
    const width = glCanvas.width;
    const height = glCanvas.height;
    captureCanvas.width = width;
    captureCanvas.height = height;
    const ctx = captureCanvas.getContext('2d');

    // 1. Vẽ Video Camera (Căn chỉnh object-fit: cover)
    // Tính toán tỷ lệ để crop video cho khớp màn hình
    const vRatio = video.videoWidth / video.videoHeight;
    const cRatio = width / height;
    let sWidth, sHeight, sx, sy;

    if (vRatio > cRatio) {
      sHeight = video.videoHeight;
      sWidth = sHeight * cRatio;
      sx = (video.videoWidth - sWidth) / 2;
      sy = 0;
    } else {
      sWidth = video.videoWidth;
      sHeight = sWidth / cRatio;
      sx = 0;
      sy = (video.videoHeight - sHeight) / 2;
    }
    
    // Vẽ video đã crop lên canvas
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, width, height);

    // 2. Vẽ lớp 3D lên trên
    ctx.drawImage(glCanvas, 0, 0, width, height);

    // 3. Xuất ra ảnh
    return captureCanvas.toDataURL('image/png');
  }

  // Sự kiện nút Chụp
  btnCapture.addEventListener('click', () => {
    const dataURL = takeScreenshot();
    previewImage.src = dataURL;
    previewContainer.style.display = 'flex';
    document.body.classList.add('in-preview'); // Class để ẩn các UI khác
  });

  // Sự kiện nút Lưu
  btnSave.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'ar-snapshot-' + Date.now() + '.png';
    link.href = previewImage.src;
    link.click();
  });

  // Sự kiện nút Thoát
  btnExit.addEventListener('click', () => {
    previewContainer.style.display = 'none';
    document.body.classList.remove('in-preview');
  });
});
