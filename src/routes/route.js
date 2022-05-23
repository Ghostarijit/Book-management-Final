const express = require('express');
const router = express.Router();


const loginController = require("../controller/loginController")
const middleWare = require("../middleWare/auth")
const put = require("../controller/putController")
const dController = require("../controller/DeleteControlle")
const user = require("../controller/userController")
const post = require("../controller/bookController")
const get = require("../controller/GetController")
const postt = require("../controller/reviewController")



router.post("/register", user.createuser)

router.post("/login", loginController.loginUser)

router.post("/books",  post.createBooks)

router.post("/uplod",  post.upload)

router.get("/books", get.getBooks)

router.get("/books/:bookId", get.getBooksById)

router.put("/books/:bookId", middleWare.validateToken, put.updatebooks)

router.put("/books/:bookId/review/:reviewId", put.updatereview)

router.post("/books/:bookId/review", postt.reviewsData)

router.delete("/books/:bookId", middleWare.validateToken, dController.deletById)

router.delete("/books/:bookId/review/:reviewId", dController.reviewdelet)








module.exports = router;