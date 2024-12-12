const express = require('express')
const router = express.Router()

const User = require('../models/User',)
const validation = require('../validations/validation')

const bcryptjs = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')

router.post('/register', async(req,res)=>{

    // validates user input against requirements
    const {error} = (validation.registerValidation(req.body))
    if(error){
        return res.status(400).send({meesage:error['details'][0]['message']})
    }

    // validates if user exists
    const userExists = await User.findOne({email:req.body.email})
    if(userExists){
        return res.status(400).send({message:'User already exists'})
    }

    // create hashed representation of password
    const salt = await bcryptjs.genSalt(5)
    const hashedPassword = await bcryptjs.hash(req.body.password,salt)

    const user = new User ({
        username:req.body.username,
        email:req.body.email,
        password:hashedPassword
    })

    // Add user
    try{
        const savedUser = await user.save()
        res.send(savedUser)
    } catch(err){
        res.status(400).send({message:err})
    }
    
})

router.post('/login', async(req,res)=>{

    // validates user input against requirements
    const {error} = (validation.loginValidation(req.body))
    if(error){
        return res.status(400).send({meesage:error['details'][0]['message']})
    }

    // validates if user exists
    const user = await User.findOne({email:req.body.email})
    if(!user){
        return res.status(400).send({message:'User does not exist'})
    }

    // validates is password matches
    const passwordValidation = await bcryptjs.compare(req.body.password,user.password)
    if(!passwordValidation){
        return res.status(400).send({message:'Incorrect password'})
    }

    const token = jsonwebtoken.sign({_id:user._id}, process.env.TOKEN_SECRET)
    res.header('auth-token',token).send({'auth-token':token})
})

module.exports = router