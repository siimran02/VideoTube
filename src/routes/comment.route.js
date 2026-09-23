import { Router } from  "express";
import { deleteComments, editComments, tweeetComments, videoComments } from "../controllers/comments.controller.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();
router.route("/video/:videoId").post(verifyJWT,videoComments);
router.route("/edit/:commentId").patch(verifyJWT,editComments);
router.route("/tweet/:tweetId").post(verifyJWT,tweeetComments);
router.route("/delete/:commentId").delete(verifyJWT, deleteComments);



export default router