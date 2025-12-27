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

**Current Status**: Active Development (Integrated with Supabase Backend)

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Backend/Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS with dark mode support
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **PDF Export**: jsPDF & @react-pdf/renderer
- **Canvas Editing**: Konva (React-Konva) for image annotations

## Features

### Implemented

- **4-Phase Project Workflow** - Complete lifecycle management from BQ creation to project closure.
- **Bill of Quantities (BQ) Editor** - Interactive editor with calculation parts, global dimensions, and library presets.
- **BQ Pelarasan Editor** - Adjustment/revision editor with location-based dimensions for final measurements.
- **Image Report Generator** - Create "Laporan Bergambar" with built-in image cropping, rotation, and annotation tools (arrows, shapes, text).
- **Notice Generator** - Generate official notices:
    - Notis Pemberitahuan (Awam)
    - Notis Peringatan 1, 2, & 3
    - Perakuan Kerja Tidak Siap (CNC)
- **Aku Janji Generator** - Personal commitment letter document generation.
- **Cover Page Editor** - "Ulasan Pengarah" document with meeting date integration.
- **Certificate Generators**:
  - CPC Certificate (Sijil Siap Kerja) with DLP calculation.
  - LAD Certificate (Liquidated Ascertained Damages) with auto-calculation.
  - Prestasi Certificate (Borang Penilaian Prestasi) with scoring system.
- **Project List** - Advanced filtering (Status, PJA, Zon, BP), column visibility toggle, and data export.
- **Admin Settings** - Year-based management of companies, vote numbers (Vot), BQ templates, and system configurations.
- **Role-Based Access** - Admin, PJA (Penolong Jurutera), and Jurutera (Signers) roles.
- **Dark Mode** - Full dark theme support for all modules.

### Project Phases

#### Phase 1: BQ Building (Bill of Quantities)
Initial phase for creating Bill of Quantities and project specifications.

**Key Fields**: Cadangan Kerja, No Aduan, Lokasi, BP, Zon, PJA, Kos Projek, Tarikh Buka

**Components**: `BQEditor.tsx`, `BQTemplateCreator.tsx`

#### Phase 2: File Creation (Execution)
Establishes formal contract and commitment documentation.

**Key Fields**: No Fail, Syarikat, No Vot, No Sebutharga, Tarikh Lantikan, Tempoh Kontrak, Tarikh Mula/Tamat Kontrak

**Components**:
- `AkuJanjiEditor.tsx` - Aku Janji document generator
- `CoverPageEditor.tsx` - Ulasan Pengarah cover page
- `NotisGenerator.tsx` - Notification notices for public/contractors

#### Phase 3: BQ Pelarasan (Adjustment)
Handles site inspections, work progress, and cost adjustments.

**Key Fields**: Tarikh Pemeriksaan, Tarikh Siap Sebenar, % Siap, Kos Sebenar, LAD

**Components**:
- `BQPelarasanEditor.tsx` - Adjustment BQ with location-based dimensions
- `ImageReportGenerator.tsx` - Photo report with annotations
- `LADCertificate.tsx` - LAD calculation and document
- `CPCCertificate.tsx` - Completion certificate with DLP dates
- `PrestasiCertificate.tsx` - Contractor performance evaluation

#### Phase 4: Closing File/Project
Final phase for project completion and financial closure.

**Key Fields**: Tarikh Hantar Kewangan, Tarikh Padanan, Wang Tahanan

## Getting Started

```bash
# Install dependencies
npm install

# Setup Environment Variables (.env)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Run development server
npm run dev

# Seed Database (Optional)
npm run seed
```

## Database Schema

The system uses a PostgreSQL schema on Supabase with the following main tables:
- `projects`: Stores all project data, BQ JSON, and phase tracking.
- `app_users`: User profiles and roles.
- `system_settings`: Year-based configurations (companies, votes, templates).
- `library_groups`: BQ preset library items.
- `bulletins`: Dashboard announcements.

## Language Note

**System Language**: Bahasa Malaysia (Malay)
**Technical Documentation**: English with Malay term references

All forms, field names, and user-facing content are in Bahasa Malaysia to serve the primary users (municipal council staff and contractors).

## License

This project is developed for Majlis Perbandaran Selayang. Usage and distribution rights are subject to municipal council policies.
