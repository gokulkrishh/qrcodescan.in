import QRReader from './vendor/qrscan.js';
import snackbar from './snackbar.js';
import { parseQR } from './parse.js';
import { track } from './analytics.js';
import { loadAd, loadStaticAds } from './ads.js';
import { registerServiceWorker } from './sw.js';

import '../css/site.css';
import '../css/styles.css';

registerServiceWorker(() => snackbar.show('App is ready for offline usage.', 5000));

const TYPE_LABELS = {
	url: 'Link',
	upi: 'UPI payment',
	wifi: 'Wi-Fi network',
	vcard: 'Contact',
	tel: 'Phone number',
	email: 'Email address',
	sms: 'Text message',
	geo: 'Location',
	text: 'Text',
};

window.addEventListener('DOMContentLoaded', () => {
	//To check the device and add iOS support
	window.iOS = ['iPad', 'iPhone', 'iPod'].indexOf(navigator.platform) >= 0;
	window.isMediaStreamAPISupported = navigator && navigator.mediaDevices && 'enumerateDevices' in navigator.mediaDevices;
	window.noCameraPermission = false;

	loadStaticAds();

	var frame = null;
	var current = null;
	var resultInHistory = false;
	// After "Scan another", the code just scanned is usually still in front of
	// the camera. Ignore it briefly so the user isn't bounced straight back.
	var REPEAT_COOLDOWN_MS = 3000;
	var lastText = null;
	var lastClosedAt = 0;

	var heroEle = document.querySelector('.scanner-hero');
	var selectPhotoBtn = document.querySelector('.app__select-photos');
	var scanningEle = document.querySelector('.custom-scanner');
	var appScanningEle = document.querySelector('.app__scanner-img');
	var videoElement = document.querySelector('video');

	var resultEle = document.querySelector('.result');
	var resultType = resultEle.querySelector('.result__type');
	var resultHost = resultEle.querySelector('.result__host');
	var resultValue = resultEle.querySelector('.result__value');
	var resultDetails = resultEle.querySelector('.result__details');
	var resultWarning = resultEle.querySelector('.result__warning');
	var resultPrimary = resultEle.querySelector('.result__primary');
	var resultShare = resultEle.querySelector('[data-action="share"]');
	var resultAd = resultEle.querySelector('[data-ad-slot]');

	var headerIcon = document.querySelector('.app__header-icon');
	var infoDialogElement = document.querySelector('.app__infodialog');
	var infoDialogCloseBtnElement = document.querySelector('.app__infodialog-close');
	var infoDialogOverlayElement = document.querySelector('.app__infodialog-overlay');

	window.appOverlay = document.querySelector('.app__overlay');

	//Scanner frame is visible by default for the camera flow only
	if (!window.isMediaStreamAPISupported) {
		appScanningEle.style.display = 'none';
	}

	//To initialize QR Scanner
	QRReader.init();

	window.addEventListener('load', () => {
		// Set camera overlay size
		setTimeout(() => {
			window.appOverlay.style.borderStyle = 'solid';
			if (window.isMediaStreamAPISupported) {
				scan();
			}
		}, 100);

		// To support other browsers who dont have mediaStreamAPI
		selectFromPhoto();
	});

	function createFrame() {
		frame = document.createElement('img');
		frame.src = '';
		frame.id = 'frame';
	}

	infoDialogCloseBtnElement.addEventListener('click', closeInfoDialog, false);
	headerIcon.addEventListener('click', showInfo, false);

	//Scan
	function scan(forSelectedPhotos = false) {
		if ((window.isMediaStreamAPISupported && !window.noCameraPermission) || forSelectedPhotos) {
			scanningEle.style.display = 'block';
			appScanningEle.style.display = 'block';
		}

		QRReader.scan((result) => {
			if (!forSelectedPhotos && String(result).trim() === lastText && Date.now() - lastClosedAt < REPEAT_COOLDOWN_MS) {
				// Restart after the decoder's own follow-up frame has run (and
				// stopped, since active is false); restarting synchronously
				// would leave two frame loops running.
				setTimeout(scan, 200);
				return;
			}
			scanningEle.style.display = 'none';
			appScanningEle.style.display = 'none';
			showResult(result, forSelectedPhotos ? 'image' : 'camera');
		}, forSelectedPhotos);
	}

	function addDetail(label, value, copyable) {
		if (!value) return;
		var dt = document.createElement('dt');
		dt.textContent = label;
		var dd = document.createElement('dd');
		var span = document.createElement('span');
		span.textContent = value;
		dd.appendChild(span);
		if (copyable) {
			var btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'result__copy-inline';
			btn.textContent = 'Copy';
			btn.addEventListener('click', () => copy(value, label.toLowerCase()));
			dd.appendChild(btn);
		}
		resultDetails.append(dt, dd);
	}

	function setPrimary(label, href, external) {
		resultPrimary.textContent = label;
		resultPrimary.href = href;
		if (external) {
			resultPrimary.target = '_blank';
			resultPrimary.rel = 'noopener noreferrer';
		} else {
			resultPrimary.removeAttribute('target');
			resultPrimary.removeAttribute('rel');
		}
		resultPrimary.hidden = false;
	}

	function warn(text) {
		resultWarning.textContent = text;
		resultWarning.hidden = false;
	}

	function vcardHref(text) {
		return URL.createObjectURL(new Blob([text], { type: 'text/vcard' }));
	}

	// The result is a page state, not a pop-up: the scanner hero is swapped
	// out for the result section in normal page flow, and Back returns to the
	// scanner.
	function showResult(raw, source) {
		current = parseQR(raw);

		resultType.textContent = TYPE_LABELS[current.type];
		resultValue.value = current.text;
		resultHost.hidden = true;
		resultDetails.textContent = '';
		resultDetails.hidden = true;
		resultWarning.hidden = true;
		resultPrimary.hidden = true;
		resultPrimary.removeAttribute('download');
		if (resultPrimary.href.startsWith('blob:')) URL.revokeObjectURL(resultPrimary.href);
		resultShare.hidden = !navigator.share;

		switch (current.type) {
			case 'url':
				resultHost.textContent = current.host;
				resultHost.hidden = false;
				setPrimary('Open link', current.href, true);
				if (current.suspicious) {
					warn('This address uses look-alike characters and may imitate another website. Check it carefully before opening.');
				} else if (current.insecure) {
					warn('This link is not secure (HTTP). Avoid entering passwords or payment details on it.');
				}
				break;
			case 'upi':
				addDetail('Pay to', current.upi.pn);
				addDetail('UPI ID', current.upi.pa, true);
				addDetail('Amount', current.upi.am ? `₹${current.upi.am}` : 'You enter it in your UPI app');
				addDetail('Note', current.upi.tn);
				setPrimary('Pay with UPI app', current.text, false);
				warn('Scanning a QR code is only for paying. You never need to scan a QR code or enter your UPI PIN to receive money.');
				break;
			case 'wifi':
				addDetail('Network', current.wifi.ssid, true);
				addDetail('Password', current.wifi.password, true);
				addDetail('Security', current.wifi.security === 'nopass' ? 'None (open network)' : current.wifi.security);
				break;
			case 'vcard':
				addDetail('Name', current.vcard.name);
				addDetail('Phone', current.vcard.phone, true);
				addDetail('Email', current.vcard.email, true);
				addDetail('Company', current.vcard.org);
				setPrimary('Save contact', vcardHref(current.text), false);
				resultPrimary.download = `${current.vcard.name || 'contact'}.vcf`;
				break;
			case 'tel':
				setPrimary('Call', current.href, false);
				break;
			case 'email':
				setPrimary('Send email', current.href, false);
				break;
			case 'sms':
				setPrimary('Send text message', current.href, false);
				break;
			case 'geo':
				setPrimary('Open in maps', current.href, true);
				break;
		}
		resultDetails.hidden = !resultDetails.childElementCount;
		// Structured payloads are shown as details; the raw string is noise.
		resultValue.hidden = !resultDetails.hidden;

		heroEle.hidden = true;
		resultEle.hidden = false;
		window.scrollTo(0, 0);

		if (!resultInHistory) {
			history.pushState({ qrResult: true }, '');
			resultInHistory = true;
		}

		// Requested only once the container is visible and has a width.
		requestAnimationFrame(() => loadAd(resultAd, resultAd.dataset.adSlot));

		track('qr_scan', { qr_type: current.type, source });
	}

	function backToScanner() {
		lastText = current ? current.text : null;
		lastClosedAt = Date.now();
		current = null;
		resultValue.value = '';
		resultEle.hidden = true;
		heroEle.hidden = false;
		window.scrollTo(0, 0);

		// Remove an uploaded image so the live camera is visible again.
		if (frame) {
			frame.removeAttribute('src');
			frame.className = '';
		}
		if (videoElement.srcObject && videoElement.paused) videoElement.play().catch(() => {});
		scan();
	}

	// "Scan another" pops the history entry pushed in showResult, so the
	// browser Back button and the in-page button behave the same.
	function closeResult() {
		if (resultInHistory) history.back();
		else backToScanner();
	}

	window.addEventListener('popstate', () => {
		if (resultInHistory) {
			resultInHistory = false;
			backToScanner();
		}
	});

	function copy(text, what) {
		var done = () => snackbar.show('Copied to clipboard', 2000);
		if (navigator.clipboard && window.isSecureContext) {
			navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
		} else {
			fallbackCopy(text, done);
		}
		track('qr_result_action', { action: 'copy', qr_type: current ? current.type : '', field: what || 'value' });
	}

	function fallbackCopy(text, done) {
		var ta = document.createElement('textarea');
		ta.value = text;
		ta.setAttribute('readonly', '');
		ta.style.position = 'fixed';
		ta.style.opacity = '0';
		document.body.appendChild(ta);
		ta.select();
		try {
			if (document.execCommand('copy')) done();
		} catch (e) {
			snackbar.show('Press and hold the text to copy it', 3000);
		}
		ta.remove();
	}

	resultEle.addEventListener('click', (e) => {
		var target = e.target.closest('[data-action]');
		if (!target || !current) return;
		var action = target.dataset.action;
		if (action === 'rescan') closeResult();
		if (action === 'copy') copy(current.text);
		if (action === 'share') {
			navigator.share({ text: current.text }).catch(() => {});
			track('qr_result_action', { action: 'share', qr_type: current.type });
		}
	});

	resultPrimary.addEventListener('click', () => {
		track('qr_result_action', { action: 'open', qr_type: current ? current.type : '' });
	});

	function selectFromPhoto() {
		//Creating the camera element
		var camera = document.createElement('input');
		camera.setAttribute('type', 'file');
		camera.setAttribute('accept', 'image/*');
		camera.id = 'camera';
		window.appOverlay.style.borderStyle = '';
		selectPhotoBtn.style.display = 'flex';
		createFrame();

		//Add the camera and img element to DOM
		var pageContentElement = document.querySelector('.app__layout-content');
		pageContentElement.appendChild(camera);
		pageContentElement.appendChild(frame);

		//Click of camera fab icon
		selectPhotoBtn.addEventListener('click', () => {
			scanningEle.style.display = 'none';
			appScanningEle.style.display = 'none';
			document.querySelector('#camera').click();
		});

		//On camera change
		camera.addEventListener('change', (event) => {
			if (event.target && event.target.files.length > 0) {
				frame.className = 'app__overlay';
				frame.src = URL.createObjectURL(event.target.files[0]);
				if (!window.noCameraPermission) {
					scanningEle.style.display = 'block';
					appScanningEle.style.display = 'block';
				}
				window.appOverlay.style.borderColor = 'rgb(62, 78, 184)';
				scan(true);
				// Allow picking the same file again.
				camera.value = '';
			}
		});
	}

	function showInfo() {
		infoDialogElement.classList.remove('app__infodialog--hide');
		infoDialogOverlayElement.classList.remove('app__infodialog--hide');
	}

	function closeInfoDialog() {
		infoDialogElement.classList.add('app__infodialog--hide');
		infoDialogOverlayElement.classList.add('app__infodialog--hide');
	}
});
