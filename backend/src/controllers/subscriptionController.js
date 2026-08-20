const Subscription = require('../models/Subscription');

// @desc    Get all subscriptions for user
// @route   GET /api/subscriptions
// @access  Private
const getSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user.id }).sort({ renewalDate: 1 });
    res.json(subscriptions);
  } catch (error) {
    next(error);
  }
};

// @desc    Add a subscription
// @route   POST /api/subscriptions
// @access  Private
const addSubscription = async (req, res, next) => {
  try {
    const { name, cost, category, renewalDate } = req.body;

    const subscription = await Subscription.create({
      user: req.user.id,
      name,
      cost,
      category: category || 'Other',
      renewalDate,
    });

    res.status(201).json(subscription);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a subscription
// @route   PUT /api/subscriptions/:id
// @access  Private
const updateSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updated = await Subscription.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a subscription
// @route   DELETE /api/subscriptions/:id
// @access  Private
const deleteSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await subscription.deleteOne();
    res.json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription,
};
