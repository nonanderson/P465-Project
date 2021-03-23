const express = require('express')
const router = express.Router()
const multer = require('multer')
const GridFsStorage = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')
const google_passport = require('../config/google_passport')
const passport = require('../config/passport')
const methodOverride = require('method-override')
const { ensureAuth } = require('../middleware/auth')
const Listing = require('../models/Listing')
const { query } = require('express')
const fs = require('fs')
const NodeGeocoder = require('node-geocoder')

// @desc    Dashboard
// @route   GET /dashboard
router.get('/', ensureAuth ,async (req, res) => {
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
var scripts = [{ script: '../public/scripts/voice.js' }];
router.get('/housing', (req, res, {scripts: scripts}) => {
  var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Check multiple categories for relevant listings
        Listing.find({$or:[
          {city: regex},
          {state: regex},
          {zip: regex},
          {name: regex}]})
          .lean().exec(
            function(err, allListings){
            if(err){
                console.log(err);
            } else {
               if(allListings.length < 1) {
                   noMatch = "No listings match that query, please try again.";
               }
               res.render("housing",{Listing:allListings, noMatch: noMatch});
               //console.log(allListings)
              }
            });
    } else {
        // Get all listings from DB
        Listing.find({}).lean().exec(
        function(err, allListings){
            if(err){
                console.log(err);
            } else {
               res.render("housing",{Listing:allListings, noMatch: noMatch});
               
            }
         }
        );
    }

    // //get images
    // const gridConn = require('../app')
    // const gfs = gridConn.gfs
    // try {
    //   gfs.files.find().toArray((err, files) => {
    //     // Check if files
    //     if (!files || files.length === 0) {
    //       res.render('file-upload', { files: false })
    //     }
    //     else {
    //       files.map(file => {
    //         if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
    //           file.isImage = true;
    //         }
    //         else {
    //           file.isImage = false;
    //         }
    //       })
    //       res.render('file-upload', { files: files })
    //     }
  
    //   })
    // }
    // catch (e) {
    //   console.log(e)
    // }
})


router.get("/housing/:id", async function(req, res){
  //find the campground with provided ID
  console.log(req.params.id)
  const api_key = process.env.GOOGLE_MAP_KEY
  console.log("API KEY = " + api_key)
  Listing.findById(req.params.id).lean().populate("comments").exec(async function(err, foundListing){
      if(err){
          console.log(err);
      } else {
        const options = {
          provider: 'google',
         
          // Optional depending on the providers

          apiKey: api_key, // for Mapquest, OpenCage, Google Premier
          formatter: null // 'gpx', 'string', ...
        }
      
        const geocoder = NodeGeocoder(options)

        var address = foundListing.streetAddress + " " + foundListing.city + " " + foundListing.state

        const locationInfo = await geocoder.geocode(address);

        var lat = locationInfo[0].latitude
        var lon = locationInfo[0].longitude
        res.render("house", {listing: foundListing, layout: 'house', latitude: lat, longitude: lon});
      }
  })
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

  const { email, name, streetAddress, city, state, zip, image } = req.body
  let errors = []

  //Check required fields
  if (!email || !name || !streetAddress || !city || !state || !zip) {
    errors.push({ msg: 'Please fill all fields' })
  }
  // console.log(typeof(image))
  // console.log(fs.readFileSync(image))


  if (!(/^\d+$/.test(zip)) || zip.length !== 5) {
    errors.push({ msg: 'Please enter a valid zip code'})
  }

  if (errors.length > 0) {
    res.render('add-listing', {
      layout: 'add-listing',
      errors,
      email,
      name,
      streetAddress,
      city,
      state,
      zip,
      image
    })
  } else {
    const newListing = new Listing({
      email,
      name,
      streetAddress,
      city,
      state,
      zip,
      image
    })

    
    //newListing.image.data = fs.readFileSync(image)


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
