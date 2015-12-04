'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EventSchema = new Schema({
  name: String,
  info: String,
  active: Boolean,
  staff: { type: Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model('Event', EventSchema);