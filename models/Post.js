const { json } = require('body-parser')
const mongoose = require('mongoose')

const PostSchema = mongoose.Schema({
    "posterId":{
        type:String,
        required:true
    },
    "username":{
        type:String,
        required:true
    },
    "title":{
        type:String,
        required:true
    },
    "topic":{
        type:String,
        required:true
    },
    "message":{
        type:String,
        required:true
    },
    "date":{
        type:Date,
        default:Date.now
    },
    "likes":{
        type:Number,
        default:0
    },
    "dislikes":{
        type:Number,
        default:0
    },
    "comments": [
        {
            username: {type:String,
                required: true},
            comment: {type:String,
                required: true},
        }
    ],
    "interactions": [
        {
            userId: {type:String,
                required: true},
            username: {type:String,
                required: true},
            type: {type:String,
                required: true},
            date: {type:Date,
                default:Date.now}
        }
    ],
    "expiration":{
        type:Date,
        required:true,
        default:Date.now
    },
    "status":{
        type:String,
        default:"Live"
    }
})

module.exports = mongoose.model('posts', PostSchema)