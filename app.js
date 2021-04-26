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
const http = require('http')
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./public/chat-users')
const formatMessage = require('./public/messages')



// Load Config
dotenv.config({ path:  './config/config.env'})

// Passport config
require('./config/google_passport')(google_passport)
require('./config/passport')(passport)

connectDB()
conn = mongoose.createConnection(process.env.MONGO_URI)
//rip
const app = express()

app.use(express.static('public'))

// const server = require('http').createServer(app)

// server.listen(5000, () => {
//   console.log('Server listening at port %d', 5000);
// });

// const io = require('socket.io')(80)

//***** CHAT STUFF  *****

//chat heroku socket server shit eegeegegee
const PORT = process.env.PORT || 3000

/*
const INDEX = '/chat.hbs';
const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));



const { Server } = require('ws');
const wss = new Server({ server });

var socket = require('socket.io')
const { format } = require('path')
*/

// old localhost listener
var server = app.listen(PORT, function(){
    console.log('listening for requests on port 3000,')
});

/*
//listening code for WEBSERVER rather than localhost
wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});
*/

const botName = ""

let io = socket(server)
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome!'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id)

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});




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
    resave: true,
    saveUninitialized: true,
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
const uploadP = multer({ storage })

// Upload image to DB
app.post('/upload', uploadP.single('file'), (req, res) => {
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



// app.listen(
//     PORT,
//     console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
// )
const checkout = require('./routes/checkout');
app.use('/checkout', checkout);