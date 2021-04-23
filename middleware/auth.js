module.exports = {
  ensureAuth: function (req, res, next) {
    console.log("Auth:" + req.user.firstName)
    if (req.isAuthenticated()) {
      
      return next()
    } else {
      res.redirect('/login')
    }
  },
  ensureGuest: function (req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    } else {
      res.redirect('/dashboard');
    }
  },
}