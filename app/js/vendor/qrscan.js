var QRReader = {};

QRReader.active = false;
QRReader.webcam = null;
QRReader.canvas = null;
QRReader.ctx = null;
QRReader.decoder = null;

QRReader.init = function () {
	var baseurl = "";
	var streaming = false;

	// Init Webcam + Canvas
	QRReader.webcam = document.querySelector("video");
	QRReader.canvas = document.createElement("canvas");
	QRReader.ctx = QRReader.canvas.getContext("2d");
	QRReader.decoder = new Worker(baseurl + "decoder.min.js");

	// Resize webcam according to input
	QRReader.webcam.addEventListener("play", function (ev) {
		if (!streaming) {
			QRReader.canvas.width = window.innerWidth;
			QRReader.canvas.height = window.innerHeight;
			streaming = true;
		}
	}, false);

	function startCapture(constraints) {
		navigator.mediaDevices.getUserMedia(constraints)
			.then(function (stream) {
				QRReader.webcam.srcObject = stream;
			})
			.catch(function(err) {
				console.log("Error occurred ", err);
				showErrorMsg();
			});
	}

	function showErrorMsg() {
		document.querySelector('.custom-btn').style.display = "none"; //Hide scan button, if error
		sendToastNotification('Unable to open the camera, provide permission to access the camera', 5000);
	}

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
			console.error("Error occurred : ", error);
		});
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
