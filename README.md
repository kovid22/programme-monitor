# Programme Monitor

Programme Monitor is a generic, lightweight analytics dashboard designed for operational tracking. It provides high-density visualizations of programme performance, delivery flows, and upcoming deadlines, helping teams easily identify risks and concentrate on value delivery.

## Tech Stack

The application is a pure client-side web application built with:
- **React 18**
- **TypeScript**
- **Vite**
- **Tailwind CSS v4**

## Key Capabilities

The `Overview` module currently provides:
- **Programme Health:** Top-level metrics summarizing overall status.
- **Delivery Calendar:** A 3-month rolling density calendar highlighting upcoming activity targets and peak weeks.
- **Needs Attention:** An actionable inbox for immediate/overdue work.
- **Value Concentration:** Identifies financial exposure across major programme workstreams.
- **Delivery Flow:** A proportional portfolio band visualization that maps activities and risk horizontally by Agency.

## Synthetic Demo Data

The dashboard currently uses synthetic fixture data (`mockActivities`) to demonstrate capabilities. This data generates dates relative to the current day, ensuring the dashboard always looks alive and populated. There is no real organization, location, or sensitive information present.

## Expected Data Schema

The dashboard expects a flat array of operational activities with the following generic fields:
- `id` (string)
- `component` (string, mapped to Workstream)
- `subComponent` (string, mapped to Sub-Workstream)
- `agency` (string)
- `title` (string)
- `targetDate` (string, ISO)
- `estValue` (number)
- `timelineStatus` ("On Track" | "Due Soon" | "Immediate" | "Overdue" | "TBC")
- `completionStatus` ("Completed" | "In Progress" | "Not Started" | "Delayed")

## Local Development

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## Production Build

To create an optimized production build:
```bash
cd frontend
npm run build
```
The compiled static assets will be output to the `frontend/dist` directory.

## Current Limitations

- State is currently managed locally (e.g., filters are not yet synced to URL parameters).
- There is no live backend or authentication logic.
- Mobile responsiveness is implemented at a high level but may require fine-tuning for complex charts on extremely small viewports.