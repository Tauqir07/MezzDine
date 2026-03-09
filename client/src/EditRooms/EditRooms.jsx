import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import api from "../api/axios";
import "../styles/FormLayout.css";

const SKIP_KEYS = ["location", "images", "ownerId", "_id", "__v", "createdAt", "updatedAt", "reviews"];

export default function EditRoom() {

  const { roomId }  = useParams();
  const navigate    = useNavigate();

  const [form, setForm] = useState({
    title:            "",
    price:            "",
    address:          "",
    description:      "",
    bedrooms:         "",
    bathrooms:        "",
    beds:             "",
    amenities:        [],
    propertyType:     "",
    hostLanguage:     "",
    isAvailable:      true,
    genderPreference: "",
    listingType:      "",
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newImages,      setNewImages]      = useState([]);
  const [deletedImages,  setDeletedImages]  = useState([]);
  const [progress,       setProgress]       = useState(0);
  const [loading,        setLoading]        = useState(false);
  const [fetching,       setFetching]       = useState(true);

  // ── FETCH ROOM ──
  useEffect(() => { fetchRoom(); }, []);

  async function fetchRoom() {
    try {
      const res  = await api.get(`/rooms/${roomId}`);
      const room = res.data.data;
      setForm({
        title:            room.title            || "",
        price:            room.price            || "",
        address:          room.address          || "",
        description:      room.description      || "",
        bedrooms:         room.bedrooms         || "",
        bathrooms:        room.bathrooms        || "",
        beds:             room.beds             || "",
        amenities:        room.amenities        || [],
        propertyType:     room.propertyType     || "",
        hostLanguage:     room.hostLanguage     || "",
        isAvailable:      room.isAvailable      ?? true,
        genderPreference: room.genderPreference || "",
        listingType:      room.listingType      || "",
      });
      setExistingImages(room.images || []);
    } catch {
      alert("Failed to load room");
    } finally {
      setFetching(false);
    }
  }

  // ── INPUT HANDLER ──
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "amenities") {
      setForm(prev => ({
        ...prev,
        amenities: checked
          ? [...prev.amenities, value]
          : prev.amenities.filter(a => a !== value),
      }));
    } else if (type === "checkbox") {
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }

  // ── IMAGE COMPRESSION ──
  async function compress(file) {
    return imageCompression(file, {
      maxSizeMB: 0.7, maxWidthOrHeight: 1920, useWebWorker: true,
    });
  }

  // ── DROPZONE ──
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    onDrop: async acceptedFiles => {
      const compressed = await Promise.all(acceptedFiles.map(compress));
      setNewImages(prev => [...prev, ...compressed]);
    },
  });

  function deleteExisting(index) {
    const img = existingImages[index];
    setDeletedImages(prev => [...prev, img.public_id]);
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  }

  function deleteNew(index) {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  }

  // ── SUBMIT ──
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setProgress(0);

    try {
      const data = new FormData();

      Object.keys(form).forEach(key => {
        if (SKIP_KEYS.includes(key)) return;
        if (key === "amenities") {
          data.append("amenities", JSON.stringify(form.amenities));
        } else {
          data.append(key, form[key]);
        }
      });

      data.append("deletedImages", JSON.stringify(deletedImages));
      newImages.forEach(file => data.append("images", file));

      await api.put(`/rooms/${roomId}`, data, {
        onUploadProgress: e => {
          setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      alert("Room updated!");
      navigate("/rooms/my");
    } catch {
      alert("Update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <div className="form-page"><p>Loading…</p></div>;

  return (
    <div className="form-page">
      <div className="form-card">
        <h2>Edit Room</h2>

        <form onSubmit={handleSubmit} className="form-grid">

          {/* Title */}
          <div className="form-group">
            <label>Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Cozy 1BHK near ITER"
              required
            />
          </div>

          {/* Price */}
          <div className="form-group">
            <label>Monthly Rent (₹) *</label>
            <input
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              placeholder="e.g. 7000"
              required
            />
          </div>

          {/* Address */}
          <div className="form-group">
            <label>Address *</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Full address — used for map location"
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the room, neighbourhood, rules..."
            />
          </div>

          {/* Bedrooms / Bathrooms / Beds */}
          <div className="form-row-3">
            <div className="form-group">
              <label>Bedrooms</label>
              <input name="bedrooms" type="number" min="0"
                value={form.bedrooms} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Bathrooms</label>
              <input name="bathrooms" type="number" min="0"
                value={form.bathrooms} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Beds</label>
              <input name="beds" type="number" min="0"
                value={form.beds} onChange={handleChange} />
            </div>
          </div>

          {/* Property Type */}
          <div className="form-group">
            <label>Property Type</label>
            <select name="propertyType" value={form.propertyType} onChange={handleChange}>
              <option value="">Select type</option>
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Studio">Studio</option>
              <option value="PG">PG</option>
              <option value="Hostel">Hostel</option>
            </select>
          </div>

          {/* Gender Preference */}
          <div className="form-group">
            <label>Gender Preference</label>
            <select name="genderPreference" value={form.genderPreference} onChange={handleChange}>
              <option value="">Any</option>
              <option value="male">Male only</option>
              <option value="female">Female only</option>
              <option value="family">Family only</option>
            </select>
          </div>

          {/* Listing Type */}
          <div className="form-group">
            <label>Listing Type</label>
            <select name="listingType" value={form.listingType} onChange={handleChange}>
              <option value="">Select</option>
              <option value="rent">Rent</option>
              <option value="pg">PG</option>
              <option value="hostel">Hostel</option>
            </select>
          </div>

          {/* Host Language */}
          <div className="form-group">
            <label>Host Language</label>
            <select name="hostLanguage" value={form.hostLanguage} onChange={handleChange}>
              <option value="">Select</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Odia">Odia</option>
              <option value="Bengali">Bengali</option>
              <option value="Urdu">Urdu</option>
            </select>
          </div>

          {/* Amenities */}
          <div className="form-group">
            <label>Amenities</label>
            <div className="form-checkboxes">
              {["wifi", "kitchen", "bathroom", "parking", "ac", "washing machine", "tv"].map(a => (
                <label key={a} className="form-checkbox-label">
                  <input
                    type="checkbox"
                    name="amenities"
                    value={a}
                    checked={form.amenities.includes(a)}
                    onChange={handleChange}
                  />
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Available */}
          <div className="form-group">
            <label className="form-checkbox-label" style={{ fontWeight: 700 }}>
              <input
                type="checkbox"
                name="isAvailable"
                checked={form.isAvailable}
                onChange={handleChange}
              />
              Room is available
            </label>
          </div>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="form-group">
              <label>Current Images</label>
              <div className="form-img-grid">
                {existingImages.map((img, i) => (
                  <div key={i} className="form-img-wrap">
                    <img src={img.url} alt="" />
                    <button
                      type="button"
                      className="form-img-delete"
                      onClick={() => deleteExisting(i)}
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dropzone */}
          <div className="form-group">
            <label>Add New Images</label>
            <div {...getRootProps()} className={`file-upload ${isDragActive ? "active" : ""}`}>
              <input {...getInputProps()} />
              <span>{isDragActive ? "Drop here…" : "Drag & drop or click to upload"}</span>
            </div>
          </div>

          {/* New image previews */}
          {newImages.length > 0 && (
            <div className="form-group">
              <label>New Images</label>
              <div className="form-img-grid">
                {newImages.map((img, i) => (
                  <div key={i} className="form-img-wrap">
                    <img src={URL.createObjectURL(img)} alt="" />
                    <button
                      type="button"
                      className="form-img-delete"
                      onClick={() => deleteNew(i)}
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {loading && (
            <div className="form-group">
              <div className="form-progress-bar">
                <div className="form-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p style={{ fontSize: 13, color: "#888", margin: "6px 0 0" }}>{progress}% uploaded</p>
            </div>
          )}

          <button type="submit" className="form-submit" disabled={loading}>
            {loading ? "Saving…" : "Update Room"}
          </button>

        </form>
      </div>
    </div>
  );
}