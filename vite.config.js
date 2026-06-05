import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vercel 정적 배포용 기본 설정. base는 루트 도메인 배포 기준.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
});
