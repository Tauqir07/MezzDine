import { useEffect,useState } from "react";
import { getMyKitchens,deleteKitchen } from "../../api/kitchen";
import { Link,useNavigate } from "react-router-dom";
import "../../styles/DashboardListings.css";
import PageLoader from "../../components/PageLoader";

export default function MyKitchens(){

const navigate=useNavigate();

const [kitchens,setKitchens]=useState([]);
const [loading,setLoading]=useState(true);
const [error,setError]=useState("");

useEffect(()=>{

getMyKitchens()
.then(res=>{
setKitchens(res.data.data);
})
.catch(err=>{
setError("Failed to load kitchens");
console.error(err);
})
.finally(()=>setLoading(false));

},[]);

if(loading) return <PageLoader />;
if(error) return <p>{error}</p>;

return(

<div className="dashboard-container">

<h2 className="dashboard-title">
My Kitchens
</h2>

{kitchens.length===0?(

<p className="empty-message">
No kitchens posted yet
</p>

):( 

<div className="dashboard-grid">

{kitchens.map(kitchen=>(

<div key={kitchen._id} className="dashboard-card">

{kitchen.images?.[0]&&(

<img
src={kitchen.images[0].url}
className="dashboard-image"
/>

)}

<div className="dashboard-content">

<h3>{kitchen.kitchenName}</h3>

<p>{kitchen.address}</p>

<div className="dashboard-actions">

<button
className="btn-edit"
onClick={()=>navigate(`/kitchens/edit/${kitchen._id}`)}
>
Edit
</button>

<button
className="btn-menu"
onClick={()=>navigate(`/kitchens/menu/${kitchen._id}`)}
>
Manage Menu
</button>

<Link
to={`/kitchens/${kitchen._id}`}
className="btn-view"
>
View
</Link>

<button
className="btn-delete"
onClick={async()=>{

if(window.confirm("Delete this kitchen?")){

await deleteKitchen(kitchen._id);

setKitchens(prev=>
prev.filter(k=>k._id!==kitchen._id)
);

}

}}
>
Delete
</button>

</div>

</div>

</div>

))}

</div>

)}

</div>

);

}