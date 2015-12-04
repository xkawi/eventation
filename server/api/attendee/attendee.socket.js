/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Attendee = require('./attendee.model');

exports.register = function(socket) {
  Attendee.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Attendee.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('attendee:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('attendee:remove', doc);
}