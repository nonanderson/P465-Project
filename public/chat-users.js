const users = []
const User = require('../models/GoogleUser')

// Join user to chat
function userJoin(id, username, room) {
  const user = { id, username, room }

  const roomArray = room.split(' ')
  const listingOwnerId = roomArray[1]


  User.findById(listingOwnerId).exec(async function(err, foundUser){
    if(err){
        console.log(err);
    } else {
      //
      const link =  "&room=" + username + "+" + listingOwnerId
      if(!foundUser.chatLinks.includes(link)){
        
        if(username != foundUser.firstName){
          foundUser.chatLinks.push(link)
          foundUser.save()
        }
      }
      
      console.log(foundUser)
      
    }
  })

 
  users.push(user)

  return user
}

// Get current user
function getCurrentUser(id) {
  return users.find(user => user.id === id)
}

// User leaves chat
function userLeave(id) {
  const index = users.findIndex(user => user.id === id)

  if (index !== -1) {
    return users.splice(index, 1)[0]
  }
}

// Get room users
function getRoomUsers(room) {
  return users.filter(user => user.room === room)
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
}