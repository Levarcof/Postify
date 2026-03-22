import { User } from "../models/User.js";
import { Session } from "../models/Session.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Otp from "../models/Otp.js";
import generateOtp from "../utils/generateOtp.js";
import sendEmail from "../utils/sendEmail.js";

export const registerUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'email is required',
      });
    }

    // 🔥 Step 1: delete old OTP (if exists)
    await Otp.deleteMany({ userKey: email });

    // 🔥 Step 2: generate new OTP
    const otp = generateOtp();

    // 🔥 Step 3: save new OTP
    await Otp.create({
      userKey: email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
    });

    // 🔥 Step 4: send email
    await sendEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });
  }
  catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: 'internal server error',
    });
  }

};

export const verifyOtp = async (req, res) => {
  const { firstName, lastName, email, password, profilePic, otp, userName } = req.body;

  // 🔍 Check OTP
  const otpRecord = await Otp.findOne({ userKey: email, otp });

  if (!otpRecord || !firstName || !lastName || !email || !password || !userName) {
    return res.status(400).json({
      success: false,
      message: 'invalid otp  OR empty field',
    });
  }

  // ⏰ Check expiry
  if (otpRecord.expiresAt < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'OTP expired',
    });
  }

  // 🔐 Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 👤 Create user
  const newUser = await User.create({
    firstName,
    lastName,
    userName,
    email,
    image: profilePic,
    password: hashedPassword,
  });

  // 🧾 Create session
  const session = await Session.create({
    userId: newUser._id,
  });

  // 🍪 Set cookie
  res.cookie("sessionId", session._id.toString(), {
    httpOnly: true,
    secure: true, // set to true only in production (HTTPS)
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // 🧹 Delete OTP
  await Otp.deleteMany({ userKey: email });

  return res.status(200).json({
    success: true,
    message: 'user registered successfully',
  });
};

export const forgetPassword = async (req, res) => {
  const { userKey } = req.body;

  const foundUser = await User.findOne({ $or: [{ email: userKey }, { userName: userKey }] });
  if (!foundUser) {
    return res.status(400).json({
      success: false,
      message: 'email not found',
    });
  }

  const email = foundUser.email
  console.log(email)
  const otp = generateOtp()
  await Otp.deleteMany({ userKey });

  await Otp.create({
    userKey,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });
  await sendEmail(email, otp);


  return res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
  });
};

export const verifyPassword = async (req, res) => {
  const { userKey, otp } = req.body;

  const record = await Otp.findOne({ userKey, otp });

  if (!record) {
    return res.status(400).json({
      success: false,
      message: 'invalid otp',
    });
  }


  if (record.expiresAt < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'OTP expired',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'OTP verified successfully',
  });
};

export const updatePassword = async (req, res) => {
  const { userKey, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("I am in update password api")
  await User.findOneAndUpdate(
    { $or: [{ email: userKey }, { userName: userKey }] },
    { password: hashedPassword }
  );

  await Otp.deleteMany({ userKey }); // cleanup

  return res.status(200).json({
    success: true,
    message: 'password updated successfully',
  });
};

export const login = async (req, res) => {
  try {
    let { userKey, password } = req.body;
    console.log("I am on login api")

    // 1️⃣ Check user exists
    const existingUser = await User.findOne({
      $or: [{ email: userKey }, { userName: userKey }]
    });

    if (!existingUser) {
      console.log("User not found")
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // 2️⃣ Compare password (IMPORTANT: await)
    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      console.log("Invalid password")
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    // 3️⃣ Create session in DB
    const session = await Session.create({
      userId: existingUser._id,
    });

    // 4️⃣ Store sessionId in cookie
    res.cookie("sessionId", session._id.toString(), {
      httpOnly: true,
      secure: true, // 👉 true in production (HTTPS)
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 5️⃣ Success response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        email: existingUser.email,
        firstName: existingUser.firstName,
      },
    });

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;

    console.log("SessionId:", sessionId);

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "No sessionId in cookie",
      });
    }

    // 🔥 delete session
    const deletedSession = await Session.findOneAndDelete({
      _id: sessionId,
    });

    console.log("Deleted:", deletedSession);

    // 🔥 clear cookie (IMPORTANT)
    res.clearCookie("sessionId", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/", // ⚠️ must match login
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });

  } catch (error) {
    console.log("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const checkSession = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "No sessionId in cookie",
      });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(400).json({
        success: false,
        message: "Session not found",
        loggedIn: false,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Session found",
      loggedIn: true,
    });

  } catch (error) {
    console.log("Check session error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      loggedIn: false,
    });
  }
};
