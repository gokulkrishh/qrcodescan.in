import styles from "rollup-plugin-styles";
import { terser } from "rollup-plugin-terser";
const { generateSW } = require("rollup-plugin-workbox");

export default {
	input: "src/js/main.js",
	output: {
		file: "public/bundle.js",
		format: "cjs",
		assetFileNames: "[name]-[hash][extname]"
	},
	plugins: [
		styles(),
		terser(),
		generateSW({
			swDest: "/public/sw.js",
			globDirectory: "public/sw/"
		})
	]
};
