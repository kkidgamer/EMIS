const express= require ('express')
const router = express.Router()
const dashController = require ('../controller/DashStats')

const { auth, authorizeRoles } = require('../middleware/auth');

router.get('/admin', auth, authorizeRoles('admin'), dashController.getAdminDashboardData)
router.get('/client', auth, authorizeRoles('client'), dashController.getClientDashboardData)
router.get('/worker', auth, authorizeRoles("worker"), dashController.getWorkerDashboardData)

module.exports = router