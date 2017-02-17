var express = require('express');
var app = express();
var gpio = require('rpi-gpio');
var path = require('path');

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

//Lights ------
var rooms = {"Salon", "Pokój", "Kuchnia", "Dwór"};
var elements = {
  "lights": [
    {
      "id": 0,
      "name": "Zólta",
      "state": false,
      "pin": 7,
      "room": "Pokój"
    },
    {
      "id": 1,
      "name": "Czerwona",
      "state": false,
      "pin": 11,
      "room": "Salon"
    },
    {
      "id": 2,
      "name": "Zielona",
      "state": false,
      "pin": 13,
      "room": "Salon"
    }
  ],
  "thermometers": [
    {
      "id": 0,
      "name": "T Salon",
      "temp": 23,
      "room": "Salon"
    },
    {
      "id": 1,
      "name": "T Dwór",
      "temp": -8.5,
      "room": "Dwór"
    },
    {
      "id": 2,
      "name": "T Woda",
      "temp": 38,
      "room": "Dwór"
    }
  ]
}

gpio.setup(7, gpio.DIR_OUT);
gpio.setup(11, gpio.DIR_OUT);
gpio.setup(13, gpio.DIR_OUT, setOff);

function setOff(){
  for(i in elements["lights"]){
    gpio.write(elements["lights"][i].pin, false, function(err){
      if(err) throw err;
    });
    console.log('SETUP | L | SET pin ' + elements["lights"][i].pin + ' OFF');
  }
}

//Switch light
function switchPin(pin, newState){
  gpio.write(pin, newState, function(err){
    if(err) throw err;
    console.log('L | Switched pin ' + pin + ' to '+ (newState?"ON":"OFF"));
  });
}

//Send state of all lights
app.get('/lights', function (req, res){
   console.log('L | SENT state of all pins');
   res.json(elements["lights"]);
});

//Send state of light by ID
app.get('/lights/:id', function (req, res){
   console.log('L | SENT state of pin ' + elements["lights"][req.params.id]["pin"] + ' which is ' + (elements["lights"][req.params.id]["state"]?"ON":"OFF"));
   res.json(elements["lights"][req.params.id]);
});

//Switch light by ID
app.get('/lights/switch/id/:id', function (req, res){
  var pin = elements["lights"][req.params.id]["pin"];
  var oldState = elements["lights"][req.params.id]["state"]; 
  var newState = !oldState;
  console.log('------------------------------------------------------');
  console.log('L | GOT switch request on pin ' + pin + ' to ' + (newState?"ON":"OFF"));

  switchPin(pin, newState);
  elements["lights"][req.params.id]["state"] = newState;

  res.json({state: newState});
});

//Switch light off by room
app.get('/lights/switch/room/:room', function (req, res){
  for(i in elements["lights"]){
    if(elements["lights"][i].room == req.params.room){
      switchPin(elements["lights"][i].pin, false);
      elements["lights"][i]["state"] = false;
    }
  }
  console.log("L | Switched lights in " + [req.params.room] + " OFF");
  res.json({success: true});
});

//Switch all lights off
app.get('/lights/switch/off', function(req, res){
  for(i in elements["lights"]){
    switchPin(elements["lights"][i].pin, false);
    elements["lights"][i]["state"] = false;
  }
  console.log('L | Switched all light OFF');
  res.json({success: true});    
});

//Send all temperatures
app.get('/temp', function(req, res){
  console.log('T | SENT all temps');
  res.json(elements["thermometers"]);
});

app.get('/temp/:id', function(req, res){
  if(elements["thermometers"][req.params.id] === "undefined"){
    res.status(404).json({error: "Thermometer " + req.params.id + " not found"});
  }else{
      var temp = elements["thermometers"][req.params.id].temp;
      console.log('T | SEND temp of ' + elements["thermometers"][req.params.id].name + ': ' + elements["thermometers"][req.params.id].temp);
      res.json(elements["thermometers"][req.params.id]);
  }    
});


//ALL
app.get('/all', function(req, res){
  console.log('TL | SENT ALL');
  res.json(elements);
});

//Rooms
app.get('/rooms', function(req, res){
  console.log('R | SENT list of rooms');
  res.json(rooms);
});

//Server ------
var server = app.listen(3000, function (){
  var host = server.address().address;
  var port = server.address().port;
  console.log('Listening at http://%s:%s', host, port);
});


/* FUTURE:
+ Change /switch/:id to /switch/id/:id
+ Change /switch to /switch/off

Add checking if array index :id exists eg. "typeof light[0].pin !== 'undefined'"
*/