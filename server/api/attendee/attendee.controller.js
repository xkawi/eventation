'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Attendee = require('./attendee.model');

// Get list of attendees
exports.index = function(req, res) {
  // console.log('body', req.body);
  // console.log('query', req.query);
  // console.log('params', req.params);
  var opts = req.query.eid ? {'event': mongoose.Types.ObjectId(req.query.eid)} : {};
  Attendee.find(opts, function (err, attendees) {
    if(err) { return handleError(res, err); }    
    return res.json(200, attendees);
  });
  // query.populate('event').exec();
};

exports.export = function(req, res){
  Attendee.find(function (err, attendees) {
    if(err) { return handleError(res, err); }

    var attDetails = _.map(attendees, function(att){ att.detail.present = att.present ? 'Yes':'No'; return att.detail; });
    res.csv(attDetails, "myFile.csv");
    
  });

}

// Get a single attendee
exports.show = function(req, res) {
  Attendee.findById(req.params.id, function (err, attendee) {
    if(err) { return handleError(res, err); }
    if(!attendee) { return res.send(404); }
    return res.json(attendee);
  });
};

// Creates a new attendee in the DB.
exports.create = function(req, res) {
  Attendee.create(req.body, function(err, attendee) {
    if(err) { return handleError(res, err); }
    return res.json(201, attendee);
  });
};

// Updates an existing attendee in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Attendee.findById(req.params.id, function (err, attendee) {
    if (err) { return handleError(res, err); }
    if(!attendee) { return res.send(404); }
    var updated = _.merge(attendee, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, attendee);
    });
  });
};

// Deletes a attendee from the DB.
exports.destroy = function(req, res) {
  Attendee.findById(req.params.id, function (err, attendee) {
    if(err) { return handleError(res, err); }
    if(!attendee) { return res.send(404); }
    attendee.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}