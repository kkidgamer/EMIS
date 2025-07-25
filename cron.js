const cron = require('node-cron');
const { manageSubscription } = require('./controller/workerController');

// Schedule subscription check to run daily at midnight
cron.schedule('0 0 * * *', () => {
  console.log('Running subscription status check...');
  manageSubscription(); // Call without req/res for background task
});

// Optional: Run immediately on startup for testing
manageSubscription();