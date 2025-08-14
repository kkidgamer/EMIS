const { User, Client, Worker, Service, Booking, Message, AdminAction, Payment, Review, Category } = require("../model/model");

// Admin Dashboard Data
exports.getAdminDashboardData = async (req, res) => {
    try {
        // Parallel queries for counts
        const [
            totalUsers,
            activeClients,
            activeWorkers,
            totalServices,
            totalBookings,
            pendingPayments,
            recentAdminActions,
            totalCategories
        ] = await Promise.all([
            User.countDocuments(),
            Client.countDocuments(),
            Worker.countDocuments({ subscriptionStatus: 'active' }),
            Service.countDocuments({ status: 'active' }),
            Booking.countDocuments(),
            Payment.countDocuments({ status: 'pending' }),
            AdminAction.countDocuments(),
            Category.countDocuments()
        ]);

        // Recent activities
        const recentBookings = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('serviceId', 'title')
            .populate('clientId', 'name')
            .populate('workerId', 'name');

        const recentReviews = await Review.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('reviewerId', 'name')
            .populate('reviewedId', 'name');

        const bookingStatusCounts = await Booking.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            totalUsers,
            activeClients,
            activeWorkers,
            totalServices,
            totalBookings,
            pendingPayments,
            recentAdminActions,
            totalCategories,
            recentBookings,
            recentReviews,
            bookingStatusCounts
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Client Dashboard Data
exports.getClientDashboardData = async (req, res) => {
    try {
        const userId = req.user.userId; // Assuming user ID is available from authentication middleware

        // Parallel queries for client-specific data
        const [
            clientBookings,
            pendingBookings,
            completedBookings,
            totalSpent,
            unreadMessages
        ] = await Promise.all([
            Booking.countDocuments({ clientId: userId }),
            Booking.countDocuments({ clientId: userId, status: 'pending' }),
            Booking.countDocuments({ clientId: userId, status: 'completed' }),
            Payment.aggregate([
                { $match: { userId, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Message.countDocuments({ receiverId: userId, isRead: false })
        ]);

        // Recent client activities
        const recentBookings = await Booking.find({ clientId: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('serviceId', 'title price')
            .populate('workerId', 'name');

        const recentReviews = await Review.find({ reviewerId: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('reviewedId', 'name');

        res.status(200).json({
            clientBookings,
            pendingBookings,
            completedBookings,
            totalSpent: totalSpent[0]?.total || 0,
            unreadMessages,
            recentBookings,
            recentReviews
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Worker Dashboard Data
exports.getWorkerDashboardData = async (req, res) => {
    try {
        const userId = req.user.userId; // Assuming user ID is available from authentication middleware
        console.log(req.user._id)
        console.log(req.user.id)
        console.log(req.user.userId)
        const user = await User.findById(req.user.userId)
        // Parallel queries for worker-specific data
        const [
            workerServices,
            activeBookings,
            completedBookings,
            totalEarnings,
            averageRating,
            unreadMessages
        ] = await Promise.all([
            Service.countDocuments({ workerId: user.worker, status: 'active' }),
            Booking.countDocuments({ workerId: user.worker, status: { $in: ['pending', 'confirmed', 'ongoing'] } }),
            Booking.countDocuments({ workerId: user.worker, status: 'completed' }),
            Payment.aggregate([
                { $match: { userId, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Review.aggregate([
                { $match: { reviewedId: userId } },
                { $group: { _id: null, average: { $avg: '$rating' } } }
            ]),
            Message.countDocuments({ receiverId: userId, isRead: false })
        ]);

        // Recent worker activities
        const recentBookings = await Booking.find({ workerId: user.worker })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('serviceId', 'title price')
            .populate('clientId', 'name');

        const recentReviews = await Review.find({ reviewedId: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('reviewerId', 'name');

        res.status(200).json({
            workerServices,
            activeBookings,
            completedBookings,
            totalEarnings: totalEarnings[0]?.total || 0,
            averageRating: averageRating[0]?.average || 0,
            unreadMessages,
            recentBookings,
            recentReviews
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
