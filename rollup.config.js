import styles from "rollup-plugin-styles";
import { terser } from "rollup-plugin-terser";
const { generateSW } = require("rollup-plugin-workbox");
import del from "rollup-plugin-delete";

const isProduction = process.env.NODE_ENV === "production";

export default {
	input: "src/js/main.js",
	output: {
		file: "public/bundle.js",
		format: "cjs",
		assetFileNames: "[name]-[hash][extname]"
	},
	plugins: [
		del({ targets: ["public/workbox-*.js", "public/sw.js"] }),
		styles(),
		isProduction && terser(),
		generateSW({
			swDest: "public/sw.js",
			globDirectory: "./",
			globPatterns: ["public/*.{html,js}"],
			skipWaiting: true,
			clientsClaim: true
		})
	]
};
