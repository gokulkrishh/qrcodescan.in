if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('../sw.js', { scope: '/' }).then((reg) => {
		if (reg.installing) {
			console.log('Service worker installing');
			var notification = document.querySelector('#toast-notification');
			var data = {
				message: 'App is ready for offline use!',
				timeout: 3000
			};
			notification.MaterialSnackbar.showSnackbar(data);
		} else if(reg.waiting) {
			console.log('Service worker installed');
		} else if(reg.active) {
			console.log('Service worker active');
		}
	}).catch((error) => {
		console.log('Registration failed with ' + error); // Registration failed
	});
}
