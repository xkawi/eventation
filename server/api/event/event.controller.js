'use strict';

var _ = require('lodash');
var fs = require('fs');
var mongoose = require('mongoose');
var Event = require('./event.model');
var Attendee = require('../attendee/attendee.model');

//Converter Class
var Converter = require("csvtojson").core.Converter;
var fs=require("fs");


function convertCsvToJson(csvfile, callback){
  var fileStream = fs.createReadStream(csvfile);

  var csvConverter = new Converter({constructResult:true});   //new converter instance

  //end_parsed will be emitted once parsing finished
  csvConverter.on("end_parsed",function(jsonObj){
    if ('function' === typeof callback) {
      callback(jsonObj);
    } else {
      return jsonObj;
    }
  });

  //read from file
  fileStream.pipe(csvConverter);
}


// Get list of events
exports.index = function(req, res) {
  var query = {};
  if (req.query.userId) {
    query.staff = req.query.userId;
  }
  Event.find(query, function (err, events) {
    if(err) { return handleError(res, err); }
    return res.json(200, events);
  });
};

// Get a single event
exports.show = function(req, res) {
  Event.findById(req.params.id, function (err, event) {
    if(err) { return handleError(res, err); }
    if(!event) { return res.send(404); }
    return res.json(event);
  });
};

exports.keys = function(req, res){
  console.log('keys');
  Attendee.findOne({event:req.params.eventid})
  .exec(function(err, att){

    if (err) { handleError(res, err) }
    
    var keys = [];
    if (att) {
      keys = _.keys(att.toObject());        
    }

    return res.status(200).send({'keys': keys});  

  });
}

// Creates a new event in the DB.
exports.create = function(req, res) {
  Event.create(req.body, function(err, event) {
    if(err) { return handleError(res, err); }
    return res.json(201, event);
  });
};

exports.uploadcsv = function(req, res){
  console.log('body', req.body);
  if (req.files) {
    if (req.files.file.path){
      convertCsvToJson(req.files.file.path, function(result){
        //result is array of record/attendee
        //_.map([1, 2, 3], function(num) { return num * 3; });
        // var restructure = _.map(result, function(att){
        //   return _.extend(att, {
        //     'event': mongoose.Types.ObjectId(req.body._id),
        //     'present':false,
        //     'details': JSON.stringify(att),
        //     'detail': att
        //   });
        // });

        var restructure = _.map(result, function(att){
          return {
            'event': mongoose.Types.ObjectId(req.body._id),
            'present':false,
            'details': JSON.stringify(att),
            'fields': _.keys(att)
          }
        });
        
        Attendee.collection.insert(restructure, function(a){
          console.log('a after insert', a);
          fs.unlink(req.files.file.path);                    
        });

      });
    }
    return res.json(req.files);    
  }
};

// Updates an existing event in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Event.findById(req.params.id, function (err, event) {
    if (err) { return handleError(res, err); }
    if(!event) { return res.send(404); }
    var updated = _.merge(event, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, event);
    });
  });
};

// Deletes a event from the DB.
exports.destroy = function(req, res) {
  
  // Event.findByIdAndRemove(req.params.id, function(err, event) {
  //   if(err) { return handleError(res, err); }
  //   if(!event) { return res.send(404); }
    
    
  //   return res.send(204);

  // });

  Event.findById(req.params.id, function (err, event) {
    if(err) { return handleError(res, err); }
    if(!event) { return res.send(404); }
    Attendee.remove({event: event._id}).exec();
    
    event.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}