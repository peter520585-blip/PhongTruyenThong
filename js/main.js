/* js/main.js */
AFRAME.registerComponent('interactive-model', {
  schema: {
    speed: { type: 'number', default: 0.5 },      // Tốc độ tự xoay
    resetScale: { type: 'vec3', default: {x: 0.6, y: 0.6, z: 0.6} }, // Kích thước chuẩn
    minScale: { type: 'number', default: 0.1 },   // Bé nhất
    maxScale: { type: 'number', default: 5.0 }    // To nhất
  },
  init: function () {
    this.isInteracting = false;
    this.isZooming = false; // Biến kiểm tra xem có đang zoom không
    
    // Biến cho Xoay
    this.lastX = 0;
    this.lastY = 0;
    
    // Biến cho Zoom
    this.startDistance = 0;
    this.startScale = new THREE.Vector3();

    // 1. SỰ KIỆN CHẠM (TOUCHSTART)
    this.el.sceneEl.addEventListener('touchstart', (e) => {
        this.isInteracting = true;

        // TRƯỜNG HỢP 1: Chạm 1 ngón -> Chuẩn bị XOAY
        if (e.touches.length === 1) {
            this.lastX = e.touches[0].clientX;
            this.lastY = e.touches[0].clientY;
            this.isZooming = false;
        }
        
        // TRƯỜNG HỢP 2: Chạm 2 ngón -> Chuẩn bị ZOOM
        if (e.touches.length === 2) {
            this.isZooming = true;
            
            // Tính khoảng cách giữa 2 ngón tay (Pytago)
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            this.startDistance = Math.sqrt(dx*dx + dy*dy);
            
            // Lưu kích thước hiện tại của mô hình
            this.startScale.copy(this.el.object3D.scale);
        }
    });

    // 2. SỰ KIỆN DI CHUYỂN (TOUCHMOVE)
    this.el.sceneEl.addEventListener('touchmove', (e) => {
        if (!this.isInteracting) return;

        // XỬ LÝ XOAY (Chỉ khi có 1 ngón và không zoom)
        if (e.touches.length === 1 && !this.isZooming) {
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            
            const deltaX = currentX - this.lastX;
            const deltaY = currentY - this.lastY;
            
            this.el.object3D.rotation.y += deltaX * 0.005; // Xoay trái phải
            this.el.object3D.rotation.x += deltaY * 0.005; // Xoay lên xuống
            
            this.lastX = currentX;
            this.lastY = currentY;
        }
        
        // XỬ LÝ ZOOM (Khi có 2 ngón)
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const newDistance = Math.sqrt(dx*dx + dy*dy);
            
            if (this.startDistance === 0) return;
            
            // Tỷ lệ phóng to = Khoảng cách mới / Khoảng cách cũ
            const scaleFactor = newDistance / this.startDistance;
            
            // Tính toán kích thước mới
            const newX = this.startScale.x * scaleFactor;
            const newY = this.startScale.y * scaleFactor;
            const newZ = this.startScale.z * scaleFactor;
            
            // Giới hạn Min/Max để không bị quá bé hoặc quá to
            if (newX > this.data.minScale && newX < this.data.maxScale) {
                this.el.object3D.scale.set(newX, newY, newZ);
            }
        }
    });

    // 3. SỰ KIỆN THẢ TAY (TOUCHEND)
    const endHandler = (e) => {
        // Khi nhấc hết tay ra (touches = 0) thì mới Reset
        if (e.touches.length === 0) {
            if (this.isInteracting) {
                this.isInteracting = false;
                this.isZooming = false;
                this.resetModel(); // Tự động trả về cũ
            }
        }
    };
    this.el.sceneEl.addEventListener('touchend', endHandler);
  },

  // 4. TỰ ĐỘNG XOAY
  tick: function (t, dt) {
    if (!this.isInteracting) {
      this.el.object3D.rotation.y += this.data.speed * (dt / 1000);
    }
  },

  // 5. HÀM RESET
  resetModel: function() {
    // Reset Kích thước
    const current = this.el.object3D.scale;
    const target = this.data.resetScale;

    this.el.removeAttribute('animation__resetScale');
    this.el.setAttribute('animation__resetScale', {
        property: 'scale',
        from: `${current.x} ${current.y} ${current.z}`,
        to: `${target.x} ${target.y} ${target.z}`,
        dur: 600,
        easing: 'easeOutElastic'
    });

    // Reset góc nghiêng đầu (trục X)
    this.el.removeAttribute('animation__resetRotX');
    this.el.setAttribute('animation__resetRotX', {
        property: 'rotation.x',
        to: 0,
        dur: 500,
        easing: 'easeOutQuad'
    });
  }
});
document.addEventListener("DOMContentLoaded", async () => { // <--- Thêm chữ async
  const scene = document.querySelector('a-scene');
  const assetsContainer = document.querySelector('a-assets');

  // --- GỌI HÀM ĐỌC DỮ LIỆU TỪ FILE CSV ---
  // Code sẽ tự tìm file js/database.csv để đọc
  const AR_DATABASE = await fetchDatabase(); 
  
  console.log("Dữ liệu đã tải:", AR_DATABASE); // Kiểm tra xem đọc được chưa

  if (!AR_DATABASE || AR_DATABASE.length === 0) {
      console.warn("Không có dữ liệu nào trong file CSV!");
      return;
  }

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
    // LOẠI 2: MÔ HÌNH (ZOOM + XOAY 360 + TỰ RESET)
    // ============================================================
    // LOẠI 2: MÔ HÌNH (XOAY + ZOOM TỰ CODE)
    // ============================================================
    else if (item.type === 'model') {
      
      // [BỎ] Không cần dòng scene.setAttribute('gesture-detector'...) nữa

      const modelContainer = document.createElement('a-entity');
      
      // Hiệu ứng hiện ra (Giữ nguyên)
      modelContainer.setAttribute('reveal-model', `duration: 3000; sound3D: ${item.audio_3d}; startScale: 0.001 0.001 0.001; finalScale: 0.6 0.6 0.6; startPos: 0 0 0.5; finalPos: 0 0 0.5`);
      
      // --- CẤU HÌNH TƯƠNG TÁC ---
      
      // [QUAN TRỌNG] Chỉ cần gọi đúng 1 dòng này là đủ cả Xoay và Zoom
      // resetScale: phải trùng với finalScale ở trên (0.6)
      modelContainer.setAttribute('interactive-model', 'speed: 0.5; resetScale: 0.6 0.6 0.6; minScale: 0.1; maxScale: 5.0'); 
      
      // [BỎ] Xóa dòng setAttribute('gesture-handler'...) đi nhé!
      // --------------------------

      const model = document.createElement('a-entity');
      model.setAttribute('gltf-model', `url(${item.modelSrc})`);
      model.setAttribute('rotation', '0 0 0');
      model.setAttribute('transparent-model', 'opacity: 0.9');
      
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
    // LOẠI 4: WEBM OVERLAY (AUTO FIT + CÓ NÚT CHỤP ẢNH)
    // ============================================================
    else if (item.type === 'webm-overlay') {
      // 1. Tạo Asset Video
      const vidAsset = document.createElement('video');
      vidAsset.setAttribute('id', item.videoId);
      vidAsset.setAttribute('src', item.videoSrc);
      vidAsset.setAttribute('preload', 'auto');
      vidAsset.setAttribute('playsinline', '');
      vidAsset.setAttribute('webkit-playsinline', '');
      vidAsset.setAttribute('crossorigin', 'anonymous');
      assetsContainer.appendChild(vidAsset);

      // 2. Tạo tấm hiển thị (Plane)
      const vidPlane = document.createElement('a-plane');
      vidPlane.setAttribute('src', `#${item.videoId}`);
      
      // Auto Fit kích thước
      vidPlane.setAttribute('width', '1'); 
      vidPlane.setAttribute('height', '0.5'); // Số tạm
      vidAsset.addEventListener('loadedmetadata', () => {
          if (vidAsset.videoWidth && vidAsset.videoHeight) {
              const ratio = vidAsset.videoHeight / vidAsset.videoWidth;
              vidPlane.setAttribute('height', ratio); 
          }
      });

      // Vị trí & Vật liệu
      vidPlane.setAttribute('position', '0 0 0.05');
      vidPlane.setAttribute('material', 'shader: flat; transparent: true; depthWrite: false');

      // 3. Logic điều khiển
      targetEl.addEventListener('targetFound', () => {
        // --- [MỚI] HIỆN NÚT CHỤP ẢNH ---
        const btnCapture = document.getElementById('btn-capture');
        if(btnCapture) btnCapture.style.display = 'block'; 

        // Xử lý video
        if (vidAsset.ended) { vidAsset.currentTime = 0; }
        vidAsset.play().catch(e => {
            if (!vidAsset.muted) {
                vidAsset.muted = true;
                vidAsset.play();
            }
        });
      });

      targetEl.addEventListener('targetLost', () => {
        // --- [MỚI] ẨN NÚT CHỤP ẢNH ---
        const btnCapture = document.getElementById('btn-capture');
        if(btnCapture) btnCapture.style.display = 'none';

        // Xử lý video
        vidAsset.pause();
      });

      // Gắn vào Target
      targetEl.appendChild(vidPlane);
    }
    // LOẠI 5: DUAL MODEL (2 NGƯỜI MẪU NAM NỮ)
    // ============================================================
    else if (item.type === 'dual-model') {
      // 1. Tạo cái VỎ CHỨA (Container) chung cho cả 2 người
      // Hiệu ứng "reveal-model" sẽ áp dụng lên vỏ này -> Cả 2 cùng to lên 1 lúc
      const container = document.createElement('a-entity');
      
      // Cấu hình hiệu ứng xuất hiện (Giống model đơn nhưng chỉnh scale nhỏ hơn chút vì 2 người khá to)
      // finalScale: 0.5 (Bạn có thể tăng giảm tùy độ to của file 3D)
      container.setAttribute('reveal-model', `duration: 2500; sound3D: ${item.audio_3d}; startScale: 0.001 0.001 0.001; finalScale: 0.5 0.5 0.5; startPos: 0 0 0; finalPos: 0 0 0`);
      
      // Chỉnh xoay vỏ chứa nếu mô hình bị quay lưng lại (ví dụ xoay 180 độ y)
      // container.setAttribute('rotation', '0 0 0'); 
      
      // LƯU Ý: Không thêm 'slow-spin' nên nó sẽ đứng yên.

      // 2. Tạo Model NAM (Bên Trái)
      const maleModel = document.createElement('a-entity');
      maleModel.setAttribute('gltf-model', `url(${item.modelSrc_male})`);
      // Dịch sang trái 0.4 đơn vị
      maleModel.setAttribute('position', '-0.4 0 0'); 
      // Dùng component trong suốt để fix lỗi hiển thị
      maleModel.setAttribute('transparent-model', 'opacity: 1.0'); 

      // 3. Tạo Model NỮ (Bên Phải)
      const femaleModel = document.createElement('a-entity');
      femaleModel.setAttribute('gltf-model', `url(${item.modelSrc_female})`);
      // Dịch sang phải 0.4 đơn vị
      femaleModel.setAttribute('position', '0.4 0 0'); 
      femaleModel.setAttribute('transparent-model', 'opacity: 1.0');

      // 4. Gắn 2 người vào VỎ
      container.appendChild(maleModel);
      container.appendChild(femaleModel);

      // 5. Gắn VỎ vào Target
      targetEl.appendChild(container);

      // 6. Hiển thị bảng thông tin (Giống chế độ cũ)
      // Hiện bảng sau 2 giây (khi mô hình đã hiện xong)
      targetEl.appendChild(createOverlay(item, 2000));   
    }

    // ÂM THANH CHUNG
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

  // === HÀM ĐÃ SỬA LỖI Ở ĐÂY ===
  function captureVideoBackground() {
    // Lấy TẤT CẢ các thẻ video trong trang
    const allVideos = document.querySelectorAll('video');
    let cameraVideo = null;

    // Tìm video nào KHÔNG CÓ ID (Vì video tư liệu mình đã đặt ID là vid_... rồi)
    // Video của MindAR tự sinh ra sẽ không có ID hoặc class riêng
    allVideos.forEach(v => {
        if (!v.id || v.id === "") {
            cameraVideo = v;
        }
    });

    // Nếu vẫn không tìm thấy thì fallback về cái đầu tiên (hiếm khi xảy ra)
    if (!cameraVideo && allVideos.length > 0) cameraVideo = allVideos[0];
    
    if (!cameraVideo) return null;

    const canvas = document.createElement('canvas');
    canvas.width = cameraVideo.videoWidth;
    canvas.height = cameraVideo.videoHeight;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
  }

  // KHI ẤN NÚT CHỤP
  btnCapture.addEventListener('click', () => {
    const bgData = captureVideoBackground();
    if (bgData) {
        bgFreeze.src = bgData;
        bgFreeze.style.display = 'block'; 
    }

    if (scene.systems['mindar-image-system']) {
      scene.systems['mindar-image-system'].pause();
    }

    btnCapture.style.display = 'none';
    btnExit.style.display = 'block';
  });

  // KHI ẤN NÚT THOÁT (TIẾP TỤC QUÉT)
  btnExit.addEventListener('click', () => {
    // 1. Ẩn ảnh nền tĩnh -> Lộ ra camera thật
    bgFreeze.style.display = 'none';
    bgFreeze.src = ""; // Giải phóng bộ nhớ ảnh

    // 2. Bật lại Tracking của MindAR
    if (scene.systems['mindar-image-system']) {
      scene.systems['mindar-image-system'].unpause();
    }

    // === [QUAN TRỌNG: SỬA LỖI ĐÈ HÌNH] ===
    // Ép buộc tất cả các Target phải "Biến mất" ngay lập tức
    // Việc này sẽ kích hoạt các sự kiện targetLost trong components.js 
    // giúp tắt nhạc, tắt video và ẩn mô hình cũ đi.
    const allTargets = document.querySelectorAll('[mindar-image-target]');
    allTargets.forEach(target => {
        target.emit('targetLost'); 
    });

    // 3. Ẩn nút thoát
    btnExit.style.display = 'none';
  });
});












