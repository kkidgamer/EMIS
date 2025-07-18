
const { Review } = require('../model/model');

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { bookingId, reviewerId, reviewedId, rating, comment } = req.body;
    const review = new Review({ bookingId, reviewerId, reviewedId, rating, comment });
    await review.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().populate('bookingId reviewerId reviewedId');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get reviews for a user
exports.getReviewsForUser = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewedId: req.params.userId }).populate('bookingId reviewerId reviewedId');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};