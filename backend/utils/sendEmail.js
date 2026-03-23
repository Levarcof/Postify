import nodemailer from "nodemailer";



const sendEmail = async (email, otp) => {
  console.log("BREVO_USER:", process.env.BREVO_USER);
console.log("BREVO_PASS:", process.env.BREVO_PASS);
    const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS
  }
});
  try {


    const info = await transporter.sendMail({
       from: "Postify <levarcof@gmail.com>",
      to: email,
      subject: "OTP Verification",
      html: `<h2>Your OTP is ${otp}</h2>`
    });

    console.log("Email sent:", info.messageId);

  } catch (error) {
    console.log("Email error:", error);
  }
};

export default sendEmail;
