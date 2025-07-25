const express = require ('express');
const router = express.Router();
const serviceController= require ('../controller/serviceController');
const {auth , authorizeRoles,checkSubscriptionStatus} = require ('../middleware/auth');

router.post('/', auth,checkSubscriptionStatus, authorizeRoles('worker'),serviceController.createService);
router.get('/worker', auth,checkSubscriptionStatus, authorizeRoles('worker'), serviceController.getServicesByWorker);
router.get('/worker/:id', auth,checkSubscriptionStatus,authorizeRoles('worker'), serviceController.getServiceById);
router.get('/:id', auth, serviceController.getServiceById);
router.get('/',auth,authorizeRoles('worker'),serviceController.getAllServices)
router.get('/',auth,serviceController.getAllServices)
router.put('/',auth,checkSubscriptionStatus,authorizeRoles('worker'),serviceController.updateService)
router.delete('/:id',auth,checkSubscriptionStatus,authorizeRoles('admin','worker'), serviceController.deleteService)

module.exports= router;