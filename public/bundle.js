'use strict';

var snackbar = {};
var snackBarElement = document.querySelector(".app__snackbar");
var snackbarMsg = null;

//To show notification
snackbar.show = (msg, options = 4000) => {
	if (!msg) return;

	if (snackbarMsg) {
		snackbarMsg.remove();
	}

	snackbarMsg = document.createElement("div");
	snackbarMsg.className = "app__snackbar-msg";
	snackbarMsg.textContent = msg;
	snackBarElement.appendChild(snackbarMsg);

	//Show toast for 3secs and hide it
	setTimeout(() => {
		snackbarMsg.remove();
	}, options);
};

var QRReader = {};

QRReader.active = false;
QRReader.webcam = null;
QRReader.canvas = null;
QRReader.ctx = null;
QRReader.decoder = null;

QRReader.setCanvas = () => {
	QRReader.canvas = document.createElement("canvas");
	QRReader.ctx = QRReader.canvas.getContext("2d");
};

function setPhotoSourceToScan(forSelectedPhotos) {
	if (!forSelectedPhotos && window.isMediaStreamAPISupported) {
		QRReader.webcam = document.querySelector("video");
	} else {
		QRReader.webcam = document.querySelector("img");
	}
}

QRReader.init = () => {
	var baseurl = "";
	var streaming = false;

	// Init Webcam + Canvas
	setPhotoSourceToScan();

	QRReader.setCanvas();
	QRReader.decoder = new Worker(baseurl + "decoder.js");

	if (window.isMediaStreamAPISupported) {
		// Resize webcam according to input
		QRReader.webcam.addEventListener(
			"play",
			function (ev) {
				if (!streaming) {
					setCanvasProperties();
					streaming = true;
				}
			},
			false
		);
	} else {
		setCanvasProperties();
	}

	function setCanvasProperties() {
		QRReader.canvas.width = window.innerWidth;
		QRReader.canvas.height = window.innerHeight;
	}

	function startCapture(constraints) {
		navigator.mediaDevices
			.getUserMedia(constraints)
			.then(function (stream) {
				QRReader.webcam.srcObject = stream;
				QRReader.webcam.setAttribute("playsinline", true);
				QRReader.webcam.setAttribute("controls", true);
				setTimeout(() => {
					document.querySelector("video").removeAttribute("controls");
				});
			})
			.catch(function (err) {
				console.log("Error occurred ", err);
				showErrorMsg();
			});
	}

	if (window.isMediaStreamAPISupported) {
		navigator.mediaDevices
			.enumerateDevices()
			.then(function (devices) {
				var device = devices.filter(function (device) {
					device.label.split(",")[1];
					if (device.kind == "videoinput") {
						return device;
					}
				});

				var constraints;
				if (device.length > 1) {
					constraints = {
						video: {
							mandatory: {
								sourceId: device[device.length - 1].deviceId ? device[device.length - 1].deviceId : null,
							},
						},
						audio: false,
					};

					if (window.iOS) {
						constraints.video.facingMode = "environment";
					}
					startCapture(constraints);
				} else if (device.length) {
					constraints = {
						video: {
							mandatory: {
								sourceId: device[0].deviceId ? device[0].deviceId : null,
							},
						},
						audio: false,
					};

					if (window.iOS) {
						constraints.video.facingMode = "environment";
					}

					if (!constraints.video.mandatory.sourceId && !window.iOS) {
						startCapture({ video: true });
					} else {
						startCapture(constraints);
					}
				} else {
					startCapture({ video: true });
				}
			})
			.catch(function (error) {
				showErrorMsg();
				console.error("Error occurred : ", error);
			});
	}

	function showErrorMsg() {
		window.noCameraPermission = true;
		document.querySelector(".custom-scanner").style.display = "none";
		snackbar.show("Unable to access the camera", 10000);
	}
};

/**
 * \brief QRReader Scan Action
 * Call this to start scanning for QR codes.
 *
 * \param A function(scan_result)
 */
QRReader.scan = function (callback, forSelectedPhotos) {
	QRReader.active = true;
	QRReader.setCanvas();
	function onDecoderMessage(event) {
		if (event.data.length > 0) {
			var qrid = event.data[0][2];
			QRReader.active = false;
			callback(qrid);
		}
		setTimeout(newDecoderFrame, 0);
	}

	QRReader.decoder.onmessage = onDecoderMessage;

	setTimeout(() => {
		setPhotoSourceToScan(forSelectedPhotos);
	});

	// Start QR-decoder
	function newDecoderFrame() {
		if (!QRReader.active) return;
		try {
			QRReader.ctx.drawImage(QRReader.webcam, 0, 0, QRReader.canvas.width, QRReader.canvas.height);
			var imgData = QRReader.ctx.getImageData(0, 0, QRReader.canvas.width, QRReader.canvas.height);

			if (imgData.data) {
				QRReader.decoder.postMessage(imgData);
			}
		} catch (e) {
			// Try-Catch to circumvent Firefox Bug #879717
			if (e.name == "NS_ERROR_NOT_AVAILABLE") setTimeout(newDecoderFrame, 0);
		}
	}
	newDecoderFrame();
};

const isURL = (url = "") => {
	if (!url || typeof url !== "string") {
		return false;
	}

	const protocol = "^(https?:\\/\\/)?";
	const domain = "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|";
	const ip = "((\\d{1,3}\\.){3}\\d{1,3}))";
	const port = "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*";
	const queryString = "(\\?[;&a-z\\d%_.~+=-]*)?";
	const fragmentLocater = "(\\#[-a-z\\d_]*)?$";

	const regex = new RegExp(`${protocol + domain + ip + port + queryString + fragmentLocater}`, "i");

	return regex.test(url);
};

const hasProtocolInUrl = (url = "") => {
	const protocol = "^(https?:\\/\\/)";
	const regex = new RegExp(protocol, "i");
	return regex.test(url);
};

var e=[],t=[];function n(n,r){if(n&&"undefined"!=typeof document){var a,s=!0===r.prepend?"prepend":"append",d=!0===r.singleTag,i="string"==typeof r.container?document.querySelector(r.container):document.getElementsByTagName("head")[0];if(d){var u=e.indexOf(i);-1===u&&(u=e.push(i)-1,t[u]={}),a=t[u]&&t[u][s]?t[u][s]:t[u][s]=c();}else a=c();65279===n.charCodeAt(0)&&(n=n.substring(1)),a.styleSheet?a.styleSheet.cssText+=n:a.appendChild(document.createTextNode(n));}function c(){var e=document.createElement("style");if(e.setAttribute("type","text/css"),r.attributes)for(var t=Object.keys(r.attributes),n=0;n<t.length;n++)e.setAttribute(t[n],r.attributes[t[n]]);var a="prepend"===s?"afterbegin":"beforeend";return i.insertAdjacentElement(a,e),e}}

var css = "/*! minireset.css v0.0.2 | MIT License | github.com/jgthms/minireset.css */\nhtml,\nbody,\np,\nol,\nul,\nli,\ndl,\ndt,\ndd,\nblockquote,\nfigure,\nfieldset,\nlegend,\ntextarea,\npre,\niframe,\nhr,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n\tmargin: 0;\n\tpadding: 0;\n}\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n\tfont-size: 100%;\n\tfont-weight: normal;\n}\nul {\n\tlist-style: none;\n}\nbutton,\ninput,\nselect,\ntextarea {\n\tmargin: 0;\n}\nhtml {\n\tbox-sizing: border-box;\n}\n*,\n*:before,\n*:after {\n\tbox-sizing: inherit;\n}\nimg,\nembed,\nobject,\naudio {\n\theight: auto;\n\tmax-width: 100%;\n}\niframe {\n\tborder: 0;\n}\ntable {\n\tborder-collapse: collapse;\n\tborder-spacing: 0;\n}\ntd,\nth {\n\tpadding: 0;\n\ttext-align: left;\n}\n\nbody {\n\tfont-family: Roboto, Helvetica, Arial, sans-serif;\n\t-webkit-font-smoothing: antialiased;\n}\n\n.app__layout {\n\tposition: absolute;\n\twidth: 100%;\n\theight: 100%;\n\toverflow: hidden;\n\tbackground-color: rgba(0, 0, 0, 0.5);\n}\n\n.app__header {\n\twidth: 100%;\n\theight: 56px;\n\tcolor: #fff;\n\tdisplay: flex;\n\t-webkit-box-align: center;\n\t-ms-flex-align: center;\n\talign-items: center;\n\tposition: fixed;\n\ttop: 0;\n\tleft: 0;\n\tright: 0;\n\tz-index: 10;\n}\n\n.app__header-icon {\n\twidth: 35px;\n\theight: 35px;\n\tdisplay: -webkit-box;\n\tdisplay: -ms-flexbox;\n\tdisplay: flex;\n\t-webkit-box-align: center;\n\t-ms-flex-align: center;\n\talign-items: center;\n\t-webkit-box-pack: center;\n\t-ms-flex-pack: center;\n\tjustify-content: center;\n\tcursor: pointer;\n\tposition: absolute;\n\tright: 20px;\n\ttop: 20px;\n}\n\n.app__header-icon:active {\n\topacity: 0.8;\n}\n\n.app__header-title {\n\tmargin-left: 5px;\n\tfont-size: 19px;\n\tuser-select: none;\n}\n\n.app__layout-content {\n\theight: inherit;\n\t/*margin-top: 56px;*/\n}\n\n.custom-menu-icon {\n\tfont-size: 28px;\n\tline-height: 47px;\n}\n\n.custom-title,\n.custom-menu-icon {\n\tcolor: #fff;\n}\n\n.custom-btn {\n\tposition: fixed;\n\tright: 26px;\n\tbottom: 26px;\n\tbackground: #448aff;\n\tborder-radius: 50%;\n\tborder: none;\n\twidth: 56px;\n\theight: 56px;\n\toutline: none;\n\tbox-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 1px 5px 0 rgba(0, 0, 0, 0.12);\n\tz-index: 9999;\n}\n\n.custom-btn:active {\n\tbox-shadow: none;\n}\n\n.custom-msg {\n\ttext-align: center;\n\twidth: 90%;\n\theight: 50%;\n\toverflow: auto;\n\tmargin: auto;\n\tposition: absolute;\n\ttop: 0;\n\tleft: 0;\n\tbottom: 0;\n\tright: 0;\n\tfont-size: 16px;\n}\n\n.custom-fab-icon {\n\tcolor: #fff;\n\tfont-size: 30px;\n\tmargin-top: 2px;\n\tuser-select: none;\n}\n\nvideo {\n\ttransform: translateX(-50%) translateY(-50%);\n\ttop: 50%;\n\tleft: 50%;\n\tmin-width: 100%;\n\tmin-height: 100%;\n\twidth: auto;\n\theight: auto;\n\tposition: absolute;\n}\n\n#list li {\n\tlist-style-type: none;\n\ttext-decoration: underline;\n\tcolor: #00f;\n}\n\n.custom-copy-btn {\n\topacity: 0;\n}\n\n.hide {\n\tdisplay: none;\n}\n\n@-webkit-keyframes scanner {\n\t0% {\n\t\tbottom: 100%;\n\t}\n\t50% {\n\t\tbottom: 0%;\n\t}\n\t100% {\n\t\tbottom: 100%;\n\t}\n}\n\n@-moz-keyframes scanner {\n\t0% {\n\t\tbottom: 100%;\n\t}\n\t50% {\n\t\tbottom: 0%;\n\t}\n\t100% {\n\t\tbottom: 100%;\n\t}\n}\n\n@-o-keyframes scanner {\n\t0% {\n\t\tbottom: 100%;\n\t}\n\t50% {\n\t\tbottom: 0%;\n\t}\n\t100% {\n\t\tbottom: 100%;\n\t}\n}\n\n@keyframes scanner {\n\t0% {\n\t\tbottom: 100%;\n\t}\n\t50% {\n\t\tbottom: 0%;\n\t}\n\t100% {\n\t\tbottom: 100%;\n\t}\n}\n\n.custom-scanner {\n\twidth: 100%;\n\theight: 2px;\n\tbackground: #4caf50;\n\tposition: absolute;\n\t-webkit-transition: all 200ms linear;\n\t-moz-transition: all 200ms linear;\n\ttransition: all 200ms linear;\n\t-webkit-animation: scanner 3s infinite linear;\n\t-moz-animation: scanner 3s infinite linear;\n\t-o-animation: scanner 3s infinite linear;\n\tanimation: scanner 3s infinite linear;\n\tbox-shadow: 0 1px 0 0 rgba(0, 0, 0, 0.4);\n\tdisplay: none;\n}\n\n#camera {\n\topacity: 0;\n}\n\n.no-support {\n\tfont-size: 20px;\n\ttext-align: center;\n}\n\n.app__snackbar {\n\tposition: fixed;\n\tbottom: 15px;\n\tleft: 20px;\n\tpointer-events: none;\n\tz-index: 9999;\n}\n\n.app__snackbar-msg {\n\twidth: 250px;\n\tmin-height: 50px;\n\tbackground-color: #404040;\n\tcolor: #fff;\n\tborder-radius: 3px;\n\tbox-shadow: 0 0 2px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.24);\n\tdisplay: -webkit-box;\n\tdisplay: -ms-flexbox;\n\tdisplay: flex;\n\t-webkit-box-align: center;\n\t-ms-flex-align: center;\n\talign-items: center;\n\t-webkit-box-pack: justify;\n\t-ms-flex-pack: justify;\n\tjustify-content: space-between;\n\tfont-size: 14px;\n\tfont-weight: 500;\n\tpadding-left: 15px;\n\tpadding-right: 10px;\n\tword-break: break-all;\n\t-webkit-transition: opacity 3s cubic-bezier(0, 0, 0.3, 1) 0;\n\ttransition: opacity 0.3s cubic-bezier(0, 0, 0.3, 1) 0;\n\ttext-transform: initial;\n\tmargin-bottom: 10px;\n\tz-index: 9999;\n}\n\n.app__snackbar--hide {\n\topacity: 0;\n}\n\n.app__dialog {\n\tz-index: 12;\n\tbackground-color: #fff;\n\twidth: 290px;\n\theight: 180px;\n\tborder-radius: 2px;\n\tdisplay: flex;\n\tposition: absolute;\n\tleft: 0;\n\tright: 0;\n\tbottom: 0;\n\ttop: 0;\n\tmargin: auto;\n\tbox-shadow: 0 9px 46px 8px rgba(0, 0, 0, 0.14), 0 11px 15px -7px rgba(0, 0, 0, 0.12), 0 24px 38px 3px rgba(0, 0, 0, 0.2);\n}\n\n.app__dialog h5 {\n\tmargin-top: 20px;\n\tmargin-left: 18px;\n\tfont-weight: 500;\n}\n\n.app__dialog input {\n\twidth: 250px;\n\tmargin: 20px;\n\theight: 30px;\n\tborder: none;\n\tborder-bottom: 1px solid rgba(0, 0, 0, 0.12);\n\toutline: none;\n\tfont-size: 15px;\n\tmargin-top: 25px;\n\tcolor: rgba(0, 0, 0, 0.54);\n\tfont-weight: 500;\n}\n\n.app__dialog-actions {\n\tdisplay: block;\n\tposition: absolute;\n\tbottom: 13px;\n\tright: 20px;\n}\n\n.app__dialog-open,\n.app__dialog-close {\n\tborder: 0;\n\theight: 35px;\n\twidth: 70px;\n\tfont-size: 16px;\n\tbackground: transparent;\n\tfont-weight: 500;\n\toutline: none;\n\tcursor: pointer;\n}\n\n.app__dialog-open {\n\tdisplay: none;\n}\n\n.app__dialog-open:active,\n.app__dialog-close:active {\n\topacity: 0.9;\n}\n\n.app__dialog--hide {\n\tdisplay: none;\n}\n\n.app__overlay {\n\tposition: fixed;\n\ttop: 0;\n\tbottom: 0;\n\tright: 0;\n\tleft: 0;\n\ttransition: all 200ms ease-in;\n\twidth: 320px;\n\theight: 320px;\n\tmargin: auto;\n}\n\n.app__overlay-left,\n.app__overlay-right {\n\twidth: 52px;\n\theight: 340px;\n\tbackground: #7f7f7f;\n}\n\n.app__overlay-left {\n\tmargin-left: -57px;\n\tmargin-top: -10px;\n}\n\n.app__overlay-right {\n\tmargin-right: -57px;\n\tmargin-top: -340px;\n\tfloat: right;\n}\n\n.app__overlay {\n\tborder: 0;\n}\n\n.app__help-text,\n.app__select-photos {\n\tcolor: #fff;\n\tposition: absolute;\n\tbottom: -70px;\n\tfont-size: 18px;\n\tright: 0;\n\ttext-align: center;\n\tuser-select: none;\n}\n\n.app__help-text {\n\tdisplay: none;\n\tleft: 0;\n}\n\n.app__dialog-overlay {\n\tposition: fixed;\n\tleft: 0;\n\tright: 0;\n\tbottom: 0;\n\ttop: 0;\n\tbackground: rgba(0, 0, 0, 0.55);\n\tz-index: 11;\n}\n\n.camera__icon,\n.focus__icon {\n\tposition: relative;\n\tleft: 10px;\n\tdisplay: none;\n}\n\n.app__select-photos {\n\twidth: 58px;\n\theight: 58px;\n\tcursor: pointer;\n\tposition: fixed;\n\tbottom: 20px;\n\tright: 20px;\n\tborder-radius: 50%;\n\tbackground-color: #3f51b5;\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: center;\n}\n\n.app__select-photos:active {\n\topacity: 0.8;\n}\n\ninput[type=\"file\"] {\n\tdisplay: none;\n}\n\n#frame {\n\twidth: auto;\n\theight: auto;\n}\n";
n(css,{});

//If service worker is installed, show offline usage notification
if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker
			.register("/sw.js")
			.then((reg) => {
				if (!localStorage.getItem("offline")) {
					localStorage.setItem("offline", true);
					snackbar.show("App is ready for offline usage.", 5000);
				}
			})
			.catch((regError) => {
				console.log("SW registration failed: ", regError);
			});
	});
}

window.addEventListener("DOMContentLoaded", () => {
	//To check the device and add iOS support
	window.iOS = ["iPad", "iPhone", "iPod"].indexOf(navigator.platform) >= 0;
	window.isMediaStreamAPISupported = navigator && navigator.mediaDevices && "enumerateDevices" in navigator.mediaDevices;
	window.noCameraPermission = false;

	var copiedText = null;
	var frame = null;
	var selectPhotoBtn = document.querySelector(".app__select-photos");
	var dialogElement = document.querySelector(".app__dialog");
	var dialogOverlayElement = document.querySelector(".app__dialog-overlay");
	var dialogOpenBtnElement = document.querySelector(".app__dialog-open");
	var dialogCloseBtnElement = document.querySelector(".app__dialog-close");
	var scanningEle = document.querySelector(".custom-scanner");
	var textBoxEle = document.querySelector("#result");
	document.querySelector(".app__help-text");
	document.querySelector(".app__header-icon svg");
	document.querySelector("video");
	window.appOverlay = document.querySelector(".app__overlay");

	//Initializing qr scanner
	window.addEventListener("load", (event) => {
		QRReader.init(); //To initialize QR Scanner
		// Set camera overlay size
		setTimeout(() => {
			setCameraOverlay();
			if (window.isMediaStreamAPISupported) {
				scan();
			}
		}, 1000);

		// To support other browsers who dont have mediaStreamAPI
		selectFromPhoto();
	});

	function setCameraOverlay() {
		window.appOverlay.style.borderStyle = "solid";
	}

	function createFrame() {
		frame = document.createElement("img");
		frame.src = "";
		frame.id = "frame";
	}

	//Dialog close btn event
	dialogCloseBtnElement.addEventListener("click", hideDialog, false);
	dialogOpenBtnElement.addEventListener("click", openInBrowser, false);

	//To open result in browser
	function openInBrowser() {
		console.log("Result: ", copiedText);

		if (!hasProtocolInUrl(copiedText)) {
			copiedText = `//${copiedText}`;
		}

		window.open(copiedText, "_blank", "toolbar=0,location=0,menubar=0");
		copiedText = null;
		hideDialog();
	}

	//Scan
	function scan(forSelectedPhotos = false) {
		if (window.isMediaStreamAPISupported && !window.noCameraPermission) {
			scanningEle.style.display = "block";
		}

		if (forSelectedPhotos) {
			scanningEle.style.display = "block";
		}

		QRReader.scan((result) => {
			copiedText = result;
			textBoxEle.value = result;
			textBoxEle.select();
			scanningEle.style.display = "none";
			if (isURL(result)) {
				dialogOpenBtnElement.style.display = "inline-block";
			}
			dialogElement.classList.remove("app__dialog--hide");
			dialogOverlayElement.classList.remove("app__dialog--hide");
		}, forSelectedPhotos);
	}

	//Hide dialog
	function hideDialog() {
		copiedText = null;
		textBoxEle.value = "";

		if (!window.isMediaStreamAPISupported) {
			frame.src = "";
			frame.className = "";
		}

		dialogElement.classList.add("app__dialog--hide");
		dialogOverlayElement.classList.add("app__dialog--hide");
	}

	function selectFromPhoto() {
		//Creating the camera element
		var camera = document.createElement("input");
		camera.setAttribute("type", "file");
		camera.setAttribute("capture", "camera");
		camera.id = "camera";
		window.appOverlay.style.borderStyle = "";
		selectPhotoBtn.style.display = "flex";
		createFrame();

		//Add the camera and img element to DOM
		var pageContentElement = document.querySelector(".app__layout-content");
		pageContentElement.appendChild(camera);
		pageContentElement.appendChild(frame);

		//Click of camera fab icon
		selectPhotoBtn.addEventListener("click", () => {
			scanningEle.style.display = "none";
			document.querySelector("#camera").click();
		});

		//On camera change
		camera.addEventListener("change", (event) => {
			if (event.target && event.target.files.length > 0) {
				frame.className = "app__overlay";
				frame.src = URL.createObjectURL(event.target.files[0]);
				if (!window.noCameraPermission) scanningEle.style.display = "block";
				window.appOverlay.style.borderColor = "rgb(62, 78, 184)";
				scan(true);
			}
		});
	}
});
