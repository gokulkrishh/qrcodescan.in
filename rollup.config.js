import terser from '@rollup/plugin-terser';
import del from 'rollup-plugin-delete';
import { generateSW } from 'rollup-plugin-workbox';
import sizes from 'rollup-plugin-sizes';
import css from 'rollup-plugin-css-only';

const isProd = process.env.NODE_ENV === 'production';

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
		del({
			targets: [
				'public/workbox-*.js',
				'public/workbox-*.js.map',
				'public/service-worker.js.map',
				'public/bundle.js',
				'public/bundle.css',
			],
		}),
		css({ output: 'bundle.css' }),
		terser(),
		isProd &&
			generateSW({
				swDest: 'public/service-worker.js',
				globDirectory: './public',
				sourcemap: false,
				clientsClaim: true,
				skipWaiting: true,
				runtimeCaching: [
					{
						urlPattern: isProd ? /https:\/\/qrcodescan.in\// : /http:\/\/localhost:5000\//,
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'pages',
							cacheableResponse: { statuses: [200] },
						},
					},
				],
			}),
		sizes(),
	],
};
