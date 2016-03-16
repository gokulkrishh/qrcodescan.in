
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
var textBox = document.querySelector('.mdl-textfield__input');
var openBtn = document.querySelector('.open-btn');

var dialog = document.querySelector('dialog');

//Close event
dialog.querySelector('.close-btn').addEventListener('click', function() {
  dialog.close();
});

//Dialog to show if copy to clipboard fails
dialog.querySelector('.open-btn').addEventListener('click', function() {
  if (isURL(textBox.value)) {
    window.location = textBox.value;
  }
  else {

  }
});

//Fab scan btn
btn.addEventListener('click', function () {
  scan();
});

//To scan QR code
function scan() {
  sendToastNotification('Scanning please wait...', 1000, '#toast-notification');

  QRReader.scan(function (result) {
    textBox.value = result;
    textBox.focus();
    textBox.select();
    try {
      var isCopied = document.execCommand('copy');
      var msg = isCopied ? 'Result is copied to the clipboard' : 'Oops, unable to copy the result';
      sendToastNotification(msg, 3000);
      console.log("QR code: ", result);
      if (!isCopied) {
        if (!isURL(result)) {
          openBtn.classList.add('hide');
        }
        else {
          openBtn.classList.remove('hide');
        }
        dialog.showModal();
      }
    }
    catch (err) {
      sendToastNotification('Oops, unable to copy the result', 3000);
      console.log("Error in copying QR code: ", err);
    }
  });
}
