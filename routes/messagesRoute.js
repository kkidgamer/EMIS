const express = require('express')
const router = express.Router()
const messageController = require('../controller/messagecontroller')

const { auth, authorizeRoles } = require('../middleware/auth')

// Create a new message
router.post('/', auth, messageController.createMessage)

// Get all messages for the authenticated user
router.get('/', auth, authorizeRoles('client', 'worker', 'admin'), messageController.getMessagesByUserId)

// Get messages for a specific booking
router.get('/booking/:bookingId', auth, authorizeRoles('client', 'worker', 'admin'), messageController.getMessagesByBookingId)

// Get messages between two users for a specific booking
router.get('/between/:otherUserId/booking/:bookingId', auth, authorizeRoles('client', 'worker', 'admin'), messageController.getMessagesBetweenUsers)

// Get all messages between two users across all bookings
router.get('/between/:otherUserId', auth, authorizeRoles('client', 'worker', 'admin'), messageController.getAllMessagesBetweenUsers)

// Mark a message as read
router.put('/read/:id', auth, messageController.markMessageAsRead)

// Get unread message count
router.get('/unread/count', auth, authorizeRoles('client', 'worker', 'admin'), messageController.getUnreadMessageCount)



// Delete a message (sender or admin only)
router.delete('/:id', auth, messageController.deleteMessage)

module.exports = router