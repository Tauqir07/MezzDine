import mongoose from "mongoose";

const kitchenSchema=new mongoose.Schema({

ownerId:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
required:true
},

kitchenName:{
type:String,
required:true
},

description:String,

address:{
type:String,
required:true
},

foodType:{
type:String,
enum:["veg","nonveg","both"],
required:true
},

halal:{
type:Boolean,
default:false
},
location: {
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
},
pausedDates: [
  {
    date:  { type: String, required: true }, // YYYY-MM-DD
    meals: {
      type: [String],
      enum: ["breakfast", "lunch", "dinner"],
      default: [], // empty = full day paused
    },
  }
],

maxSubscribers:{
type:Number,
required:true
},

currentSubscribers:{
type:Number,
default:0
},

oneMealPrice:Number,

twoMealPrice:Number,

threeMealPrice:Number,
upiId: { type: String, default: "" },
images:[
{
url:String,
public_id:String
}
],


},{
timestamps:true
});

const Kitchen = mongoose.models.Kitchen || mongoose.model("Kitchen", kitchenSchema);

export default Kitchen;