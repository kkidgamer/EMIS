
const { Worker } = require('./script.js');

// Create a new worker
exports.createWorker = async (req, res) => {
  try {
    const { name, email, phone, profession, nationalId, experience, address } = req.body;
    const worker = new Worker({ name, email, phone, profession, nationalId, experience, address });
    await worker.save();
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
