export const AD_CLIENT = 'ca-pub-8317178183177647';

// Creates a responsive AdSense unit inside `container` and requests it.
//
// The <ins> is created on demand instead of living in the HTML because
// adsbygoogle.push({}) fills the first unprocessed <ins> in document order.
// A hidden <ins> earlier in the page would swallow another unit's push and
// fail with availableWidth=0. Only call this when the container is visible.
// Each unit is requested once: re-requesting without a user-initiated page
// load is against AdSense policy.
export function loadAd(container, slot) {
	if (!container || container.dataset.adLoaded) return;
	container.dataset.adLoaded = 'true';

	const ins = document.createElement('ins');
	ins.className = 'adsbygoogle';
	ins.style.display = 'block';
	ins.dataset.adClient = AD_CLIENT;
	ins.dataset.adSlot = slot;
	ins.dataset.adFormat = 'auto';
	ins.dataset.fullWidthResponsive = 'true';
	container.appendChild(ins);

	try {
		(window.adsbygoogle = window.adsbygoogle || []).push({});
	} catch (e) {
		// Ad blocked or script failed; the page works without it.
	}
}

// Loads every ad container on the page that is visible from the start.
// Containers marked data-ad-defer are loaded later, when shown.
export function loadStaticAds() {
	document.querySelectorAll('[data-ad-slot]:not([data-ad-defer])').forEach((el) => loadAd(el, el.dataset.adSlot));
}
