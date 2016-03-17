var express = require("express");
var bodyParser = require("body-parser");
var app = express();

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//To server static assests in root dir
app.use(express.static(__dirname + '/dist/'));

//To allow cross origin request
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//To server index.html page
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/dist/index.html");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Local Server : http://localhost:8000");
});
