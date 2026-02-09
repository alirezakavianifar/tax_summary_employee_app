# Tax Summary Frontend

Persian RTL form system built with Next.js 14, TypeScript, and Tailwind CSS.

## Tech Stack

- **Next.js 14** - App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - API client
- **React Hook Form** - Form management
- **Zod** - Validation

## Features

- ✅ Persian/Farsi language support
- ✅ RTL (Right-to-Left) layout
- ✅ Responsive design
- ✅ API integration with backend
- ✅ Form validation
- ✅ Print-ready layouts
- ✅ Modern UI with Tailwind CSS

## Getting Started

### Install Dependencies

```bash
cd frontend
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Project Structure

```
frontend/
├── app/                  # Next.js App Router
│   ├── layout.tsx       # Root layout with RTL
│   ├── page.tsx         # Home page
│   ├── globals.css      # Global styles
│   └── reports/         # Reports pages
│       ├── page.tsx     # List reports
│       └── create/      # Create report
├── lib/
│   └── api/             # API client
│       ├── client.ts    # Axios instance
│       ├── types.ts     # TypeScript types
│       └── reports.ts   # API functions
├── components/          # React components
├── public/              # Static assets
│   └── fonts/          # Persian fonts
└── package.json
```

## API Integration

The frontend connects to the backend API at `http://localhost:5000/api`

Endpoints used:
- GET `/employeereports` - List reports
- POST `/employeereports` - Create report
- GET `/employeereports/{id}` - Get report
- PUT `/employeereports/{id}` - Update report
- DELETE `/employeereports/{id}` - Delete report

## Persian Font

Uses **Vazirmatn** font for Persian text.

Download from: https://github.com/rastikerdar/vazirmatn

Place font files in `public/fonts/`:
- Vazirmatn-Regular.woff2
- Vazirmatn-Medium.woff2
- Vazirmatn-Bold.woff2

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Print Layout

The print layout is optimized for A4 paper size with exact dimensions matching the physical forms.

To print:
1. Navigate to report detail
2. Click "چاپ" (Print)
3. Use browser's print function

## Notes

- Backend must be running on port 5000
- Supports Persian text throughout
- RTL layout automatically applied
- Responsive for mobile and desktop

---

**Status:** ✅ Foundation Complete
Ready for additional features and components.
