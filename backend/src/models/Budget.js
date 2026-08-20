const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  category: {
    type: String,
    required: true,
  },
  limit: {
    type: Number,
    required: true,
  },
  month: {
    type: Number, // 0-11 for JS dates
    required: true,
  },
  year: {
    type: Number,
    required: true,
  }
}, {
  timestamps: true,
});

// Compound index for fast lookup of a user's category budget per period
budgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
