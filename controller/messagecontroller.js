const {User, Client, Worker, Service, Booking} = require('../model/model');

// Add a new message
exports.addMessage = async (req, res) => {
    const { receiverId, content} = req.body;
    const senderId = req.user.userId
    try {
        existreceipient = await User.findById(receiverId);
        if (!existreceipient) {
            return res.status(404).json({message: 'Receiver not found'});
        }
        if (!receiverId || !content) {
            return res.status(400).json({message: 'Kindly fill all required fields'});
        }
        if (req.user.role == existreceipient.role) {
            return res.status(400).json({message: 'You cannot send a message to a user with the same role'});

        }
        const newMessage = new Message({
            senderId,
            receiverId,
            content,
            bookingId: req.body.bookingId || null, // Optional booking reference
        });

        const savedMessage = await newMessage.save();
        res.status(201).json(savedMessage);
        
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

