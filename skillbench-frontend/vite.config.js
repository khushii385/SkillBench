import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,      // Yeh hamesha 5173 par hi run karega
    strictPort: true // Agar 5173 busy hoga, toh doosre port par jaane ke bajaye error dega (taaki aapko pata chale ki purana server band karna hai)
  }
})