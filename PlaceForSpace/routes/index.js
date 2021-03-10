const express = require('express')
const router = express.Router()
const multer = require('multer')
const GridFsStorage = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')
const methodOverride = require('method-override')
const { ensureAuth } = require('../middleware/auth')
const Listing = require('../models/Listing')

// @desc    Dashboard
// @route   GET /dashboard
router.get('/', ensureAuth,async (req, res) => {
  try {
    res.render('dashboard', {
      firstName: req.user.firstName,
    })
  }
  catch (e) {
    console.log(e)
  }
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

// Dashboard Page
router.get('/dashboard', ensureAuth, async (req, res) => {
  try {
    res.render('dashboard', {
      firstName: req.user.firstName,
    })
  }
  catch (e) {
    console.log(e)
  }
})

// Upload Page
router.get('/file-upload', (req, res) => {
  const gridConn = require('../app')
  const gfs = gridConn.gfs
  try {
    gfs.files.find().toArray((err, files) => {
      // Check if files
      if (!files || files.length === 0) {
        res.render('file-upload', { files: false })
      }
      else {
        files.map(file => {
          if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
            file.isImage = true;
          }
          else {
            file.isImage = false;
          }
        })
        res.render('file-upload', { files: files })
      }

    })
  }
  catch (e) {
    console.log(e)
  }
})


// Create Listing Page
router.get('/add-listing', (req, res) => {
  res.render('add-listing', {
    layout: 'add-listing',
  })
})

// Submit listing
router.post('/add-listing', (req, res) => {

  const { userEmail, streetAddress, city, state, pictures } = req.body
  let errors = []

  //Check required fields
  if (!userEmail || !streetAddress || !city || !state) {
    errors.push({ msg: 'Please fill all fields' })
  }

  if (errors.length > 0) {
    res.render('add-listing', {
      layout: 'add-listing',
      errors,
      userEmail,
      streetAddress,
      city,
      state
    })
  } else {
    const newListing = new Listing({
      userEmail,
      streetAddress,
      city,
      state,
      pictures
    });

    // Save listing
    newListing
      .save()
      .then(user => {
        req.flash(
          'success_msg',
          'Listing created'
        );
        res.redirect('/add-listing');
      })
      .catch(err => console.log(err));
  }
});

module.exports = router;
