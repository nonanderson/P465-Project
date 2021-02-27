const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs');
const { ensureAuth, ensureGuest } = require('../middleware/auth')
const passport = require('passport');

// Load User model
const User = require('../models/User')
const GoogleUser = require('../models/GoogleUser')

// Login Page
// @desc    Login/Landing page
// @route   GET /
router.get('/login', ensureGuest, (req, res) => {
  res.render('login', {
    layout: 'login',
  })
})

// Registration Page
router.get('/registration', (req, res) => {
  res.render('registration', {
    layout: 'registration',
  })
})

// About Page
router.get('/about-page', (req, res) => {
  res.render('about-page', {
    layout: 'about-page',
  })
})

// About Renting Page
router.get('/about-renting', (req, res) => {
  res.render('about-renting', {
    layout: 'about-renting',
  })
})

// About Selling Page
router.get('/about-selling', (req, res) => {
  res.render('about-selling', {
    layout: 'about-selling',
  })
})

// Housing Page
router.get('/housing', (req, res) => {
  res.render('housing', {
    layout: 'housing',
  })
})

// Register Handle
router.post('/registration', (req, res) => {

  const { firstName, lastName, email, password, password2 } = req.body
  let errors = []

  //Check required fields
  if (!firstName || !lastName || !email || !password || !password2) {
    errors.push({ msg: 'Please fill all fields' })
  }

  //Check passwords match
  if (password !== password2) {
    errors.push({ msg: 'Passwords do not match' })
  }

  //Check password length
  if (password.length < 8) {
    errors.push({ msg: 'Password needs to contain at least 8 characters' })
  }

  if (errors.length > 0) {
    res.render('registration', {
      layout: 'registration',
      errors,
      firstName,
      lastName,
      email,
    })
  } else {
    GoogleUser.findOne({ email: email }).then(googleUser => {
      if (googleUser) { // Look for existing google user (in our system - I think)
        errors.push({ msg: 'Email is already registered through a Google Account' });
        res.render('registration', {
          layout: 'registration',
          errors,
          firstName,
          lastName,
          email,
        });
      } else {
        User.findOne({ email: email }).then(user => { // look for existing user in our users
          if (user) {
            errors.push({ msg: 'Email is already registered' });
            res.render('registration', {
              layout: 'registration',
              errors,
              firstName,
              lastName,
              email,
            });
          } else {

            const newUser = new User({
              firstName,
              lastName,
              email,
              password
            });

            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(newUser.password, salt, (err, hash) => {
                if (err) throw err;
                // Set password to hashed
                newUser.password = hash;

                // Save user
                newUser
                  .save()
                  .then(user => {
                    req.flash(
                      'success_msg',
                      'You are now registered and can log in'
                    );
                    res.redirect('/login');
                  })
                  .catch(err => console.log(err));
              });
            });
          }
        });

      }
    });
  }
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('login');
});

module.exports = router;