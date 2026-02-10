/* js/main.js */
/* --- DÁN VÀO ĐẦU FILE js/main.js --- */

AFRAME.registerComponent('interactive-model', {
  schema: {
    speed: { type: 'number', default: 0.5 },      // Tốc độ tự xoay
    resetScale: { type: 'vec3', default: {x: 0.6, y: 0.6, z: 0.6} },
    minScale: { type: 'number', default: 0.1 },
    maxScale: { type: 'number', default: 5.0 },
    delay: { type: 'number', default: 5000 },     // Đợi 5s mới reset
    smoothDuration: { type: 'number', default: 1500 } // Trượt về trong 1.5s
  },
  init: function () {
    this.isInteracting = false; 
    this.isResetting = false;
    this.timer = null;
    
    this.lastX = 0;
    this.lastY = 0;
    this.startDistance = 0;
    this.startScale = new THREE.Vector3();
    
    // Cờ kiểm tra xem có đang Zoom không
    this.isZooming = false; 

    // 1. CHẠM TAY VÀO (STOP XOAY TỰ ĐỘNG NGAY LẬP TỨC)
    this.el.sceneEl.addEventListener('touchstart', (e) => {
        // Ngắt bộ đếm 5s
        if (this.timer) clearTimeout(this.timer);
        
        // Ngắt quá trình trượt về cũ (nếu đang chạy)
        if (this.isResetting) {
             this.el.removeAttribute('animation__resetScale');
             this.el.removeAttribute('animation__resetRotX');
             this.isResetting = false;
        }

        // Đánh dấu là đang tương tác -> Để hàm tick() dừng tự quay
        this.isInteracting = true;

        // Nếu chạm 1 ngón -> Chuẩn bị xoay
        if (e.touches.length === 1) {
            this.lastX = e.touches[0].clientX;
            this.lastY = e.touches[0].clientY;
            this.isZooming = false; // Chắc chắn là không zoom
        }
        
        // Nếu chạm 2 ngón -> Chuẩn bị Zoom
        if (e.touches.length === 2) {
            this.isZooming = true; // Bật cờ Zoom lên
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            this.startDistance = Math.sqrt(dx*dx + dy*dy);
            this.startScale.copy(this.el.object3D.scale);
        }
    });

    // 2. DI CHUYỂN TAY
    this.el.sceneEl.addEventListener('touchmove', (e) => {
        if (!this.isInteracting) return;

        // --- TRƯỜNG HỢP 1: XOAY (CHỈ KHI 1 NGÓN VÀ KHÔNG ZOOM) ---
        if (e.touches.length === 1 && !this.isZooming) {
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            
            // Xoay Ngang (Trục Y)
            this.el.object3D.rotation.y -= (currentX - this.lastX) * 0.005; 
            
            // Xoay Dọc (Trục X) - ĐÃ SỬA: Đổi dấu += thành -= để đảo chiều lại cho thuận
            this.el.object3D.rotation.x += (currentY - this.lastY) * 0.005; 

            // (Tùy chọn) Giới hạn góc ngẩng để không bị lộn vòng quá đà
            // this.el.object3D.rotation.x = Math.min(Math.max(this.el.object3D.rotation.x, -1.0), 1.0);
            
            this.lastX = currentX;
            this.lastY = currentY;
        }
        
        // --- TRƯỜNG HỢP 2: ZOOM (CHỈ KHI 2 NGÓN) ---
        // Khi vào đây thì Code Xoay ở trên sẽ KHÔNG CHẠY -> Khắc phục lỗi vừa zoom vừa xoay
        if (e.touches.length === 2) {
            this.isZooming = true; // Khẳng định lại lần nữa
            
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const newDistance = Math.sqrt(dx*dx + dy*dy);
            
            if (this.startDistance === 0) return;
            const scaleFactor = newDistance / this.startDistance;
            
            const newX = this.startScale.x * scaleFactor;
            const newY = this.startScale.y * scaleFactor;
            const newZ = this.startScale.z * scaleFactor;
            
            if (newX > this.data.minScale && newX < this.data.maxScale) {
                this.el.object3D.scale.set(newX, newY, newZ);
            }
        }
    });

    // 3. THẢ TAY RA
    const endHandler = (e) => {
        // Chỉ khi nhấc HẾT các ngón tay ra
        if (e.touches.length === 0) { 
            this.isInteracting = false;
            this.isZooming = false;
            
            // Đếm ngược 5 giây rồi mới Reset
            this.timer = setTimeout(() => {
                this.resetModelSmoothly(); 
            }, this.data.delay);
        }
    };
    this.el.sceneEl.addEventListener('touchend', endHandler);
    // Thêm mouseup để test trên máy tính cho dễ
    this.el.sceneEl.addEventListener('mouseup', endHandler); 
  },

  // 4. TỰ XOAY (VÒNG LẶP)
  tick: function (t, dt) {
    // Chỉ tự xoay khi: Không chạm tay VÀ Không đang Reset
    if (!this.isInteracting && !this.isResetting) {
      this.el.object3D.rotation.y += this.data.speed * (dt / 1000);
    }
  },

  // 5. RESET MƯỢT MÀ
  resetModelSmoothly: function() {
    this.isResetting = true; 

    // Reset Scale
    const currentS = this.el.object3D.scale;
    const targetS = this.data.resetScale;
    
    this.el.removeAttribute('animation__resetScale');
    this.el.setAttribute('animation__resetScale', {
        property: 'scale',
        from: `${currentS.x} ${currentS.y} ${currentS.z}`,
        to: `${targetS.x} ${targetS.y} ${targetS.z}`,
        dur: this.data.smoothDuration,
        easing: 'easeInOutQuad'
    });

    // Reset Rotation X (Dựng đầu dậy)
    const currentRotX = this.el.object3D.rotation.x * (180/Math.PI);
    
    this.el.removeAttribute('animation__resetRotX');
    this.el.setAttribute('animation__resetRotX', {
        property: 'rotation.x',
        from: currentRotX,
        to: 0,
        dur: this.data.smoothDuration,
        easing: 'easeInOutQuad'
    });
    
    // Sau khi xong thì cho tự xoay lại
    setTimeout(() => {
        this.isResetting = false; 
    }, this.data.smoothDuration);
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
      
      
      // --------------------------

      const model = document.createElement('a-entity');
      model.setAttribute('gltf-model', `url(${item.modelSrc})`);
      model.setAttribute('rotation', '0 0 0');
      model.setAttribute('transparent-model', 'opacity: 0.9');
      
      modelContainer.appendChild(model);
      targetEl.appendChild(modelContainer);
      targetEl.appendChild(createOverlay(item, 2000));
    }
  // LOẠI 3: VIDEO (ĐÃ SỬA LỖI HIỂN THỊ & LƯU ẢNH)
    // ============================================================
    else if (item.type === 'video') {
      
      // 1. TẠO ASSET VIDEO
      const vidAsset = document.createElement('video');
      vidAsset.setAttribute('id', item.videoId);
      vidAsset.setAttribute('src', item.videoSrc);
      vidAsset.setAttribute('preload', 'auto');
      vidAsset.setAttribute('loop', 'true');
      vidAsset.setAttribute('playsinline', '');
      vidAsset.setAttribute('webkit-playsinline', '');
      vidAsset.setAttribute('crossorigin', 'anonymous');
      
      // [QUAN TRỌNG] Set trực tiếp thuộc tính muted bằng JS để chắc chắn
      vidAsset.muted = true; 
      
      assetsContainer.appendChild(vidAsset);

      // 2. TẠO MẶT PHẲNG VIDEO (A-VIDEO)
      const vidPlane = document.createElement('a-video');
      vidPlane.setAttribute('src', `#${item.videoId}`);
      vidPlane.setAttribute('width', '1');
      vidPlane.setAttribute('height', '0.5625'); // Tỷ lệ 16:9
      vidPlane.setAttribute('position', '0 0 0.01'); // Nổi lên một chút
      
      // [QUAN TRỌNG] Mặc định ẩn đi (visible=false) thay vì dùng opacity=0
      // Điều này giúp tránh hiện khung đen hoặc hình cũ khi chưa quét xong
      vidPlane.setAttribute('visible', 'false');
      
      targetEl.appendChild(vidPlane);

      // 3. LOGIC ĐIỀU KHIỂN (Trực tiếp, không qua component trung gian)
      targetEl.addEventListener('targetFound', () => {
          // A. Hiện hình ảnh
          vidPlane.setAttribute('visible', 'true'); 
          
          // B. Hiện nút chụp ảnh (nếu có)
          const btnCapture = document.getElementById('btn-capture');
          if(btnCapture) btnCapture.style.display = 'block';

          // C. Chơi video (Xử lý Promise để tránh lỗi trình duyệt chặn)
          vidAsset.currentTime = 0;
          const playPromise = vidAsset.play();
          
          if (playPromise !== undefined) {
              playPromise.then(() => {
                  // Nếu chạy được thì mở tiếng
                  vidAsset.muted = false; 
              })
              .catch(error => {
                  // Nếu bị chặn thì tắt tiếng để chạy ép
                  console.log("Auto-play bị chặn, chuyển sang chế độ im lặng");
                  vidAsset.muted = true;
                  vidAsset.play();
              });
          }
      });

      targetEl.addEventListener('targetLost', () => {
          // A. Dừng video
          vidAsset.pause();
          
          // B. Ẩn hình ảnh ngay lập tức (Chống lưu ảnh/Ghosting)
          vidPlane.setAttribute('visible', 'false');

          // C. Ẩn nút chụp ảnh
          const btnCapture = document.getElementById('btn-capture');
          if(btnCapture) btnCapture.style.display = 'none';
      });

      // 4. HIỆN BẢNG THÔNG TIN
      // (Hàm createOverlay của bạn vẫn hoạt động tốt, giữ nguyên)
      targetEl.appendChild(createOverlay(item, 500));
    }
 // LOẠI 4: WEBM OVERLAY (ĐÃ FIX LỖI ĐỨNG IM & LƯU ẢNH)
    // ============================================================
    else if (item.type === 'webm-overlay') {
      // 1. Tạo Asset Video
      const vidAsset = document.createElement('video');
      vidAsset.setAttribute('id', item.videoId);
      vidAsset.setAttribute('src', item.videoSrc);
      vidAsset.setAttribute('preload', 'auto'); // Tải trước để đỡ bị đứng
      vidAsset.setAttribute('playsinline', '');
      vidAsset.setAttribute('webkit-playsinline', '');
      vidAsset.setAttribute('crossorigin', 'anonymous');
      // [Mẹo] Mặc định tắt tiếng trước để dễ Auto Play, khi quét trúng sẽ bật tiếng sau
      // vidAsset.muted = true; 
      assetsContainer.appendChild(vidAsset);

      // 2. Tạo tấm hiển thị (Plane)
      const vidPlane = document.createElement('a-plane');
      vidPlane.setAttribute('src', `#${item.videoId}`);
      
      // [QUAN TRỌNG] Ẩn đi ngay từ đầu để tránh hiện khung hình đen hoặc đứng im
      vidPlane.setAttribute('visible', 'false'); 

      // Auto Fit kích thước (Giữ nguyên code của bạn)
      vidPlane.setAttribute('width', '1'); 
      vidPlane.setAttribute('height', '0.5'); 
      vidAsset.addEventListener('loadedmetadata', () => {
          if (vidAsset.videoWidth && vidAsset.videoHeight) {
              const ratio = vidAsset.videoHeight / vidAsset.videoWidth;
              vidPlane.setAttribute('height', ratio); 
          }
      });

      // Vị trí & Vật liệu
      vidPlane.setAttribute('position', '0 0 0.05');
      // shader: flat giúp video sáng rõ không bị ảnh hưởng bởi ánh sáng môi trường
      vidPlane.setAttribute('material', 'shader: flat; transparent: true; depthWrite: false');

      // 3. Logic điều khiển (ĐÃ SỬA LẠI LOGIC)
      targetEl.addEventListener('targetFound', () => {
        // --- HIỆN NÚT CHỤP ẢNH ---
        const btnCapture = document.getElementById('btn-capture');
        if(btnCapture) btnCapture.style.display = 'block'; 

        // [FIX LỖI ĐỨNG IM]
        // B1: Cho hiển thị tấm plane lên
        vidPlane.setAttribute('visible', 'true');

        // B2: Tua về đầu
        vidAsset.currentTime = 0; 

        // B3: Dùng Promise để ép chạy video
        var playPromise = vidAsset.play();
        
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // Video đã chạy thành công -> Bật tiếng lên (nếu đang tắt)
                vidAsset.muted = false;
            })
            .catch(error => {
                // Nếu bị chặn Autoplay -> Phải tắt tiếng mới cho chạy
                console.log("Autoplay bị chặn, chuyển sang chế độ không tiếng");
                vidAsset.muted = true;
                vidAsset.play();
            });
        }
      });

      targetEl.addEventListener('targetLost', () => {
        // --- ẨN NÚT CHỤP ẢNH ---
        const btnCapture = document.getElementById('btn-capture');
        if(btnCapture) btnCapture.style.display = 'none';

        // [FIX LỖI LƯU ẢNH/DÍNH ẢNH]
        // B1: Dừng video
        vidAsset.pause();
        
        // B2: [QUAN TRỌNG NHẤT] Ẩn tấm plane đi ngay lập tức
        // Nếu không ẩn, nó sẽ giữ nguyên khung hình cuối cùng trên màn hình
        vidPlane.setAttribute('visible', 'false');
      });

      // Gắn vào Target
      targetEl.appendChild(vidPlane);
    }
   // ============================================================
    // LOẠI 5: DUAL MODEL (TĨNH - KHÔNG XOAY - DỰNG ĐỨNG)
    // ============================================================
    else if (item.type === 'dual-model') {
      
      const container = document.createElement('a-entity');
      
      // 1. CẤU HÌNH HIỆU ỨNG HIỆN RA (Giữ nguyên)
      container.setAttribute('reveal-model', `duration: 2500; sound3D: ${item.audio_3d}; startScale: 0.001 0.001 0.001; finalScale: 0.5 0.5 0.5; startPos: 0 0 0; finalPos: 0 0 0`);
      
      // 2. CHỈNH HƯỚNG DỰNG ĐỨNG (QUAN TRỌNG NHẤT)
      // Nếu đang bị nằm bẹp trên bàn, bạn hãy sửa số đầu tiên (Trục X)
      // Thử 1 trong 2 trường hợp sau:
      // Trường hợp A: '90 0 0' (Dựng đứng lên)
      // Trường hợp B: '-90 0 0' (Nếu A bị lộn ngược đầu)
      // Trường hợp C: '0 0 0' (Mặc định - nếu mô hình gốc đã đứng sẵn)
      
      container.setAttribute('rotation', '75 0 0'); // <--- SỬA DÒNG NÀY ĐỂ DỰNG ĐỨNG
      
      // [LƯU Ý] Tôi ĐÃ BỎ dòng 'interactive-model' và 'slow-spin' -> Nó sẽ đứng im.

      // 3. MODEL NAM
      if (item.modelSrc_male) {
          const maleModel = document.createElement('a-entity');
          maleModel.setAttribute('gltf-model', `url(${item.modelSrc_male})`);
          // position: '-0.4 0 0' (Lệch trái), '0 0.4 0' (Lên trên nếu cần), '0 0 0' (Gốc)
          // Lưu ý: Khi đã dựng container lên 90 độ, trục Y và Z của con sẽ thay đổi theo.
          // Bạn cứ để mặc định thế này trước xem sao.
          maleModel.setAttribute('position', '-0.4 0 0'); 
          maleModel.setAttribute('rotation', '0 0 0');
          maleModel.setAttribute('transparent-model', 'opacity: 1.0'); 
          maleModel.setAttribute('shadow', 'cast: true; receive: true');
          container.appendChild(maleModel);
      }

      // 4. MODEL NỮ
      if (item.modelSrc_female) {
          const femaleModel = document.createElement('a-entity');
          femaleModel.setAttribute('gltf-model', `url(${item.modelSrc_female})`);
          femaleModel.setAttribute('position', '0.4 0 0'); 
          femaleModel.setAttribute('rotation', '0 0 0');
          femaleModel.setAttribute('transparent-model', 'opacity: 1.0');
          femaleModel.setAttribute('shadow', 'cast: true; receive: true');
          container.appendChild(femaleModel);
      }

      targetEl.appendChild(container);

      // 5. Bảng thông tin (Vẫn hiện bình thường)
      targetEl.appendChild(createOverlay(item, 2500));    
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
  // KHI ẤN NÚT THOÁT (TIẾP TỤC QUÉT)
  btnExit.addEventListener('click', () => {
    // 1. Ẩn ảnh nền tĩnh -> Lộ ra camera thật
    bgFreeze.style.display = 'none';
    bgFreeze.src = ""; // Giải phóng bộ nhớ

    // 2. XỬ LÝ ẨN VẬT THỂ (QUAN TRỌNG: Làm bước này TRƯỚC khi unpause)
    const allTargets = document.querySelectorAll('[mindar-image-target]');
    allTargets.forEach(target => {
        // A. Kích hoạt sự kiện để Logic trong main.js chạy (Tắt tiếng, dừng video)
        target.emit('targetLost'); 
        
        // B. [BỔ SUNG QUAN TRỌNG] Ép ẩn vật thể về mặt hình ảnh ngay lập tức
        // Can thiệp thẳng vào core của Three.js để xóa khỏi khung hình
        if (target.object3D) {
            target.object3D.visible = false; 
        }
        
        // C. Nếu là video overlay (trường hợp đặc biệt), tìm con của nó để ẩn
        // Vì đôi khi ẩn cha nhưng con chưa kịp cập nhật
        const vidPlanes = target.querySelectorAll('a-plane, a-video');
        vidPlanes.forEach(plane => {
            plane.setAttribute('visible', 'false');
        });
    });

    // 3. Bật lại Tracking của MindAR
    // Đợi 1 chút xíu (100ms) để các lệnh ẩn ở trên thực hiện xong rồi mới chạy camera lại
    // Điều này giúp tránh việc camera bật lên cái là thấy ngay hình cũ bị giật
    setTimeout(() => {
        if (scene.systems['mindar-image-system']) {
            scene.systems['mindar-image-system'].unpause();
        }
    }, 100);

    // 4. Ẩn nút thoát, hiện lại nút chụp
    btnExit.style.display = 'none';
    btnCapture.style.display = 'block'; // Nhớ hiện lại nút chụp để dùng cho lần sau
  });
});












