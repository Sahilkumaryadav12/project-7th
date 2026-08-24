const mongoose = require('mongoose');

const caregiverRelationshipSchema = new mongoose.Schema({
  caregiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'revoked'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

caregiverRelationshipSchema.index(
  { caregiverId: 1, patientId: 1 },
  { unique: true }
);

module.exports = mongoose.model('CaregiverRelationship', caregiverRelationshipSchema);
