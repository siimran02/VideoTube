import { Router } from  "express";
import { createPlaylist, addVideoToPlaylist, getPlaylist, updatePlaylist,removeVideoFromPlaylist, deletePlaylist } from "../controllers/playlist.controller.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/create").post(verifyJWT, createPlaylist);
router.route("/addVideos/:playlistId").patch(verifyJWT, addVideoToPlaylist);
router.route("/getPlaylist/:playlistId").get(verifyJWT, getPlaylist);
router.route("/update/:playlistId").patch(verifyJWT, updatePlaylist);
router.route("/remove/:playlistId/:videoId").patch(verifyJWT, removeVideoFromPlaylist)
router.route("/deleteplaylist/:playlistId").delete(verifyJWT,deletePlaylist)

export default router;
