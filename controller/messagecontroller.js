const { Message, Booking, User } = require('../model/model');

// Create a message
exports.createMessage = async (req, res) => {
  try {
    const { receiverId, bookingId, content } = req.body;
    const senderId = req.user.userId; // From JWT

    // Verify users exist and are part of the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.clientId.toString() !== senderId && booking.workerId.toString() !== senderId) {
      return res.status(403).json({ message: 'Unauthorized to send message for this booking' });
    }
    if (booking.clientId.toString() !== receiverId && booking.workerId.toString() !== receiverId) {
      return res.status(403).json({ message: 'Invalid receiver for this booking' });
    }

    const message = new Message({
      senderId,
      receiverId,
      bookingId,
      content
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get messages for a user
exports.getMessagesByUserId = async (req, res) => {
  try {
    const userId = req.user.userId; // From JWT
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    })
      .populate('senderId', 'name')
      .populate('receiverId', 'name')
      .populate('bookingId', 'serviceId');
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get messages between two specific users for a specific booking
exports.getMessagesBetweenUsers = async (req, res) => {
  try {
    const userId = req.user.userId; // From JWT (current user)
    const { otherUserId, bookingId } = req.params;

    // Verify booking exists and user is part of it
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if current user is part of this booking
    if (booking.clientId.toString() !== userId && booking.workerId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized to view messages for this booking' });
    }

    // Check if other user is part of this booking
    if (booking.clientId.toString() !== otherUserId && booking.workerId.toString() !== otherUserId) {
      return res.status(403).json({ message: 'Other user is not part of this booking' });
    }

    // Get messages between the two users for this specific booking
    const messages = await Message.find({
      bookingId: bookingId,
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    })
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email')
      .populate('bookingId', 'serviceId status')
      .sort({ time: 1 }); // Sort by time ascending (oldest first)

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Alternative: Get all messages between two users across all their bookings
exports.getAllMessagesBetweenUsers = async (req, res) => {
  try {
    const userId = req.user.userId; // From JWT (current user)
    const { otherUserId } = req.params;

    // Verify other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find all bookings where both users are involved
    const bookings = await Booking.find({
      $or: [
        { clientId: userId, workerId: otherUserId },
        { clientId: otherUserId, workerId: userId }
      ]
    });

    if (bookings.length === 0) {
      return res.status(403).json({ 
        message: 'No bookings found between these users' 
      });
    }

    const bookingIds = bookings.map(booking => booking._id);

    // Get all messages between the two users across all their bookings
    const messages = await Message.find({
      bookingId: { $in: bookingIds },
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    })
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email')
      .populate('bookingId', 'serviceId status')
      .sort({ time: 1 }); // Sort by time ascending

    res.status(200).json({
      success: true,
      count: messages.length,
      bookingsInvolved: bookings.length,
      data: messages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get messages for a specific booking (regardless of users)
exports.getMessagesByBookingId = async (req, res) => {
  try {
    const userId = req.user.userId; // From JWT
    const { bookingId } = req.params;

    // Verify booking exists and user is part of it
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user is part of this booking
    if (booking.clientId.toString() !== userId && booking.workerId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized to view messages for this booking' });
    }

    const messages = await Message.find({ bookingId })
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email')
      .sort({ time: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      booking: {
        id: booking._id,
        serviceId: booking.serviceId,
        status: booking.status
      },
      data: messages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark message as read
exports.markMessageAsRead = async (req, res) => {
  try {
    const userId = req.user.userId; // From JWT
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Ensure user is the receiver
    if (message.receiverId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized to mark this message as read' });
    }

    message.isRead = true;
    await message.save();
    res.status(200).json({ message: 'Message marked as read', data: message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete message (optional, restricted to sender or admin)
exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.user.userId; // From JWT
    const user = await User.findById(userId);
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Only sender or admin can delete
    if (message.senderId.toString() !== userId && user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this message' });
    }

    await Message.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};