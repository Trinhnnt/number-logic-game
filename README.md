# 🧩 SỐ LOGIC 10 — Game Giải Đố Dãy Số Bằng Quy Luật

Trò chơi web giải đố logic hiện đại, sắp xếp 10 số (1x`1`, 2x`2`, 3x`3`, 4x`4`) tuân theo các quy luật vị trí logic nghiêm ngặt.

## 🚀 Hướng dẫn Deploy lên Vercel trong 2 phút

Game được xây dựng dưới dạng **Static Web App** (HTML5, Vanilla CSS, JS), không cần cấu hình build phức tạp. Bạn có thể deploy miễn phí lên Vercel theo 2 cách cực kỳ đơn giản:

---

### Cách 1: Deploy qua GitHub (Khuyên dùng - Nhanh & Tự động update)

1. **Tạo GitHub Repository mới**:
   - Truy cập [GitHub.com](https://github.com/new) và tạo repository mới (ví dụ: `number-logic-game`).
   - Đẩy toàn bộ mã nguồn thư mục này lên repository đó:
     ```bash
     git init
     git add .
     git commit -m "Initial commit - Number Logic Game"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/number-logic-game.git
     git push -u origin main
     ```

2. **Kết nối với Vercel**:
   - Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard).
   - Bấm nút **"Add New..."** ➔ chọn **"Project"**.
   - Chọn repository `number-logic-game` vừa push.
   - Giữ nguyên các thông số mặc định (Framework Preset: *Other / Static*).
   - Bấm **"Deploy"**.
   - **Xong!** Vercel sẽ cấp cho bạn tên miền miễn phí dạng `https://number-logic-game.vercel.app`.

---

### Cách 2: Deploy bằng Vercel CLI (Dành cho Lập trình viên)

1. Cài đặt Vercel CLI nếu chưa có:
   ```bash
   npm install -g vercel
   ```

2. Chạy lệnh deploy trực tiếp tại thư mục dự án:
   ```bash
   vercel
   ```
   - Làm theo các bước xác nhận nhanh trên terminal.
   - Nhận link preview và production sau vài giây!

---

### Cách 3: Kéo thả thủ công trên trang Vercel Dashboard

1. Mở trang [Vercel New Project](https://vercel.com/new).
2. Kéo thả trực tiếp **cả thư mục dự án này** vào vùng upload trên trình duyệt.
3. Nhấn **Deploy** để xuất bản ngay lập tức.

---

## 🎨 Tính Năng Đáng Chú Ý

- **Thuật toán sinh màn đố thông minh**: Mỗi lượt chơi sinh ra một đáp án ngẫu nhiên thỏa mãn quy luật và cấp các manh mối tương ứng.
- **Real-time Validator**: Cập nhật trạng thái quy luật (<span style="color:#22c55e">✔ ĐÚNG</span> / <span style="color:#ef4444">✖ SAI</span>) ngay lập tức khi di chuyển thẻ số.
- **Hệ thống Âm thanh Synth**: Tích hợp Web Audio API phát tiếng click, đặt thẻ, âm sai, chiến thắng mà không tốn tài nguyên.
- **Pháo hoa ăn mừng (Confetti Canvas)**: Hiệu ứng pháo hoa hoành tráng khi hoàn thành màn chơi.
- **Hỗ trợ Đa nền tảng**: Tương thích tốt với màn hình cảm ứng điện thoại (Touch) và máy tính (Drag-and-drop / Click).
