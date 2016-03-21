
function isURL(url) {
  var regExp = new RegExp('^(?:[a-z]+:)?//', 'i');
  return regExp.test(url);
}

QRReader.init("#webcam");

var btn = document.querySelector('.custom-btn');
var openBtn = document.querySelector('.open-btn');
var dialog = document.querySelector('#dialog');

//Close event
dialog.querySelector('.close-btn').addEventListener('click', function() {
  dialog.close();
});

//Fab scan btn
btn.addEventListener('click', function () {
  scan();
});

var copiedText = null;

//To open scanner url in browser
function openInBrowser(event) {
  window.open(copiedText, '_blank', '');
}

//To scan QR code
function scan() {
  sendToastNotification('Scanning please wait...', 3000);

  QRReader.scan(function (result) {
    var msg, textBoxEle, copyTextBtn;
    textBoxEle = document.querySelector('#result');
    copyTextBtn = document.querySelector('.copy-btn');
    textBoxEle.value = result;
    textBoxEle.select();
    copiedText = result;

    if (!isURL(result)) {
      dialog.showModal();
    }
    else {
      sendToastNotification('Open the result in your browser', 5000, 'open', openInBrowser);
    }
  });
}
