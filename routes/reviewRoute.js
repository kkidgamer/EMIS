const express = require('express');
const router = express.Router();
const reviewController = require('../controller/reviewController');
const { auth, authorizeRoles } = require('../middleware/auth');

// Create a new review
router.post('/', auth, authorizeRoles('client'), reviewController.createReview);

// Get all reviews
router.get('/',auth, reviewController.getAllReviews);

// Get reviews for a specific user
router.get('/user/:userId',auth, reviewController.getReviewsForUser);

// Delete a review
router.delete('/:id',auth,authorizeRoles('admin'), reviewController.deleteReview);

module.exports = router;