import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import api from "../../api/axios";
import "../../styles/FormLayout.css";

const AMENITY_OPTIONS = [
  { value: "wifi",        label: "📶 WiFi"         },
  { value: "kitchen",     label: "🍳 Kitchen"       },
  { value: "bathroom",    label: "🚿 Bathroom"      },
  { value: "ac",          label: "❄️ AC"            },
  { value: "parking",     label: "🅿️ Parking"       },
  { value: "laundry",     label: "🧺 Laundry"       },
  { value: "furnished",   label: "🛋️ Furnished"     },
  { value: "geyser",      label: "🚿 Geyser"        },
];

export default function CreateRoom() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    title:            "",
    price:            "",
    address:          "",
    description:      "",
    location:         "",
    bedrooms:         "",
    bathrooms:        "",
    beds:             "",
    amenities:        [],
    propertyType:     "",
    hostLanguage:     "",
    isAvailable:      true,
    listingType:      "owner",
    genderPreference: "any",   // NEW
  });

  const [images, setImages]         = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [progress, setProgress]     = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "amenities") {
      setForm(prev => ({
        ...prev,
        amenities: checked
          ? [...prev.amenities, value]
          : prev.amenities.filter(a => a !== value)
      }));
    } else if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  async function compress(file) {
    return await imageCompression(file, {
      maxSizeMB: 0.7,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    });
  }

  const onDrop = async acceptedFiles => {
    const compressed = await Promise.all(acceptedFiles.map(compress));
    setImages(prev => [...prev, ...compressed]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    onDrop
  });

  function removeImage(index) {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (index === coverIndex) setCoverIndex(0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(form).forEach(key => {
        if (key === "amenities") {
          data.append("amenities", JSON.stringify(form.amenities));
        } else {
          data.append(key, form[key]);
        }
      });
      const ordered = [images[coverIndex], ...images.filter((_, i) => i !== coverIndex)];
      ordered.forEach(file => data.append("images", file));
      await api.post("/rooms", data, {
        onUploadProgress: e => {
          setProgress(Math.round((e.loaded * 100) / e.total));
        }
      });
      alert("Room Created");
      navigate("/rooms/my");
    } catch {
      setError("Upload Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-page">
      <div className="form-card">
        <h2>Create New Room</h2>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit} className="form-grid">

          <select name="listingType" value={form.listingType} onChange={handleChange}>
            <option value="owner">I am the room owner</option>
            <option value="roommate">I am looking for roommate</option>
          </select>

          {/* NEW: gender preference */}
          <select name="genderPreference" value={form.genderPreference} onChange={handleChange}>
            <option value="any">Open to Everyone</option>
            <option value="male">Males Only</option>
            <option value="female">Females Only</option>
          </select>

          <input name="title" placeholder="Room Title" value={form.title} onChange={handleChange} required />
          <input name="price" type="number" placeholder="Monthly Rent (₹)" value={form.price} onChange={handleChange} required />
          <input name="location" placeholder="Location" value={form.location} onChange={handleChange} />
          <input name="address" placeholder="Full Address" value={form.address} onChange={handleChange} required />
          <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} />
          <input name="bedrooms" type="number" placeholder="Bedrooms" value={form.bedrooms} onChange={handleChange} />
          <input name="bathrooms" type="number" placeholder="Bathrooms" value={form.bathrooms} onChange={handleChange} />
          <input name="beds" type="number" placeholder="Beds" value={form.beds} onChange={handleChange} />

          <select name="propertyType" value={form.propertyType} onChange={handleChange}>
            <option value="">Property Type</option>
            <option value="Apartment">Apartment</option>
            <option value="House">House</option>
            <option value="Studio">Studio</option>
          </select>

          <select name="hostLanguage" value={form.hostLanguage} onChange={handleChange}>
            <option value="">Host Language</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Urdu">Urdu</option>
            <option value="Bengali">Bengali</option>
            <option value="Odia">Odia</option>
          </select>

          <div className="form-group">
            <label className="group-label">Amenities</label>
            <div className="amenities-checkboxes">
              {AMENITY_OPTIONS.map(a => (
                <label key={a.value}>
                  <input
                    type="checkbox"
                    name="amenities"
                    value={a.value}
                    onChange={handleChange}
                  />
                  {a.label}
                </label>
              ))}
            </div>
          </div>

          <label>
            <input type="checkbox" name="isAvailable" checked={form.isAvailable} onChange={handleChange} />
            &nbsp;Available
          </label>

          <div {...getRootProps()} className="file-upload">
            <input {...getInputProps()} />
            Upload Images
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {images.map((img, index) => (
              <div key={index}>
                <img
                  src={URL.createObjectURL(img)}
                  width="100"
                  style={{ border: index === coverIndex ? "3px solid green" : "" }}
                />
                <button type="button" onClick={() => setCoverIndex(index)}>Cover</button>
                <button type="button" onClick={() => removeImage(index)}>Remove</button>
              </div>
            ))}
          </div>

          {loading && <progress value={progress} max="100" />}

          <button type="submit" className="form-submit" disabled={loading}>
            {loading ? "Creating..." : "Create Room"}
          </button>

        </form>
      </div>
    </div>
  );
}