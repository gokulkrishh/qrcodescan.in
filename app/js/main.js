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
  var dialogOpenBtnElement = document.querySelector('.app__dialog-open');
  var dialogCloseBtnElement = document.querySelector('.app__dialog-close');
  var scanningEle = document.querySelector('.custom-scanner');
  var textBoxEle = document.querySelector('#result');
  var menuIconElement = document.querySelector('.app__header-icon');
  var menuElement = document.querySelector('.menu');
  var menuOverlayElement = document.querySelector('.menu__overlay');
  var frame = document.createElement('img');
  frame.src = '';
  frame.id = 'frame';
  
  //Menu click event
  menuIconElement.addEventListener('click', showMenu, false);
  menuOverlayElement.addEventListener('click', hideMenu, false);

  //Dialog close btn event
  dialogCloseBtnElement.addEventListener('click', hideDialog, false);
  dialogOpenBtnElement.addEventListener('click', openInBrowser, false);

  //To open result in browser
  function openInBrowser() {
    console.log('Result: ', copiedText);
    window.open(copiedText, '_blank', 'toolbar=0,location=0,menubar=0');
    copiedText = null;
  }

  //To show menu
  function showMenu() {
    menuElement.classList.add('menu--show');
    menuOverlayElement.classList.add('menu__overlay--show');
  }

  //To hide menu
  function hideMenu() {
    menuElement.classList.remove('menu--show');
    menuOverlayElement.classList.remove('menu__overlay--show');
  }

  //Add scan funz to fab button, if its other iOS
  if (!window.iOS) {
    //Fab btn to scan
    scanBtnElement.addEventListener('click',  () => {
      snackbar.show('Scanning please wait...', 2000);
      scanningEle.style.display = 'block';
      scan();
    });
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
    });
  }

  //Hide dialog
  function hideDialog() {
    copiedText = null;
    textBoxEle.value = "";
    frame.src = "";
    dialogElement.classList.add('app__dialog--hide');
  }

  //If its iOS, then remove the video element and camera element.
  if (window.iOS) {
    document.querySelector('video').remove(); //removing the video element
    //Creating the camera element
    var camera = document.createElement('input');
    camera.setAttribute('type', 'file');
    camera.setAttribute('capture', 'camera');
    camera.id = 'camera';

    var iconElement = document.createElement('i');
    iconElement.className = 'material-icons custom-fab-icon';
    iconElement.textContent = 'camera_enhance';
    
    var noSupportText = document.createElement('h2');
    noSupportText.className = "no-support";
    noSupportText.textContent = "Press the camera icon below."

    //Add the camera and img element to DOM
    var pageContentElement = document.querySelector('.app__layout-content');
    var fabElement = document.querySelector('.custom-btn');
    var fabIconElement = document.querySelector('.custom-fab-icon');

    pageContentElement.appendChild(camera);
    pageContentElement.appendChild(frame);
    pageContentElement.appendChild(noSupportText);    

    fabElement.removeChild(fabIconElement);
    fabElement.appendChild(iconElement);

    //On camera change
    camera.addEventListener('change', (event) => {
      if (event.target && event.target.files.length > 0) {
        frame.src = URL.createObjectURL(event.target.files[0]);
        snackbar.show('Scanning please wait...', 2000);
        scanningEle.style.display = 'block';
        scan();
      }
    });

    //Click of camera fab icon
    fabElement.addEventListener('click', () => {
      scanningEle.style.display = 'none';
      document.querySelector("#camera").click();
    });
  }
});

//Initializing qr scanner
window.addEventListener('load', (event) => {
  QRReader.init(); //To initialize QR Scanner
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