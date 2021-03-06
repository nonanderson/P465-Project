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
const User = require('../models/User')
const { query } = require('express')
const fs = require('fs')
const NodeGeocoder = require('node-geocoder')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './views/images')
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + file.originalname)
  }
})

const fileFilter = (req, file, cb) => {
  //reject file
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true)
  }
  //accept file
  else {
    cb(null, false)
  }
}

const upload = multer({storage: storage, limits: {
  fileSize: 1024 * 1024 * 8
},
  fileFilter: fileFilter
})

//Main Page
router.get('/', (req, res) => {
  res.redirect('/housing')
})


// Registration Page
router.get('/registration', (req, res) => {
  res.render('registration', {
    layout: 'registration',
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
})


router.get("/housing/:id", ensureAuth, async function(req, res){
  const api_key = process.env.GOOGLE_MAP_KEY
  Listing.findById(req.params.id).lean().populate("comments").exec(async function(err, foundListing){
      if(err){
          console.log(err);
      } else {
        const options = {
          provider: 'google',
  

          apiKey: api_key, 
          formatter: null 
        }
      
        const geocoder = NodeGeocoder(options)

        var address = foundListing.streetAddress + " " + foundListing.city + " " + foundListing.state

        const locationInfo = await geocoder.geocode(address);

        var lat = locationInfo[0].latitude
        var lon = locationInfo[0].longitude
        res.render("house", {listing: foundListing, layout: 'house', latitude: lat, longitude: lon, firstName: req.user.firstName
        })
      }
  })
})

// Dashboard Page
router.get('/dashboard', ensureAuth ,async (req, res) => {
  try {
    const name = []
    req.user.chatLinks.forEach(element => name.push(element.split("+")[0].split('=')[1]))
    

    res.render('dashboard', {
      firstName: req.user.firstName,
      chatLinks: req.user.chatLinks,
      chatNames: name,

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
router.get('/add-listing', ensureAuth, (req, res) => {
  //console.log(req.user)
  res.render('add-listing', {
    layout: 'add-listing', userID: req.user._id,
  })
})

// Submit listing
router.post('/add-listing', upload.single('image'), (req, res) => {
  
  
  var { email, name, description, streetAddress, city, state, zip, image, amenities, id} = req.body
  image = req.file.filename

  let errors = []
  //Check required fields
  //req.user.firstname or req.user.username
  if (!email || !name || !streetAddress || !city || !state || !zip || !amenities || !description) {
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
      description,
      streetAddress,
      city,
      state,
      zip,
      image,
      amenities,
      id
    })
  } else {
    const newListing = new Listing({
      email,
      name,
      description,
      streetAddress,
      city,
      state,
      zip,
      image,
      amenities,
      id
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

// Chat
router.get('/chat', (req, res) => {
  res.render('chat')
})

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
