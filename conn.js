const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Supabase setup
const supabaseUrl = 'https://mhhdvnxhklmnchhcootj.supabase.co'; // Replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaGR2bnhoa2xtbmNoaGNvb3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzNDk5MzUsImV4cCI6MjA0NjkyNTkzNX0.JeGtIk-HDQQSqnx-0iOvVP4mAf3bOVqjwK1q5CkYxA4'; // Replace with your Supabase API key
const supabase = createClient(supabaseUrl, supabaseKey);

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'venuebooking317@gmail.com', // Sender email
    pass: 'ftdx ggtx iswm yrgh', // App password
  },
});

// Function to send an email
async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: 'venuebooking317@gmail.com',
    to,
    subject,
    text,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        reject(error);
      } else {
        console.log('Email sent:', info.response);
        resolve(info);
      }
    });
  });
}

// Function to process individual notification
async function processNotification(notification) {
  try {
    const { notification_id, message, customers } = notification;

    if (!customers || !customers.email) {
      console.warn(`Notification ${notification_id} skipped: No email available`);
      return;
    }

    // Define email content based on the message
    let emailSubject;
    let emailBody;

    if (message === 'Booking confirmed') {
      emailSubject = 'Booking Confirmed';
      emailBody = 'Your booking has been confirmed. Thank you for choosing us!';
    } else if (message === 'Booking cancelled') {
      emailSubject = 'Booking Cancelled';
      emailBody = 'Unfortunately, your booking has been cancelled. Please contact support if you have questions.';
    } else {
      console.warn(`Notification ${notification_id} skipped: Unrecognized message`);
      return;
    }

    // Send email
    await sendEmail(customers.email, emailSubject, emailBody);

    // Mark notification as processed
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ email_sent: true })
      .eq('notification_id', notification_id);

    if (updateError) {
      console.error(`Error updating email_sent for notification ${notification_id}:`, updateError);
    } else {
      console.log(`Notification ${notification_id} processed successfully.`);
    }
  } catch (error) {
    console.error(`Error processing notification ${notification.notification_id}:`, error);
  }
}

// Main function
async function processNotifications() {
  try {
    // Fetch notifications that have not been processed
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        notification_id,
        message,
        customers (email)
      `)
      .eq('email_sent', false); // Only fetch notifications where email_sent is false

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    if (!notifications || notifications.length === 0) {
      console.log('No notifications found to process.');
      return;
    }

    // Process each notification
    for (const notification of notifications) {
      await processNotification(notification);
    }
  } catch (error) {
    console.error('Error in processNotifications:', error);
  }
}

// Execute the function
processNotifications();
