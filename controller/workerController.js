
const { Worker, User } = require('../model/model');
const bcrypt = require('bcrypt');
// Create a new worker
exports.createWorker = async (req, res) => {
  try {
    const { name, email, phone, profession, nationalId, experience, address, role, password } = req.body;

    // Normalize email
    const userEmail = `${role.toLowerCase().trim()}.${email.toLowerCase().trim()}`;

    // Check for duplicates in User
    const existingUser = await User.findOne({ email: userEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Check for duplicates in Worker
    const existingWorker = await Worker.findOne({ email });
    if (existingWorker) {
      return res.status(400).json({ message: "Worker already exists" });
    }

    // Check for duplicate national ID
    const existingNationalId = await Worker.findOne({ nationalId });
    if (existingNationalId) {
      return res.status(400).json({ message: "National ID already exists" });
    }

    // Create Worker first
    const worker = new Worker({
      name,
      email,
      phone,
      profession,
      nationalId,
      experience,
      address
    });
    await worker.save();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create User linked to Worker
    const user = new User({
      name,
      email: userEmail,
      password: hashedPassword,
      role,
      worker: worker._id.toString() // Link Worker
    });
    await user.save();

    // Update Worker with User ID (optional, if you want bidirectional link)
    worker.user = user._id.toString();
    await worker.save();

    res.status(201).json({
      message: "Worker and user created successfully",
      worker,
      user
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// Get all workers
exports.getAllWorkers = async (req, res) => {
  try {
    const workers = await Worker.find();
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get worker by ID
exports.getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    res.json(worker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update worker
exports.updateWorker = async (req, res) => {
  try {
    const updates = req.body;


    // Ensure that the user if is a worker can only update their own information and must be logged in
     
    
    const worker = await Worker.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    const user = await User.findOneAndDelete({worker:req.params.id},updates,{new:true})
    res.json(worker);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete worker
exports.deleteWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndDelete(req.params.id);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    const user = await User.findOneAndDelete({worker:req.params.id})
    if (!user) return res.json({message:"User not found"})
    res.json({ message: 'Worker deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Mock payment function to simulate payment processing
const simulatePayment = async (workerId, amount) => {
  try {
    // Simulate payment processing (e.g., calling Stripe API)
    // In a real system, this would interact with a payment gateway
    const paymentSuccessful = Math.random() > 0.1; // 90% chance of success for simulation
    if (!paymentSuccessful) {
      throw new Error('Payment failed');
    }
    return {
      status: 'success',
      transactionId: `txn_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      workerId,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      status: 'failed',
      message: error.message,
      workerId,
      timestamp: new Date()
    };
  }
};


// update worker subscription status
// Manage subscription (handles payment-based activation and status checking)
exports.manageSubscription = async (req, res) => {
  try {
    const currentDate = new Date();
    const {paymentAmount} = req.body

    // If req is provided (API call to process payment and activate subscription)
    if (req && res) {
      const workerId = req.params.id;
      const worker = await Worker.findById(workerId);
      if (!worker) return res.status(404).json({ message: 'Worker subscription off' });

      // // Check if user is authenticated and authorized
      // if (!req.user || req.user.userId.toString() !== workerId) {
      //   return res.status(403).json({ error: 'Unauthorized: You can only manage your own subscription' });
      // }

      // Simulate payment (e.g., $20 for monthly subscription)
       // Adjust as needed
      const paymentResult = await simulatePayment(workerId, paymentAmount);

      if (paymentResult.status === 'success') {
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 30); // Set subscription for 1 month

        worker.subscriptionStatus = 'active';
        worker.subscriptionStartDate = startDate;
        worker.subscriptionEndDate = endDate;

        await worker.save();
        return res.json({
          message: 'Subscription activated after successful payment',
          worker,
          payment: {
            transactionId: paymentResult.transactionId,
            amount: paymentResult.amount,
            timestamp: paymentResult.timestamp
          }
        });
      } else {
        return res.status(400).json({ message: 'Payment failed' });
      }
    }

    // If no req/res (background task to check all subscriptions)
    const workers = await Worker.find({ subscriptionStatus: 'active' });
    for (const worker of workers) {
      if (worker.subscriptionEndDate && currentDate > worker.subscriptionEndDate) {
        worker.subscriptionStatus = 'inactive';
        await worker.save();
        console.log(`Subscription expired for worker: ${worker.email}`);
      }
    }
    res.json({message:'Subscription status check completed'});
  } catch (error) {
    if (res) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error managing subscriptions:', error.message);
  }
};
