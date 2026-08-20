const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

// @desc    Get financial insights and health score (Rule-based heuristics)
// @route   GET /api/insights
// @access  Private
const getInsights = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id });

    let totalIncome = 0;
    let totalExpense = 0;
    const categorySpending = {};

    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
      }
    });

    const balance = totalIncome - totalExpense;

    // Financial Health Score Calculation (Rule-based heuristic)
    // 0-100 scale: Base 50, +/- based on savings rate (savings / income)
    let healthScore = 50;
    if (totalIncome > 0) {
      const savingsRate = (totalIncome - totalExpense) / totalIncome;
      if (savingsRate > 0) {
        healthScore += Math.min(savingsRate * 100, 50); // cap at +50
      } else {
        healthScore -= Math.min(Math.abs(savingsRate) * 50, 50); // deduct for debt
      }
    } else if (totalExpense > 0) {
      healthScore = 10; // no income but expenses
    }
    
    // Rule-based insights (heuristics)
    const insights = [];
    if (totalExpense > totalIncome && totalIncome > 0) {
      insights.push("Warning: Your expenses exceed your income this period.");
    }

    const categories = Object.keys(categorySpending).map(cat => ({
      category: cat,
      amount: categorySpending[cat]
    })).sort((a, b) => b.amount - a.amount);

    if (categories.length > 0 && totalExpense > 0) {
      const topCategory = categories[0];
      const percent = Math.round((topCategory.amount / totalExpense) * 100);
      insights.push(`You spend ${percent}% of your outflows on ${topCategory.category}.`);
    }
    
    // Add savings rate insight
    if (totalIncome > 0) {
      const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
      if (savingsRate > 20) {
         insights.push(`Great job! You are saving ${savingsRate.toFixed(1)}% of your income.`);
      }
    }

    res.json({
      totalIncome,
      totalExpense,
      balance,
      healthScore: Math.max(0, Math.round(healthScore)),
      insights, // Keep response payload structure for API compatibility
      categorySpending: categories,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInsights };
