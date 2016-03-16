// var Quagga = require('quagga');
//
// var btn = document.querySelector('.custom-btn');
//
// btn.addEventListener('click', function () {
//   accessCamera();
// });
//
// function accessCamera() {
//   Quagga.init(
//     {
//       inputStream: {
//         type : "LiveStream",
//         target: document.querySelector('#qr-code'),
//         constraints: {
//           width: 640,
//           height: 480,
//           facing: "environment" // or user
//         }
//       },
//       locator: {
//         patchSize: "medium",
//         halfSample: true
//       },
//       numOfWorkers: 4,
//       decoder: {
//         readers : ["code_128_reader"]
//       },
//       locate: true
//     },
//     function(err) {
//       if (err) {
//         console.log(err);
//         return
//       }
//       alert('Initialization finished. Ready to start');
//       // Quagga.start();
//   });
// }
