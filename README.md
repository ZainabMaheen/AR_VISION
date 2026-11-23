# AR Vision

AR Vision is a web app for stone businesses. Customers photograph their room, tap the 4 corners of a floor or wall, and preview marble, granite or tiles on it with correct perspective. They can save favourites, compare stones, keep saved visualisations in projects, and request a quote. Shop staff get a separate business area to manage stock and enquiries.

## Features

**Customer area**
- Dashboard with recommended materials
- Material catalogue with search and category filters
- AR room preview: take or upload a photo, mark a surface, preview the stone, adjust tile count and room lighting
- Favourites and compare (up to 3 stones)
- Save visualisations and group them into projects (requires an account)
- Scan history: reopen, rename or delete saved visualisations
- Quote request basket with an area calculator (area, wastage %), no payment
- Sign in and create account
- Settings: profile, workspace and measurement units

**Business area (`/business`)**
- Overview: material count, enquiries, visualisations attached to enquiries
- Stock manager: add, edit, hide, show and delete materials, with availability (in stock, made to order, out of stock)
- Enquiries: list, search, filter by status (new, quoted, confirmed, delivered), staff notes, attached visualisations
- Shop settings: shop name, logo, contact details, and "Show prices to customers"

Everything works on phones and desktops.

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React, Vite, TypeScript (strict), Tailwind CSS v4 |
| Routing and state | react-router-dom, zustand |
| Icons and font | lucide-react, Inter |
| AR | Photo-based. WebGL1 shader draws the stone inside the 4 tapped corners (perspective-correct), canvas-generated textures, `getUserMedia` for the camera |
| Backend | Flask, Flask-SQLAlchemy, Flask-Migrate, Flask-CORS, Flask-JWT-Extended, Pillow |
| Database | SQLite (`backend/instance/ar_vision.db`) |
| Images | Saved as files in `backend/uploads/`, only the path is stored in the database |

## Project structure

```
AR_VISION/
├── frontend/          React + Vite app
│   └── src/
│       ├── app/           router, layouts
│       ├── pages/         customer pages (and pages/business/)
│       ├── features/      ar, catalogue, cart, enquiries, scans, projects, auth, settings, business ...
│       ├── components/    layout, ui, common
│       ├── services/      apiClient, endpoints
│       └── lib/           constants, helpers, styles
└── backend/           Flask API
    ├── app/
    │   ├── models/        user, material, scan, project, enquiry, shop
    │   ├── routes/        auth, materials, scans, projects, enquiries, shop, uploads, health
    │   ├── services/      images, seed, schema
    │   └── utils/
    ├── instance/          SQLite database (not in git)
    ├── uploads/           stone and room images (not in git)
    └── tests/
```

## Getting started

You need Node.js 18 or newer and Python 3.10 or newer.

### 1. Backend

```powershell
cd backend
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
flask create-business-user
flask run
```

The API runs at `http://127.0.0.1:5000/api`. On first start the database tables are created and 6 sample materials are added automatically.

Open `.env` and set a strong `JWT_SECRET_KEY` before using the app anywhere other than your own machine.

### 2. Frontend

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`. The API address comes from `VITE_API_URL` in `frontend/.env` (default `http://127.0.0.1:5000/api`).

Keep both terminals running.

## Accounts

- **Customers** create an account on the site: **Sign in, then Create account**. Guests can browse, use the AR preview, favourites and compare, and request a quote. Saving visualisations and projects needs an account.
- **Business (staff)** accounts are created from the terminal, so visitors cannot make themselves staff:
  ```powershell
  cd backend
  .venv\Scripts\activate
  flask create-business-user
  ```
  To turn an existing account into a business account or reset its password, run `flask create-business-user --reset`.

Business users see a **Business view** link in the sidebar.

## How the AR preview works

1. Take a photo with the camera (needs `https` or `localhost`) or upload one.
2. A short "scan" animation plays. This is a visual effect only.
3. Tap the 4 corners of the wall or floor, in any order. Corners are re-ordered automatically.
4. A WebGL shader maps the stone texture onto that area with correct perspective, and keeps the room's own light and shadows. Adjust tiles across, tiles down and lighting, or drag the corner handles.
5. Save the visualisation to a project.

**Limits**
- Walls and floors are not detected automatically. The customer marks them.
- Stone textures are generated samples, not photos of the real stone.
- Previews are approximate. View a physical sample before ordering.
- The camera only works on `localhost` or `https`. Upload works everywhere.

## Testing on a phone

- **Layout only:** run `npm run dev -- --host` and open `http://<your-computer-ip>:5173` on the same Wi-Fi. Use **Upload**, because the camera is blocked on plain `http`.
- **Camera:** use an `https` tunnel (for example `npx cloudflared tunnel --url http://localhost:5173`), or on Android connect by USB and use Chrome's port forwarding to `localhost:5173`. If Vite blocks the tunnel address, add `server: { allowedHosts: ['.trycloudflare.com'] }` to `vite.config.ts`.

## API overview

All routes are under `/api` and return `{"data": ...}` or `{"error": "message"}`.

| Area | Routes |
|---|---|
| Health | `GET /health` |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Materials | `GET /materials` (public, visible only), `POST`, `PUT`, `PATCH`, `DELETE` (business), `POST /materials/restore-samples` (business) |
| Shop | `GET /shop` (public), `PUT /shop` (business) |
| Scans | `GET`, `POST`, `PATCH`, `DELETE /scans` (owner only; staff can read scans attached to enquiries) |
| Projects | `GET`, `POST`, `PATCH`, `DELETE /projects`, `POST` and `DELETE /projects/:id/scans` (owner only) |
| Enquiries | `POST /enquiries` (public), `GET` and `PATCH /enquiries` (business) |
| Uploads | `POST /uploads/materials` (business), `GET /uploads/<path>` (public) |

Prices are hidden from the public materials list unless the shop turns on "Show prices to customers".

## Security notes

- Passwords are hashed and never returned. Repeated failed logins are slowed down and blocked for a while.
- Tokens are stored in the browser's localStorage in this version. Use `https` in production.
- Set a strong `JWT_SECRET_KEY` and never commit `.env`.
- Back up `backend/instance/ar_vision.db` and `backend/uploads/`. Hosting needs a disk that persists.
- SQLite suits a single shop. For many shops, move to PostgreSQL (the code uses SQLAlchemy, so the change is small).

## Known limitations

- Favourites, compare, the quote basket and settings are stored in the browser, not on the server.
- Signing in from the AR page leaves the page, so an unsaved marked surface is lost.
- Customers see their past quote requests only in the browser they were sent from.
- The login attempt limit resets when the server restarts.
- Material images are set by link, so a material without one shows a generated texture.

## Roadmap

- Automatic wall and floor detection (check the model's licence allows commercial use first)
- Real stone photos instead of generated textures
- "My requests" page for customers, backed by the server
- Pagination for long lists
- Database migrations with Flask-Migrate
- Deployment guide

## Running the backend tests

```powershell
cd backend
.venv\Scripts\activate
pytest
```