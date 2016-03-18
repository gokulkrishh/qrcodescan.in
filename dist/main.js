
function isURL(url) {
  var regExp = new RegExp('^(?:[a-z]+:)?//', 'i');
  return regExp.test(url);
}

QRReader.init("#webcam");

var btn = document.querySelector('.custom-btn');
var openBtn = document.querySelector('.open-btn');
var dialog = document.querySelector('dialog');

//Close event
dialog.querySelector('.close-btn').addEventListener('click', function() {
  dialog.close();
});

//Close event
dialog.querySelector('.copy-btn').addEventListener('click', function(event) {
  var result = document.querySelector('#result').value;
  console.log("QR code: ", result);
  try {
    var isCopied = document.execCommand('copy');
    if (isCopied) {
      var msg = 'Result is copied to the clipboard';
      sendToastNotification(msg, 3000);
      dialog.close();
    }
    else {
      sendToastNotification('Oops, unable to copy to clipboard', 2000);
    }
  }
  catch (err) {
    console.log('Oops, unable to copy to clipboard', err);
  }
});

//Fab scan btn
btn.addEventListener('click', function () {
  scan();
});

var copiedText = null;

//To open scanner url in browser
function openInBrowser(event) {
  window.location = copiedText;
}

//To scan QR code
function scan() {
  sendToastNotification('Scanning please wait...', 1000);

  QRReader.scan(function (result) {
    var msg, textBoxEle, copyTextBtn;
    textBoxEle = document.querySelector('#result');
    copyTextBtn = document.querySelector('.copy-btn');
    textBoxEle.value = result;
    textBoxEle.select();
    copiedText = result;

    var msg = 'Result is copied to the clipboard';
    if (!isURL(result)) {
      sendToastNotification(msg, 3000);
      modal.showDialog();
    }
    else {
      sendToastNotification(msg, 4000, 'open', openInBrowser);
    }
  });
}
