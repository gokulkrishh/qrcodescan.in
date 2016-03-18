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
			QRReader.canvas.width = 600;
			QRReader.canvas.height = Math.ceil(600 / QRReader.webcam.clientWidth *
				QRReader.webcam.clientHeight);
			streaming = true;
		}
	}, false);

	// Start capturing video only
	function startCapture(constraints) {
		if (!constraints) {
			constraints = {
				video: {
					mandatory: {
						sourceId: null
					}
				},
				audio: false
			};
		}
		// Start video capturing
		navigator.mediaDevices.getUserMedia(constraints)
			.then(function (stream) {
				QRReader.webcam.src = window.URL.createObjectURL(stream);
			})
			.catch(function(err) {
				console.log("Error in navigator.getUserMedia: " + err);
			});
	}

	// Firefox lets users choose their camera, so no need to search for an environment
	// facing camera
	if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
		startCapture(null);
	else {
		navigator.mediaDevices.enumerateDevices()
			.then(function (devices) {
				var found_env_cam = false;
				devices.forEach(function(device) {
		      console.log(device.kind + " : " + device.label + " id = " + device.deviceId);
					var deviceLabel = device.label.split(',')[1];
					if (device.kind == "videoinput" && deviceLabel == " facing back") {
						var constraints = {
							video: {
								mandatory: {
									sourceId: device.deviceId ? device.deviceId : undefined
								}
							},
							audio: false
						};
						startCapture(constraints);
						found_env_cam = true;
					}
		    });

				// If no specific environment camera is found (non-smartphone), user chooses
				if (!found_env_cam) startCapture(null);
			})
			.catch(function (error) {
				console.error("Error occurred : ", error);
			});
		//Below code is deprecated: https://www.chromestatus.com/feature/4765305641369600
		// MediaStreamTrack.getSources(function (sources) {
		// 	var found_env_cam = false;
		// 	for (var i = 0; i < sources.length; i++) {
		// 		if (sources[i].kind == "video" && sources[i].facing == "user") {
		// 			var constraints = {optional: [{sourceId: sources[i].id}]};
		// 			startCapture(constraints);
		//
		// 			found_env_cam = true;
		// 		}
		// 	}
		//
		// 	// If no specific environment camera is found (non-smartphone), user chooses
		// 	if (!found_env_cam) startCapture(null);
		// });
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
