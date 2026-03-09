import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "./PostRoom.css";

export default function PostRoom(){

const navigate = useNavigate();

const [title,setTitle] = useState("");
const [description,setDescription] = useState("");
const [price,setPrice] = useState("");
const [address,setAddress] = useState("");
const [location,setLocation] = useState("");
const [amenities,setAmenities] = useState("");

const [listingType,setListingType] = useState("owner");

const [loading,setLoading] = useState(false);

async function handleSubmit(e){

e.preventDefault();

if(loading) return;

setLoading(true);

try{

await api.post("/rooms",{

title,

description,

price,

address,

location,

amenities: amenities.split(",").map(a=>a.trim()),

listingType

});

navigate("/rooms/my");

}
catch{

alert("Failed to create listing");

}
finally{

setLoading(false);

}

}

return(

<div className="post-room-page">

<div className="post-room-container">

<h2>Create Listing</h2>

<form onSubmit={handleSubmit} className="post-room-form">

<label>Listing Type</label>

<select

value={listingType}

onChange={(e)=>setListingType(e.target.value)}

className="post-room-input"

>

<option value="owner">

I am the property owner

</option>

<option value="roommate">

I am looking for roommate

</option>

</select>

<label>Title</label>

<input

value={title}

onChange={(e)=>setTitle(e.target.value)}

required

className="post-room-input"

/>

<label>Description</label>

<textarea

value={description}

onChange={(e)=>setDescription(e.target.value)}

required

className="post-room-input"

/>


<label>Price</label>

<input

type="number"

value={price}

onChange={(e)=>setPrice(e.target.value)}

required

className="post-room-input"

/>


<label>Address</label>

<input

value={address}

onChange={(e)=>setAddress(e.target.value)}

required

className="post-room-input"

/>


<label>Location</label>

<input

value={location}

onChange={(e)=>setLocation(e.target.value)}

required

className="post-room-input"

/>


<label>Amenities (comma separated)</label>

<input

value={amenities}

onChange={(e)=>setAmenities(e.target.value)}

className="post-room-input"

/>


<button

type="submit"

className="post-room-btn"

disabled={loading}

>

{loading ? "Posting..." : "Post Listing"}

</button>


</form>

</div>

</div>

);

}
