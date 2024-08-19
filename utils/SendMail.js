const nodemailer = require("nodemailer");

const sendMail = async (subject, messageBody, Email) => {
  // email config
  let transporter = await nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
      user: process.env.MAIL_EMAIL,
      pass: process.env.MAIL_PASSWORD,
    },
  });
  const mailOptions = {
    from: `"Talent Hospitality" <${process.env.MAIL_EMAIL}>`,
    to: Email,
    subject: subject,
    html: messageBody,
  };

  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error.message);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

module.exports = sendMail;
