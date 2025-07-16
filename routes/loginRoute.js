const express = require('express');
const router = express.Router();
const loginController = require('../controller/loginController');
router.post('/register', loginController.registerAdmin);
router.post('/', loginController.loginAdmin);
router.get('/', loginController.getAllUsers);
router.get('/:id', loginController.getUserById);
router.put('/:id', loginController.updateUser);

module.exports = router;