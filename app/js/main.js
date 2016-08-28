
//To check result is url or not
function isURL(url) {
  var regExp = new RegExp('^(?:[a-z]+:)?//', 'i');
  return regExp.test(url);
}

//Initializing qr scanner
window.addEventListener("load", function(event) {
  QRReader.init();
});

var btn = document.querySelector('.custom-btn');
var openBtn = document.querySelector('.open-btn');
var dialog = document.querySelector('#dialog');
var scanningEle = document.querySelector('.custom-scanner');
var textBoxEle = document.querySelector('#result');
var copiedText = null;

//Close event
dialog.querySelector('.close-btn').addEventListener('click', function() {
  dialog.close();
});

//Fab btn to scan
btn.addEventListener('click', function () {
  sendToastNotification('Scanning please wait...', 3000);
  toggleScanner(true);
  QRReader.scan(function (result) {
    copiedText = result;
    textBoxEle.value = result;
    textBoxEle.select();
    toggleScanner();
    if (isURL(result)) {
      sendToastNotification('Open the result in your browser', 5000, 'open', openInBrowser);
    }
    else {
      dialog.showModal();
    }
  });
});

//To open scanner url in browser
function openInBrowser(event) {
  console.log('Result: ', copiedText);
  window.open(copiedText, '_blank', 'toolbar=0,location=0,menubar=0');
  copiedText = null;
}

//To show/hide scanner
function toggleScanner(isScanner) {
  if (isScanner) {
    scanningEle.style.display = 'block';
  }
  else {
    scanningEle.style.display = 'none';
  }
}
