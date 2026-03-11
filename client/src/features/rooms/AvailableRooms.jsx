import { useEffect, useState } from "react";
import { getRooms } from "../../api/rooms";
import { Link } from "react-router-dom";
import "./AvailableRooms.css";
import { FaWifi, FaSearch, FaUtensils, FaBath } from "react-icons/fa";
import Skeleton from "../../components/PageLoader";

export default function AvailableRooms() {
  const [rooms, setRooms]                         = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [error, setError]                         = useState("");

  const [search, setSearch]                       = useState("");
  const [showFilterModal, setShowFilterModal]     = useState(false);

  const [minPrice, setMinPrice]                   = useState(0);
  const [maxPrice, setMaxPrice]                   = useState(Infinity);

  const [bedrooms, setBedrooms]                   = useState(0);
  const [bathrooms, setBathrooms]                 = useState(0);
  const [beds, setBeds]                           = useState(0);

  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [propertyType, setPropertyType]           = useState("");
  const [hostLanguage, setHostLanguage]           = useState("");
  const [availableOnly, setAvailableOnly]         = useState(false);

  // ── NEW filters ──
  const [genderPreference, setGenderPreference]   = useState(""); // "male" | "female" | ""
  const [roommateOnly, setRoommateOnly]           = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const res  = await getRooms();
        const data = res.data.data || [];
        setRooms(data);
        if (data.length > 0) {
          const highestPrice = Math.max(...data.map(r => Number(r.price) || 0));
          setMaxPrice(highestPrice);
        } else {
          setMaxPrice(Infinity);
        }
      } catch (err) {
        setError("Failed to load rooms");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  // Count how many filters are active (for badge on filter button)
  const activeFilterCount = [
    minPrice > 0,
    maxPrice !== Infinity,
    bedrooms > 0,
    bathrooms > 0,
    beds > 0,
    selectedAmenities.length > 0,
    propertyType !== "",
    hostLanguage !== "",
    availableOnly,
    genderPreference !== "",
    roommateOnly,
  ].filter(Boolean).length;

  const filteredRooms = rooms.filter(room => {
    const locationStr =
      typeof room.location === "string"
        ? room.location
        : room.location
          ? Object.values(room.location).join(" ")
          : "";

    const matchesSearch =
      room.title?.toLowerCase().includes(search.toLowerCase())   ||
      room.address?.toLowerCase().includes(search.toLowerCase()) ||
      locationStr.toLowerCase().includes(search.toLowerCase());

    const matchesMinPrice     = room.price >= minPrice;
    const matchesMaxPrice     = maxPrice === Infinity || room.price <= maxPrice;
    const matchesBedrooms     = bedrooms  === 0 || room.bedrooms  >= bedrooms;
    const matchesBathrooms    = bathrooms === 0 || room.bathrooms >= bathrooms;
    const matchesBeds         = beds      === 0 || room.beds      >= beds;
    const matchesAmenities    = selectedAmenities.every(a => room.amenities?.includes(a));
    const matchesProperty     = propertyType === "" || room.propertyType === propertyType;
    const matchesLanguage     = hostLanguage === "" || room.hostLanguage  === hostLanguage;
    const matchesAvailability = !availableOnly || room.isAvailable === true;

    // ── NEW: gender — show rooms that accept this gender OR "any"
    const matchesGender = genderPreference === ""
      || room.genderPreference === genderPreference
      || room.genderPreference === "any"
      || !room.genderPreference;

    // ── NEW: roommate — show only rooms tagged as roommate listings
    const matchesRoommate = !roommateOnly || room.listingType === "roommate";

    return (
      matchesSearch && matchesMinPrice && matchesMaxPrice &&
      matchesBedrooms && matchesBathrooms && matchesBeds &&
      matchesAmenities && matchesProperty && matchesLanguage &&
      matchesAvailability && matchesGender && matchesRoommate
    );
  });

  function clearAll() {
    setMinPrice(0); setMaxPrice(Infinity);
    setBedrooms(0); setBathrooms(0); setBeds(0);
    setSelectedAmenities([]); setPropertyType("");
    setHostLanguage(""); setAvailableOnly(false);
    setGenderPreference(""); setRoommateOnly(false);
  }

  if (loading) return (
    <div className="ar-skeleton-wrap">
      <Skeleton type="title" />
      <Skeleton type="image" />
      <Skeleton type="text" />
      <Skeleton type="text" />
    </div>
  );

  if (error) return <p className="ar-error-msg">{error}</p>;

  return (
    <>
      <div className="ar-container">

        <h2 className="ar-page-title">Available Rooms</h2>

        <div className="ar-search-wrap">
          <div className="ar-search-bar">
            <span className="ar-search-icon"><FaSearch /></span>
            <input
              type="text"
              placeholder="Search by city, address or title…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="ar-filter-trigger" onClick={() => setShowFilterModal(true)}>
              ⚙ Filters
              {activeFilterCount > 0 && (
                <span className="ar-filter-badge">{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* ── Active filter chips ── */}
        {(genderPreference || roommateOnly) && (
          <div className="ar-active-chips">
            {genderPreference && (
              <span className="ar-chip">
                {genderPreference === "male" ? "👨 Male only" : "👩 Female only"}
                <button onClick={() => setGenderPreference("")}>✕</button>
              </span>
            )}
            {roommateOnly && (
              <span className="ar-chip">
                🤝 Roommate listings
                <button onClick={() => setRoommateOnly(false)}>✕</button>
              </span>
            )}
          </div>
        )}

        {filteredRooms.length === 0 ? (
          <div className="ar-empty">
            <span className="ar-empty__icon">🏠</span>
            <p className="ar-empty__text">No rooms found</p>
          </div>
        ) : (
          <div className="ar-grid">
            {filteredRooms.map(room => (
              <Link to={`/rooms/${room._id}`} key={room._id} className="ar-card">
                {room.images?.[0] && (
                  <div className="ar-card__image-wrap">
                    <img src={room.images[0].url} alt={room.title} className="ar-card__image" />
                    {/* ── Room type badges on image ── */}
                    <div className="ar-card__badges">
                      {room.listingType === "roommate" && (
                        <span className="ar-card__badge ar-card__badge--roommate">🤝 Roommate</span>
                      )}
                      {room.genderPreference && room.genderPreference !== "any" && (
                        <span className="ar-card__badge ar-card__badge--gender">
                          {room.genderPreference === "male" ? "👨 Male" : "👩 Female"}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div className="ar-card__body">
                  <h3 className="ar-card__title">{room.title}</h3>
                  <p className="ar-card__address">{room.address}</p>
                  <div className="ar-card__footer">
                    <span className="ar-card__price">₹{room.price}<small>/mo</small></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Filter Modal ── */}
      {showFilterModal && (
        <div className="ar-modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="ar-modal" onClick={e => e.stopPropagation()}>

            <div className="ar-modal__header">
              <h2>Filters</h2>
              <button className="ar-modal__close" onClick={() => setShowFilterModal(false)}>✕</button>
            </div>

            <div className="ar-modal__body">

              {/* ── NEW: Roommate filter ── */}
              <div className="ar-filter-section">
                <h4>Listing Type</h4>
                <label className="ar-checkbox-label">
                  <input
                    type="checkbox"
                    checked={roommateOnly}
                    onChange={() => setRoommateOnly(!roommateOnly)}
                  />
                  🤝 Show roommate listings only
                </label>
              </div>

              {/* ── NEW: Gender preference ── */}
              <div className="ar-filter-section">
                <h4>Gender Preference</h4>
                <p className="ar-filter-hint">Show rooms that accept your gender</p>
                <div className="ar-gender-options">
                  {[
                    { value: "",       label: "Any",    emoji: "👥" },
                    { value: "male",   label: "Male",   emoji: "👨" },
                    { value: "female", label: "Female", emoji: "👩" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      className={`ar-gender-btn ${genderPreference === opt.value ? "ar-gender-btn--active" : ""}`}
                      onClick={() => setGenderPreference(opt.value)}
                    >
                      <span>{opt.emoji}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ar-filter-section">
                <h4>Price Range</h4>
                <div className="ar-price-inputs">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={e => Number(e.target.value) <= maxPrice && setMinPrice(Number(e.target.value))}
                  />
                  <span>—</span>
                  <input
                    type="number"
                    value={maxPrice === Infinity ? "" : maxPrice}
                    placeholder="Max"
                    onChange={e => Number(e.target.value) >= minPrice && setMaxPrice(Number(e.target.value))}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="20000"
                  value={maxPrice === Infinity ? 20000 : maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="ar-range"
                />
              </div>

              <div className="ar-filter-section">
                <h4>Rooms & Beds</h4>
                <Counter label="Bedrooms"  value={bedrooms}  setValue={setBedrooms}  />
                <Counter label="Bathrooms" value={bathrooms} setValue={setBathrooms} />
                <Counter label="Beds"      value={beds}      setValue={setBeds}      />
              </div>

              <div className="ar-filter-section">
                <h4>Amenities</h4>
                <div className="ar-amenities-grid">
                  <AmenityButton icon={<FaWifi />}     label="WiFi"        active={selectedAmenities.includes("wifi")}     onClick={() => toggleAmenity("wifi")}     />
                  <AmenityButton icon={<FaUtensils />} label="Kitchen"     active={selectedAmenities.includes("kitchen")}  onClick={() => toggleAmenity("kitchen")}  />
                  <AmenityButton icon={<FaBath />}     label="1+ Bathroom" active={selectedAmenities.includes("bathroom")} onClick={() => toggleAmenity("bathroom")} />
                </div>
              </div>

              <div className="ar-filter-section">
                <h4>Property Type</h4>
                <select value={propertyType} onChange={e => setPropertyType(e.target.value)} className="ar-select">
                  <option value="">Any</option>
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Studio">Studio</option>
                </select>
              </div>

              <div className="ar-filter-section">
                <h4>Host Language</h4>
                <select value={hostLanguage} onChange={e => setHostLanguage(e.target.value)} className="ar-select">
                  <option value="">Any</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Urdu">Urdu</option>
                </select>
              </div>

              <div className="ar-filter-section">
                <label className="ar-checkbox-label">
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={() => setAvailableOnly(!availableOnly)}
                  />
                  Available Only
                </label>
              </div>

            </div>

            <div className="ar-modal__footer">
              <button className="ar-btn ar-btn--clear" onClick={clearAll}>
                Clear all
              </button>
              <button className="ar-btn ar-btn--apply" onClick={() => setShowFilterModal(false)}>
                Apply Filters
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

/* ── Sub-components ── */

function Counter({ label, value, setValue }) {
  return (
    <div className="ar-counter">
      <span className="ar-counter__label">{label}</span>
      <div className="ar-counter__controls">
        <button onClick={() => setValue(Math.max(0, value - 1))}>−</button>
        <span>{value === 0 ? "Any" : value + "+"}</span>
        <button onClick={() => setValue(value + 1)}>+</button>
      </div>
    </div>
  );
}

function AmenityButton({ icon, label, active, onClick }) {
  return (
    <button className={`ar-amenity${active ? " ar-amenity--active" : ""}`} onClick={onClick}>
      <span className="ar-amenity__icon">{icon}</span>
      {label}
    </button>
  );
}