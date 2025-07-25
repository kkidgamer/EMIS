const { Service, User, Worker } = require('../model/model');

// Create a new service
exports.createService = async (req, res) => {
  try {
    const { title, description, category, price, duration } = req.body;
    const userId = req.user.userId; // From JWT middleware

    // Verify user is a worker
    const user = await User.findById(userId);
    if (!user || user.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can create services' });
    }

    const service = new Service({
      workerId: user.worker,
      title,
      description,
      category,
      price,
      duration,
      status:"active"
    });

    await service.save();
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all services
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find({ status: 'active' }).populate('workerId', 'name email');
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Get services by worker ID
exports.getServicesByWorker = async (req, res) => {
  try {
    const user =  await User.findById(req.user.userId);
    if (!user || user.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can view their services' });
    }
    const services = await Service.find({ workerId:user.worker }).populate('workerId', 'name email');
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

// Update service
exports.updateService = async (req, res) => {
  try {
    const workerId = req.user.userId; // From JWT
    const updates = req.body;
    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can update services' });
    }

    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    // Ensure only the worker who created the service can update it
    if (service.workerId.toString() !== worker.worker.toString()) {
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
    const existUser = await User.findById(userId)
    if (!existUser){
      return res.status(404).json({message:"User not found"})
    }
    const existWorker = await Worker.findById(existUser.worker)
    if (!existWorker){
      return res.status(404).json({message:"Worker not found"})
    }
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    console.log(service.workerId)
    console.log(existWorker._id)

    // Ensure only the worker who created the service can delete it
    if (service.workerId.toString() !== existWorker._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this service' });
    }

    await Service.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

