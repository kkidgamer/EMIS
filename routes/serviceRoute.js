// routes/serviceRoute.js
const express = require('express');
const router = express.Router();
const serviceController = require('../controller/serviceController');
const { auth, authorizeRoles, checkSubscriptionStatus } = require('../middleware/auth');

// Create a new service (worker only)
router.post(
  '/',
  auth,
  checkSubscriptionStatus,
  authorizeRoles('worker'),
  serviceController.createService
);

// Get services for the logged-in worker
router.get(
  '/worker',
  auth,
  checkSubscriptionStatus,
  authorizeRoles('worker'),
  serviceController.getServicesByWorker
);

// Get service by ID (any authenticated user)
router.get('/:id', auth, serviceController.getServiceById);

// Get all services (authenticated users)
router.get('/', auth, serviceController.getAllServices);

// Update service by ID (worker only)
router.put(
  '/:id',
  auth,
  checkSubscriptionStatus,
  authorizeRoles('worker'),
  serviceController.updateService
);

// Delete service by ID (worker or admin)
router.delete(
  '/:id',
  auth,
  checkSubscriptionStatus,
  authorizeRoles('admin', 'worker'),
  serviceController.deleteService
);

module.exports = router;
