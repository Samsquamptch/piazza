const jsonwebtoken = require('jsonwebtoken')
const User = require('./models/User')

async function auth(req,res,next){
    const token = req.header('auth-token')
    if(!token){
        console.log("test")
        return res.status(401).send({message:'Access Denied'})
    }
    try{
        const verified = jsonwebtoken.verify(token,process.env.TOKEN_SECRET)
        const tokenUser = await User.findById(verified._id)
        req.userDetails = {_id: tokenUser._id, username: tokenUser.username}
        next()
    } catch(err){
        return res.status(401).send({message:'Acess Denied'})
    }
}

module.exports=auth