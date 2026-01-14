// js/database.js
const AR_DATABASE = [
  // --- TARGET 0: ẢNH (Phòng truyền thống) ---
  {
    type: 'image',          // Loại hiển thị
    targetIndex: 0,         // Thứ tự trong file targets.mind
    title: "Đ/C NGUYỄN PHAN VINH",
    desc: "Sinh năm: 1933; Mất năm: 1968, Anh hùng Lực lượng vũ trang nhân dân; sĩ quan Hải quân Nhân dân Việt Nam; thuyền trưởng tàu không số 235, Đoàn 125 Hải quân; tham gia vận chuyển vũ khí trên tuyến Đường Hồ Chí Minh trên biển; hy sinh năm 1968 trong khi làm nhiệm vụ; tên ông được đặt cho đảo Phan Vinh (quần đảo Trường Sa) và nhiều công trình, đơn vị của Hải quân Nhân dân Việt Nam.",
    color: "#00E5FF",
    audio_desc: "./assets/audio/thuyetminh1.mp3", // Thuyết minh sau 2s
    // Các file chung
    audio_text: "./assets/audio/text_ra.mp3"
  },


  // --- TARGET 1: VIDEO (Tư liệu) ---
  {
    type: 'video',
    targetIndex: 1,
    title: "BÀN GIAO THỦY LÔI",
    desc: "Trung tâm BĐKT Vùng 3 bàn giao thủy lôi cho nhiệm vụ diễn tập năm 2024",
    color: "#FFAB00",
    videoSrc: "./assets/videos/video1.mp4",
    videoId: "vid_2", // ID duy nhất cho mỗi video (để không bị trùng)
    audio_desc: "./assets/audio/thuyetminh_video1.mp3",
    audio_text: "./assets/audio/text_ra.mp3"
  },
    // --- TARGET 2: MÔ HÌNH 3D (Tên lửa) ---
    {
    type: 'model',
    targetIndex: 2,
    title: "CƠ CẤU NGẮM CƠ KHÍ",
    desc: "Cơ cấu ngắm cơ khí của súng máy phòng không 12,7mm là hệ thống ngắm truyền thống, hoạt động hoàn toàn bằng các bộ phận cơ khí, không phụ thuộc vào điện hay thiết bị điện tử. Hệ thống này thường gồm thước ngắm, vòng ngắm và các chi tiết điều chỉnh, cho phép xạ thủ ước lượng cự ly, hướng và tốc độ mục tiêu trên không hoặc mục tiêu mặt đất. Với kết cấu đơn giản, bền bỉ và độ tin cậy cao trong mọi điều kiện môi trường, cơ cấu ngắm cơ khí giữ vai trò quan trọng, đặc biệt khi các phương tiện ngắm hiện đại không thể sử dụng.",
    color: "#FFD700",
    modelSrc: "./assets/models/sung12ly7.glb",
    audio_3d: "./assets/audio/3d_ra.mp3",
    audio_desc: "./assets/audio/thuyetminh_12ly7.mp3",
    audio_text: "./assets/audio/text_ra.mp3"
  },
  {
    type: 'model',
    targetIndex: 3,
    title: "BI ĐÔNG NHÔM",
    desc: "Đây là bi đông nhôm, một vật dụng cá nhân quen thuộc của bộ đội, dùng để chứa và bảo quản nước uống trong quá trình huấn luyện, hành quân và thực hiện nhiệm vụ. Bi đông được chế tạo bằng nhôm nên nhẹ, bền, chịu va đập tốt, dễ mang theo bên người hoặc gắn vào trang bị cá nhân. Nắp bi đông có dây buộc giúp tránh thất lạc, đồng thời hạn chế rò rỉ nước khi di chuyển. Với thiết kế đơn giản nhưng hiệu quả, bi đông nhôm bảo đảm cung cấp nước kịp thời cho cá nhân trong điều kiện dã ngoại, góp phần duy trì sức khỏe và khả năng hoàn thành nhiệm vụ.",
    color: "#FFD700",
    modelSrc: "./assets/models/bidong.glb",
    audio_3d: "./assets/audio/3d_ra.mp3",
    audio_desc: "./assets/audio/thuyetminh_bidong.mp3",
    audio_text: "./assets/audio/text_ra.mp3"
  },
{
    type: 'model',
    targetIndex: 4,
    title: "MÁY ẢNH ARYKA 608 ",
    desc: "Máy ảnh ARYKA 608 là thiết bị chụp ảnh chuyên dụng, được sử dụng để ghi lại hình ảnh phục vụ công tác chuyên môn, lưu trữ tư liệu và báo cáo nhiệm vụ trong đơn vị. Máy có kết cấu gọn, độ bền cao, hoạt động ổn định trong điều kiện làm việc dã ngoại và môi trường khắc nghiệt. Với khả năng ghi nhận hình ảnh tương đối chính xác, rõ nét theo tiêu chuẩn thời kỳ sử dụng, ARYKA 608 góp phần quan trọng trong việc lưu giữ hồ sơ, minh chứng hiện trường, phục vụ công tác tổng kết, huấn luyện và giáo dục truyền thống.",
    color: "#FFD700",
    modelSrc: "./assets/models/mayanh.glb",
    audio_3d: "./assets/audio/3d_ra.mp3",
    audio_desc: "./assets/audio/thuyetminh_mayanh.mp3",
    audio_text: "./assets/audio/text_ra.mp3"
  },

];
