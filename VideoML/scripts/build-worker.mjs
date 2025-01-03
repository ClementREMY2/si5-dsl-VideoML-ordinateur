import esbuild from 'esbuild'

esbuild.build({
  entryPoints: ['./src/language-server/main-browser.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  outfile: './ui/public/video-ml-server-worker.js',
  define: {
    'process.env.IS_ELECTRON': JSON.stringify('true'),
  },
  platform: 'browser',
  external: ['path', 'fs'],
}).catch(() => process.exit(1));