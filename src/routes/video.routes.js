import { Router } from  "express";

import {
  uploadvideo,
  getUserVideos,
  updateVideodetails, 
  changeThumbnail, 
  getVideoById, 
  deleteUploadedVideo
} from "../controllers/video.controllers.js";

import {upload} from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/upload").post(
  verifyJWT,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  uploadvideo
);
router.route("/my-videos").get(verifyJWT, getUserVideos);
router.route("/updatedetails/:videoId").patch(verifyJWT, updateVideodetails);
router.route("/thumbnail/:videoId").patch(verifyJWT,  upload.single("thumbnail"),changeThumbnail);
router.route("/watchVideo/:videoId").get(verifyJWT, getVideoById);
router.route("/delete/:videoId").delete(verifyJWT, deleteUploadedVideo)

export default router;