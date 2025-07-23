const express = require ('express');
const router = express.Router();
const serviceController= require ('../controller/serviceController');
const {auth , authorizeRoles} = require ('../middleware/auth');

router.post('/', auth, authorizeRoles('worker'),serviceController.createService);
router.get('/',auth,serviceController.getAllServices)
router.put('/',auth,authorizeRoles('worker'),serviceController.updateService)
router.delete('/:id',auth,authorizeRoles('admin','worker'), serviceController.deleteService)

module.exports= router;