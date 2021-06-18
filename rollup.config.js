import { terser } from 'rollup-plugin-terser';
import styles from 'rollup-plugin-styles';
import del from 'rollup-plugin-delete';
import { generateSW } from 'rollup-plugin-workbox';

export default {
	input: ['src/js/index.js'],
	output: [
		{
			file: 'public/bundle.js',
			format: 'cjs',
			assetFileNames: '[name]-[hash][extname]',
		},
	],
	plugins: [
		del({ targets: ['public/workbox-*.js', 'public/sw.js'] }),
		styles(),
		terser(),
		generateSW({
			swDest: 'public/service-worker.js',
			globDirectory: './public',
			clientsClaim: true,
			skipWaiting: true,
			runtimeCaching: [
				{
					urlPattern: process.env.NODE_ENV === 'production' ? /https:\/\/qrcodescan.in\// : /http:\/\/localhost:5000\//,
					handler: 'CacheFirst',
					options: {
						cacheName: 'pages',
						cacheableResponse: { statuses: [200] },
					},
				},
			],
		}),
	],
};
