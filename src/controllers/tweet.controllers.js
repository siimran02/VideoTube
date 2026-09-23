import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"

import {User} from "../models/user.model.js"
import {Video} from "../models/video.model.js"
import { Tweet } from "../models/tweet.model.js"
import {Subscription} from "../models/subcriptions.model.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const tweetIt = asyncHandler(async(req,res)=>{
    const {content} = req.body;
    if(!content){
        throw new ApiError(400, "You can't tweet empty content");
    }
    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })
    if(!tweet){
        throw new ApiError(400, "Something wrong while tweeting")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet uploaded"))
})

const editTweet = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params;
    const {content} = req.body;
    if(!content){
        throw new ApiError(400, "Content is required");
    }
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
         throw new ApiError(404, "Tweet not found");
    }

    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400, "You are not authorized to edit the tweet")
    }
    const updatedtweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content,
            }
        },
        {new:true}

    );
    return res.status(200).json(new ApiResponse(200, updatedtweet, "Tweet edited successfully"))
})
 const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(400, "You are not authorized to delete the tweet");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export{
    tweetIt,
    editTweet,
    deleteTweet
}