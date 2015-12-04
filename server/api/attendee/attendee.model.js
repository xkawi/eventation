'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AttendeeSchema = new Schema({
  present: Boolean,
  detail: {},
  details: String,
  fields: [String],
  event: { type: Schema.Types.ObjectId, ref: "Event" }
});

module.exports = mongoose.model('Attendee', AttendeeSchema);