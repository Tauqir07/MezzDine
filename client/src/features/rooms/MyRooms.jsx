import { useEffect, useState } from "react";
import { getMyRooms, deleteRoom } from "../../api/rooms";
import "../../styles/DashboardListings.css";
import { useNavigate, Link } from "react-router-dom";
import Skeleton from "../../components/PageLoader";


export default function MyRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getMyRooms()
      .then(res => {
        setRooms(res.data.data);
      })
      .catch(err => {
        setError("Failed to load rooms");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  if(loading){ return( <div> <Skeleton type="title"/> <Skeleton type="image"/> <Skeleton type="text"/> <Skeleton type="text"/> </div> ); }
  if (error) return <p>{error}</p>;



  // rest of your code remains same


  return (
    <div className="dashboard-container">

      <h2 className="dashboard-title">My Rooms</h2>

      {rooms.length === 0 ? (
        <p className="empty-message">No rooms posted yet</p>
      ) : (

        <div className="dashboard-grid">

          {rooms.map(room => (

            <div key={room._id} className="dashboard-card">

              {/* CLICKABLE AREA */}
              <Link
                to={`/rooms/${room._id}`}
                className="dashboard-link"
              >

                {room.images?.[0] && (
                  <img
                    src={room.images[0].url}
                    alt="room"
                    className="dashboard-image"
                  />
                )}

                <div className="dashboard-content">

                  <h3>{room.title}</h3>
                  <p>₹{room.price}</p>
                  <p>{room.address}</p>

                </div>

              </Link>


              {/* ACTION BUTTONS */}
              <div className="dashboard-actions">

                {/* EDIT BUTTON */}
                <button
                  className="btn-edit"
                  onClick={() =>
                    navigate(`/rooms/edit/${room._id}`)
                  }
                >
                  Edit
                </button>
                <button onClick={() => navigate(`/rooms/dashboard/${room._id}`)}>
  📊 Dashboard
</button>


                {/* DELETE BUTTON */}
                <button
                  className="btn-delete"
                  onClick={async () => {

                    if (window.confirm("Delete this room?")) {

                      await deleteRoom(room._id);

                      setRooms(prev =>
                        prev.filter(r => r._id !== room._id)
                      );

                    }

                  }}
                >
                  Delete
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );

}
