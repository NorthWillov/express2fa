const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const Nexmo = require("nexmo");

const app = express();

app.use(bodyParser.json());

// Dummy data store for users
const users = [];

// Set up Nexmo client for SMS verification
const nexmo = new Nexmo({
  apiKey: "YOUR_API_KEY",
  apiSecret: "YOUR_API_SECRET",
});

// Registration route
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    if (users.find((user) => user.username === username)) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user object
    const user = {
      username,
      password: hashedPassword,
    };

    // Add user to data store
    users.push(user);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Login route
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = users.find((user) => user.username === username);
    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // Compare password with hash
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // Generate verification code
    const code = Math.floor(100000 + Math.random() * 900000);

    // Send verification code via SMS
    nexmo.message.sendSms(
      "YOUR_VIRTUAL_NUMBER", // Your virtual number
      "+48YOUR_USER_NUMBER", // User's number with +48 country code
      `Your verification code is ${code}`, // SMS message
      (err, responseData) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: "Something went wrong" });
        } else {
          console.log(responseData);
          // Store code and user in memory for verification
          user.verificationCode = code;
          user.verificationAttempts = 0;
          return res.status(200).json({ message: "Verification code sent" });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Verification route
app.post("/verify", async (req, res) => {
  try {
    const { username, code } = req.body;

    // Check if user exists
    const user = users.find((user) => user.username === username);
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid username or verification code" });
    }

    // Check if verification attempts exceeded limit
    if (user.verificationAttempts >= 3) {
      return res
        .status(400)
        .json({ message: "Too many verification attempts" });
    }

    // Check if verification code matches stored code

    if (code !== user.verificationCode) {
      // Increment verification attempts
      user.verificationAttempts++;
      return res
        .status(400)
        .json({ message: "Invalid username or verification code" });
    }

    // Remove verification properties from user object
    delete user.verificationCode;
    delete user.verificationAttempts;

    res.status(200).json({ message: "User logged in successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Start server
app.listen(3000, () => {
  console.log("Server started on port 3000");
});
