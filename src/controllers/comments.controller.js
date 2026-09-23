import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"

import {User} from "../models/user.model.js"
import {Video} from "../models/video.model.js"
import {Like} from "../models/like.model.js"
import {Tweet} from "../models/tweet.model.js"
import {Comment} from "../models/comments.model.js"
import {Subscription} from "../models/subcriptions.model.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const videoComments = asyncHandler(async(req,res)=>{
    const { videoId } = req.params;
    const { content } = req.body;
    if(!content){
        throw new ApiError(400, "Comment is required")
    }
    const video = await Video.findById(videoId);
    

    if(!video){
        throw new ApiError(400, "Video doesn't exists");
    }
    const comment = await Comment.create({
        videoId,
        content,
        owner: req.user._id
    });
    if(!comment){
        throw new ApiError(400,"Something went wrong while commenting");
    }
    return res.status(200).json( new ApiResponse(200, comment,"Comment added successfully"));

})

const editComments = asyncHandler (async(req,res)=>{
    const { commentId } = req.params;
    const{ content} = req.body;
    if(!content){
        throw new ApiError(400,"content is required");
    }
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404, "No comment found")
    }
    if(comment.owner.toString()!==req.user._id.toString()){
        throw new ApiError(400, "You are not authorized to edit the comment")
    }
    const updatedcomment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content
            }
        },
        {new:true}
    );
    return res.status(200).json(new ApiResponse(200, comment, "comment edited successfully"));

})
const tweeetComments = asyncHandler(async(req,res)=>{
    const { tweetId } = req.params;
    const { content } = req.body;
    if(!content){
        throw new ApiError(400, "Comment is required")
    }
    const tweet = await Tweet.findById(tweetId);
    

    if(!tweet){
        throw new ApiError(400, "Tweet doesn't exists");
    }
    const comment = await Comment.create({
        tweetId,
        content,
        owner: req.user._id
    });
    if(!comment){
        throw new ApiError(400,"Something went wrong while commenting");
    }
    return res.status(200).json( new ApiResponse(200, comment,"Comment added successfully"));

})

const deleteComments = asyncHandler(async(req,res)=>{
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "No comment found")
    }
    const deletecomment = await Comment.findByIdAndDelete(commentId);
    return res.status(200).json(new ApiResponse(200, deletecomment, "Comment deleted successfully"));
})

export{
    videoComments,
    editComments,
    tweeetComments,
    deleteComments
}