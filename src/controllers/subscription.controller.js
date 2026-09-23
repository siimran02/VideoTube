import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"

import {User} from "../models/user.model.js"
import {Video} from "../models/video.model.js"

import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { Subscription } from "../models/subcriptions.model.js";

const subscribe = asyncHandler(async(req,res)=>{
    const { channelId } = req.params;
    const channel = await User.findById(channelId);
    if(!channel){
        throw new ApiError(400, "Channel doesn't exist");
    }
    if(req.user._id == channelId){
        throw new ApiError(401, "You cann't subscribe to your channel")
    }
    const existingsubscirber = await Subscription.findOne({subscriber: req.user._id, channel: channelId});
    if(existingsubscirber){
        const subscriber = await Subscription.findByIdAndDelete(existingsubscirber._id);
        return res.status(200).json(new ApiResponse(200,subscriber, "Unsubscribed successfully"));
    }else{
        const subscriber = await Subscription.create({
            subscriber: req.user._id,
            channel : channelId
        })

        if(!subscriber){
            throw new ApiError(400, "facing server error to subscriber the channel")
        }
        return res.status(200).json(new ApiResponse(200, subscriber, "Subscribed successfully"));
    }
})

export{
    subscribe
}