const { Booking, Service, User } = require('../model/model');

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

    // Calculate total amount based on service price
    const start = new Date(startTime)
    const end = new Date(endTime)
    const rate = service.price / service.duration
    const duration=( (end - start)/ (1000 * 60))
    const totalAmount = rate * ( duration)
    const booking = new Booking({
      serviceId,
      clientId,
      workerId: service.workerId,
      startTime,
      endTime,
      status: 'pending',
      totalAmount
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId); // From JWT
    let bookings;

    // Admins can see all bookings, clients/workers see only their own
    if (user.role === 'admin') {
      bookings = await Booking.find()
        .populate('serviceId', 'title category price')
        .populate('clientId', 'name email')
        .populate('workerId', 'name email');
    } else if (user.role === 'client') {
      bookings = await Booking.find({ clientId: req.user.userId })
        .populate('serviceId', 'title category price')
        .populate('workerId', 'name email');
    } else if (user.role === 'worker') {
      bookings = await Booking.find({ workerId: user.worker})
        .populate('serviceId', 'title category price')
        .populate('clientId', 'name email');
    } else {
      return res.status(403).json({ message: 'Unauthorized to view bookings' });
    }

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('serviceId', 'title category price')
      .populate('clientId', 'name email')
      .populate('workerId', 'name email');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Ensure user is part of the booking or an admin
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin' && booking.clientId.toString() !== req.user.userId && booking.workerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to view this booking' });
    }

    res.status(200).json(booking);
  } catch (error) {
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
    if (user.role === 'worker' && booking.workerId.toString() !== req.user.userId) {
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
      updates.totalAmount = service.price;
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

// Delete booking (cancel)
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Authorization: clients/workers can cancel pending bookings, admins can delete any
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin' && booking.clientId.toString() !== req.user.userId && booking.workerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this booking' });
    }
    if (user.role !== 'admin' && booking.status !== 'pending') {
      return res.status(403).json({ message: 'Only pending bookings can be cancelled' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};