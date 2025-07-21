const express = require('express');
const router = express.Router();
const clientController = require('../controller/clientController');
const { auth, authorizeRoles } = require('../middleware/auth');

router.post('/',clientController.createClient);
router.get('/:id', auth, authorizeRoles('admin'), clientController.getClientById);
router.get('/', auth, authorizeRoles('admin'), clientController.getAllClients);
router.delete('/:id', auth, authorizeRoles('admin'), clientController.deleteClient);
module.exports = router;