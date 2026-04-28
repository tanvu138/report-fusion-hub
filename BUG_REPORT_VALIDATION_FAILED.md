# Báo cáo lỗi kỹ thuật: Validation failed khi tạo báo cáo mới

**Ngày ghi nhận:** 16 Tháng 04, 2026

**Mô tả lỗi:** Khi người dùng nhập đủ thông tin vào giao diện và nhấn nút "Tạo báo cáo" (Create Report), hệ thống báo lỗi "Validation failed" dạng toast popup trên UI và API `/api/reports/custom` trả về HTTP Status 400 (Bad Request).

---

## 1. Nguyên nhân gốc rễ (Root Causes)

Lỗi này là tổ hợp của 3 vấn đề liên quan đến Logic Frontend, Ràng buộc Backend và Môi trường Docker:

### Vấn đề 1: Logic Frontend (Payload Data)
Tại màn hình tạo báo cáo (`src/pages/ReportCreate.tsx`), khi sinh dữ liệu Payload cho chức năng **Custom Report**, vòng lặp sinh tham số `displayOrder` dùng chính giá trị `index` của mảng (bắt đầu từ `0`). Do đó, phần tử (section) đầu tiên luôn được gửi lên server với giá trị `displayOrder: 0`.

### Vấn đề 2: Ràng buộc Backend (Zod Validation)
Trong hệ thống validation của backend (`server/middleware/validation.js`), schema kiểm tra request `createCustomReport` định nghĩa trường `displayOrder` là `z.number().int().positive()`. Thuộc tính `.positive()` của thư viện Zod yêu cầu giá trị gửi lên phải **lớn hơn 0** (tức là `>= 1`). Việc nhận vào giá trị `0` khiến Middleware báo lỗi validation.

### Vấn đề 3: Môi trường (Docker Compose Cache)
Sau khi thực hiện sửa lại source code local, tuy nhiên kết quả vẫn không thay đổi. Lý do là hệ thống Dev của dự án đang được ảo hóa (host) thông qua Docker Compose ở chế độ production / built-images. 
- Frontend được webpack/vite build cố định thành file tĩnh `index-[hash].js` và phục vụ bằng Nginx.
- Việc thực hiện gõ lệnh chạy nội bộ `npm start` hay hot-reload bị lỗi `EADDRINUSE: :::8945` vì container backend của Docker vẫn đang chiếm dụng port và nó chỉ chạy source code của Image cũ.

---

## 2. Giải pháp đã áp dụng để sửa chữa (Fixes)

### 2.1 Cập nhật Frontend
Cập nhật file `src/pages/ReportCreate.tsx` ở hàm `handleCreateCustomReport`, buộc `displayOrder` đếm từ `1` thay vì `0`.
```typescript
// Trích xuất thay đổi trong payload
sections: customReportSections.map((section, index) => ({ 
  ...section, 
  displayOrder: index + 1 // Cũ: displayOrder: index
})),
```

### 2.2 Cập nhật Backend (Dự phòng)
Nới lỏng ràng buộc tại `server/middleware/validation.js` để tránh sập lỗi về sau nếu front-end hoặc hệ thống ngoài đẩy index từ 0 vào, bằng cách chuyển hàm `.positive()` sang hàm `.min(0)`.
```javascript
// Trích xuất thay đổi schema createCustomReport và addSectionToReport
displayOrder: z.number().int().min(0, { message: 'Display order must be at least 0' }).optional(),
```

### 2.3 Đồng bộ môi trường hệ thống
Xóa cache build và tiến hành dựng lại Image cho Docker với đoạn code đã được sửa lại.
```bash
# Lệnh đã chạy trên Terminal định tuyến lại Docker Image
docker compose up -d --build backend frontend
```

*Lưu ý cho tương lai:* Nếu chỉnh sửa code và đang sử dụng hệ thống ảo hóa Docker ngầm, hãy luôn nhớ gọi lệnh kèm flags `--build` để đóng gói (pack) code mới vào container đang chạy.
