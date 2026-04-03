# MeZzDiNe

> A home kitchen subscription and room finder platform connecting home cooks with corporate employees and students seeking affordable meals and accommodation.

## About

MeZzDiNe bridges the gap between home cooks and people who need affordable, home-cooked daily meals — along with a place to stay. Designed specifically for corporate employees and students navigating new cities.

## Features

### 🍽️ Kitchen Subscriptions
- Browse nearby kitchens with photos, pricing, and weekly menus
- Flexible meal plans — 1, 2, or 3 meals/day
- UPI payments with screenshot upload
- Reviews, notifications & similar kitchen suggestions

###  Room Listings
- Filter by Male / Female / Family
- Browse photos and room details
- Interactive map to find nearby rooms
- Contact owners via in-app chat or WhatsApp

###  Chat & Notifications
- Real-time messaging via Socket.io
- WhatsApp deep-link with pre-filled messages
- Alerts for payments, subscriptions, and messages

###  Maps & Location
- Interactive map for kitchens and rooms
- Auto-geocoding of addresses
- Delivery location tracking for subscribers

### For Kitchen Owners
- Create listings with photos and weekly menus
- Approve/reject payments, manage subscribers
- Dashboard with subscriber overview and delivery map

###  General
- Role-based auth: subscriber / kitchen owner / room owner
- Similar listing suggestions on detail pages

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React / Next.js |
| Backend | Node.js + Express |
| Database | MongoDB |
| Real-time | Socket.io |
| Maps | Leaflet.js |
| Payments | UPI (manual approval) |

## Getting Started

```bash
## Running Locally
cd client && npm run dev
cd server && npm run dev
```



## Contributing

Pull requests are welcome. For major changes, please open an issue first.

© 2026 [Toukir Akhtar]. All rights reserved.
