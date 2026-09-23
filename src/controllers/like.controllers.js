import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"

import {User} from "../models/user.model.js"
import {Video} from "../models/video.model.js"
import {Like} from "../models/like.model.js"
import {Tweet} from "../models/tweet.model.js"
import {Subscription} from "../models/subcriptions.model.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const likevideo = asyncHandler(async(req,res)=>{
    const {videoid} =req.params;
    const video = await Video.findById(videoid);
    if(!video){
        throw new ApiError(400, "Video doesn't exist");
    }
    const existinglike = await Like.findOne({video:videoid, likedBy: req.user._id});
    if(existinglike){
        await Like.findByIdAndDelete(existinglike._id);
        return res.status(200).json(new ApiResponse(200,[], "unliked video successfully"));
    }
    const like = await Like.create({
        video: videoid,
        likedBy: req.user._id
    })
    return res.status(200).json(new ApiResponse(200, like, "Liked video successfully"));
})
const liketweet = asyncHandler(async(req,res)=>{
    const {tweetid} =req.params;
    const tweet = await Tweet.findById(tweetid);
    if(!tweet){
        throw new ApiError(400, "Tweet doesn't exist");
    }
    const existinglike = await Like.findOne({tweet:tweetid, likedBy: req.user._id});
    if(existinglike){
        await Like.findByIdAndDelete(existinglike._id);
        return res.status(200).json(new ApiResponse(200,[], "unliked tweet successfully"));
    }
    const like = await Like.create({
        tweet: tweetid,
        likedBy: req.user._id
    })
    return res.status(200).json(new ApiResponse(200, like, "Liked tweet successfully"));
})
const getVideoLikeCount = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "Invalid video");
    }

    const likeCount = await Like.countDocuments({ video: videoId });

    return res
        .status(200)
        .json(new ApiResponse(200, { likeCount }, "Like count fetched successfully"));
});
const gettweetLikeCount = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(400, "Invalid tweet");
    }

    const likeCount = await Like.countDocuments({ tweet: tweetId });

    return res
        .status(200)
        .json(new ApiResponse(200, { likeCount }, "Like count fetched successfully"));
});

export{
    likevideo,
    liketweet,
    getVideoLikeCount,
    gettweetLikeCount
}