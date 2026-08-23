# Changelog

All notable changes to Programme Monitor will be documented in this file.

The format is inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), with releases grouped by meaningful product changes rather than individual commits.

## [Unreleased]

### Planned

* Continued UI and mobile refinement
* Expanded test coverage
* Additional deployment and reliability improvements

---

## [0.5.13] - 2026-08-24

### Added

* Product walkthrough documentation with dashboard and activity explorer screenshots
* Refreshed project README with a concise product overview and architecture summary
* Unified filtering experience across the Programme Overview and Activity Explorer
* Multi-category activity filtering for Workstream, Sub-Workstream, Agency, Timeline Status, and Completion Status
* Serial number sorting and improved multi-dimensional sorting behavior
* Dashboard-wide scope filtering for Overview analytics
* Activity drill-through from programme-level risk views
* Workstream Completion visualization
* Server-side Google Sheets caching with manual forced refresh
* Last-refreshed timestamp displayed in IST

### Changed

* Redesigned filtering and sorting interactions for improved usability
* Refined Delivery Calendar presentation and interactions
* Improved programme KPI presentation and dashboard hierarchy
* Reworked delivery-state and estimated-value visualizations
* Refined dark-mode contrast, semantic colors, risk styling, legends, and chart layout
* Improved empty states, filter counts, and reset behavior
* Strengthened visual consistency across Overview analytics cards

### Removed

* Previous Sankey-based delivery-flow visualization and related implementation leftovers

---

## [0.4.x] - 2026-08-21 to 2026-08-22

### Added

* Live programme-data backend using FastAPI and the Google Sheets API
* Activity Explorer / drill-down view
* Azure App Service deployment for the backend
* Azure Static Web Apps deployment for the frontend
* GitHub Actions deployment workflows
* Production frontend-to-backend API configuration

### Changed

* Refined Overview KPI presentation
* Expanded and refined the Delivery Calendar
* Improved Overview filtering and analytics
* Updated project documentation as the deployed architecture matured

### Fixed

* Production API URL exposure during frontend builds
* Azure backend deployment workflow configuration

---

## Initial Development - 2026-08-21

### Added

* Initial Programme Monitor application
* React and TypeScript frontend
* Core programme overview interface
* Initial project structure and configuration
* Azure Static Web Apps CI/CD setup

---

## Versioning

Programme Monitor is currently under active development.

Version numbers track meaningful iterations of the product as features, data workflows, and interface behavior evolve.
