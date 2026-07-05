import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // or '@vitejs/react-vite' depending on your setup

export default defineConfig({
  plugins: [react()],
  base: '/fixtures-generator/', // 👈 MUST match your GitHub repository name exactly
})