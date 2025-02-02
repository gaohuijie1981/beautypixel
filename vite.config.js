import { defineConfig } from 'vite'
import { resolve } from 'path'
export default defineConfig(option => ({
    server: {
        host: '0.0.0.0',
        port: 8000
    },
    build: {
        target: 'esnext',
        lib: {
            entry: resolve(__dirname, './src/index.ts'),
            name: 'Beautypixel',
            fileName: (format) => `beautypixel.${format}.js`,
        },
        minify: false
    }
}))