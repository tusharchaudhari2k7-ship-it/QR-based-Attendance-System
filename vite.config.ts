import { defineConfig } from 'vite'
import react from '@vitejs/react-vite' // or your standard react plugin

export default defineConfig({
  plugins: [react()],
  base: '/QR-based-Attendance-System/', 
})
