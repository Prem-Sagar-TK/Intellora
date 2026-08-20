const Budget = require('../models/Budget');

// @desc    Get budgets for user
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res, next) => {
  try {
    // Optionally filter by month/year from query
    const { month, year } = req.query;
    let query = { user: req.user.id };
    
    if (month !== undefined) query.month = parseInt(month);
    if (year !== undefined) query.year = parseInt(year);

    const budgets = await Budget.find(query);
    res.json(budgets);
  } catch (error) {
    next(error);
  }
};

// @desc    Set a new budget
// @route   POST /api/budgets
// @access  Private
const setBudget = async (req, res, next) => {
  try {
    const { category, limit, month, year } = req.body;

    // Check if budget already exists for this category, month, year
    let existingBudget = await Budget.findOne({
      user: req.user.id,
      category,
      month,
      year
    });

    if (existingBudget) {
      existingBudget.limit = limit;
      const updatedBudget = await existingBudget.save();
      return res.status(200).json(updatedBudget);
    }

    const budget = await Budget.create({
      user: req.user.id,
      category,
      limit,
      month,
      year,
    });

    res.status(201).json(budget);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a budget
// @route   PUT /api/budgets/:id
// @access  Private
const updateBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedBudget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedBudget);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await budget.deleteOne();

    res.json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBudgets,
  setBudget,
  updateBudget,
  deleteBudget,
};
