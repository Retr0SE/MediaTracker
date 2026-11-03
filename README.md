# 🎬 KINEMIO - Premium Full-Stack Media Tracker

## Overview
Kinemio is a high-performance, containerized full-stack web application designed for tracking movies and TV series. Built with a strictly decoupled architecture, it leverages a robust Django REST Framework backend and a dynamic React frontend, seamlessly integrated with the OMDb API. The project focuses on industry-standard practices, including Redis caching, JWT authentication, and a premium Glassmorphism UI with custom zero-dependency SVG data visualization.

## 🚀 Architecture & Key Features

* **High-Load Caching (Cache-Aside Pattern):** 
  Integrated Redis caching for OMDb API queries to minimize external network requests and bypass rate limits. External data is cached with a 30-day TTL based on unique `imdb_id`. User profiles and media lists use strict cache invalidation on content creation, updates, or deletion events.
* **Strict Client-Server Decoupling:** 
  The backend handles pure business logic and responds with standardized HTTP status codes and English logs/errors. The React client independently intercepts these HTTP statuses (200, 201, 400, 429) to render localized UI feedback via a Global Context, ensuring the UI never breaks due to backend text changes.
* **Zero-Dependency SVG Analytics:** 
  Implemented a custom, mathematically accurate SVG Donut Chart for user genre analytics. By calculating `stroke-dasharray` and circumference dynamically in React, the application visualizes complex data without relying on heavy external libraries like Chart.js.
* **Premium UI/UX System:** 
  Features a Glassmorphism design language with GPU-accelerated CSS background animations (floating blobs), smooth 3D hover states, and centralized Toast notifications that persist across React Router navigations. Includes strict frontend validation (e.g., 5MB avatar size limits) to reduce server load.
* **Production-Ready Infrastructure:** 
  The entire stack is containerized using Docker and orchestrated via `docker-compose`, providing isolated environments for PostgreSQL, Redis, Django, and React.

## 🛠 Tech Stack

**Frontend:**
* React (Vite)
* React Router DOM
* Context API (Auth & Global Toasts)
* Pure CSS (Glassmorphism, SVG Animations)

**Backend:**
* Python / Django REST Framework (DRF)
* PostgreSQL (Relational Database)
* Redis (In-memory Caching)
* SimpleJWT (Authentication)

**DevOps & External Services:**
* Docker & Docker Compose
* OMDb API

## ⚙️ Local Setup & Installation

**1. Clone the repository:**
```bash
git clone [https://github.com/Retr0SE/MediaTracker.git](https://github.com/Retr0SE/MediaTracker.git)

cd kinemio

2. Configure Environment Variables:
Create a .env file in the root directory and specify your credentials:
Фрагмент коду

# Backend & DB
POSTGRES_DB=kinemio_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=db
POSTGRES_PORT=5432
REDIS_URL=redis://redis:6379/1

# External APIs
OMDB_API_KEY=your_omdb_key

# Frontend
VITE_API_URL=http://localhost:8000

3. Run with Docker Compose:
Bash

docker-compose up --build -d

The backend will be available at http://localhost:8000 and the React frontend at http://localhost:5173.

🔒 API Endpoints Overview

    */api/users/register/ - Register new account (with duplicate and validation handling)

    */api/token/ - Obtain JWT Access & Refresh tokens

    */api/users/profile/ - GET/PATCH user profile (handles multipart/form-data for avatars)

    */api/media/search/?q={query} - Live search proxy to OMDb via Redis cache

    */api/media/add/ - Add media to personal list

    */api/media/my-list/ - Retrieve user's tracked media

    */api/media/update/{id}/ - Patch status (completed, in_progress, planned, dropped) and score