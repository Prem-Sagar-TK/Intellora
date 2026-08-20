const Transaction = require('../models/Transaction');
const fs = require('fs');
const csv = require('csv-parser');
const { z } = require('zod');

// Schema for transaction creation & update validation
const transactionSchema = z.object({
  amount: z.number({ required_error: 'Amount is required' }).finite(),
  type: z.enum(['income', 'expense'], { required_error: 'Type must be income or expense' }),
  category: z.string({ required_error: 'Category is required' }).min(1).max(50),
  description: z.string().max(255).optional().default(''),
  date: z.preprocess((val) => val ? new Date(val) : new Date(), z.date()),
  isRecurring: z.boolean().optional().default(false),
});

/**
 * Sanitizes input values to prevent CSV injection (Formula injection)
 * by prepending a single quote to strings starting with special chars.
 */
const sanitizeCsvValue = (val) => {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (/^[=\+\-\@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
};

// @desc    Get all transactions for user (with pagination)
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { user: req.user.id };

    if (req.query.category) query.category = req.query.category;
    if (req.query.type) query.type = req.query.type;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: transactions,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a transaction
// @route   POST /api/transactions
// @access  Private
const addTransaction = async (req, res, next) => {
  try {
    const validatedData = transactionSchema.parse(req.body);

    const transaction = await Transaction.create({
      user: req.user.id,
      ...validatedData,
    });

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Allow partial updates with Zod validation
    const validatedData = transactionSchema.partial().parse(req.body);

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { $set: validatedData },
      { new: true }
    );

    res.json(updatedTransaction);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await transaction.deleteOne();

    res.json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload transactions via CSV
// @route   POST /api/transactions/upload
// @access  Private
const uploadTransactionsCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a CSV file' });
    }

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          // Remove file after reading
          fs.unlinkSync(req.file.path);

          const transactionsToInsert = results.map((row) => {
            const rawAmount = parseFloat(row.amount);
            const type = row.type && row.type.toLowerCase() === 'income' ? 'income' : 'expense';
            const category = sanitizeCsvValue(row.category || 'Other');
            const description = sanitizeCsvValue(row.description || '');
            const date = row.date ? new Date(row.date) : new Date();
            const isRecurring = row.isRecurring && row.isRecurring.toLowerCase() === 'true';

            return {
              user: req.user.id,
              amount: rawAmount,
              type,
              category,
              description,
              date: isNaN(date.getTime()) ? new Date() : date,
              isRecurring,
            };
          }).filter(t => !isNaN(t.amount));

          if (transactionsToInsert.length === 0) {
            return res.status(400).json({ message: 'No valid transactions found in CSV' });
          }

          // Validate each row with Zod
          const validatedRows = transactionsToInsert.map(row => {
            const val = transactionSchema.parse({
              amount: row.amount,
              type: row.type,
              category: row.category,
              description: row.description,
              date: row.date,
              isRecurring: row.isRecurring,
            });
            return {
              user: row.user,
              ...val,
            };
          });

          const inserted = await Transaction.insertMany(validatedRows);
          res.status(201).json(inserted);
        } catch (err) {
          next(err);
        }
      })
      .on('error', (err) => {
        next(err);
      });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  uploadTransactionsCSV,
  transactionSchema,
};
