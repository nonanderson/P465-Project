const express = require('express')
const router = express.Router()
const multer = require('multer')
const GridFsStorage = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')
const methodOverride = require('method-override')
const { ensureAuth } = require('../middleware/auth')
const Listing = require('../models/Listing')
const { query } = require('express')


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
  var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all campgrounds from DB
        Listing.find({city: regex}, function(err, allListings){
           if(err){
               console.log(err);
           } else {
              if(allListings.length < 1) {
                  noMatch = "No listings match that query, please try again.";
              }
              res.render("housing",{Listing:allListings, noMatch: noMatch});
              console.log(allListings)
           }
        });
    } else {
        // Get all listings from DB
        Listing.find({}, function(err, allListings){
           if(err){
               console.log(err);
           } else {
              res.render("housing",{Listing:allListings, noMatch: noMatch});
           }
        });
    }
})

// router.post('/housing', (req, res) => {
//   const { inquiry } = req.body

//   Listing.find({city: inquiry}, (error, data) => {
//     if(error){
//       console.log(error)
//     }
//     else{
//       console.log(data)
//     }
//   })
//   res.redirect('/housing')
// })

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

  const { email, name, streetAddress, city, state, pictures } = req.body
  let errors = []

  //Check required fields
  if (!email || !name || !streetAddress || !city || !state) {
    console.log(streetAddress)
    errors.push({ msg: 'Please fill all fields' })
  }

  if (errors.length > 0) {
    res.render('add-listing', {
      layout: 'add-listing',
      errors,
      email,
      name,
      streetAddress,
      city,
      state
    })
  } else {
    const newListing = new Listing({
      email,
      name,
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


function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
