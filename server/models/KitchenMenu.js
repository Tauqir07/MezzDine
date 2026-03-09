import mongoose from "mongoose";



/* =========================
   MEAL
========================= */

const mealSchema = new mongoose.Schema({

name:{
type:String,
default:""
},

image:{
url:{
type:String,
default:""
},
public_id:{
type:String,
default:""
}
}

},{ _id:false });



/* =========================
   DAY
========================= */

const daySchema = new mongoose.Schema({

day:{
type:String,
enum:[
"Monday",
"Tuesday",
"Wednesday",
"Thursday",
"Friday",
"Saturday",
"Sunday"
],
required:true
},

breakfast:{
type:mealSchema,
default:()=>({})
},

lunch:{
type:mealSchema,
default:()=>({})
},

dinner:{
type:mealSchema,
default:()=>({})
}

},{ _id:false });



/* =========================
   WEEK
========================= */

const weekSchema = new mongoose.Schema({

week:{
type:Number,
required:true
},

days:{
type:[daySchema],
default:[]
}

},{ _id:false });



/* =========================
   MAIN
========================= */

const kitchenMenuSchema = new mongoose.Schema({

kitchenId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Kitchen",
required:true,
unique:true
},

weeks:{
type:[weekSchema],
default:[]
}

},{ timestamps:true });



export default mongoose.model(
"KitchenMenu",
kitchenMenuSchema
);
