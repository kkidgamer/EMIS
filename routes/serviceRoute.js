const express = require ('express');
const router = express.Router();
const serviceController= require ('../controller/serviceController');
const {auth , authorizeRoles} = require ('../middleware/auth');

router.post('/', auth, authorizeRoles('worker'),serviceController.createService);
router.get('/worker', auth, authorizeRoles('worker'), serviceController.getServicesByWorker);
router.get('/:id', auth, serviceController.getServiceById);
router.get('/',auth,serviceController.getAllServices)
router.put('/',auth,authorizeRoles('worker'),serviceController.updateService)
router.delete('/:id',auth,authorizeRoles('admin','worker'), serviceController.deleteService)

module.exports= router;