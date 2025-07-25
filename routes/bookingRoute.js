const express = require('express')
const router = express.Router()
const bookingController= require('../controller/bookingController')

const {auth,authorizeRoles}= require ('../middleware/auth')

router.post('/',auth,authorizeRoles('client'),bookingController.createBooking)
router.put('/:id/confirm',auth,authorizeRoles('worker'),bookingController.confirmBooking)
router.put('/:id/cancel',auth,authorizeRoles('client'),bookingController.cancelBooking)


module.exports=router