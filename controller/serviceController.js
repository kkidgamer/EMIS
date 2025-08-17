const { Service, User, Worker } = require('../model/model');

// Create a new service
exports.createService = async (req, res) => {
  try {
    const { title, description, category, price, duration } = req.body;

    // Get logged-in user's data
    const userId = req.user.userId; 

    // Find user and populate worker
    const user = await User.findById(userId).populate("worker");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.worker) {
      return res.status(404).json({ error: "Worker profile not found for this user" });
    }

    // Create service linked to worker (using workerId as per schema)
    const service = new Service({
      title,
      description,
      category,
      price,
      duration,
      workerId: userId // Link worker using workerId field
    });

    await service.save();

    res.status(201).json({
      message: "Service created successfully",
      service
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all services
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find({ status: 'active' }).populate('workerId', 'name email');
    res.status(200).json(services);
    console.log(services)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get services by worker ID
exports.getServicesByWorker = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can view their services' });
    }
    const userId = req.user.userId; 
    // Use 'workerId' field as per schema
    const services = await Service.find({ workerId: userId }).populate('workerId', 'name email');
    if (!services.length) return res.status(404).json({ error: 'No services found for this worker' });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get service by ID
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('workerId', 'name email');
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    const user = await User.findById(userId);
    if (!user || user.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can update services' });
    }

    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    // Use 'workerId' field and compare with user.worker
    if (service.workerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to update this service' });
    }

    const updatedService = await Service.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.status(200).json(updatedService);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete service
exports.deleteService = async (req, res) => {
  try {
    const userId = req.user.userId; // From JWT
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.role == 'client') {
      return res.status(403).json({ message: "Clients cannot delete services" });
    }

    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    
    console.log('Service workerId:', service.workerId);
    console.log('User worker:', user.worker);

    // Use 'workerId' field as per schema
    if (service.workerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this service' });
    }

    await Service.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
