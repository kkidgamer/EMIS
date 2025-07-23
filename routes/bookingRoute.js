const express = require('express')
const router = express.Router()
const bookingController= require('../controller/bookingController')

const {auth,authorizeRoles}= require ('../middleware/auth')

router.post('/',auth,authorizeRoles('client'),bookingController.createBooking)

module.exports=router