const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const OAuth2 = google.auth.OAuth2;

const sendEmail = async (mailOptions) => {
  const {
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI,
    GMAIL_REFRESH_TOKEN,
  } = process.env;

  // Debug: Check if env variables exist
  console.log("=== EMAIL DEBUG ===");
  console.log("CLIENT_ID exists:", !!GMAIL_CLIENT_ID);
  console.log("CLIENT_SECRET exists:", !!GMAIL_CLIENT_SECRET);
  console.log("REDIRECT_URI:", GMAIL_REDIRECT_URI);
  console.log("REFRESH_TOKEN exists:", !!GMAIL_REFRESH_TOKEN);

  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    throw new Error("Missing Gmail OAuth2 credentials in environment variables");
  }

  const oauth2Client = new OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: GMAIL_REFRESH_TOKEN,
  });

  // Get access token with error handling
  let accessToken;
  try {
    accessToken = await oauth2Client.getAccessToken();
    console.log("Access token retrieved successfully");
  } catch (tokenError) {
    console.error("Failed to get access token:", tokenError.message);
    throw new Error(`OAuth2 token error: ${tokenError.message}`);
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "atombank.noreply@gmail.com",
      clientId: GMAIL_CLIENT_ID,
      clientSecret: GMAIL_CLIENT_SECRET,
      refreshToken: GMAIL_REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"Atom Bank" <atombank.noreply@gmail.com>',
      to: mailOptions.to,
      subject: mailOptions.subject,
      text: mailOptions.text,
      html: mailOptions.html,
    });

    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (sendError) {
    console.error("Failed to send email:", sendError.message);
    throw new Error(`Email send error: ${sendError.message}`);
  }
};

module.exports = sendEmail;
