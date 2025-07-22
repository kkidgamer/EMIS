const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema
const userSchema = new Schema({
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    role: { type: String, enum: ['admin', 'client', 'worker'], required: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', default: null },
    worker: { type: Schema.Types.ObjectId, ref: 'Worker', default: null },
}, { timestamps: true });

// Client schema
const clientSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String, required: true }
}, { timestamps: true });

// Worker schema
const workerSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    profession: { type: String, required: true },
    nationalId: { type: String, required: true, unique: true },

    experience: { type: String },
    address: { type: String }
}, { timestamps: true });

// service schema
const ServiceSchema = new Schema({
  workerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    
  },
  description: {
    type: String,
  },
  category: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  },
  duration: {
    type: Number, // Duration in minutes
    min: [0, 'Duration cannot be negative'],
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive'],
    default: 'draft',
  },
}, {
  timestamps: true,
});


// booking schema
const BookingSchema = new Schema({
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  workerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed','ongoing', 'completed', 'cancelled'],
    default: 'pending',
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative'],
  },
}, {
  timestamps: true,
});

// message schema
const MessageSchema = new Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
  },
  content: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  time:{ type: Date, default: Date.now }

}, );


// admin action schema
const AdminActionSchema = new Schema({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  actionType: {
    type: String,
    enum: ['approve_profile', 'reject_profile', 'ban_user', 'resolve_dispute', 'edit_service'],
    required: true,
  },
  targetId: {
    type: Schema.Types.ObjectId, 
    required: true,
  },
  details: {
    type: Map,
    of: String, 
  },
}, {
  timestamps: true,
});

// payment schema
// const PaymentSchema = new Schema({
//   bookingId: {
//     type: Schema.Types.ObjectId,
//     ref: 'Booking',
//     required: true,
//   },
//   clientId: {
//     type: Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   workerId: {
//     type: Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   amount: {
//     type: Number,
//     required: true,
//     min: [0, 'Amount cannot be negative'],
//   },
//   platformFee: {
//     type: Number,
//     required: true,
//     min: [0, 'Fee cannot be negative'],
//   },
//   method: {
//     type: String,
//     enum: ['card', 'mpesa', 'paypal'],
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'held', 'released', 'refunded'],
//     default: 'pending',
//   },
//   transactionId: {
//     type: String, // From payment gateway
//   },
// },
// {
//   timestamps: true,
// });


const PaymentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  mpesaReceiptNumber: { type: String },
  phoneNumber: { type: String },
  transactionDate: { type: Date },
  merchantRequestID: { type: String },
  checkoutRequestID: { type: String },
  errorMessage: { type: String },
}, { timestamps: true });


// review schema
const ReviewSchema = new Schema({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  reviewerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewedId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
  },
  comment: {
    type: String,
  },
}, {
  timestamps: true,
});

// category schema
const CategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
  },
  service:[{type: Schema.Types.ObjectId, ref: 'Service'}]
}, {
  timestamps: true,
});

// prepare for export
const User = mongoose.model('User', userSchema);
const Client = mongoose.model('Client', clientSchema);
const Worker = mongoose.model('Worker', workerSchema);
const Service = mongoose.model('Service', ServiceSchema);
const Booking = mongoose.model('Booking', BookingSchema);
const Message = mongoose.model('Message', MessageSchema);
const AdminAction = mongoose.model('AdminAction', AdminActionSchema);
const Payment = mongoose.model('Payment', PaymentSchema);
const Review = mongoose.model('Review', ReviewSchema);
const Category = mongoose.model('Category', CategorySchema);

module.exports = {User,Client,Worker,Service,Booking,Message,AdminAction,Payment,Review,Category
};