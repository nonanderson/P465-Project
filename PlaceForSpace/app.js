const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const morgan = require('morgan')
const exphbs = require('express-handlebars')
//const methodOverride = require('method-override')
const passport = require('passport')
const google_passport = require('passport') // honestly, I don't know if this should be require('google_passport') or require('passport'). Try changing if errors persist
const flash = require('connect-flash')
const session = require('express-session')
const MongoStore = require('connect-mongo')//(session)
const connectDB = require('./config/db')




// Load Config
dotenv.config({ path:  './config/config.env'})

// Passport config
require('./config/google_passport')(google_passport)
require('./config/passport')(passport)

connectDB()

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
    //store: new MongoStore({ mongooseConnection: mongoose.connection }),
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

// Global Vars
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', require('./routes/index'))
app.use('/', require('./routes/users'))
app.use('/auth', require('./routes/auth'))

app.use(express.static('views/images'))

const PORT = process.env.PORT || 3000

app.listen(
    PORT,
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
)

