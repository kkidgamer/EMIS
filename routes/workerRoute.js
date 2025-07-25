const express = require('express');
const router = express.Router();
const workerController = require('../controller/workerController');
const { auth, authorizeRoles } = require('../middleware/auth');

router.post('/', workerController.createWorker);
router.get('/:id', auth, authorizeRoles('admin'), workerController.getWorkerById);
router.get('/', auth, authorizeRoles('admin'), workerController.getAllWorkers);
router.put('/sub/:id', auth, authorizeRoles('admin'), workerController.manageSubscription);
router.put('/:id', auth, authorizeRoles('admin'), workerController.updateWorker);
router.delete('/:id', auth, authorizeRoles('admin'), workerController.deleteWorker);

module.exports = router;