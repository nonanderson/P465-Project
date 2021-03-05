const express = require('express')
const router = express.Router()

// @desc    Dashboard
// @route   GET /dashboard
router.get('/', async (req, res) => {
  try {
    res.render('dashboard', {
      //name: req.User.firstName,
    })
  }
  catch (e) {
    console.log(e)
  }
})


module.exports = router;
