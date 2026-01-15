/* js/components.js - ĐÃ FIX LỖI AUDIO */

// Hàm phát âm thanh từ đường dẫn file (String)
function playSound(audioSrc) {
  if (!audioSrc) return;
  // Nếu chuỗi có dính chữ "url(...)" thì cắt bỏ đi để lấy đường dẫn sạch
  const cleanSrc = audioSrc.replace('url(', '').replace(')', '');
  
  try {
    const audio = new Audio(cleanSrc);
    audio.play().catch((e) => {
      console.warn("Chưa tương tác, trình duyệt chặn tiếng:", e);
    });
  } catch (e) {
    console.warn("Lỗi file âm thanh:", e);
  }
}

// 1. HTML OVERLAY CONTROLLER
AFRAME.registerComponent("html-overlay-controller", {
  schema: {
    delay: { type: "number", default: 1000 },
    soundText: { type: "string", default: "" } // ĐỔI TỪ SELECTOR SANG STRING
  },
  init() {
    this.uiPanel = document.getElementById("info-panel");
    this.uiTitle = document.getElementById("ui-title");
    this.uiDesc = document.getElementById("ui-desc");
    this.btnCapture = document.getElementById("btn-capture"); // Lấy nút chụp
    this.fullTitle = this.el.getAttribute("data-title") || "";
    this.fullDesc = this.el.getAttribute("data-desc") || "";
    this.color = this.el.getAttribute("data-color") || "#FFD700";
    this.target = this.el.closest("[mindar-image-target]");
    this.startTimer = null;
    this.typingTimer = null;

    this.target.addEventListener("targetFound", () => this.onFound());
    this.target.addEventListener("targetLost", () => this.onLost());
  },
  onFound() {
    this.uiTitle.textContent = "";
    this.uiDesc.textContent = "";
    this.uiPanel.style.borderLeftColor = this.color;
    this.uiTitle.style.color = this.color;
    
    // Hiện nút chụp ảnh
    if(this.btnCapture) this.btnCapture.style.display = "block";

    this.startTimer = setTimeout(() => { this.showPanel(); }, this.data.delay);
  },
  onLost() {
    if (this.startTimer) clearTimeout(this.startTimer);
    if (this.typingTimer) clearTimeout(this.typingTimer);
    this.uiPanel.classList.remove("visible");
    
    // Ẩn nút chụp ảnh
    if(this.btnCapture) this.btnCapture.style.display = "none";
  },
  showPanel() {
    playSound(this.data.soundText); // Gọi hàm phát nhạc mới
    this.uiPanel.classList.add("visible");
    let i = 0;
    const typeLoop = () => {
      if (i < this.fullTitle.length) {
        this.uiTitle.textContent += this.fullTitle.charAt(i); i++; this.typingTimer = setTimeout(typeLoop, 30);
      } else {
        const descIndex = i - this.fullTitle.length;
        if (descIndex < this.fullDesc.length) {
          this.uiDesc.textContent += this.fullDesc.charAt(descIndex); i++; this.typingTimer = setTimeout(typeLoop, 20);
        }
      }
    };
    typeLoop();
  }
});

// 2. DELAYED AUDIO
AFRAME.registerComponent('delayed-audio', {
  schema: {
    sound: { type: 'string', default: "" }, // ĐỔI SANG STRING
    delay: { type: 'number', default: 2000 }
  },
  init: function() {
    this.target = this.el.closest("[mindar-image-target]");
    this.timer = null;
    this.audioObj = null; // Biến lưu đối tượng Audio để pause khi lost

    this.target.addEventListener("targetFound", () => {
      this.timer = setTimeout(() => {
        if (this.data.sound) {
           const cleanSrc = this.data.sound.replace('url(', '').replace(')', '');
           this.audioObj = new Audio(cleanSrc);
           this.audioObj.play().catch(()=>{});
        }
      }, this.data.delay);
    });

    this.target.addEventListener("targetLost", () => {
      if (this.timer) clearTimeout(this.timer);
      if (this.audioObj) {
        this.audioObj.pause();
        this.audioObj.currentTime = 0;
      }
    });
  }
});

// 3. REVEAL MODEL
AFRAME.registerComponent("reveal-model", {
  schema: {
    duration: { type: "number", default: 3000 },
    sound3D: { type: "string", default: "" }, // ĐỔI SANG STRING
    startScale: { type: "vec3" }, finalScale: { type: "vec3" }, startPos: { type: "vec3" }, finalPos: { type: "vec3" }
  },
  init() {
    this.target = this.el.closest("[mindar-image-target]");
    this.running = false;
    this._hardReset();
    this.target.addEventListener("targetLost", () => this._hardReset());
    this.target.addEventListener("targetFound", () => this.start());
  },
  _hardReset() {
    this.running = false;
    this.el.removeAttribute("animation__scale");
    this.el.removeAttribute("animation__pos");
    const ss = this.data.startScale, sp = this.data.startPos;
    this.el.setAttribute("scale", `${ss.x} ${ss.y} ${ss.z}`);
    this.el.setAttribute("position", `${sp.x} ${sp.y} ${sp.z}`);
    if (this.el.object3D) {
      this.el.object3D.scale.set(ss.x, ss.y, ss.z);
      this.el.object3D.position.set(sp.x, sp.y, sp.z);
    }
  },
  start() {
    if (this.running) return;
    this.running = true;
    this._hardReset();
    
    playSound(this.data.sound3D); // Phát nhạc

    const fs = this.data.finalScale, fp = this.data.finalPos;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      this.el.setAttribute("animation__scale", { property: "scale", to: `${fs.x} ${fs.y} ${fs.z}`, dur: this.data.duration, easing: "easeOutCubic" });
      this.el.setAttribute("animation__pos", { property: "position", to: `${fp.x} ${fp.y} ${fp.z}`, dur: this.data.duration, easing: "easeOutCubic" });
    }));
  }
});


AFRAME.registerComponent('video-control', { schema: { video: { type: 'selector' }, delay: { type: 'number', default: 1500 } }, init: function() { this.target = this.el.closest("[mindar-image-target]"); this.videoEl = this.data.video; this.videoPlane = this.target.querySelector('a-video'); this.timer = null; this._reset(); this.target.addEventListener("targetFound", () => { this.timer = setTimeout(() => { this._playAndFade(); }, this.data.delay); }); this.target.addEventListener("targetLost", () => { this._reset(); }); }, _reset: function() { if (this.timer) clearTimeout(this.timer); if (this.videoEl) { try { this.videoEl.pause(); this.videoEl.currentTime = 0; } catch (e) {} } if (this.videoPlane) { const mesh = this.videoPlane.getObject3D('mesh'); if (mesh && mesh.material) { mesh.material.opacity = 0; } this.videoPlane.setAttribute('opacity', '0'); try { this.videoPlane.removeAttribute('animation__fade'); } catch (e) {} } }, _playAndFade: function() { if (this.videoEl) { this.videoEl.muted = true; this.videoEl.setAttribute("playsinline", ""); try { this.videoEl.play(); } catch (e) {} } if (this.videoPlane) { this.videoPlane.emit('fade-in'); } } });
AFRAME.registerComponent('video-fx', { schema: { opacity: { type: 'number', default: 0.9 }, softness: { type: 'number', default: 0.2 } }, init: function() { const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256; const ctx = canvas.getContext('2d'); const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2); const start = Math.max(0, 1.0 - this.data.softness * 2); gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); gradient.addColorStop(start, 'rgba(255, 255, 255, 1)'); gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height); const maskTexture = new THREE.CanvasTexture(canvas); this.el.addEventListener('materialtextureloaded', () => { const mesh = this.el.getObject3D('mesh'); if (mesh && mesh.material) { mesh.material.alphaMap = maskTexture; mesh.material.transparent = true; mesh.material.opacity = 0; mesh.material.blending = THREE.AdditiveBlending; mesh.material.needsUpdate = true; } }); } });
AFRAME.registerComponent("slow-spin", { init() { this.el.setAttribute("animation__spin", { property: "rotation", to: "0 360 0", loop: true, dur: 14000, easing: "linear" }); } });
AFRAME.registerComponent("transparent-model", {
  schema: { opacity: { type: "number", default: 0.85 } }, // Tăng lên 0.85 cho đỡ ảo
  init() {
    this.el.addEventListener("model-loaded", () => {
      const op = this.data.opacity;
      this.el.object3D.traverse((n) => {
        if (n.isMesh) { // Chỉ tác động lên lưới 3D
          if (n.material) {
            const mats = Array.isArray(n.material) ? n.material : [n.material];
            mats.forEach((m) => {
              // 1. Bật trong suốt
              m.transparent = true;
              m.opacity = op;

              // 2. KỸ THUẬT CHE RUỘT (QUAN TRỌNG NHẤT)
           
              m.depthWrite = true; 
              
              // 3. Chỉ vẽ mặt ngoài (Không vẽ mặt trong)
              m.side = THREE.FrontSide; 

              m.needsUpdate = true;
            });
          }
        }
      });
    });
  }
});

