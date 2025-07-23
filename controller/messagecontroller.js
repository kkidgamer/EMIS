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