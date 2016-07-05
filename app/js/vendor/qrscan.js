navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia
	|| navigator.mozGetUserMedia || navigator.msGetUserMedia
	|| navigator.oGetUserMedia;

var QRReader = {};
QRReader.active = false;
QRReader.webcam = null;
QRReader.canvas = null;
QRReader.ctx = null;
QRReader.decoder = null;

(function() {

	var promisifiedOldGUM = function(constraints, successCallback, errorCallback) {

		// First get ahold of getUserMedia, if present
		var getUserMedia = (navigator.getUserMedia ||
				navigator.webkitGetUserMedia ||
				navigator.mozGetUserMedia ||
				navigator.msGetUserMedia);

		// Some browsers just don't implement it - return a rejected promise with an error
		// to keep a consistent interface
		if(!getUserMedia) {
			return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
		}

		// Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
		return new Promise(function(successCallback, errorCallback) {
			getUserMedia.call(navigator, constraints, successCallback, errorCallback);
		});

	}

	// Older browsers might not implement mediaDevices at all, so we set an empty object first
	if(navigator.mediaDevices === undefined) {
		navigator.mediaDevices = {};
	}

	// Some browsers partially implement mediaDevices. We can't just assign an object
	// with getUserMedia as it would overwrite existing properties.
	// Here, we will just add the getUserMedia property if it's missing.
	if(navigator.mediaDevices.getUserMedia === undefined) {
		navigator.mediaDevices.getUserMedia = promisifiedOldGUM;
	}

})();


/**
 * \brief QRReader Initialization
 * Call this as soon as the document has finished loading.
 *
 * \param webcam_selector selector for the webcam video tag
 */
QRReader.init = function (webcam_selector, baseurl) {
	baseurl = typeof baseurl !== "undefined" ? baseurl : "";

	// Init Webcam + Canvas
	QRReader.webcam = document.querySelector(webcam_selector);
	QRReader.canvas = document.createElement("canvas");
	QRReader.ctx = QRReader.canvas.getContext("2d");
	var streaming = false;
	QRReader.decoder = new Worker(baseurl + "decoder.min.js");

	// Resize webcam according to input
	QRReader.webcam.addEventListener("play", function (ev) {
		if (!streaming) {
			QRReader.canvas.width = window.innerWidth;
			QRReader.canvas.height = window.innerHeight;
			streaming = true;
		}
	}, false);

	// Start capturing video only
	function startCapture(constraints) {
		// Start video capturing
		navigator.mediaDevices.getUserMedia(constraints)
			.then(function (stream) {
				document.querySelector("video").srcObject = stream;
			})
			.catch(function(err) {
				showErrorMsg();
			});
	}

	function showErrorMsg() {
		document.querySelector('.custom-btn').style.display = "none"; //Hide scan button, if error
		sendToastNotification('Unable to open the camera, provide permission to access the camera', 5000);
	}

	// Firefox lets users choose their camera, so no need to search for an environment
	// facing camera
	if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
		startCapture({ video: true });
	else {
		navigator.mediaDevices.enumerateDevices()
			.then(function (devices) {
				var device = devices.filter(function(device) {
		      var deviceLabel = device.label.split(',')[1];
					if (device.kind == "videoinput") {
						return device;
					}
		    });

				if (device.length > 1) {
					var constraints = {
						video: {
							mandatory: {
								sourceId: device[1].deviceId ? device[1].deviceId : null
							}
						},
						audio: false
					};

					startCapture(constraints);
				}
				else if (device.length) {
					var constraints = {
						video: {
							mandatory: {
								sourceId: device[0].deviceId ? device[0].deviceId : null
							}
						},
						audio: false
					};

					startCapture(constraints);
				}
				else {
					startCapture({video:true});
				}
			})
			.catch(function (error) {
				showErrorMsg();
			});
	}
}

/**
 * \brief QRReader Scan Action
 * Call this to start scanning for QR codes.
 *
 * \param A function(scan_result)
 */
QRReader.scan = function (callback) {
	QRReader.active = true
	function onDecoderMessage(e) {
		if (e.data.length > 0) {
			var qrid = e.data[0][2];
			QRReader.active = false
			callback(qrid);
		}
		setTimeout(newDecoderFrame, 0);
	}
	QRReader.decoder.onmessage = onDecoderMessage;

	// Start QR-decoder
	function newDecoderFrame() {
		if (!QRReader.active) return;
		try {
			QRReader.ctx.drawImage(QRReader.webcam, 0, 0,
				QRReader.canvas.width, QRReader.canvas.height);
			var imgData = QRReader.ctx.getImageData(0, 0, QRReader.canvas.width,
				QRReader.canvas.height);

			if (imgData.data) {
				QRReader.decoder.postMessage(imgData);
			}
		} catch(e) {
			// Try-Catch to circumvent Firefox Bug #879717
			if (e.name == "NS_ERROR_NOT_AVAILABLE") setTimeout(newDecoderFrame, 0);
		}
	}
	newDecoderFrame();
}
