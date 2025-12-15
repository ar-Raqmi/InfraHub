# InfraHub

> Infrastructure Project Management Workflow System for Majlis Perbandaran Selayang

<p align="center">
  <img src="https://i.imgur.com/8Smw9sf.png"
       alt="InfraHub Main Image"
       style="height:520px; width:auto; border-radius:6px;" />
</p>

**Note**: This system operates fully in **Bahasa Malaysia** (Malay language). This README is provided in English for broader accessibility, but all system documentation, forms, and workflows are in Bahasa Malaysia.

## Overview

InfraHub is a comprehensive project management documentation system designed to standardize and track infrastructure development projects under the Selayang Municipal Council (Majlis Perbandaran Selayang). The system manages workflows, documentation, and procedural steps for construction projects from initial planning through project completion and financial closure.

**Current Status**: Active Development (Work in Progress)

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with dark mode support
- **Build Tool**: Vite
- **Icons**: Lucide React
- **PDF Export**: html2pdf.js
- **Data Storage**: localStorage (mock service for development)

## Features

### Implemented

- **4-Phase Project Workflow** - Complete lifecycle management from BQ creation to project closure
- **Bill of Quantities (BQ) Editor** - Interactive editor with calculation parts, global dimensions, and library presets
- **BQ Pelarasan Editor** - Adjustment/revision editor with location-based dimensions
- **Aku Janji Generator** - Personal commitment letter document generation
- **Cover Page Editor** - Ulasan Pengarah document with meeting date integration
- **Certificate Generators**:
  - CPC Certificate (Sijil Siap Kerja) with DLP calculation
  - LAD Certificate (Liquidated Ascertained Damages) with auto-calculation
  - Prestasi Certificate (Borang Penilaian Prestasi) with scoring system
- **Project List** - Advanced filtering (Status, PJA, Zon, BP), column visibility toggle, CSV export
- **Admin Settings** - Year-based management of companies, vote numbers, sebutharga numbers, and meeting dates
- **Company Details Management** - Full company profile (address, owner, phone, gred, registration)
- **Role-Based Access** - Admin and PJA (Penolong Jurutera Awam) roles
- **Dark Mode** - Full dark theme support
- **Print/PDF Export** - Paginated output with orphan protection for headers

### Project Phases

#### Phase 1: BQ Building (Bill of Quantities)
Initial phase for creating Bill of Quantities and project specifications.

**Key Fields**: Cadangan Kerja, No Aduan, Lokasi, BP, Zon, PJA, Kos Projek, Tarikh Buka

**Components**: `BQEditor.tsx` - Full BQ editor with preset library, calculation parts, and print view

#### Phase 2: File Creation (Aku Janji)
Establishes formal contract and commitment documentation.

**Key Fields**: No Fail, Syarikat, Bulan, No Vot, No Sebutharga, Tarikh Lantikan, Tempoh Kontrak, Tarikh Mula/Tamat Kontrak

**Components**:
- `AkuJanjiEditor.tsx` - Aku Janji document generator
- `CoverPageEditor.tsx` - Ulasan Pengarah cover page

#### Phase 3: BQ Pelarasan (Adjustment)
Handles site inspections, work progress, and cost adjustments.

**Key Fields**: Tarikh Pemeriksaan, Tarikh Siap Sebenar, % Siap, Kos Sebenar, LAD

**Components**:
- `BQPelarasanEditor.tsx` - Adjustment BQ with location-based dimensions
- `LADCertificate.tsx` - LAD calculation and document
- `CPCCertificate.tsx` - Completion certificate with DLP dates
- `PrestasiCertificate.tsx` - Contractor performance evaluation

#### Phase 4: Closing File/Project
Final phase for project completion and financial closure.

**Key Fields**: Tarikh Hantar Kewangan, Tarikh Padanan, Wang Tahanan

## Project Structure

```
InfraHub/
├── App.tsx                 # Main application with routing
├── components/
│   └── YearSelector.tsx    # Year picker component
├── pages/
│   ├── Dashboard.tsx       # Main dashboard
│   ├── ProjectsList.tsx    # Project list with filters
│   ├── ProjectDetail.tsx   # Project detail view (all phases)
│   ├── BQEditor.tsx        # Bill of Quantities editor
│   ├── BQPelarasanEditor.tsx # BQ adjustment editor
│   ├── AkuJanjiEditor.tsx  # Aku Janji document
│   ├── CoverPageEditor.tsx # Cover page editor
│   ├── CPCCertificate.tsx  # CPC certificate
│   ├── LADCertificate.tsx  # LAD certificate
│   ├── PrestasiCertificate.tsx # Prestasi form
│   ├── AdminSettings.tsx   # System settings
│   ├── Calendar.tsx        # Calendar view
│   ├── Inbox.tsx           # Notifications
│   ├── Login.tsx           # Authentication
│   └── Profile.tsx         # User profile
├── services/
│   └── mockService.ts      # Data service with localStorage
├── data/
│   └── bqPresets.ts        # BQ library presets
├── types.ts                # TypeScript interfaces
└── index.html              # Entry point with print styles
```

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Default Users

| Username | Password | Role |
|----------|----------|------|
| syafiq | password | Admin |
| khairul | password | PJA |
| farhan | password | PJA |
| nursilmi | password | PJA |
| salam | password | PJA |

## Future Development

- Backend API integration (currently using localStorage mock)
- Database system (PostgreSQL/MySQL)
- User management interface
- Document archival system
- Mobile responsive improvements
- Offline capability

## Language Note

**System Language**: Bahasa Malaysia (Malay)
**Technical Documentation**: English with Malay term references

All forms, field names, and user-facing content are in Bahasa Malaysia to serve the primary users (municipal council staff and contractors).

## License

This project is developed for Majlis Perbandaran Selayang. Usage and distribution rights are subject to municipal council policies.
