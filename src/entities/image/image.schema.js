const mongoose = require('mongoose')

const { Schema } = mongoose

const ImageData = new Schema({
  user: { type: Schema.Types.ObjectId, required: true, get: toString },
  survey: Schema.Types.ObjectId,
  question: Schema.Types.ObjectId,
  name: { type: String, required: true },
  type: { type: String, required: true },
  hash: { type: String, required: true },
  tags: [String],
  url: { type: String, required: true },
}, { timestamps: { createdAt: 'creationDate' } })

module.exports = ImageData
