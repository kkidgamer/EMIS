
const { AdminAction } = require('../model/model');

// Create a new admin action
exports.createAdminAction = async (req, res) => {
  try {
    const { adminId, actionType, targetId, details } = req.body;
    const adminAction = new AdminAction({ adminId, actionType, targetId, details });
    await adminAction.save();
    res.status(201).json(adminAction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all admin actions
exports.getAllAdminActions = async (req, res) => {
  try {
    const adminActions = await AdminAction.find().populate('adminId');
    res.json(adminActions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get admin action by ID
exports.getAdminActionById = async (req, res) => {
  try {
    const adminAction = await AdminAction.findById(req.params.id).populate('adminId');
    if (!adminAction) return res.status(404).json({ error: 'Admin action not found' });
    res.json(adminAction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete admin action
exports.deleteAdminAction = async (req, res) => {
  try {
    const adminAction = await AdminAction.findByIdAndDelete(req.params.id);
    if (!adminAction) return res.status(404).json({ error: 'Admin action not found' });
    res.json({ message: 'Admin action deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
