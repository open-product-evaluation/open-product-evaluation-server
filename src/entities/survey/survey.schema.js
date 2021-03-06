const mongoose = require('mongoose')

const { Schema } = mongoose

const Survey = new Schema({
  creator: {
    type: Schema.Types.ObjectId,
    required: [true, 'needs to be an ID'],
    get: c => c.toString(),
  },
  title: {
    type: String,
    required: [true, 'needs to be a String'],
  },
  description: String,
  types: [{
    type: String,
    enum: ['LIKE', 'LIKEDISLIKE', 'CHOICE', 'REGULATOR', 'RANKING', 'FAVORITE'],
  }],
  isActive: { type: Boolean, default: true, required: [true, 'needs to be a Boolean'] },
  questionOrder: {
    type: [Schema.Types.ObjectId],
    get: (arr) => {
      if (arr) { return arr.map(id => id.toString()) }
      return []
    },
  },
}, { timestamps: { createdAt: 'creationDate', updatedAt: 'lastUpdate' } })

module.exports = Survey
