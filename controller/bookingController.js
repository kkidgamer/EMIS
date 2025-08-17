const { Booking, Service, User, Worker, Client } = require('../model/model');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const { serviceId, startTime, endTime } = req.body;
    const clientId = req.user.userId; // From JWT middleware

    // Verify user is a client
    const user = await User.findById(clientId);
    if (!user || user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can create bookings' });
    }

    // Verify service exists and is active
    const service = await Service.findById(serviceId);
    if (!service || service.status !== 'active') {
      return res.status(404).json({ error: 'Service not found or not active' });
    }

    // Make sure client and worker are not the same person
    const worker = await User.findById(service.workerId);
    if (!worker) {
      return res.status(404).json({ message: "Worker does not exist" });
    }
    const currentClient = await Client.findById(user.client);
    if (!currentClient) {
      return res.status(404).json({ message: "Client not found" });
    }
    if (worker.worker.email === currentClient.email) {
      return res.status(403).json({ message: "Cannot book service to this account" });
    }
    // check if booking times are valid and in the future
    const now = new Date();
    if (new Date(startTime) < now || new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ message: 'Invalid booking times' });
    }

    // Calculate total amount based on service price
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = (end - start) / (1000 * 60); // Duration in minutes
    const rate = service.price / service.duration;
    const totalAmount = rate * duration;

    const booking = new Booking({
      serviceId,
      clientId,
      workerId: service.workerId,
      startTime,
      endTime,
      status: 'pending', // Initial status
      totalAmount
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Worker confirms a booking
exports.confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only workers can confirm bookings
    const user = await User.findById(req.user.userId);
    if (user.role !== 'worker' || booking.workerId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Only the assigned worker can confirm this booking' });
    }

    // Only pending bookings can be confirmed
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be confirmed' });
    }

    booking.status = 'confirmed';
    await booking.save();
    
    res.status(200).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Periodically check and update booking statuses
exports.updateBookingStatuses = async () => {
  try {
    const now = new Date();
    const bookings = await Booking.find({
      status: { $in: ['confirmed', 'ongoing'] }
    });

    for (const booking of bookings) {
      const startTime = new Date(booking.startTime);
      const endTime = new Date(booking.endTime);

      if (booking.status === 'confirmed' && now >= startTime) {
        booking.status = 'ongoing';
        await booking.save();
      } else if (booking.status === 'ongoing' && now >= endTime) {
        booking.status = 'completed';
        await booking.save();
      }
    }
  } catch (error) {
    res.status(500).json({message:error.message})
  }
};

// Get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    let bookings;

    if (user.role === 'admin') {
      bookings = await Booking.find()
        .populate('serviceId', 'title category price')
        .populate('clientId', 'name email') // Ensure User schema has name/email
        .populate('workerId', 'name email');
    } else if (user.role === 'client') {
      bookings = await Booking.find({ clientId: req.user.userId })
        .populate('serviceId', 'title category price')
        .populate('workerId', 'name email');
    } else if (user.role === 'worker') {
      bookings = await Booking.find({ workerId: req.user.userId })
        .populate('serviceId', 'title category price')
        .populate('clientId', 'name email');
    } else {
      return res.status(403).json({ message: 'Unauthorized to view bookings' });
    }

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Get All Bookings Error:', error); // Debug log
    res.status(500).json({ error: error.message });
  }
};
// Update booking (e.g., change status or reschedule)
exports.updateBooking = async (req, res) => {
  try {
    const updates = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Authorization: clients can reschedule pending bookings, workers can update status, admins can do both
    const user = await User.findById(req.user.userId);
    if (user.role === 'client' && booking.clientId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to update this booking' });
    }
    if (user.role === 'worker' && booking.workerId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to update this booking' });
    }

    // Restrict clients to updating startTime/endTime only for pending bookings
    if (user.role === 'client' && booking.status !== 'pending') {
      return res.status(403).json({ message: 'Clients can only reschedule pending bookings' });
    }
    if (user.role === 'client' && Object.keys(updates).some(key => !['startTime', 'endTime'].includes(key))) {
      return res.status(403).json({ message: 'Clients can only update startTime or endTime' });
    }

    // Update totalAmount if serviceId changes
    if (updates.serviceId) {
      const service = await Service.findById(updates.serviceId);
      if (!service || service.status !== 'active') {
        return res.status(404).json({ error: 'Service not found or not active' });
      }
      const start = new Date(updates.startTime || booking.startTime);
      const end = new Date(updates.endTime || booking.endTime);
      const duration = (end - start) / (1000 * 60); // Duration in minutes
      const rate = service.price / service.duration;
      updates.totalAmount = rate * duration;
      updates.workerId = service.workerId;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('serviceId', 'title category price')
      .populate('clientId', 'name email')
      .populate('workerId', 'name email');
    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Cancel booking (update status to cancelled)
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Authorization: clients/workers can cancel pending bookings, admins can cancel any
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin' && booking.clientId.toString() !== req.user.userId && booking.workerId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to cancel this booking' });
    }
    if (user.role !== 'admin' && booking.status !== 'pending') {
      return res.status(403).json({ message: 'Only pending bookings can be cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();
    res.status(200).json({ message: 'Booking cancelled', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
