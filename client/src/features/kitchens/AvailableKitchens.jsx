import { useEffect, useState } from "react";
import { getKitchens } from "../../api/kitchen";
import { Link } from "react-router-dom";
import "./AvailableKitchens.css";
import PageLoader from "../../components/PageLoader";
import { FaSearch } from "react-icons/fa";

export default function AvailableKitchens() {
  const [kitchens, setKitchens] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const [showFilterModal, setShowFilterModal] = useState(false);

  // ── Filters ──
  const [search,         setSearch]         = useState("");
  const [foodTypeFilter, setFoodTypeFilter] = useState("");
  const [halalFilter,    setHalalFilter]    = useState("");
  const [maxPrice,       setMaxPrice]       = useState(Infinity);
  const [mealPlan,       setMealPlan]       = useState(""); // "one" | "two" | "three"
  const [spotsAvailable, setSpotsAvailable] = useState(false);

  useEffect(() => {
    getKitchens()
      .then(res => setKitchens(res.data.data || []))
      .catch(() => setError("Failed to load kitchens"))
      .finally(() => setLoading(false));
  }, []);

  const activeFilterCount = [
    foodTypeFilter !== "",
    halalFilter !== "",
    maxPrice !== Infinity,
    mealPlan !== "",
    spotsAvailable,
  ].filter(Boolean).length;

  const filteredKitchens = kitchens.filter(kitchen => {
    const matchesSearch =
      kitchen.kitchenName?.toLowerCase().includes(search.toLowerCase()) ||
      kitchen.address?.toLowerCase().includes(search.toLowerCase());

    const matchesFoodType = foodTypeFilter === "" || kitchen.foodType === foodTypeFilter;
    const matchesHalal    = halalFilter    === "" || String(kitchen.halal) === halalFilter;
    const matchesSpots    = !spotsAvailable       || kitchen.currentSubscribers < kitchen.maxSubscribers;

    // ── Price filter: check against the meal plan's specific price ──
    // If a meal plan is selected, check that plan's price
    // If no meal plan selected, check the lowest price among all three
    let matchesPrice = true;
    if (maxPrice !== Infinity) {
      if (mealPlan === "one") {
        matchesPrice = (kitchen.oneMealPrice || 0) <= maxPrice;
      } else if (mealPlan === "two") {
        matchesPrice = (kitchen.twoMealPrice || 0) <= maxPrice;
      } else if (mealPlan === "three") {
        matchesPrice = (kitchen.threeMealPrice || 0) <= maxPrice;
      } else {
        // No meal plan selected — show if ANY plan fits the budget
        matchesPrice =
          (kitchen.oneMealPrice || 0) <= maxPrice ||
          (kitchen.twoMealPrice || 0) <= maxPrice ||
          (kitchen.threeMealPrice || 0) <= maxPrice;
      }
    }

    // ── Meal plan filter ──
    // If filtering by meal plan, only show kitchens that have that price set
    const matchesMealPlan = mealPlan === ""
      || (mealPlan === "one"   && kitchen.oneMealPrice)
      || (mealPlan === "two"   && kitchen.twoMealPrice)
      || (mealPlan === "three" && kitchen.threeMealPrice);

    return matchesSearch && matchesFoodType && matchesHalal &&
           matchesPrice && matchesMealPlan && matchesSpots;
  });

  function clearAll() {
    setFoodTypeFilter(""); setHalalFilter("");
    setMaxPrice(Infinity); setMealPlan(""); setSpotsAvailable(false);
  }

  // Helper: get the price to show based on selected meal plan, or lowest price
  function getDisplayPrice(kitchen) {
    if (mealPlan === "one"   && kitchen.oneMealPrice) return { price: kitchen.oneMealPrice, label: "1 meal/day" };
    if (mealPlan === "two"   && kitchen.twoMealPrice) return { price: kitchen.twoMealPrice, label: "2 meals/day" };
    if (mealPlan === "three" && kitchen.threeMealPrice) return { price: kitchen.threeMealPrice, label: "3 meals/day" };
    // No meal plan selected — show lowest available price as "starting from"
    const prices = [
      kitchen.oneMealPrice && { price: kitchen.oneMealPrice, label: "1 meal" },
      kitchen.twoMealPrice && { price: kitchen.twoMealPrice, label: "2 meals" },
      kitchen.threeMealPrice && { price: kitchen.threeMealPrice, label: "3 meals" },
    ].filter(Boolean);
    if (!prices.length) return null;
    return { ...prices.sort((a, b) => a.price - b.price)[0], from: true };
  }

  if (loading) return <PageLoader />;
  if (error)   return <p className="ak-error-msg">{error}</p>;

  return (
    <>
      <div className="ak-container">

        <h2 className="ak-page-title">Available Kitchens</h2>

        {/* ── Search bar ── */}
        <div className="ak-search-wrap">
          <div className="ak-search-bar">
            <span className="ak-search-icon"><FaSearch /></span>
            <input
              type="text"
              placeholder="Search by name or location…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="ak-filter-trigger" onClick={() => setShowFilterModal(true)}>
              ⚙ Filters
              {activeFilterCount > 0 && (
                <span className="ak-filter-badge">{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* ── Active filter chips ── */}
        {activeFilterCount > 0 && (
          <div className="ak-active-chips">
            {foodTypeFilter && (
              <span className="ak-chip">
                {foodTypeFilter === "veg" ? "🥦 Veg" : foodTypeFilter === "nonveg" ? "🍖 Non-Veg" : "🍱 Both"}
                <button onClick={() => setFoodTypeFilter("")}>✕</button>
              </span>
            )}
            {halalFilter && (
              <span className="ak-chip">
                {halalFilter === "true" ? "✅ Halal" : "❌ Non-Halal"}
                <button onClick={() => setHalalFilter("")}>✕</button>
              </span>
            )}
            {maxPrice !== Infinity && (
              <span className="ak-chip">
                💰 Under ₹{maxPrice}
                <button onClick={() => setMaxPrice(Infinity)}>✕</button>
              </span>
            )}
            {mealPlan && (
              <span className="ak-chip">
                🍴 {mealPlan === "one" ? "1 Meal/day" : mealPlan === "two" ? "2 Meals/day" : "3 Meals/day"}
                <button onClick={() => setMealPlan("")}>✕</button>
              </span>
            )}
            {spotsAvailable && (
              <span className="ak-chip">
                🟢 Spots available
                <button onClick={() => setSpotsAvailable(false)}>✕</button>
              </span>
            )}
          </div>
        )}

        {filteredKitchens.length === 0 ? (
          <div className="ak-empty">
            <span className="ak-empty__icon">🍽️</span>
            <p className="ak-empty__text">No kitchens match your filters</p>
          </div>
        ) : (
          <div className="ak-grid">
            {filteredKitchens.map(kitchen => {
              const displayPrice = getDisplayPrice(kitchen);
              return (
                <Link to={`/kitchens/${kitchen._id}`} key={kitchen._id} className="ak-card">
                  <div className="ak-card__image-wrap">
                    <img
                      src={kitchen.images?.[0]?.url || "/placeholder.png"}
                      alt={kitchen.kitchenName}
                      className="ak-card__image"
                    />
                    {kitchen.halal && (
                      <span className="ak-badge ak-badge--halal ak-badge--overlay">HALAL</span>
                    )}
                    {kitchen.maxSubscribers && (
                      <span className={`ak-spots-badge ${kitchen.currentSubscribers >= kitchen.maxSubscribers ? "ak-spots-badge--full" : "ak-spots-badge--open"}`}>
                        {kitchen.currentSubscribers >= kitchen.maxSubscribers
                          ? "Full"
                          : `${kitchen.maxSubscribers - kitchen.currentSubscribers} spots left`}
                      </span>
                    )}
                  </div>

                  <div className="ak-card__body">
                    <h3 className="ak-card__name">{kitchen.kitchenName}</h3>
                    <p className="ak-card__address">📍 {kitchen.address}</p>

                    <div className="ak-card__badges">
                      {kitchen.foodType === "veg"    && <span className="ak-badge ak-badge--veg">🥦 VEG</span>}
                      {kitchen.foodType === "nonveg"  && <span className="ak-badge ak-badge--nonveg">🍖 NON-VEG</span>}
                      {kitchen.foodType === "both"    && <span className="ak-badge ak-badge--both">🍱 VEG / NON-VEG</span>}
                    </div>

                    {/* ── Pricing rows ── */}
                    <div className="ak-card__pricing">
                      {kitchen.oneMealPrice && (
                        <div className={`ak-price-row ${mealPlan === "one" ? "ak-price-row--highlight" : ""}`}>
                          <span className="ak-price-label">🍴 1 meal/day</span>
                          <span className="ak-price-val">₹{kitchen.oneMealPrice}<small>/mo</small></span>
                        </div>
                      )}
                      {kitchen.twoMealPrice && (
                        <div className={`ak-price-row ${mealPlan === "two" ? "ak-price-row--highlight" : ""}`}>
                          <span className="ak-price-label">🍴🍴 2 meals/day</span>
                          <span className="ak-price-val">₹{kitchen.twoMealPrice}<small>/mo</small></span>
                        </div>
                      )}
                      {kitchen.threeMealPrice && (
                        <div className={`ak-price-row ${mealPlan === "three" ? "ak-price-row--highlight" : ""}`}>
                          <span className="ak-price-label">🍴🍴🍴 3 meals/day</span>
                          <span className="ak-price-val">₹{kitchen.threeMealPrice}<small>/mo</small></span>
                        </div>
                      )}
                    </div>

                    <div className="ak-card__footer">
                      {displayPrice && (
                        <span className="ak-card__price">
                          {displayPrice.from && <small>from </small>}
                          ₹{displayPrice.price}
                          <small>/mo</small>
                        </span>
                      )}
                      <span className="ak-card__subs">
                        👥 {kitchen.currentSubscribers}/{kitchen.maxSubscribers}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Filter Modal ── */}
      {showFilterModal && (
        <div className="ak-modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="ak-modal" onClick={e => e.stopPropagation()}>

            <div className="ak-modal__header">
              <h2>Filters</h2>
              <button className="ak-modal__close" onClick={() => setShowFilterModal(false)}>✕</button>
            </div>

            <div className="ak-modal__body">

              <div className="ak-filter-section">
                <h4>Food Type</h4>
                <div className="ak-option-group">
                  {[
                    { value: "",       label: "Any",     emoji: "🍽" },
                    { value: "veg",    label: "Veg",     emoji: "🥦" },
                    { value: "nonveg", label: "Non-Veg", emoji: "🍖" },
                    { value: "both",   label: "Both",    emoji: "🍱" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      className={`ak-option-btn ${foodTypeFilter === opt.value ? "ak-option-btn--active" : ""}`}
                      onClick={() => setFoodTypeFilter(opt.value)}
                    >
                      <span>{opt.emoji}</span>{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ak-filter-section">
                <h4>Halal Preference</h4>
                <div className="ak-option-group">
                  {[
                    { value: "",      label: "Any",       emoji: "🌐" },
                    { value: "true",  label: "Halal",     emoji: "✅" },
                    { value: "false", label: "Non-Halal", emoji: "❌" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      className={`ak-option-btn ${halalFilter === opt.value ? "ak-option-btn--active" : ""}`}
                      onClick={() => setHalalFilter(opt.value)}
                    >
                      <span>{opt.emoji}</span>{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meal plan + price together — selecting plan highlights that price */}
              <div className="ak-filter-section">
                <h4>Meals Per Day</h4>
                <p className="ak-filter-hint">Selecting a plan filters price for that plan only</p>
                <div className="ak-option-group">
                  {[
                    { value: "",      label: "Any",     emoji: "🍽" },
                    { value: "one",   label: "1 Meal",  emoji: "1️⃣" },
                    { value: "two",   label: "2 Meals", emoji: "2️⃣" },
                    { value: "three", label: "3 Meals", emoji: "3️⃣" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      className={`ak-option-btn ${mealPlan === opt.value ? "ak-option-btn--active" : ""}`}
                      onClick={() => setMealPlan(opt.value)}
                    >
                      <span>{opt.emoji}</span>{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ak-filter-section">
                <h4>Max Monthly Price</h4>
                <p className="ak-filter-hint">
                  {mealPlan
                    ? `Filtering price for ${mealPlan === "one" ? "1" : mealPlan === "two" ? "2" : "3"} meal/day plan`
                    : "Shows kitchens where any plan fits your budget"}
                </p>
                <div className="ak-option-group">
                  {[
                    { value: Infinity, label: "Any" },
                    { value: 2000,     label: "₹2000" },
                    { value: 4000,     label: "₹4000" },
                    { value: 6000,     label: "₹6000" },
                    { value: 10000,    label: "₹10000" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      className={`ak-option-btn ${maxPrice === opt.value ? "ak-option-btn--active" : ""}`}
                      onClick={() => setMaxPrice(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <input
                  type="range" min="0" max="10000" step="500"
                  value={maxPrice === Infinity ? 10000 : maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="ak-range"
                />
                <div className="ak-range-label">
                  {maxPrice === Infinity ? "No limit" : `Up to ₹${maxPrice}/mo`}
                </div>
              </div>

              <div className="ak-filter-section">
                <label className="ak-checkbox-label">
                  <input
                    type="checkbox"
                    checked={spotsAvailable}
                    onChange={() => setSpotsAvailable(s => !s)}
                  />
                  🟢 Show only kitchens with open spots
                </label>
              </div>

            </div>

            <div className="ak-modal__footer">
              <button className="ak-btn ak-btn--clear" onClick={clearAll}>Clear all</button>
              <button className="ak-btn ak-btn--apply" onClick={() => setShowFilterModal(false)}>Apply Filters</button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}