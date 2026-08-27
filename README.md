# Programme Monitor

![Version](https://img.shields.io/badge/version-v0.6.11-black)
![Frontend](https://img.shields.io/badge/frontend-Firebase%20Hosting-orange)
![Backend](https://img.shields.io/badge/backend-Google%20Cloud%20Run-blue)

Programme Monitor is a lightweight operational analytics dashboard for tracking programme delivery, deadlines, risks, completion, and estimated value.

It uses Google Sheets as an accessible source of truth, with FastAPI handling validation and normalization before the data is visualized through a React dashboard.

## Preview

![Programme Monitor Overview](docs/screenshots/light_mode_preview.png)

For a detailed product walkthrough, see [`WalkThrough.md`](WalkThrough.md).

## Features

- **Programme overview dashboard** with completion, risk, value, and delivery metrics
- **Dashboard filtering** by Workstream, Sub-Workstream, and Agency
- **Activity explorer** with search, filtering, and multi-dimensional sorting
- **Activity detail drawer** for individual programme items
- **Timeline health states** including Overdue, Immediate, Due Soon, On Track, and TBC
- **Delivery calendar** with support for multiple activities on the same date
- **Google Sheets integration** for live programme data
- **Firebase Authentication** with backend access control
- **Manual data sync** with server-side caching
- **Responsive light and dark interfaces**

## Tech Stack

**Frontend**
- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Firebase Authentication
- Firebase Hosting
- Lucide React

**Backend & Infrastructure**
- FastAPI
- Python 3.14
- Google Sheets API
- Google Cloud Run
- Google Cloud service identity / Application Default Credentials

## Architecture

```text
Google Sheets
    ↓
FastAPI / Google Cloud Run
    ↑
Firebase Authentication
    ↑
React / Firebase Hosting
```

Programme data remains maintained in Google Sheets, while access to the deployed dashboard is authenticated through Firebase.

The backend validates Firebase ID tokens before returning programme data and restricts application access to approved users.

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
```

Activate the environment:

```bash
source venv/bin/activate
```

Windows:

```powershell
venv\Scripts\activate
```

Then run:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Environment examples are provided in:

```text
frontend/.env.example
backend/.env.example
```

## Documentation

See [`WalkThrough.md`](WalkThrough.md) for a deeper look at the interface, user flows, filtering, visualizations, architecture, authentication, and design decisions.

## Status

**v0.6.10** Firebase-authenticated production deployment running on Firebase Hosting and Google Cloud Run with Google Sheets as the source of truth.

## License

Licensed under the [MIT License](LICENSE).
