var logUpdate = require('./betterLog.js');
var express = require('express');
var app = express();
var gpio = require('rpi-gpio');
var path = require('path');
var mongo = require('mongodb').MongoClient;
var therms = require('ds18b20');

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

var url = 'MONGODB ADDRESS HERE';

function setupDB(db) {
  let lights, temps, rooms;
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
        let name = data.name;
        logUpdate(`MongoDB | Get room data (ID: ${id})`);
        callback(name);
      });
    }
  };

  //Light  -----------
  mon.lights = {
    collection: db.collection('lights'),
    getState: function (id, callback) {
      this.collection.findOne({"id": parseInt(id)}, {"_id": 0, "state": 1}, function(err, data) {
        let state;
        if(data){
          state = data.state;
          logUpdate(`MongoDB | Get light state (ID: ${id} - ${state?"ON":"OFF"})`);
        }
        else{
          state = null;
          logUpdate(`MongoDB | Light not found (ID: ${id})`);
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
        logUpdate(`MongoDB | Get light data (ID: ${id})`);
        callback(data);
      });
    },
    updateState: function (id, state) {
      this.collection.update({"id": parseInt(id)}, {$set: {"state": state}}, function(err, result) {
        logUpdate(`MongoDB | Updated light (ID ${id})`);
      });
    },
    updateRoom: function (roomID, state) {
      this.collection.update({"room_id": parseInt(roomID)}, {$set: {"state": state}}, {"multi": true}, function(err, result) {
        logUpdate(`MongoDB | Updated lights in room (ID ${roomID})`);
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
      this.collection.find({},{"id": 1, "description": 1, "room_id": 1, "device_id": 1}).toArray(function(err, data) {
        logUpdate("MongoDB | Get temps list");
        callback(data);
      });
    },
    getData: function (id, callback) {
      this.collection.findOne({"id": parseInt(id)}, {"device_id": 0}, function(err, data) {
        logUpdate(`MongoDB | Get temp data (ID: ${id})`);
        callback(data);
      });
    },
    getTemp: function (id, callback) {
      this.collection.findOne({"id": parseInt(id)}, {"temps": {$slice: -1}, "_id": 0, "id": 0, "description": 0}, function(err, data) {
        if(data){
          let dateAndTemp = data.temps[0]; //Because findOne returns table with table inside
          logUpdate(`MongoDB | Get temperature (ID: ${id} - ${dateAndTemp[1]})`);
          callback(dateAndTemp);
        }else callback(null);
      });
    },
    getDevice: function (id, callback) {
      this.collection.find({"id": parseInt(id)},{"device_id": 1}).toArray(function(err, data) {
        logUpdate(`MongoDB | Get temps device_id (ID ${id})`);
        callback(data);
      });
    },
    pushTemp: function (id, tempArray) {
      this.collection.update({"id": parseInt(id)}, {$push: {"temps": tempArray}}, function(err, result) {
        logUpdate(`MongoDB | Pushed temp (ID ${id})`);
      });
    }
  };
}

mongo.connect(url, function(err, database) {
  //db = database;
  setupDB(database);
  logUpdate("MongoDB | Connected to the database");

  //tempUpdate();
  setInterval(tempUpdate, UPDATE_TIME);

  gpio.setup(12, gpio.DIR_OUT);
  gpio.setup(11, gpio.DIR_OUT);
  gpio.setup(13, gpio.DIR_OUT, setOff);

  //Start app when DB is ready
  var server = app.listen(3000, () => {
    logUpdate(`Express | Server started`);
  });
});


var UPDATE_TIME = 300000;

function tempUpdate(){
  mon.temps.getList(function (thermometers) {
    let now = new Date().getTime();
    for(i of thermometers){
      let therm = i;
      therms.temperature(therm.device_id, function(err, value) {
        if(!err){
          mon.temps.pushTemp(therm.id, [now, value])
          logUpdate("T" + therm.id + " - " + value);
        }
        else{
          throw err;
        }
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
    logUpdate(`mHome L | Switched pin ${pin} to ${newState?"ON":"OFF"}`);
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
    logUpdate(`mHome T | SENT temp of thermometre with id ${req.params.id}`);
    if(data) res.json(data);
    else res.status(404).send(`Thermometer with ID ${req.params.id} not found!`);
  });
});

//Send all data by thermometer ID
app.get('/temps/data/:id', function (req, res) {
   mon.temps.getData(req.params.id, function(data) {
    logUpdate('mHome T | SENT info of thermometre with id ' + req.params.id);
    if(data) res.json(data);
    else res.status(404).send(`Thermometer with ID ${req.params.id} not found!`);
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
      logUpdate(`mHome L | SENT state of light ${req.params.id} which is ${state?"ON":"OFF"}`);
      res.json(state);
    }else{
      res.status(404).send(`Light with ID ${req.params.id} not found!`);
      logUpdate(`mHome L | Light not found (ID: ${req.params.id})`);
    }
  });
});

//Switch light by ID
app.get('/lights/switch/id/:id', function (req, res){
  mon.lights.getData(req.params.id, function (data) {
    if(data){
      let id = req.params.id;
      let pin = data.pin;
      let newState = !data.state;
      switchPin(pin, newState);
      mon.lights.updateState(id, newState);
      logUpdate(`mHome L | GOT switch request on light (ID: ${id}, PIN: ${pin}) to ${newState?"ON":"OFF"}`);
      res.json({state: newState});
    } else res.status(404).send(`Light with ID ${req.params.id}not found!`);
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
