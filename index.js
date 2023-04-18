const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const { Vonage } = require("@vonage/server-sdk");
const mongoose = require("mongoose");

dotenv.config();
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
});

// Define the user schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    requestId: {
      type: String,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lastLoginAttempt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Define the User model
const User = mongoose.model("User", userSchema);

// Connect to the MongoDB database
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB database");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Handle registration requests
app.post("/register", async (req, res) => {
  try {
    const { username, password, phoneNumber } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hash, phoneNumber });
    await user.save();
    res.send("User registered successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

// Handle login requests
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).send("Invalid username or password");
      return;
    }
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      try {
        const { request_id } = await vonage.verify.start({
          number: user.phoneNumber,
          brand: process.env.MY_BRAND_NAME,
        });
        user.requestId = request_id;
        await user.save();
        res.json(user);
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
      }
    } else {
      res.status(401).send("Invalid username or password");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

// Handle 2FA requests
app.post("/verify", async (req, res) => {
  try {
    const { code, request_id } = req.body;
    const user = await User.findOne({ requestId: request_id });
    if (!user) {
      res.status(401).send("Invalid verification code");
      return;
    }
    const check = await vonage.verify.check(request_id, code);
    if (check.status === "0") {
      res.send("Verification succeeded!");
    } else {
      res.send(check);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
