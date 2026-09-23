import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"

import {User} from "../models/user.model.js"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subcriptions.model.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const uploadvideo = asyncHandler( async (req,res)=>{
  const { title, description } = req.body;
  if(!title?.trim() || !description?.trim()){
    throw new ApiError(401, "Title and description for uploading the video is required");
  }
  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
  if(!videoLocalPath){
    throw new ApiError(400, "Video file is required")
  }
   if(!thumbnailLocalPath){
    throw new ApiError(400, "thumbnail file is required")
  }
  let videoFile;
  try {
    videoFile = await uploadOnCloudinary(videoLocalPath);
    console.log("Uploaded video",videoFile);
  } catch (error) {
    console.log("Error uploading video")
    throw new ApiError(500, "Failed to upload video")
  }
  let thumbnail;
  try {
    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    console.log("Uploaded thumbnail",thumbnail);
  } catch (error) {
    console.log("Error uploading thumbnail")
    throw new ApiError(500, "Failed to upload thumbnail")
  }
  try {
    const video = await Video.create({
        videoFile:{
            url:videoFile?.url,
            public_id:videoFile?.public_id
        },
        thumbnail: {
            url:thumbnail?.url || "",
            public_id: thumbnail?.public_id || ""
        },
        title,
        description,
        duration: videoFile.duration,
        owner: req.user._id,
    })
    console.log("CREATE PASSED:", video._id);

    const uploadedVideo =await Video.findById(video._id)
    
    if(!uploadedVideo){
        throw new ApiError(500, "Something went wrong while uploading the video")
    }
    return res
        .status(201)
        .json( new ApiResponse(200, uploadedVideo, "video uploaded sucessfully"))
  } catch (error) {
       
        if(videoFile){
            await deleteFromCloudinary(videoFile.public_id)
        }
        if(thumbnail){
            await deleteFromCloudinary(thumbnail.public_id)
        }
       
        throw new ApiError(500, "Something went wrong while uploading")
  }
})
const getUserVideos = asyncHandler(async (req, res) => {
    
    const userId = req.user._id;

    const videos = await Video.find({ owner: userId }).sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "User videos fetched successfully"));
});

const updateVideodetails = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: { title, description }
        },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video details updated successfully"));
});

const changeThumbnail = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    
    const oldPublicId = video.thumbnail?.public_id;

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail?.url) {
        throw new ApiError(500, "Something went wrong while uploading thumbnail");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: {
                    url: thumbnail.url,
                    public_id: thumbnail.public_id
                }
            }
        },
        { new: true }
    );

    if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId);
    }
    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Thumbnail updated successfully"));
});

const getVideoById = asyncHandler(async(req, res) => {
    const { videoId } = req.params;

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: { views: 1 }
        },
        { new: true }
    );
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $addToSet: { watchHistory: videoId }
        },
        
    );

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
});
const deleteUploadedVideo = asyncHandler(async(req,res)=>{
    const { videoId} = req.params;
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found");
    }
    const oldthumbnailPublicId = video.thumbnail?.public_id;
    const oldvideoPublicId = video.videoFile?.public_id;
    const deleteVideo = await Video.findByIdAndDelete(videoId);
    if (oldthumbnailPublicId) {
        await deleteFromCloudinary(oldthumbnailPublicId);
    }
    if (oldvideoPublicId) {
        await deleteFromCloudinary(oldvideoPublicId);
    }
    return res.status(200).json(new ApiResponse(200, deleteVideo, "video deleted successfully"));

})
export{
    uploadvideo,
    getUserVideos,
    updateVideodetails,
    changeThumbnail,
    getVideoById,
    deleteUploadedVideo
}