import qrcode from 'qrcode-generator';

// Byte mode with UTF-8 so Hindi, Tamil, emoji etc. survive the round trip.
// The library looks up qrcode.stringToBytes at encode time.
qrcode.stringToBytes = (s) => Array.from(new TextEncoder().encode(s));

// The QR spec requires a 4-module light border ("quiet zone") for reliable
// scanning, especially on printed codes.
export const QUIET_ZONE = 4;

// Returns { size, isDark(row, col) } or throws if the text is too long.
export function encode(text, ecl = 'M') {
	const qr = qrcode(0, ecl);
	qr.addData(text, 'Byte');
	qr.make();
	return { size: qr.getModuleCount(), isDark: (r, c) => qr.isDark(r, c) };
}

export function toSvg(matrix, { fg = '#000000', bg = '#ffffff' } = {}) {
	const total = matrix.size + QUIET_ZONE * 2;
	let d = '';
	// One horizontal run per group of adjacent dark modules keeps the path
	// small (a cell-per-rect SVG is ~10x larger).
	for (let r = 0; r < matrix.size; r++) {
		let c = 0;
		while (c < matrix.size) {
			if (!matrix.isDark(r, c)) {
				c++;
				continue;
			}
			const start = c;
			while (c < matrix.size && matrix.isDark(r, c)) c++;
			d += `M${start + QUIET_ZONE} ${r + QUIET_ZONE}h${c - start}v1h-${c - start}z`;
		}
	}
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">` +
		`<rect width="${total}" height="${total}" fill="${bg}"/><path d="${d}" fill="${fg}"/></svg>`
	);
}

// Draws the code filling `canvas`, snapped to whole pixels per module so
// edges stay sharp. Returns the canvas.
export function drawToCanvas(canvas, matrix, targetPx, { fg = '#000000', bg = '#ffffff' } = {}) {
	const total = matrix.size + QUIET_ZONE * 2;
	const scale = Math.max(1, Math.floor(targetPx / total));
	const px = total * scale;
	canvas.width = px;
	canvas.height = px;

	const ctx = canvas.getContext('2d');
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, px, px);
	ctx.fillStyle = fg;
	for (let r = 0; r < matrix.size; r++) {
		for (let c = 0; c < matrix.size; c++) {
			if (matrix.isDark(r, c)) ctx.fillRect((c + QUIET_ZONE) * scale, (r + QUIET_ZONE) * scale, scale, scale);
		}
	}
	return canvas;
}
