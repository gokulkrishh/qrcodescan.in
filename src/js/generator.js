import { normalizeLinkOrText, buildWifi, buildUpi } from './payloads.js';
import { encode, toSvg, drawToCanvas } from './qr-render.js';
import { track } from './analytics.js';
import { registerServiceWorker } from './sw.js';
import { loadStaticAds } from './ads.js';

import '../css/site.css';
import '../css/generator.css';

const BUILDERS = {
	text: (f) => {
		const text = normalizeLinkOrText(f.get('text') || '');
		return text ? { text } : { error: 'Type a link or some text to create a QR code.' };
	},
	wifi: (f) =>
		buildWifi({
			ssid: f.get('ssid') || '',
			password: f.get('password') || '',
			security: f.get('security') || 'WPA',
			hidden: f.get('hidden') === 'on',
		}),
	upi: (f) =>
		buildUpi({
			pa: f.get('pa') || '',
			pn: f.get('pn') || '',
			am: f.get('am') || '',
			tn: f.get('tn') || '',
		}),
};

registerServiceWorker();

window.addEventListener('DOMContentLoaded', () => {
	loadStaticAds();

	const form = document.querySelector('.gen__form');
	if (!form) return;

	const type = form.dataset.qrType;
	const build = BUILDERS[type];
	const filename = form.dataset.filename || 'qr-code';
	const canvas = document.querySelector('.gen__canvas');
	const empty = document.querySelector('.gen__empty');
	const status = document.querySelector('.gen__status');
	const encoded = document.querySelector('.gen__encoded');
	const downloads = document.querySelectorAll('[data-download]');
	const sizeSelect = document.querySelector('[name="png-size"]');

	let matrix = null;
	let currentText = '';
	let tracked = false;

	function setReady(ready) {
		canvas.hidden = !ready;
		empty.hidden = ready;
		downloads.forEach((b) => (b.disabled = !ready));
	}

	function render() {
		const data = new FormData(form);
		const touched = [...data.values()].some((v) => typeof v === 'string' && v.trim() && v !== 'WPA');
		const result = build(data);

		if (result.error) {
			matrix = null;
			currentText = '';
			setReady(false);
			status.textContent = touched ? result.error : '';
			encoded.textContent = '';
			return;
		}

		try {
			matrix = encode(result.text);
		} catch (e) {
			matrix = null;
			setReady(false);
			status.textContent = 'That’s too much text for one QR code. Shorten it, or use a link instead.';
			return;
		}

		currentText = result.text;
		drawToCanvas(canvas, matrix, 260 * Math.min(window.devicePixelRatio || 1, 3));
		setReady(true);
		status.textContent = '';
		encoded.textContent = type === 'text' && result.text !== (data.get('text') || '').trim() ? `Encoded as: ${result.text}` : '';

		if (!tracked) {
			tracked = true;
			track('qr_create', { qr_type: type });
		}
	}

	function save(blob, ext) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${filename}.${ext}`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	downloads.forEach((btn) =>
		btn.addEventListener('click', () => {
			if (!matrix) return;
			const format = btn.dataset.download;
			if (format === 'svg') {
				save(new Blob([toSvg(matrix)], { type: 'image/svg+xml' }), 'svg');
			} else {
				const size = Number(sizeSelect ? sizeSelect.value : 1024);
				drawToCanvas(document.createElement('canvas'), matrix, size).toBlob((blob) => blob && save(blob, 'png'), 'image/png');
			}
			track('qr_download', { qr_type: type, format, length: currentText.length });
		}),
	);

	// Show/hide the password field for open networks.
	const security = form.querySelector('[name="security"]');
	const passwordRow = form.querySelector('.gen__field--password');
	function syncSecurity() {
		if (security && passwordRow) passwordRow.hidden = security.value === 'nopass';
	}
	if (security) security.addEventListener('change', syncSecurity);
	syncSecurity();

	form.addEventListener('input', render);
	form.addEventListener('change', render);
	form.addEventListener('submit', (e) => e.preventDefault());
	render();
});
