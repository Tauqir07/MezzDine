import { useState } from "react";
import "./RoomGallery.css";

export default function RoomGallery({ images = [] }) {

const [current,setCurrent]=useState(0);

const [fullscreen,setFullscreen]=useState(false);


if(!images.length)
return <p>No images</p>;



function next(){

setCurrent(

(current+1)%images.length

);

}


function prev(){

setCurrent(

(current-1+images.length)%images.length

);

}



return(

<div className="gallery">


{/* MAIN IMAGE */}


<div className="main-image-container">

<button
className="nav prev"
onClick={prev}
>
‹
</button>


<img

src={images[current].url}

className="main-image"

onClick={()=>setFullscreen(true)}

/>


<button
className="nav next"
onClick={next}
>
›
</button>


</div>



{/* THUMBNAILS */}


<div className="thumbnails">


{images.map((img,index)=>(


<img

key={index}

src={img.url}

className={
index===current
?
"thumb active"
:
"thumb"
}

onClick={()=>
setCurrent(index)
}


/>


))}


</div>



{/* FULLSCREEN */}


{fullscreen&&(

<div
className="fullscreen"
onClick={()=>
setFullscreen(false)
}
>


<img
src={images[current].url}
className="fullscreen-img"
/>


</div>

)}



</div>

);

}
