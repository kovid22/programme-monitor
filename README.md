# Programme Monitor

![Version](https://img.shields.io/badge/version-v0.5.13-black)
![Frontend](https://img.shields.io/badge/frontend-Azure%20Static%20Web%20Apps-blue)
![Backend](https://img.shields.io/badge/backend-Azure%20App%20Service-blue)

Programme Monitor is a lightweight operational analytics dashboard for tracking programme delivery, deadlines, risk, and value concentration.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- FastAPI
- Google Sheets
- Azure Static Web Apps
- Azure App Service

## Features

- Programme overview and delivery metrics
- Activity search, filtering, sorting, and detail view
- Live programme data from Google Sheets
- Manual data sync
- Responsive light and dark interfaces

## Architecture

```text
Google Sheets
    ↓
FastAPI / Azure App Service
    ↓
React / Azure Static Web Apps
```

## Local Development

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Environment examples are provided in the frontend and backend `.env.example` files.

## Status

The core application and live-data pipeline are deployed.

Frontend refinement and documentation are ongoing.
