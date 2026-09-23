import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"

import {User} from "../models/user.model.js"
import {Video} from "../models/video.model.js"
import { Playlist } from "../models/playlist.model.js"
import {Subscription} from "../models/subcriptions.model.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const createPlaylist = asyncHandler(async(req , res)=>{
    const { name, description } = req.body;
    if(!name || !description){
        throw new ApiError(400, "Name and description is required");
    }
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })
    if(!playlist){
        throw new ApiError(400, "Something went creating the playlist");
    }
     return res.status(200).json(new ApiResponse(200, playlist, "playlist created successfully"));
})

const addVideoToPlaylist =  asyncHandler(async(req,res)=>{
    const { playlistId} = req.params;
    const { videoIds } = req.body;
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "No playlist found");
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: { videos: { $each: videoIds } },
        }, {new:true}
    )
    if(!updatedPlaylist){
        throw new ApiError(400, "Sorry, cann't add video to the playlist")
    }
    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "videos are added to playlist successfully"));
})

const getPlaylist = asyncHandler(async(req,res)=>{
    const { playlistId } = req.params;
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400, "No playlist found");
    }
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetch successfully"));
})
const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!name || !description) {
        throw new ApiError(400, "Name and description is required");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not allowed to edit this playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: { name, description }
        },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"));
});
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not allowed to edit this playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: videoId }  
        },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist"));
});
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this playlist");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});
export{
    createPlaylist,
    addVideoToPlaylist,
    getPlaylist,
    updatePlaylist,
    removeVideoFromPlaylist,
    deletePlaylist
}