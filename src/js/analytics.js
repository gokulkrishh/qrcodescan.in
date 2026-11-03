// GA4 custom events. gtag is only defined in production (see the inline
// snippet in each page), so this is a no-op on localhost or when blocked.
export function track(name, params = {}) {
	try {
		if (typeof window.gtag === 'function') window.gtag('event', name, params);
	} catch (e) {
		// Analytics must never break the app.
	}
}
