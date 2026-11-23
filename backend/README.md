# AR Vision - Backend (Flask + SQLite)

Small JSON API for the AR Vision frontend. Data lives in `instance/ar_vision.db`
(SQLite); uploaded images are files in `uploads/` (never in the database).
Login uses JWT access tokens (Flask-JWT-Extended). Customers register in the app;
business (staff) accounts are created with a command (below).

## Setup (Windows, from this `backend` folder)

    py -m venv .venv
    .venv\Scripts\activate
    pip install -r requirements.txt
    copy .env.example .env      (only if .env does not exist yet)
    flask seed                  (creates tables, adds the 6 sample materials and the shop row)
    flask create-business-user  (asks for name, email and password: the shop's staff login)
    flask run                   (http://127.0.0.1:5000)

Business accounts:

    flask create-business-user                 (prompts; the password is hidden)
    flask create-business-user --reset         (existing email: make it business + set a new password)

You can pass `--name`, `--email` and `--password` as options, but typing the password
at the prompt keeps it out of your shell history. No accounts are created automatically.

macOS / Linux: `python3 -m venv .venv`, `source .venv/bin/activate`, then the same commands.

Tests: `pytest` (uses an in-memory database and a temporary uploads folder).

## API

Every response is JSON: `{"data": ...}` on success, `{"error": "message"}` with a
4xx/5xx status on failure. Field names are camelCase.

| Method | Path | Notes |
|---|---|---|
| GET | /api/health | Server and database check |
| POST | /api/auth/register | Customer account: `name`, `email`, `password` (8+ chars). Returns `{token, user}` |
| POST | /api/auth/login | `email`, `password`. Returns `{token, user}`. Wrong email and wrong password give the same message; repeated failures are blocked for a while |
| GET | /api/auth/me | Signed in |
| GET | /api/materials | Visible materials. `?include_hidden=true` (staff), `?category=`, `?q=` |
| GET | /api/materials/:id | |
| POST | /api/materials | Staff |
| PUT / PATCH | /api/materials/:id | Staff. PUT = all required fields, PATCH = some |
| DELETE | /api/materials/:id | Staff |
| GET | /api/scans | Signed in: your own saved visualisations |
| GET | /api/scans/:id | |
| POST | /api/scans | multipart: `room` (image), optional `thumbnail`, fields `name`, `materialName`, `corners` (JSON), `tilesX`, `tilesY`, `light` |
| PATCH | /api/scans/:id | Rename: `{"name": "..."}` |
| DELETE | /api/scans/:id | Also deletes its image files |
| GET / POST | /api/projects | Signed in: your own projects |
| GET / PATCH / DELETE | /api/projects/:id | |
| POST | /api/projects/:id/scans | `{"scanIds": [..]}` |
| DELETE | /api/projects/:id/scans/:scanId | |
| POST | /api/enquiries | Public quote request (linked to you if signed in; only signed-in customers can attach their own saved visualisations) |
| GET | /api/enquiries | Staff. `?status=new`, `?q=` |
| GET / PATCH | /api/enquiries/:id | Staff. PATCH `status`, `staffNote` |
| GET / PUT | /api/shop | Shop details; PUT is staff |
| POST | /api/uploads/materials | Staff. multipart `image`, returns `{url}` |
| GET | /api/uploads/:path | Serves uploaded files |

Prices: when the shop's `showPrices` is off, the public materials list returns
`pricePerSqFt: null`. Staff requests (`include_hidden=true`) always get prices.

Access: send `Authorization: Bearer <token>`. "Staff" routes need a business account
(401 without a token, 403 for customers). Scans and projects are private to their owner
(others get 404). Staff can read scans that customers attached to an enquiry. Image files
under /api/uploads are public, with long random file names.

## Security notes

- Login tokens are kept in the browser's localStorage in this version. Any script injected
  into the site could read them, so keep the frontend free of untrusted HTML/scripts.
- Use https in production, so tokens and passwords are never sent in plain text.
- Set a long random `JWT_SECRET_KEY` (and `SECRET_KEY`) in `.env`. The app refuses to start
  without `JWT_SECRET_KEY` unless `FLASK_DEBUG=1`. Changing it signs everyone out.
- Change or remove the sample data (materials, prices, the default shop row) before going live.
- Back up `instance/ar_vision.db` and the `uploads/` folder together; neither is in git.
- The failed-login limit is kept in memory: it resets when the server restarts and is per
  server process.

## Database changes later

Tables are created automatically (`AUTO_SETUP_DB=1`) or with `flask seed`. Databases created
before login existed get the new owner columns added automatically (`app/services/schema.py`);
scans and projects saved before then have no owner and are not shown to anyone.
Flask-Migrate is installed for later schema changes: `flask db init` once, then
`flask db migrate -m "..."` and `flask db upgrade`.
