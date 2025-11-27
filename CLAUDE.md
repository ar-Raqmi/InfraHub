# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InfraHub is a React-based project management system for infrastructure projects at Majlis Perbandaran Selayang (MPS). It manages the complete lifecycle of construction projects from initial bidding through completion, including Bill of Quantities (BQ) management, contractor appointments, project execution, and payment claims.

The application is built using React 19.2, TypeScript, and Vite. It uses a mock service layer for data persistence via localStorage and supports comprehensive PDF/Excel export functionality for official documentation.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm preview
```

## Architecture

### Core Data Model

The application centers around the `Project` interface (types.ts:67-130) which tracks projects through 4 phases:

1. **Phase 1 (BQ Building & Asas)**: Project creation, complaint registration (aduan), and initial Bill of Quantities
2. **Phase 2 (File Creation & Lantikan)**: Contractor appointment, contract terms, and site handover
3. **Phase 3 (Pelarasan & Pelaksanaan)**: Project execution, BQ adjustments, LAD (late delivery penalties), and completion certification
4. **Phase 4 (Tuntutan & Closing)**: Payment claims, final accounts, and performance evaluation

### State Management

- **No Redux or external state management**: All state is managed via React hooks
- **Data persistence**: `mockService` (services/mockService.ts) provides localStorage-based persistence
- **Main application state**: Lives in App.tsx with projects array and user authentication state

### Key Components

- **App.tsx**: Main application wrapper with routing logic, user authentication, and year filtering
- **pages/ProjectDetail.tsx**: Core project editing interface with tabbed workflow (4 phases)
- **pages/BQEditor.tsx**: Bill of Quantities editor for initial project costing
- **pages/BQPelarasanEditor.tsx**: Adjusted BQ editor for project variations
- **components/AduanManager.tsx**: Manages multiple complaint (aduan) numbers per project
- **components/Sidebar.tsx**: Navigation with role-based menu items

### Service Layer

#### mockService (services/mockService.ts)
- Provides CRUD operations for projects and users
- Uses localStorage keys: 'infrahub_projects', 'infrahub_users', 'infrahub_current_user'
- Handles user authentication and session management
- Auto-generates ISO codes for projects

#### PDF Export (services/pdfExport/)
- **coverPagePDF.ts**: Generates project cover page
- **akuJanjiPDF.ts**: Generates contractor declaration form
- **bqPDF.ts**: Exports Bill of Quantities with calculations
- **bqPelarasanPDF.ts**: Exports adjusted BQ with variation tracking
- Uses html2pdf.js for PDF generation

#### Excel Export (services/excelExport/)
- **bqExcel.ts**: Exports BQ data to Excel format with proper formatting
- Uses exceljs library for spreadsheet generation

### Multi-Aduan System

Projects support multiple complaint numbers (aduan) with locations:
- New field: `aduanList: Aduan[]` (types.ts:79)
- Legacy fields maintained for backward compatibility: `noAduan`, `lokasi`, `aduan`
- Migration logic in ProjectDetail.tsx:64-80 converts old single-aduan format to new multi-aduan format

### Role-Based Access

Two user roles defined in types.ts:2-5:
- **ADMIN (PT - Pembantu Tadbir)**: Full system access
- **PJA (Penolong Jurutera Awam)**: Limited access, can only edit assigned projects

Role checks occur in component visibility and edit permissions throughout the application.

### Status Management

Project status (ProjectStatus enum, types.ts:7-12) follows the workflow:
1. MENUNGGU_LANTIKAN (Awaiting Appointment)
2. DALAM_PROSES (In Progress)
3. TUNTUTAN_BAYARAN (Payment Claim)
4. SIAP (Completed)

Auto-status calculation logic in ProjectDetail.tsx uses date fields to determine appropriate status.

## Key Features

### BQ Management
- Hierarchical structure: BQGroup contains BQItem array
- Items can be headers (bold titles) or calculation rows
- Automatic amount calculation: `qty × rate = amount`
- Support for custom units and formulas
- Both initial BQ and adjusted BQ (pelarasan) tracking

### Date Calculations
- Contract end date auto-calculated from start date + contract period (in days/weeks/months)
- LAD (late delivery penalty) days calculated from contract end vs actual completion
- Tempoh kontrak supports HARI, MINGGU, BULAN units (types.ts:14-18)

### Year Filtering
- YearSelector component filters projects by `tarikhBuka` (opening date)
- Applied globally across Dashboard, ProjectsList, and Calendar views

### Theme Support
- Dark mode toggle via ThemeToggle component
- Tailwind dark: classes throughout
- Animated background elements and glassmorphic UI

## Important Patterns

### Form Data Management in ProjectDetail
- Uses local `formData` state separate from prop
- Controlled inputs with `handleChange` helper
- Validates and formats dates, calculates derived fields
- Auto-status can be toggled on/off

### BQ Editor Pattern
- Groups have collapsible sections
- Items editable inline in table rows
- Add/remove items and groups dynamically
- Save triggers parent callback with updated data
- Export to PDF/Excel generates formatted documents

### PDF Generation
- Constructs HTML structure with styles
- Uses html2pdf.js with specific options for page breaks
- Generates filename with project details
- Called from ProjectDetail action buttons

## File Organization

```
/
├── App.tsx                 # Main app component with routing
├── index.tsx              # React root renderer
├── types.ts               # TypeScript interfaces and enums
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts
├── components/            # Reusable UI components
├── pages/                 # Page-level components
└── services/
    ├── mockService.ts     # Data persistence layer
    ├── pdfExport/         # PDF generation services
    └── excelExport/       # Excel export services
```

## Common Tasks

### Adding a New Project Field
1. Update `Project` interface in types.ts
2. Add form input in appropriate phase tab in ProjectDetail.tsx
3. Update `handleChange` to handle the new field
4. Update mockService if default/calculation logic needed
5. Update PDF exports if field should appear in documents

### Creating New PDF Export
1. Create new file in services/pdfExport/
2. Structure HTML with inline styles (external CSS not supported)
3. Export function that takes project/data and returns Promise
4. Use html2pdf with page break classes where needed
5. Add export to services/pdfExport/index.ts
6. Add action button in ProjectDetail.tsx

### Modifying BQ Structure
- BQ data structure defined in types.ts:38-56
- Both BQEditor and BQPelarasanEditor use same structure
- Changes must maintain backward compatibility with stored data
- Update PDF/Excel exports to match new structure

## Environment Variables

The application expects `GEMINI_API_KEY` in `.env.local` (referenced in README and vite.config.ts), though current code doesn't actively use Gemini API.

## Path Aliases

- `@/` resolves to project root (configured in vite.config.ts and tsconfig.json)
- Use for cleaner imports: `import { Project } from '@/types'`

## Styling

- Tailwind CSS with custom animations
- Glassmorphic design with `glass-effect` utility class
- Responsive design with mobile-first approach
- Dark mode via `dark:` variants
- Custom animations defined in index.html style block
