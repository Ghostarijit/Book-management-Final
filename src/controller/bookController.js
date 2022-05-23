const mongoose = require('mongoose');
const userModel = require("../model/userModel")
const bookModel = require("../model/bookModel")
const aws= require("aws-sdk")
const multer= require("multer");


// s3 and cloud stodare
//  step1: multer will be used to get access to the file in nodejs( from previous session learnings)
//  step2:[BEST PRACTISE]:- always write s2 upload function separately- in a separate file/function..exptect it to take file as input and return the uploaded file as output
// step3: aws-sdk install - as package
// step4: Setupconfig for aws authenticcation- use code below as plugin keys that are given to you
//  step5: build the uploadFile funciton for uploading file- use code below and edit what is marked HERE only


//PROMISES:-
// -you can never use await on callback..if you awaited something , then you can be sure it is within a promise
// -how to write promise:- wrap your entire code inside: "return new Promise( function(resolve, reject) { "...and when error - return reject( err )..else when all ok and you have data, return resolve (data)

aws.config.update({
    accessKeyId: "AKIAY3L35MCRVFM24Q7U",
    secretAccessKeyId: "qGG1HE0qRixcW1T1Wg1bv+08tQrIkFVyDFqSft4J",
    region: "ap-south-1"
})

let uploadFile= async ( file) =>{
   return new Promise( function(resolve, reject) {
    // this function will upload file to aws and return the link
    let s3= new aws.S3({apiVersion: '2006-03-01'}); // we will be using the s3 service of aws

    var uploadParams= {
        ACL: "public-read",
        Bucket: "classroom-training-bucket",  //HERE
        Key: "abc/" + file.originalname, //HERE 
        Body: file.buffer
    }


    s3.upload( uploadParams, function (err, data ){
        if(err) {
            return reject({"error": err})
        }
        console.log(data)
        console.log("file uploaded succesfully")
        return resolve(data.Location)
    })

    // let data= await s3.upload( uploadParams)
    // if( data) return data.Location
    // else return "there is an error"

   })
}

const upload = async function(req,res){
    
    let files= req.files
    if(files && files.length>0){
        //upload to s3 and get the uploaded link
        // res.send the link back to frontend/postman
        let uploadedFileURL= await uploadFile( files[0] )
        res.status(201).send({msg: "file uploaded succesfully", data: uploadedFileURL})
    }
    else{
        res.status(400).send({ msg: "No file found" })
    }
}

const createBooks = async function (req, res) {
    try {
        const data = req.body
        //  data validation  

       
      

    // Book creation

        if (!data || Object.keys(data).length === 0) return res.status(400).send({ status: false, msg: "plz enter some data" })

        let { title, userId, excerpt, ISBN, category, subcategory, reviews, releasedAt, isDeleted } = data
        // Book is same Book or not
        if (typeof ISBN !== "string") {
            return res.status(400).send({ status: false, msg: "ISBN datatype should be string" })
        }

        if (typeof title !== "string" || title.trim().length === 0) return res.status(400).send({ status: false, msg: "please enter valid titlee" });
        const check = await bookModel.findOne({ $or: [{ title: title?.trim() }, { ISBN: ISBN?.trim() }] })
        // console.table(check)
        if (check) return res.status(400).send({ status: false, msg: "this book already exist" })
        // authorId validation

        if (!userId) {
            return res.status(400).send({ status: false, msg: "userId must be present" })
        }
        if (typeof userId !== "string") {
            return res.status(400).send({ status: false, msg: "userId datatype should be string" })
        }
        
        let idCheck = mongoose.isValidObjectId(userId)
        userId = userId?.trim()
        //console.log(idCheck)
        if (!idCheck) return res.status(400).send({ status: false, msg: "userId is not a type of objectId" })

        const id = await userModel.findById(userId)
        if (!id) {
            return res.status(404).send({ status: false, msg: "this user is not present." })
        }
        //  accessing the payload authorId from request
        let token = req["userId"]

        //  authorization
        if (token != userId) {
            return res.status(403).send({ status: false, msg: "You are not authorized to access this data" })
        }
        //console.log(title)

        // title validation
        if (!title || title === undefined) {
            return res.status(400).send({ status: false, msg: "title is not given" })
        }
        if (typeof title !== "string" || title.trim().length === 0) return res.status(400).send({ status: false, msg: "please enter valid title" });
        title = title.trim()


        // releasedAt validation
        if (!releasedAt || releasedAt === undefined) {
            return res.status(400).send({ status: false, msg: "releasedAt is not given" })
        }
        if (typeof releasedAt !== "string" || releasedAt.trim().length === 0) return res.status(400).send({ status: false, msg: "please enter valid releasedAt and Should be in String" });

        let releasedAtt = /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(releasedAt.trim())
        if (!releasedAtt) {
            return res.status(400).send({ status: false, msg: " releasedAt YYYY/MM/DD or YYYY-MM-DD Format or Enter A valied Date " })
        }
        data.releasedAt = data.releasedAt.trim()

        // ISBN validation

        if (!ISBN || ISBN === undefined) {
            return res.status(400).send({ status: false, msg: "ISBN is not given" })
        }
        if (typeof ISBN !== "string") {
            return res.status(400).send({ status: false, msg: "ISBN datatype should be string" })
        }

        let ISBNN = /^\d{3}-?\d{10}/.test(ISBN.trim())
        if (!ISBNN) {
            return res.status(400).send({ status: false, msg: "ISBN is ony number and should be in format like XXX-XXXXXXXXXX" })
        }
        data.ISBN = data.ISBN.trim()
        //reviews Validation
        // if (!reviews || reviews === undefined) {
        // return res.status(400).send({ status: false, msg: "reviews is not given" })
        //  }

        // let reviewss = /^[0]$/.test(reviews)
        // if (!reviewss) {
        // return res.status(400).send({ status: false, msg: "Reviews is only 0 when u created" })
        // }
        // body validation
        if (!excerpt || excerpt === undefined) {
            return res.status(400).send({ status: false, msg: "excerpt is not Given" })
        }
        if (typeof excerpt !== "string" || excerpt.trim().length === 0) return res.status(400).send({ status: false, msg: "please enter valid excerpt" });
        data.excerpt = data.excerpt.trim()

        // category validation
        if (!category || category === undefined) {
            return res.status(400).send({ status: false, msg: "category must be present" })
        }

        if (typeof category !== "string" || category.trim().length === 0) return res.send({ status: false, msg: "please enter valid category" })
        data.category = data.category.trim()

        // if isdeleted key is present
        if (isDeleted) {

            if (typeof isDeleted !== "boolean") {
                return res.status(400).send({ status: false, msg: "isDeleted is boolean so,it can be either true or false" })
            }
            if (isDeleted === true) { data.deletedAt = Date.now() }

        }




        // subcategory validation
        if (!subcategory) return res.status(400).send({ status: false, msg: "subcategory should be present" })

        if (subcategory) {
            if (!Array.isArray(subcategory)) return res.status(400).send({ status: false, msg: "subcategory should be array of strings" })

            if (subcategory.some(sub => typeof sub === "string" && sub.trim().length === 0)) {
                return res.status(400).send({ status: false, message: " subcategory should not be empty or with white spaces" })
            }
            const subtrim = data.subcategory.map(element => {
                return element.trim()

            })

            data.subcategory = subtrim

        }
        console.log(data)



        // Book Creation
        const Book = await bookModel.create(data)
        return res.status(201).send({ status: true, data: Book })
    } catch (err) {
        res.status(500).send({ status: "error", error: err.message })
    }
}



module.exports.createBooks = createBooks

module.exports.upload = upload