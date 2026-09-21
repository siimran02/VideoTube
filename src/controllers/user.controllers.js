import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"

import {User} from "../models/user.model.js"
import {subscription} from "../models/subcriptions.model.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
  
const generateAccessandRefreshToken = async(userId)=>{
    try{
        const user = await User.findById(userId);
        if(!user){
            throw new ApiError(406, "user doesn't exist");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        return {accessToken, refreshToken}
    }catch(error){
        console.log("TOKEN ERROR:", error);   // <-- ye add kar

        throw new ApiError(500, "Something went wrong while generating access and refresh tokens");
    }
   
}
const registerUser = asyncHandler(async(req,res)=>{
    const {fullname,email,username,password} = req.body ;
    if(
        [fullname, username, email, password].some((field)=> field?.trim()==="")
    ){
        throw new ApiError(400, "All fields are required");
    }
    const existedUser = await User.findOne({
        $or:[{email},{username}]
    })
    if(existedUser){
        throw new ApiError(409, "User with emailname or username already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path 
    const coverLocalPath = req.files?.coverImage?.[0]?.path 
   // if(!avatarLocalPath){
       // throw new ApiError(400,"Avatar file is missing")
    //}
   // const avatar = await uploadOnCloudinary(avatarLocalPath)
    //if(coverLocalPath){
        //const coverImage = await uploadOnCloudinary(coverLocalPath)
    //}
    let avatar;
    try{
        avatar = await uploadOnCloudinary(avatarLocalPath)
        console.log("Uploaded avatar",avatar)

    }catch(error){
        console.log("Error uploading avatar")
        throw new ApiError(500, "Failed to upload avatar")
    }
    let coverImage;
    try{
        coverImage = await uploadOnCloudinary(coverLocalPath)
        console.log("Uploaded coverimage",coverImage)

    }catch(error){
        console.log("Error uploading coverimage")
        throw new ApiError(500, "Failed to upload coverimage")
    }
    try{
        const user = await User.create({
            fullname,
            avatar:{
                url:avatar?.url,
                public_id:avatar?.public_id
            },
            coverImage: {
                url:coverImage?.url || "",
                public_id: coverImage?.public_id || ""
            },
            email,
            password,
            username: username.toLowerCase()
        })

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
        if(!createdUser){
            throw new ApiError(500, "Something went wrong while registering a user")
        }
        return res
            .status(201)
            .json( new ApiResponse(200, createdUser, "User registed sucessfully"))
    }catch(error){
        console.log("User Creation failed")
        if(avatar){
            await deleteFromCloudinary(avatar.public_id)
        }
        if(coverImage){
            await deleteFromCloudinary(coverImage.public_id)
        }
        -console.log("REGISTER ERROR:", error);   // <-- ye add karo

        throw new ApiError(500, "Something went wrong while registering a user and images were deleted")
        
    }

})
const loginUser = asyncHandler(async(req,res)=>{
    const { email, username, password} = req.body;
    if(!email){
        throw new ApiError(400, "Email is required");
    }
    const user =  await User.findOne({
        $or:[{username}, {email}]
    })
    if(!user){
        throw new ApiError(404, "User not found")
    }
    console.log(user.username, user.email, user.password);
    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials")
    }
    const {accessToken,refreshToken} = await generateAccessandRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id)
       .select("-password -refreshToken");
    if(!loggedInUser){
        throw new ApiError(500, "Something went wrong while login");
    }
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", 
    }
    return res
        .status(200)
        .cookie("accessToken",accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            200,
            {user: loggedInUser, accessToken, refreshToken},
            "user logged in successfully"
        ))
})
const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined,
            }
        },
        {new: true}
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {},"User logged out successfully"))
})
const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Refresh token is required")
    }
    try{
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user =await User.findById(decodedToken?._id)

        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
        if(incomingRefreshToken !==user?.refreshToken){
            throw new ApiError(401,"Invalid refresh token")
        }
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", 
        }

       const{accessToken, refreshToken:newRefreshToken} =await generateAccessandRefreshToken(user._id)
       return res
            .status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",newRefreshToken, options)
            .json(
                new ApiResponse(
                    200, 
                    {accessToken,
                        refreshToken:newRefreshToken
                    },
                    "Access token refreshed successfully"
                ));
    }catch(error){
        throw new ApiError(401,"Something went wrong while generating refresh token")
    }
})


const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid Password entered")
    }
    user.password = newPassword;

    await user.save({ validateBeforeSave: false})
    return res
        .status(200)
        .json(new ApiResponse(200, {},"Password change sucessfully"))




})
const getCurrentUser = asyncHandler(async(req,res)=>{
    
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user details"));

})
const updateAccountdetails = asyncHandler(async(req,res)=>{
    const {fullname, email} = req.body;
    if(!fullname || !email){
        throw new ApiError(401, "Fullname and email both are required");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname, 
                email: email,
            }
        },
        {new:true}
    ).select("-password -refreshToken");
    res
        .status(200)
        .json(new ApiResponse(200, user, "Data updated successfully"))

})
const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "File is required")
    }
     const oldAvatarUrl = req.user?.avatar.url;
     const oldpublic_id = req.user?.avatar.public_id;
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(500, "Something went wrong while uploading avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken")
    if(oldpublic_id){
        await deleteFromCloudinary(oldpublic_id)
    }
    res.status(200).json(new ApiResponse(200,user, "Avataruploaded successfully"))


})
const updateCoverImage = asyncHandler(async(req,res)=>{
    const coverLocalPath= req.file?.path;
    if(!coverLocalPath){
        throw new ApiError(400, "File is required")
    }
    const oldCoverImageUrl = req.user?.coverImage.url;
    const oldpublic_id = req.user?.coverImage.public_id;
    const coverImage = await uploadOnCloudinary(coverLocalPath)
    if(!coverImage.url){
        throw new ApiError(500, "Something went wrong while uploading coverImage")
    }
   
   
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken");

    if(oldpublic_id){
        await deleteFromCloudinary(oldpublic_id)
    }
    res.status(200).json(new ApiResponse(200,user, "CoverImage uploaded successfully"))

})
const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400, "Username is required")
    }

    const channel = await User.aggregate(
        [
            {
                $match:{
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup:{
                    from:"subscription",
                    localField:"_id",
                    foreignField: "channel",
                    as:"subscribers"
                },
            },
            {
                $lookup:{
                    from:"subscription",
                    localField:"_id",
                    foreignField:"subscriber",
                    as :"subscriberedTo"
                }
            },
            {
                $addFields:{
                    subscribersCount:{
                        $size:"$subscribers"
                    },
                    channelsSubscribedToCount:{
                        $size:"$subscriberedTo"
                    },
                    isSubscribed: {
                        $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                        }
                    }
                }
            },
            {
                $project:{
                    fullname:1,
                    username:1,
                    subscribersCount:1,
                    channelsSubsribedToCount:1,
                    isSubscribed:1,
                    coverImage:1,
                    email:1
                }
            }    
        ]
    )
    if(!channel?.length){
        throw new ApiError(404,"Channel not found")
    }
    return res.status(200).json(new ApiResponse(
        200,
        channel[0],
        "Channel profite fetched successfully"

    ))
})
const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField:"watchHistory",
                foreignField:"_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup:{
                            from: "users",
                            localField:"owner",
                            foreignField:"_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project:{
                                        fullname: 1,
                                        username : 1,
                                        avatar: 1
                                    }
                                },
                                {
                                    $addFields:{
                                        owner:{
                                            $first: "$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, user[0]?.watchHistory,"Watch history fetched successfully"))
})
export{
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountdetails,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}