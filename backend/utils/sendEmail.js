import nodemailer from "nodemailer";

// ✅ SMTP connection test


const sendEmail = async (email, otp) => {
  try {

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS:", process.env.EMAIL_PASS);

    transporter.verify((error, success) => {
      if (error) {
        console.log("SMTP connection failed:", error);
      } else {
        console.log("SMTP server ready");
      }
    });

    const info = await transporter.sendMail({
      from: `"OTP Verification" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "OTP Verification",
      html: `<h2>Your OTP is ${otp}</h2>`
    });

    console.log("Email sent:", info.response);

  } catch (error) {
    console.log("Email error:", error);
  }
};

export default sendEmail;
