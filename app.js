var express = require('express');
var app = express();
var gpio = require('rpi-gpio');
var path = require('path');
var mongo = require('mongodb').MongoClient;
var assert = require('assert');

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

//Better console logging
var counter = 1;
var lastLog = "";
function logUpdate(text) {
  if(text == lastLog){
    counter++;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(text + " | x" + counter);
  }else{
    counter = 1;
    process.stdout.write("\n" + text);
  }
  lastLog = text;
}

var url = 'mongodb://192.168.100.254:27017/mHome';
var db;

var lights, temps, rooms;
function setupDB() {
  mon = {rooms, lights, temps};

  //Rooms -----------
  mon.rooms = {
    collection: db.collection('rooms'),
    getList: function (callback) {
      this.collection.find({},{"_id": 0}).toArray(function(err, data) {
        logUpdate("MongoDB | Get rooms list");
        callback(data);
      });
    },
    getName: function (id, callback) {
      this.collection.findOne({"id": parseInt(id)}, {"_id": 0}, function(err, data) {
        var name = data.name;
        logUpdate("MongoDB | Get room data (ID: " + id + ")");
        callback(name);
      });
    }
  };

  //Light  -----------
  mon.lights = {
    collection: db.collection('lights'),
    getState: function (id, callback) {
      this.collection.findOne({"id": parseInt(id)}, {"_id": 0, "state": 1}, function(err, data) {
        var state;
        if(data){
          state = data.state;
          logUpdate("MongoDB | Get light state (ID: " + id + " - " + (state?"ON":"OFF") + ")");
        }
        else{
          state = null;
          logUpdate("MongoDB | Light not found (ID: " + id + ")");
        }
        callback(state);
      });
    },
    getList: function (callback) {
      this.collection.find({},{"_id": 0}).toArray(function(err, data) {
        logUpdate("MongoDB | Get lights list");
        callback(data);
      });
    },
    getData: function (id, callback) {
      this.collection.findOne({"id": parseInt(id)}, {"_id": 0}, function(err, data) {
        logUpdate("MongoDB | Get light data (ID: " + id + ")");
        callback(data);
      });
    },
    updateState: function (id, state) {
      this.collection.update({"id": parseInt(id)}, {$set: {"state": state}}, function(err, result) {
        logUpdate("MongoDB | Updated light (ID " + id + ")");
      });
    },
    updateRoom: function (roomID, state) {
      this.collection.update({"room_id": parseInt(roomID)}, {$set: {"state": state}}, {"multi": true}, function(err, result) {
        logUpdate("MongoDB | Updated lights in room (ID " + roomID + ")");
      });
    },
    updateAll: function (state) {
      this.collection.update({}, {$set: {"state": state}}, {"multi": true}, function(err, result) {
        logUpdate("MongoDB | Updated all lights");
      });
    }
  };

  //Temps  -----------
  mon.temps = {
    collection: db.collection('thermometers'),
    getList: function (callback) {
      this.collection.find({},{"id": 1, "description": 1, "room_id": 1}).toArray(function(err, data) {
        logUpdate("MongoDB | Get temps list");
        callback(data);
      });
    },
    getData: function (id, callback) {
      this.collection.findOne({"id": parseInt(id)}, function(err, data) {
        logUpdate("MongoDB | Get temp data (ID: " + id + ")");
        callback(data);
      });
    },
    getTemp: function (id, callback) {
      this.collection.findOne({"id": parseInt(id)}, {"temps": {$slice: -1}, "_id": 0, "id": 0, "description": 0}, function(err, data) {
        if(data){
          var dateAndTemp = data.temps[0]; //Because findOne returns table with table inside
          logUpdate("MongoDB | Get temperature (ID: " + id + " - " + dateAndTemp[1] + ")");
          callback(dateAndTemp);
        }else callback(null);
      });
    },
    pushTemp: function (id, tempArray) {
      this.collection.update({"id": parseInt(id)}, {$push: {"temps": tempArray}}, function(err, result) {
        logUpdate("MongoDB | Pushed temp (ID " + id + ")");
      });
    }
  };
}

mongo.connect(url, function(err, database) {
  // assert.equal(null, err);
  db = database;
  setupDB();
  logUpdate("MongoDB | Connected successfully to server");

  tempUpdate();
  setInterval(tempUpdate, UPDATE_TIME);

  gpio.setup(7, gpio.DIR_OUT);
  gpio.setup(11, gpio.DIR_OUT);
  gpio.setup(13, gpio.DIR_OUT, setOff);

  //Start app when DB is ready
  var server = app.listen(3000, function (){
    var host = server.address().address;
    var port = server.address().port;
    logUpdate('Express | Listening at http://' + host +":" + port);
  });
});

//Temporary generate temperature
var diff = [-0.2,-0.1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.1,0.2];
var UPDATE_TIME = 60000;

function tempUpdate(){
  logUpdate("------ TEMP UPDATE ------")
  var now = new Date().getTime();
  logUpdate("Time: " + now);
  mon.temps.getList(function (thermometers) {
    for(i in thermometers){
      let id = parseInt(thermometers[i].id);
      mon.temps.getTemp(id, function (data) {
        var temp = data[1];
        do{
          temp *= 10;
          temp += diff[Math.floor(Math.random() * 20)]*10;
          temp /= 10;
        }while(temp > 24 || temp < 21);
        mon.temps.pushTemp( id, [now, temp]);
        // logUpdate("T" + id + " - " + temp);
      });
    }
  });
}

function setOff(){
  logUpdate("PINS | SETUP");
  mon.lights.getList(function (lights) {
    for(i in lights){
      let pin = lights[i].pin;
      switchPin(pin, false);
    }
  });
}

//Switch light (RPI IO-pin)
function switchPin(pin, newState){
  gpio.write(pin, newState, function(err){
    if(err) throw err;
    logUpdate('mHome L | Switched pin ' + pin + ' to '+ (newState?"ON":"OFF"));
  });
}

//Send rooms list
app.get('/rooms', function(req, res){
  logUpdate("mHome R | SENT rooms");
  mon.rooms.getList(function (rooms) {
    res.json(rooms);
  });
});

//Send thermometers list
app.get('/temps/', function (req, res){
    mon.temps.getList(function (temps) {
      res.json(temps);
    });
});

//Send temperature by ID
app.get('/temps/:id', function (req, res){
  mon.temps.getTemp(req.params.id, function(data) {
    logUpdate('mHome T | SENT temp of thermometre with id ' + req.params.id);
    if(data) res.json(data);
    else res.status(404).send("Thermometer with ID " + req.params.id + " not found!");
  });
});

//Send all data by thermometer ID
app.get('/temps/data/:id', function (req, res) {
   mon.temps.getData(req.params.id, function(data) {
    logUpdate('mHome T | SENT info of thermometre with id ' + req.params.id);
    if(data) res.json(data);
    else res.status(404).send("Thermometer with ID " + req.params.id + " not found!");
  });
});

//Send lights list
app.get('/lights/', function (req, res){
    mon.lights.getList(function (lights) {
      res.json(lights);
    });
});

//Send state of light by ID
app.get('/lights/:id', function (req, res){
  mon.lights.getState(req.params.id, function (state) {
    if(state !== null){
      logUpdate('mHome L | SENT state of light ' + req.params.id + ' which is ' + (state?"ON":"OFF"));
      res.json(state);
    }else{
      res.status(404).send("Light with ID " + req.params.id + " not found!");
      logUpdate("mHome L | Light not found (ID: " + req.params.id + ")");
    }
  });
});

//Switch light by ID
app.get('/lights/switch/id/:id', function (req, res){
  mon.lights.getData(req.params.id, function (data) {
    if(data){
      var id = req.params.id;
      var pin = data.pin;
      var newState = !data.state;
      switchPin(pin, newState);
      mon.lights.updateState(id, newState);
      logUpdate("mHome L | GOT switch request on light (ID: " + id + ", PIN: " + pin + ') to ' + (newState?"ON":"OFF"));
      res.json({state: newState});
    } else res.status(404).send("Light with ID " + req.params.id + " not found!");
  });
});

//Switch lights off by room
app.get('/lights/switch/room/:id', function (req, res){
  mon.lights.getList(function (data) {
    for(i in data){
      let roomID = data[i].room_id;
      if(roomID == req.params.id){
        let pin = data[i].pin;
        switchPin(pin, false);
      }
    }
    mon.lights.updateRoom(req.params.id, false);
    res.json({success: true});
  });
  //logUpdate("L | Switched OFF the lights in " + groups[req.params.id].room);
});

//Switch all lights off
app.get('/lights/switch/off', function(req, res){
  mon.lights.getList(function (lights) {
    for(i in lights){
      let pin = lights[i].pin;
      switchPin(pin, false);
    }
    mon.lights.updateAll(false);
    res.json({success: true});
  });
  logUpdate("mHome A | Switched OFF all lights");
});

//Close DB Connection (dev-test)
app.get('/db/close', function (req, res) {
  db.close();
  logUpdate("MongoDB | Connection closed");
  res.json({success: true});
});

/* TODO:
 - Errors handling
*/
