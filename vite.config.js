import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
    const isElectron = process.env.ELECTRON === '1'

    return {
        base: './',
        plugins: [
            react(),
            ...(isElectron ? [
                electron([
                    {
                        entry: 'electron/main.js',
                        vite: {
                            build: {
                                outDir: 'dist-electron',
                                rollupOptions: {
                                    external: ['electron'],
                                },
                            },
                        },
                    },
                    {
                        entry: 'electron/preload.js',
                        onstart(args) {
                            args.reload()
                        },
                        vite: {
                            build: {
                                outDir: 'dist-electron',
                            },
                        },
                    },
                ]),
                renderer(),
            ] : []),
        ],
    }
})
