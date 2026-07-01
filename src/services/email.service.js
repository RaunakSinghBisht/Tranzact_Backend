const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Tranzact" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

async function sendRegistrationEmail(email, name) {
  const subject = "Welcome to Tranzact - Registration Successful";

  const text = `
Hi ${name},

Welcome to Tranzact! Your registration was successful.

You can now log in to your account and start using our services.

Thank you for joining us!

Best regards,
The Tranzact Team
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
        <h2 style="color: #333; margin-bottom: 20px;">Welcome to Tranzact, ${name}! 🎉</h2>
        
        <p style="color: #555; line-height: 1.6;">
          Your registration was successful. We're excited to have you on board!
        </p>
        
        <div style="margin: 30px 0;">
          <p style="color: #555; margin-bottom: 10px;">
            <strong>What's Next?</strong>
          </p>
          <ul style="color: #555; line-height: 1.8;">
            <li>Complete your profile</li>
            <li>Explore our features</li>
            <li>Start using Tranzact</li>
          </ul>
        </div>
        
        <p style="color: #777; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          If you didn't register for this account, please contact our support team.
        </p>
      </div>
    </div>
  `.trim();

  await sendEmail(email, subject, text, html);
}

async function sendTransactionEmail(email, name, amount, sender, receiver) {
  const subject = "Tranzact - Transaction Successful";

  const text = `
    Hi ${name},

    Your transaction has been completed successfully.

    Transaction Details:
    From: ${sender}
    To: ${receiver}
    Amount: ₹${amount}

    Thank you for using Tranzact!

    Best regards,
    The Tranzact Team
      `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
        <h2 style="color: #333; margin-bottom: 20px;">Transaction Successful ✅</h2>
        
        <p style="color: #555; line-height: 1.6;">
          Hi ${name}, your transaction has been completed successfully.
        </p>
        
        <div style="background-color: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <p style="color: #666; margin: 5px 0;"><strong>From:</strong> ${sender}</p>
          <p style="color: #666; margin: 5px 0;"><strong>To:</strong> ${receiver}</p>
          <p style="color: #2e7d32; margin: 5px 0; font-size: 18px;"><strong>Amount:</strong> ₹${amount}</p>
        </div>
        
        <p style="color: #777; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          If you didn't initiate this transaction, please contact our support team immediately.
        </p>
      </div>
    </div>
  `.trim();

  await sendEmail(email, subject, text, html);
}

async function sendTransactionFailureEmail(email, name, amount, sender, receiver, reason) {
  const subject = "Tranzact - Transaction Failed";

  const text = `
Hi ${name},

Your transaction could not be completed.

Transaction Details:
From: ${sender}
To: ${receiver}
Amount: ₹${amount}
Reason: ${reason}

Please try again or contact support if the issue persists.

Best regards,
The Tranzact Team
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
        <h2 style="color: #d32f2f; margin-bottom: 20px;">Transaction Failed ❌</h2>
        
        <p style="color: #555; line-height: 1.6;">
          Hi ${name}, your transaction could not be completed. Please review the details below.
        </p>
        
        <div style="background-color: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d32f2f;">
          <p style="color: #666; margin: 5px 0;"><strong>From:</strong> ${sender}</p>
          <p style="color: #666; margin: 5px 0;"><strong>To:</strong> ${receiver}</p>
          <p style="color: #666; margin: 5px 0; font-size: 16px;"><strong>Amount:</strong> ₹${amount}</p>
          <p style="color: #d32f2f; margin-top: 10px;"><strong>Reason:</strong> ${reason}</p>
        </div>
        
        <p style="color: #555; margin: 20px 0;">
          Please try again or contact our support team if the issue persists.
        </p>
        
        <p style="color: #777; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          Your account balance remains unchanged.
        </p>
      </div>
    </div>
  `.trim();

  await sendEmail(email, subject, text, html);
}


module.exports = { sendRegistrationEmail, sendTransactionEmail, sendTransactionFailureEmail };