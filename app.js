var express = require('express');
var app = express();
var gpio = require('rpi-gpio');
var path = require('path');

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

var groups = [
  {
    "room": "Salon",
    "items": [
      {
        "id": 0,
        "type": "light",
        "description": "Żyrandol",
        "state": false,
        "pin": 7
      },
      {
        "id": 1,
        "type": "light",
        "description": "Kinkiet",
        "state": false,
        "pin": 11
      },
      {
        "id": 2,
        "type": "temp",
        "description": "Powietrze",
        "temp": 23
      },
      {
        "id": 3,
        "type": "temp",
        "description": "Mini lodówka",
        "temp": 7
      }
    ]
  },
  {
    "room": "Kuchnia",
    "items": [
      {
        "id": 4,
        "type": "light",
        "description": "Lampka",
        "state": false,
        "pin": 13
      },
      {
        "id": 5,
        "type": "temp",
        "description": "Powietrze",
        "temp": 27
      }
    ]
  },
  {
    "room": "Pokój",
    "items": [
      {
        "id": 6,
        "type": "light",
        "description": "Lampka",
        "state": false,
        "pin": 7
      }
    ]
  },
    {
    "room": "Sypialnia",
    "items": [
      {
        "id": 7,
        "type": "light",
        "description": "Światło",
        "state": false,
        "pin": 7
      },
      {
        "id": 8,
        "type": "light",
        "description": "Światło",
        "state": false,
        "pin": 7
      }
    ]
  },
    {
    "room": "Lazienka",
    "items": [
      {
        "id": 9,
        "type": "light",
        "description": "Światło",
        "state": false,
        "pin": 7
      },
      {
        "id": 10,
        "type": "temp",
        "description": "Powierze",
        "temp": 22
      }
    ]
  },
    {
    "room": "Przedpokój",
    "items": [
      {
        "id": 11,
        "type": "light",
        "description": "Lewe",
        "state": false,
        "pin": 7
      },
      {
        "id": 12,
        "type": "light",
        "description": "Prawe",
        "state": false,
        "pin": 7
      }
    ]
  }
];

gpio.setup(7, gpio.DIR_OUT);
gpio.setup(11, gpio.DIR_OUT);
gpio.setup(13, gpio.DIR_OUT, setOff);

function setOff(){
  for(g in groups){
    for(i in groups[g].items){
      let item = groups[g].items[i];
      if(item.type == "light")switchPin(item.pin, false);
      else continue;
      console.log('SETUP | L | SET pin ' + item.pin + ' OFF');
    }
  }
}

//Switch light
function switchPin(pin, newState){
  gpio.write(pin, newState, function(err){
    if(err) throw err;
    console.log('L | Switched pin ' + pin + ' to '+ (newState?"ON":"OFF"));
  });
}

//Send all data
app.get('/byRoom', function(req, res){
  console.log("SENT all by ROOM");
  res.json(groups);

});


//Send state of light by ID
app.get('/lights/:id', function (req, res){
  for(g in groups){
    for(i in groups[g].items){
      let item = groups[g].items[i];
      if(item.id == req.params.id){
        console.log('L | SENT state of pin ' + item.pin + ' which is ' + (item.state?"ON":"OFF"));
        res.json(item.state);
        return 0;
      }
    }
  }  
});

//Switch light by ID
app.get('/lights/switch/id/:id', function (req, res){
  for(g in groups){
    for(i in groups[g].items){
      let item = groups[g].items[i];
      if(item.id == req.params.id){
        console.log('L | GOT switch request on pin ' + item.pin + ' to ' + (newState?"ON":"OFF"));
        var oldState = item.state; 
        var newState = !oldState;

        switchPin(item.pin, newState);
        item.state = newState;

        res.json({state: newState});
        return 0;
      }
    }
  }  
});

//Switch lights off by room
app.get('/lights/switch/room/:id', function (req, res){
  let items = groups[req.params.id].items;
  for(i in items){
    if(items[i].type != "light") continue;
    switchPin(items[i].pin, false);
    items[i].state = false;
  }

  console.log("L | Switched lights in " + groups[req.params.id].room + " OFF");
  res.json({success: true});
});

//Switch all lights off
app.get('/lights/switch/off', function(req, res){
  for(g in groups){
    for(i in groups[g].items){
      let item = groups[g].items[i];
      if(item.type == "light"){
        switchPin(item.pin, false);
        item.state = false;
      }
    }
  }
  res.json({success: true});
});

//Server ------
var server = app.listen(3000, function (){
  var host = server.address().address;
  var port = server.address().port;
  console.log('Listening at http://%s:%s', host, port);
});


/* TODO:

*/