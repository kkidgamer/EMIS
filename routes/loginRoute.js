const express = require('express');
const router = express.Router();
const loginController = require('../controller/loginController');
const { auth, authorizeRoles } = require('../middleware/auth');
router.post('/register', loginController.registerAdmin);
router.post('/admin', loginController.loginAdmin);
router.post('/',loginController.loginAdmin)
router.get('/:id',auth,authorizeRoles('admin'), loginController.getUserById);
router.get('/',auth,authorizeRoles('admin'), loginController.getAllUsers);
router.put('/:id',auth, loginController.deactivateUser);
router.put('/',auth, loginController.updateUser);

module.exports = router;