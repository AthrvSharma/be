const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');

const router = express.Router();

// ========== GOOGLE AUTH ROUTES ==========

// Trigger Google OAuth
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }) // ✅ include 'email'
);


// Google OAuth Callback
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/api/order'); // or your dashboard
  });


// ========== LOGIN ROUTE (LOCAL) ==========
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log("User not found");
      return res.redirect('/register');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Incorrect password");
      return res.redirect('/login');
    }

    req.session.username = user.username;
    req.login(user, function (err) {
      if (err) return next(err);
      return res.redirect('/api/order');
    });

  } catch (err) {
    console.error("Login error:", err);
    next(err);
  }
});
router.get('/admin/google-users', async (req, res) => {
  try {
    const googleUsers = await User.find({ googleId: { $ne: null } });
    res.render('googleUsers.ejs', { users: googleUsers });
  } catch (err) {
    res.status(500).send("Server error");
  }
});
router.get('/admin/all-users', async (req, res) => {
  try {
    const googleUsers = await User.find({ googleId: { $ne: null } });
    const manualUsers = await User.find({ googleId: null });

    res.render('allUsers.ejs', { googleUsers, manualUsers });
  } catch (err) {
    res.status(500).send("Error fetching users");
  }
});



// ========== REGISTER ROUTE ==========
router.post('/register', async (req, res, next) => {
  const { username, password, uemail } = req.body; // uemail comes from form

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.redirect('/login');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      email: uemail           // ✅ Save email here
    });

    await newUser.save();
    res.redirect('/login');
  } catch (err) {
    console.error('Registration error:', err);
    next(err);
  }
});

// ========== LOGOUT ROUTE ==========
router.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.redirect('/api/order'); // or a fail page
    }
    req.session.destroy(() => {
      res.redirect('/login');
    });
  });
});

module.exports = router;
