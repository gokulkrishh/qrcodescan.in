export function registerServiceWorker(onFirstInstall) {
	if (!('serviceWorker' in navigator)) return;
	window.addEventListener('load', () => {
		navigator.serviceWorker
			.register('/service-worker.js')
			.then(() => {
				try {
					if (!localStorage.getItem('offline')) {
						localStorage.setItem('offline', true);
						if (onFirstInstall) onFirstInstall();
					}
				} catch (e) {
					// Storage blocked (private mode); nothing to remember.
				}
			})
			.catch((err) => console.log('SW registration failed: ', err));
	});
}
