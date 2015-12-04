/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /things              ->  index
 * POST    /things              ->  create
 * GET     /things/:id          ->  show
 * PUT     /things/:id          ->  update
 * DELETE  /things/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var http = require('http');
//Converter Class
var Converter = require("csvtojson").core.Converter;
var fs=require("fs");

var Thing = require('./thing.model');


function convertCsvToJson(csvString, callback){
  var csvConverter = new Converter({constructResult:true});   //new converter instance
  csvConverter.fromString(csvString, callback);
}

// Get list of things
exports.index = function(req, res) {
  Thing.find(function (err, things) {
    if(err) { return handleError(res, err); }
    return res.json(200, things);
  });
};

exports.getFromUrl = function(req, res){
  var link = "http://download.finance.yahoo.com/d/quotes.csv?s=AAPL&e=.csv";
  //"http://samplecsvs.s3.amazonaws.com/Sacramentorealestatetransactions.csv"
  http.get(link, function(resp) {
    //console.log("Got response: " + data.statusCode, data);
    // initialize the container for our data
    var data = "";

    // this event fires many times, each time collecting another piece of the response
    resp.on("data", function (chunk) {
        // append this chunk to our growing `data` var
        data += chunk;
    });

    // this event fires *one* time, after all the `data` events/chunks have been gathered
    resp.on("end", function () {
        // you can use res.send instead of console.log to output via express
        convertCsvToJson(data, function(err, jsonObj){
          //console.log(jsonObj);
          return res.status(200).json(jsonObj);
        });

    });

    
  }).on('error', function(e) {
    return res.status(500).json(e.message);
    console.log("Got error: " + e.message);
  });
};

// Get a single thing
exports.show = function(req, res) {
  Thing.findById(req.params.id, function (err, thing) {
    if(err) { return handleError(res, err); }
    if(!thing) { return res.send(404); }
    return res.json(thing);
  });
};

// Creates a new thing in the DB.
exports.create = function(req, res) {
  Thing.create(req.body, function(err, thing) {
    if(err) { return handleError(res, err); }
    return res.json(201, thing);
  });
};

// Updates an existing thing in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Thing.findById(req.params.id, function (err, thing) {
    if (err) { return handleError(res, err); }
    if(!thing) { return res.send(404); }
    var updated = _.merge(thing, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, thing);
    });
  });
};

// Deletes a thing from the DB.
exports.destroy = function(req, res) {
  Thing.findById(req.params.id, function (err, thing) {
    if(err) { return handleError(res, err); }
    if(!thing) { return res.send(404); }
    thing.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}