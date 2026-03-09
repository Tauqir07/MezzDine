import Review from "../models/KitchenReview.js";


// CREATE REVIEW

export const createReview = async (req,res)=>{

const review = await Review.create({

room: req.params.roomId,

user: req.user.id,

rating: req.body.rating,

comment: req.body.comment

});

res.json(review);

};


// GET ROOM REVIEWS

export const getRoomReviews =
async (req,res)=>{

const reviews =
await Review.find({

room: req.params.roomId

}).populate("user","name");


res.json(reviews);

};
