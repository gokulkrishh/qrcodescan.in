import QRReader from './vendor/qrscan.js';
import {snackbar} from './snackbar.js';
import styles from '../css/styles.css';
import isURL from 'is-url';

if (process.env.NODE_ENV === 'production') {
  require('offline-plugin/runtime').install(); //To generate sw.js file
}

window.addEventListener("DOMContentLoaded", () => {
  //To check the device and add iOS support
  window.iOS = ['iPad', 'iPhone', 'iPod'].indexOf(navigator.platform) >= 0;
  
  var copiedText = null;
  var scanBtnElement = document.querySelector('.custom-btn');
  var dialogElement = document.querySelector('.app__dialog');
  var dialogOverlayElement = document.querySelector('.app__dialog-overlay');
  var dialogOpenBtnElement = document.querySelector('.app__dialog-open');
  var dialogCloseBtnElement = document.querySelector('.app__dialog-close');
  var cameraIcon = document.querySelector('.camera__icon');
  var focusIcon = document.querySelector('.focus__icon');
  var scanningEle = document.querySelector('.custom-scanner');
  var textBoxEle = document.querySelector('#result');
  var helpText = document.querySelector('.app__help-text');
  var infoSvg = document.querySelector('.app__header-icon svg');
  window.appOverlay = document.querySelector('.app__overlay');
  var frame = null;
  
  function createFrame() {
    frame = document.createElement('img');
    frame.src = '';
    frame.id = 'frame';
  }
  
  //Dialog close btn event
  dialogCloseBtnElement.addEventListener('click', hideDialog, false);
  dialogOpenBtnElement.addEventListener('click', openInBrowser, false);

  //To open result in browser
  function openInBrowser() {
    console.log('Result: ', copiedText);
    window.open(copiedText, '_blank', 'toolbar=0,location=0,menubar=0');
    copiedText = null;
  }

  //Add scan funz to fab button, if its other iOS
  if (!window.iOS) {
    focusIcon.style.display = 'block';
    //Fab btn to scan
    scanBtnElement.addEventListener('click',  () => {
      snackbar.show('Scanning please wait...', 3000);
      scanningEle.style.display = 'block';
      scan();
    });
  }
  else if (window.iOS) {
    cameraIcon.style.display = 'block';
    createFrame();
  }

  //Scan
  function scan() {
    QRReader.scan((result) => {
      copiedText = result;
      textBoxEle.value = result;
      textBoxEle.select();
      scanningEle.style.display = 'none';
      if (isURL(result)) {
        dialogOpenBtnElement.style.display = 'inline-block';
      }
      dialogElement.classList.remove('app__dialog--hide');
      dialogOverlayElement.classList.remove('app__dialog--hide');
    });
  }

  //Hide dialog
  function hideDialog() {
    copiedText = null;
    textBoxEle.value = "";

    if (window.iOS) {
      frame.src = "";
      frame.className = "";
    }

    dialogElement.classList.add('app__dialog--hide');
    dialogOverlayElement.classList.add('app__dialog--hide');
  }

  //If its iOS, then remove the video element and camera element.
  if (window.iOS) {
    document.querySelector('video').remove(); //removing the video element
    //Creating the camera element
    var camera = document.createElement('input');
    camera.setAttribute('type', 'file');
    camera.setAttribute('capture', 'camera');
    camera.id = 'camera';

    
    helpText.textContent = 'Press the below icon to take or load picture.'
    helpText.style.color = '#212121';
    helpText.style.bottom = '-60px';
    infoSvg.style.fill = '#212121';

    window.appOverlay.style.borderStyle = '';

    //Add the camera and img element to DOM
    var pageContentElement = document.querySelector('.app__layout-content');
    pageContentElement.appendChild(camera);
    pageContentElement.appendChild(frame);

    
    // Set camera overlay size
    setCameraOverlay();
    
    //On camera change
    camera.addEventListener('change', (event) => {
      if (event.target && event.target.files.length > 0) {
        frame.className = 'app__overlay';
        frame.src = URL.createObjectURL(event.target.files[0]);
        snackbar.show('Scanning please wait...', 3000);
        scanningEle.style.display = 'block';
        scan();
      }
    });

    //Click of camera fab icon
    scanBtnElement.addEventListener('click', () => {
      scanningEle.style.display = 'none';
      document.querySelector("#camera").click();
    });
  }
});

function setCameraOverlay() {
  window.appOverlay.style.borderStyle = 'solid';
}

//Initializing qr scanner
window.addEventListener('load', (event) => {
  QRReader.init(); //To initialize QR Scanner
  // Set camera overlay size
  setCameraOverlay();
});

//If service worker is installed, show offline usage notification
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    if (!localStorage.getItem("offline")) {
      localStorage.setItem("offline", true);
      snackbar.show('App is ready for offline usage.', 5000);
    }
  });
}
