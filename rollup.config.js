import { terser } from 'rollup-plugin-terser';
import styles from 'rollup-plugin-styles';
import del from 'rollup-plugin-delete';

export default {
  input: 'src/js/index.js',
  output: {
    file: 'public/bundle.js',
    format: 'cjs',
    assetFileNames: '[name]-[hash][extname]'
  },
  plugins: [del({ targets: ['public/workbox-*.js', 'public/sw.js'] }), , styles(), terser()]
};
