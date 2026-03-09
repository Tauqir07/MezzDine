import { useState } from "react";
import { createKitchen } from "../../api/kitchen";
import { useNavigate } from "react-router-dom";
import "../../styles/FormLayout.css";

export default function CreateKitchen(){

const navigate=useNavigate();

const [form,setForm]=useState({
kitchenName:"",
description:"",
address:"",
foodType:"",
halal:false,
maxSubscribers:"",
oneMealPrice:"",
twoMealPrice:"",
threeMealPrice:""
});

const [images,setImages]=useState([]);
const [preview,setPreview]=useState([]);
const [loading,setLoading]=useState(false);
const [error,setError]=useState("");

function handleChange(e){

const{name,value,type,checked}=e.target;

setForm({
...form,
[name]:type==="checkbox"?checked:value
});

}

function handleImageChange(e){

const files=[...e.target.files];

setImages(prev=>[...prev,...files]);

const previewUrls=
files.map(file=>URL.createObjectURL(file));

setPreview(prev=>[...prev,...previewUrls]);

}

function removeImage(index){

setImages(prev=>prev.filter((_,i)=>i!==index));

setPreview(prev=>prev.filter((_,i)=>i!==index));

}

async function handleSubmit(e){

e.preventDefault();

setError("");

setLoading(true);

try{

const data=new FormData();

data.append("kitchenName",form.kitchenName);

data.append("description",form.description);

data.append("address",form.address);

data.append("foodType",form.foodType);

data.append("halal",form.halal);

data.append(
"maxSubscribers",
Number(form.maxSubscribers)
);

if(form.oneMealPrice){

data.append(
"oneMealPrice",
Number(form.oneMealPrice)
);

}

if(form.twoMealPrice){

data.append(
"twoMealPrice",
Number(form.twoMealPrice)
);

}

if(form.threeMealPrice){

data.append(
"threeMealPrice",
Number(form.threeMealPrice)
);

}

images.forEach(img=>{

data.append("images",img);

});

await createKitchen(data);

alert("Kitchen created successfully");

navigate("/kitchens/my");

}
catch(err){

setError(
err.response?.data?.message
||
"Failed to create kitchen"
);

}
finally{

setLoading(false);

}

}

return(

<div className="form-page">

<div className="form-card">

<h2>Create New Kitchen</h2>

{error &&

<p className="form-error">
{error}
</p>
}

<form
onSubmit={handleSubmit}
className="form-grid"
>

<input
name="kitchenName"
placeholder="Kitchen Name"
value={form.kitchenName}
onChange={handleChange}
required
/>

<textarea
name="description"
placeholder="Description"
value={form.description}
onChange={handleChange}
/>

<input
name="address"
placeholder="Address"
value={form.address}
onChange={handleChange}
required
/>

<select
name="foodType"
value={form.foodType}
onChange={handleChange}
required
>

<option value="">
Food Type
</option>

<option value="veg">
Veg
</option>

<option value="nonveg">
Non-Veg
</option>

<option value="both">
Veg & Non-Veg
</option>

</select>

<label>

<input
type="checkbox"
name="halal"
checked={form.halal}
onChange={handleChange}
/>

Halal Food

</label>

<input
type="number"
name="maxSubscribers"
placeholder="Maximum Subscribers Capacity"
value={form.maxSubscribers}
onChange={handleChange}
required
/>

<input
type="number"
name="oneMealPrice"
placeholder="Price for 1 Meal / Day (Monthly)"
value={form.oneMealPrice}
onChange={handleChange}
/>

<input
type="number"
name="twoMealPrice"
placeholder="Price for 2 Meals / Day (Monthly)"
value={form.twoMealPrice}
onChange={handleChange}
/>

<input
type="number"
name="threeMealPrice"
placeholder="Price for 3 Meals / Day (Monthly)"
value={form.threeMealPrice}
onChange={handleChange}
/>

<label className="file-upload">

Upload Kitchen / Food Images

<input
type="file"
multiple
hidden
accept="image/*"
onChange={handleImageChange}
/>

</label>

<div
style={{
display:"flex",
gap:"10px",
flexWrap:"wrap"
}}
>

{preview.map((src,index)=>(

<div
key={index}
style={{
position:"relative"
}}
>

<img
src={src}
style={{
width:"100px",
height:"80px",
objectFit:"cover",
borderRadius:"8px",
border:"1px solid #ddd"
}}
/>

<button
type="button"
onClick={()=>removeImage(index)}
style={{
position:"absolute",
top:"-8px",
right:"-8px",
background:"red",
color:"white",
border:"none",
borderRadius:"50%",
width:"20px",
height:"20px",
cursor:"pointer"
}}
>

×

</button>

</div>

))}

</div>

<button
type="submit"
disabled={loading}
className="form-submit"
>

{loading
?
"Saving..."
:
"Create Kitchen"
}

</button>

</form>

</div>

</div>

);

}
