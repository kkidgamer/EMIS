const { Client, User } = require('../model/model');
const bcrypt = require('bcrypt');

// Create a new client
exports.createClient = async (req, res) => {
  try {
    const { name, email, phone, address,password, role } = req.body;
    console.log(role)
    const userEmail= `${role.toLowerCase().trim()}.${email.toLowerCase().trim()}`
    const existingUser= await User.findOne({email:userEmail})
    if (existingUser){
      return res.json( {message:"User already exists"})
    }
    const existClient= await Client.findOne({email})
    if (existClient){
      return res.json({message:"Client already exists"})
    }
    const client = new Client({ name, email, phone, address });
    await client.save();

    // hash password
    const hashedPassword= await bcrypt.hash(password,12)
    const user= new User({name,email:userEmail,password:hashedPassword,role,client:client._id})
    await user.save()
    res.status(201).json(client);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all clients
exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.find();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get client by ID
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.json({ error: 'Client not found' });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update client
exports.updateClient = async (req, res) => {
  try {
    const updates = req.body;
    const client = await Client.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!client) return res.json({ error: 'Client not found' });
    res.json(client);
    // update corresponding user
    const user = await User.findOneAndUpdate(
      { client: req.params.id },
      { name: updates.name, email: updates.email },
      { new: true }
    );
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete client
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.json({ error: 'Client not found' });
    res.json({ message: 'Client deleted' });
    // delete corresponding user
    const deleteUser = await User.findOneAndDelete({ client: req.params.id });
    if (!deleteUser) {
      return res.json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted' });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 