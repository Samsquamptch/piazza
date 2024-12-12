const express = require('express')
const router = express.Router()

const Post = require('../models/Post')
const verify = require('../verifytoken')

// Add Post
router.post('/', verify, async(req,res)=>{
    
    // Used to set the expiration date of the post
    const currentTime = new Date()
    const expirationDate = currentTime.setMinutes(currentTime.getMinutes() + Number(req.body.expiration))

    // Data to be added to the mongodb database as a post
    const postData = new Post({
        posterId:req.userDetails._id,
        username:req.userDetails.username,
        title:req.body.title,
        topic:req.body.topic,
        message:req.body.message,
        expiration:expirationDate
    })
    try{
        const postToSave = await postData.save()
        res.send(postToSave)
    } catch(err){
        res.send({message:err})
    }
})

// Delete Post
router.delete('/:postId', verify, async(req,res)=>{
    
    // Checks to see if the post exists
    const postExists = await Post.findById({_id:req.params.postId})

    // If post does not exist, return an error message
    if(!postExists){
        return res.status(400).send({message:"post does not exist"})
    }

    // If interaction is not by the poster, return an error message
    if(postExists.posterId !== req.userDetails._id){
        return res.status(400).send({message:"only poster may delete posts"})
    }

    try{
        const deletePostById = await Post.deleteOne({_id:req.params.postId})
        res.send(deletePostById)
    } catch(err){
        res.send({message:err})
    }
})


// Add comment
router.patch('/:postId/comment', verify, async(req,res)=>{

    // Data to be added to the mongodb database for comment and interaction
    const commentData = {
        username:req.userDetails.username,
        comment:req.body.comment
    }
    const interactionData = {
        userId:req.userDetails._id,
        username:req.userDetails.username,
        type:"comment"
    }
    
    // Checks to see if the post exists
    const postExists = await Post.findById({_id:req.params.postId})

    // If post does not exist, return an error message
    if(!postExists){
        return res.status(400).send({message:"post does not exist"})
    }

    // If post has expired, return an error message
    if(postExists.expiration < Date.now()){
        return res.status(400).send({message:"post has expired"})
    }

    try{
        const updatePostById = await Post.updateOne(
            {_id:req.params.postId},
            {$push: {comments: commentData, interactions: interactionData}})
        res.send(updatePostById)
    } catch(err){
        res.send({message:err})
    }
})

// Like post
router.patch('/:postId/like', verify, async(req,res)=>{

    // Data to be added to the mongodb database for interaction
    const interactionData = {
        userId:req.userDetails._id,
        username:req.userDetails.username,
        type:"like"
    }

    // Checks to see if the post exists
    const postExists = await Post.findById({_id:req.params.postId})

    // If post does not exist, return an error message
    if(!postExists){
        return res.status(400).send({message:"post does not exist"})
    }

    // If post has expired, return an error message
    if(postExists.expiration < Date.now()){
        return res.status(400).send({message:"post has expired"})
    }

    // If interaction is by the poster, return an error message
    if(postExists.posterId == req.userDetails._id){
        return res.status(400).send({message:"user cannot like their own post"})
    }
    
    try{
        const updatePostById = await Post.updateOne(
            {_id:req.params.postId},
            {$inc: {likes: 1}, $push: {interactions: interactionData}})
        res.send(updatePostById)
    } catch(err){
        res.send({message:err})
    }
})

// Dislike Post
router.patch('/:postId/dislike', verify, async(req,res)=>{

    // Data to be added to the mongodb database for interaction
    const interactionData = {
        userId:req.userDetails._id,
        username:req.userDetails.username,
        type:"dislike"
    }

    // Checks to see if the post exists
    const postExists = await Post.findById({_id:req.params.postId})

    // If post does not exist, return an error message
    if(!postExists){
        return res.status(400).send({message:"post does not exist"})
    }

    // If post has expired, return an error message
    if(postExists.expiration < Date.now()){
        return res.status(400).send({message:"post has expired"})
    }

    // If interaction is by the poster, return an error message
    if(postExists.posterId == req.userDetails._id){
        return res.status(400).send({message:"user cannot like their own post"})
    }

    try{
        const updatePostById = await Post.updateOne(
            {_id:req.params.postId},
            {$inc: {dislikes: 1}, $push: {interactions: interactionData}})
        res.send(updatePostById)
    } catch(err){
        res.send({message:err})
    }
})

// Update status
router.patch('/', verify, async(req,res)=>{

    // Get current time
    const currentTime = Date.now()
    try{
        // Updates status of posts where status is live and current time after post expiry data
        await await Post.updateMany({expiration: {$lt: currentTime}, status: 'Live'},
            {$set: {status: 'Expired'}})
        res.send({message:"posts status updated"})
    }catch(err){
        res.send({message:err})
    }})

// Get all
router.get('/', verify, async(req,res)=>{
    try{
        const getPosts = await Post.find()
        res.send(getPosts)
    } catch(err){
        res.send({message:err})
    }
})

// Get post
router.get('/:postId', verify, async(req,res)=>{
    try{
        var getPostById = await Post.findById(req.params.postId)
        res.send(getPostById)
    } catch(err){
        res.send({message:err})
    }
})

// Get topic
router.get('/topic/:chosenTopic', verify, async(req,res)=>{
    try{
        const getTopicPosts = await Post.find({topic:req.params.chosenTopic})
        res.send(getTopicPosts)
    } catch(err){
        res.send({message:err})
    }
})

// Get most active
router.get('/most-active/:chosenTopic', verify, async(req,res)=>{
    // Gets current date
    const currentTime = new Date
    try{
        // Returns the post in category which has not expired and has the most likes and dislikes
        const getActivePosts = await Post.aggregate([{$match:{topic:req.params.chosenTopic}},
            {$match: {expiration: {$gte: currentTime}}},           
        {$addFields: {activity:{$add: ['$likes', '$dislikes']}}},
        {$sort: { activity: -1}},
        {$limit: 1}
    ])
        res.send(getActivePosts)
    } catch(err){
        res.send({message:err})
    }
})

// Get available
router.get('/active/:chosenTopic', verify, async(req,res)=>{
    // Gets current date
    const currentTime = Date.now()
    try{
        // Returns all posts where current time is before expiration date and matches selected topic
        const getActivePosts = await Post.find({topic:req.params.chosenTopic, expiration:{$gte: currentTime}})
        res.send(getActivePosts)
    } catch(err){
        res.send({message:err})
    }
})

// Get expired
router.get('/expired/:chosenTopic', verify, async(req,res)=>{
    // Gets current date
    const currentTime = Date.now()
    try{
        // Returns all posts where current time is after expiration data and matches selected topic
        const getExpiredPosts = await Post.find({topic:req.params.chosenTopic, expiration:{$lte: currentTime}})
        res.send(getExpiredPosts)
    } catch(err){
        res.send({message:err})
    }
})

module.exports = router