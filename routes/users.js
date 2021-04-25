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
router.post('/login', function(req, res, next) {
  passport.authenticate('local', {scope: ['profile']}, function(err, user, info) {
    
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }

    req.logIn(user, function(err) {
      console.log("login:" + req.user.firstName)
      if (err) { return next(err); }
      var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/dashboard';
      res.redirect(redirectTo);
    });
  })(req, res, next);
});

/*
https://github.com/jaredhanson/passport/issues/482
// Endpoint to login
router.post('/login',
  passport.authenticate('local'),
  function(req, res) {
    res.sesssion.save() yada yada check out the git link and find it 
    This may work or it may work once the server is in deploment
    res.send(req.user);
  }
);

*/
// Logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('housing');
});

module.exports = router;