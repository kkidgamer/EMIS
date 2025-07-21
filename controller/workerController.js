
const { Worker } = require('../model/model');

// Create a new worker
exports.createWorker = async (req, res) => {
  try {
    const { name, email, phone, profession, nationalId, experience, address,role,password } = req.body;
    const userEmail = `${role.toLowerCase().trim()}.${email.toLowerCase().trim()}`;
    const existingUser = await User.findOne({ email: userEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const existingWorker = await Worker.findOne({ email });
    if (existingWorker) {
      return res.status(400).json({ message: "Worker already exists" });
    }
    const worker = new Worker({ name, email, phone, profession, nationalId, experience, address });
    await worker.save();
    
    // hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    // Create a new user associated with the worker
    const user = new User({ name, email: userEmail, password: hashedPassword, role, worker: worker._id });
    await user.save();

    res.status(201).json(worker);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all workers
exports.getAllWorkers = async (req, res) => {
  try {
    const workers = await Worker.find();
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get worker by ID
exports.getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    res.json(worker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update worker
exports.updateWorker = async (req, res) => {
  try {
    const updates = req.body;
    const worker = await Worker.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    res.json(worker);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete worker
exports.deleteWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndDelete(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    res.json({ message: 'Worker deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
