const GoogleStrategy = require('passport-google-oauth20').Strategy
const mongoose = require('mongoose')
const GoogleUser = require('../models/GoogleUser')


module.exports = function (google_passport) {
  google_passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        const newUser = {
          googleId: profile.id,
          displayName: profile.displayName,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          image: profile.photos[0].value,
        }

        try {
          let user = await GoogleUser.findOne({ googleId: profile.id })

          if (user) {
            done(null, user)
          } else {
            user = await GoogleUser.create(newUser)
            done(null, user)
          }
        } catch (err) {
          console.error(err)
        }
      }
    )
  )

  google_passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  google_passport.deserializeUser((id, done) => {
    GoogleUser.findById(id, (err, user) => done(err, user))
  })
}