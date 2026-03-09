import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "./CreateMenu.css";
import PageLoader from "../../components/PageLoader";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const EMPTY_WEEK = {
  week: 1,
  days: DAYS.map(day => ({
    day,
    breakfast: { name: "", image: null, preview: "" },
    lunch:     { name: "", image: null, preview: "" },
    dinner:    { name: "", image: null, preview: "" }
  }))
};


export default function CreateMenu() {

  const { kitchenId } = useParams();
  const navigate = useNavigate();

  const [menu, setMenu]       = useState(EMPTY_WEEK);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  

  /* ================= LOAD EXISTING MENU ================= */

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    try {
      setLoading(true);
      const res = await api.get(`/menu/${kitchenId}`);

      if (res.data.data?.weeks?.length) {
        const existing = res.data.data.weeks[0];
        setMenu({
          week: existing.week,
          days: existing.days.map(d => ({
            day: d.day,
            breakfast: { name: d.breakfast?.name || "", image: null, preview: d.breakfast?.image?.url || "" },
            lunch:     { name: d.lunch?.name     || "", image: null, preview: d.lunch?.image?.url     || "" },
            dinner:    { name: d.dinner?.name    || "", image: null, preview: d.dinner?.image?.url    || "" }
          }))
        });
      }
    } catch {}
    finally { setLoading(false); }
  }

  /* ================= HANDLE NAME CHANGE ================= */

  function handleNameChange(dayIndex, meal, value) {
    const updated = [...menu.days];
    updated[dayIndex][meal].name = value;
    setMenu({ ...menu, days: updated });
  }

  /* ================= HANDLE IMAGE ================= */

  function handleImage(dayIndex, meal, file) {
    const updated = [...menu.days];
    updated[dayIndex][meal].image   = file;
    updated[dayIndex][meal].preview = URL.createObjectURL(file);
    setMenu({ ...menu, days: updated });
  }

  /* ================= SAVE MENU ================= */

  async function saveMenu() {
    try {
      setSaving(true);

      const formData = new FormData();

      const weeks = [{
        week: 1,
        days: menu.days.map(d => ({
          day: d.day,

          // FIX: if no new image file is selected, send the existing Cloudinary
          // URL from preview so the controller knows to keep it.
          // Old code only sent { name } — so every meal without a new upload
          // lost its image on save.
          breakfast: {
            name: d.breakfast.name,
            ...(!d.breakfast.image && d.breakfast.preview
              ? { image: { url: d.breakfast.preview } }
              : {})
          },
          lunch: {
            name: d.lunch.name,
            ...(!d.lunch.image && d.lunch.preview
              ? { image: { url: d.lunch.preview } }
              : {})
          },
          dinner: {
            name: d.dinner.name,
            ...(!d.dinner.image && d.dinner.preview
              ? { image: { url: d.dinner.preview } }
              : {})
          }

        }))
      }];

      formData.append("weeks", JSON.stringify(weeks));

      // named image fields for any newly selected files
      menu.days.forEach((d, dayIndex) => {
        if (d.breakfast.image) formData.append(`image_${dayIndex}_breakfast`, d.breakfast.image);
        if (d.lunch.image)     formData.append(`image_${dayIndex}_lunch`,     d.lunch.image);
        if (d.dinner.image)    formData.append(`image_${dayIndex}_dinner`,    d.dinner.image);
      });

      await api.post(`/menu/${kitchenId}`, formData);

      alert("Menu Saved Successfully");
      navigate(`/kitchens/${kitchenId}`);

    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  }

  /* ================= UI ================= */

  if (loading) return <PageLoader />;

  return (
    <div className="cm-page">

      <h1>Create Weekly Menu</h1>

      {menu.days.map((day, dayIndex) => (

        <div key={day.day} className="cm-day">

          <h2>{day.day}</h2>

          {["breakfast", "lunch", "dinner"].map(meal => (

            <div key={meal} className="cm-meal">

              <h3>{meal}</h3>

              <input
                placeholder="Meal name"
                value={day[meal].name}
                onChange={e => handleNameChange(dayIndex, meal, e.target.value)}
              />

              <input
                type="file"
                accept="image/*"
                onChange={e => handleImage(dayIndex, meal, e.target.files[0])}
              />

              {day[meal].preview && (
                <img
                  src={day[meal].preview}
                  className="cm-preview"
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    marginTop: "6px",
                    display: "block"
                  }}
                />
              )}

            </div>

          ))}

        </div>

      ))}

      <button
        onClick={saveMenu}
        disabled={saving}
        className="cm-save"
      >
        {saving ? "Saving..." : "Save Full Week"}
      </button>

    </div>
  );
}