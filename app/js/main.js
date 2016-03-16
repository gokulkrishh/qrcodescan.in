
function isURL(url) {
    var strRegex = "^((https|http|ftp|rtsp|mms)?://)"
        + "?(([0-9a-z_!~*'().&=+$%-]+: )?[0-9a-z_!~*'().&=+$%-]+@)?" //ftp的user@
        + "(([0-9]{1,3}\.){3}[0-9]{1,3}" // IP形式的URL- 199.194.52.184
        + "|" // 允许IP和DOMAIN（域名）
        + "([0-9a-z_!~*'()-]+\.)*" // 域名- www.
        + "([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\." // 二级域名
        + "[a-z]{2,6})" // first level domain- .com or .museum
        + "(:[0-9]{1,4})?" // 端口- :80
        + "((/?)|" // a slash isn't required if there is no file name
        + "(/[0-9a-z_!~*'().;?:@&=+$,%#-]+)+/?)$";
     var re=new RegExp(strRegex);
     return re.test(url);
 }
QRReader.init("#webcam");

var btn = document.querySelector('.custom-btn');
var openBtn = document.querySelector('.open-btn');

var dialog = document.querySelector('dialog');

//Close event
dialog.querySelector('.close-btn').addEventListener('click', function() {
  dialog.close();
});

//Dialog to show if copy to clipboard fails
dialog.querySelector('.open-btn').addEventListener('click', function() {
  window.location = textBox.value;
  dialog.close();
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
    var msg, textBoxEle;
    textBoxEle = document.querySelector('#result');
    textBoxEle.value = result;
    textBoxEle.select();
    copiedText = result;

    try {
      var successful = document.execCommand('copy');
      msg = successful ? 'successful' : 'unsuccessful';
      console.log("QR code: ", result);
    }
    catch (err) {
      console.log('Oops, unable to copy to clipboard', err);
    }

    if (msg) {
      if (!isURL(result)) {
        sendToastNotification('Result is copied to the clipboard', 3000);
      }
      else {
        sendToastNotification('Result is copied to the clipboard', 4000, 'open', openInBrowser);
      }
    }
    else {
      sendToastNotification('Oops, unable to copy to clipboard', 3000);
    }
  });
}
