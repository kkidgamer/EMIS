const express = require('express')
const router = express.Router()
const bookingController= require('../controller/bookingController')

const {auth,authorizeRoles}= require ('../middleware/auth')

router.post('/',auth,authorizeRoles('client'),bookingController.createBooking)
router.put('/:id/cancel',auth,authorizeRoles('client'),bookingController.cancelBooking)
router.put('/:id',auth,authorizeRoles('worker'),bookingController.confirmBooking)
router.get('/',auth,authorizeRoles('client','worker','admin'),bookingController.getAllBookings)
router.put('/status',auth,authorizeRoles('worker','admin'),bookingController.updateBookingStatuses)

module.exports=router