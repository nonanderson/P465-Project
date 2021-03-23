const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const morgan = require('morgan')
const exphbs = require('express-handlebars')
const methodOverride = require('method-override')
const passport = require('passport')
const google_passport = require('passport') // honestly, I don't know if this should be require('google_passport') or require('passport'). Try changing if errors persist
const flash = require('connect-flash')
const session = require('express-session')
const MongoStore = require('connect-mongo').default;//(session)
const connectDB = require('./config/db')
const crypto = require('crypto')  //avoid duplicate file names
const multer = require('multer')
const GridFsStorage = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')



// Load Config
dotenv.config({ path:  './config/config.env'})

// Passport config
require('./config/google_passport')(google_passport)
require('./config/passport')(passport)

connectDB()
conn = mongoose.createConnection(process.env.MONGO_URI)
//rip
const app = express()

// Logging
if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

// Handlebars
app.engine(
  '.hbs',
  exphbs({/*
    helpers: {
      formatDate,
      stripTags,
      truncate,
      editIcon,
      select,
    }, */
    defaultLayout: 'main',
    extname: '.hbs',
    helpers: {
      doubleSubmit: function() {
        console.log("PRESSED")
        document.forms[0].submit();
        document.forms[1].submit();
      },
      isdefined: function (value) {
        return value !== undefined;
      }

    }
  })
)
app.set('view engine', '.hbs')

//Bodyparser
app.use(express.urlencoded({ extended: false }))

// Sessions
app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
  })
)

// Passport middleware
app.use(google_passport.initialize())
app.use(google_passport.session())

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Connect flash
app.use(flash())

// Static folder
app.use(express.static(path.join(__dirname, 'public')))


// Allow method-override for deletion from db
app.use(methodOverride('_method'))

// Global Vars
app.use(function(req, res, next) {
  res.locals.user = req.user || null
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', require('./routes/index'))
app.use('/', require('./routes/users'))
app.use('/auth', require('./routes/auth'))

let gfs

conn.once('open', () => {
  // init stream
  gfs = Grid(conn.db, mongoose.mongo)
  gfs.collection('uploads')
  exports.gfs = gfs
})

// Storage engine
const storage = new GridFsStorage({
url: process.env.MONGO_URI,
file: (req, file) => {
    return new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, buf) => {
        if (err) {
        return reject(err)
        }
        const filename = buf.toString('hex') + path.extname(file.originalname)
        const fileInfo = {
        filename: filename,
        bucketName: 'uploads'
        }
        resolve(fileInfo)
    })
    })
}
})
const upload = multer({ storage })

// Upload image to DB
app.post('/upload', upload.single('file'), (req, res) => {
  //res.json({file: req.file})
  res.redirect('/add-listing')
})

// Display Image
app.get('/images/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      })
    }

    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      const readstream = gfs.createReadStream(file.filename)
      readstream.pipe(res)
    } else {
      res.status(404).json({
        err: 'Not an image'
      })
    }
  })
})

// Delete file
app.delete('/images/:id', (req, res) => {
  gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({ err: err });
    }

    res.redirect('/file-upload');
  });
});


app.use(express.static('views/images'))

const PORT = process.env.PORT || 3000

app.listen(
    PORT,
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
)
