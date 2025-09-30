# Hotel Comparison Website

Modern, minimalistic hotel comparison website built with React, TypeScript, Material-UI, and React Router.

## Features

- **Search Page**: Beautiful landing page with search form for hotels
- **Results Page**: List view of available hotels with pricing
- **Hotel Detail Page**: Detailed view of rooms and offers for each hotel
- **Real-time Updates**: Automatic polling for search results
- **Session Management**: Automatic session handling with the BaseAPI backend

## Tech Stack

- **React 19** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Material-UI** - Component library for modern UI
- **React Router** - Client-side routing
- **Vite** - Fast build tool and dev server

## Project Structure

```
src/
├── lib/
│   └── api.ts              # API client with session management
├── pages/
│   ├── SearchPage.tsx      # Search form page
│   ├── ResultsPage.tsx     # Hotel results list
│   └── HotelDetailPage.tsx # Hotel details with rooms
├── App.tsx                 # Main app with routing
├── main.tsx                # Entry point
└── index.css               # Global styles
```

## API Integration

The application connects to the BaseAPI backend running on `http://localhost:6953`.

### Key Features:

- **Session Management**: Automatically stores and sends `BASEAPISESSID` cookie
- **Type Safety**: TypeScript interfaces match API responses
- **Error Handling**: Graceful error messages throughout
- **Real-time Search**: Polls for results every 2 seconds until complete

## Routes

- `/` - Search page
- `/search/:searchId` - Results page with hotel list
- `/search/:searchId/hotel/:hotelId` - Hotel detail page

## Design

The design follows Apple's design language:

- **Minimalistic**: Clean white backgrounds with strategic use of color
- **Modern Typography**: System fonts with careful weight and spacing
- **Smooth Animations**: Subtle transitions and hover effects
- **Gradient Accents**: Purple gradient used for CTAs and highlights
- **Card-based UI**: Elevated cards with subtle shadows
- **Responsive**: Works on all screen sizes

## Development

The dev server should already be running. If not:

```bash
npm run dev
```

Visit `http://localhost:5173` to view the application.

## Usage Flow

1. Enter search criteria on the home page:
   - Location ID (UUID)
   - Check-in date (YYYY-MM-DD)
   - Check-out date (YYYY-MM-DD)
   - Number of guests (1-12)

2. View search results with hotels sorted by best price

3. Click on a hotel to see detailed room information with all available offers

4. Each offer shows:
   - Original price (if discounted)
   - Discount percentage
   - Effective price
   - Validity dates
   - Best deal highlighted