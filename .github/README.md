# InfraHub

> Infrastructure Project Management Workflow System for Majlis Perbandaran Selayang

**Note**: This system operates fully in **Bahasa Malaysia** (Malay language). This README is provided in English for broader accessibility, but all system documentation, forms, and workflows are in Bahasa Malaysia.

## Overview

InfraHub is a comprehensive project management documentation system designed to standardize and track infrastructure development projects under the Selayang Municipal Council (Majlis Perbandaran Selayang). The system defines workflows, required documentation, and procedural steps for construction projects from initial planning through project completion and financial closure.

**Current Status**: Documentation and reference phase
**Future Vision**: Full software application implementation

## System Architecture

InfraHub implements a **4-phase workflow** for managing infrastructure projects. Each phase has specific fields, requirements, and deliverables.

### Phase 1: BQ Building (Bill of Quantities)

This initial phase focuses on creating the Bill of Quantities and project specifications.

**Key Fields**:
- **Cadangan Kerja** - Proposed work/project proposal
- **No Aduan** - Complaint/request number
- **Lokasi** - Project location
- **BP** - Budget proposal reference
- **Zon** - Zone/area designation
- **PJA** - Project officer assignment
- **Kos Projek** - Project cost estimate
- **Tarikh Buka** - Opening/start date

**Deliverables**:
- Bill of Quantities (BQ) document
- Project cover page
- Initial project specifications

### Phase 2: File Creation (Aku Janji - Personal Commitment)

This phase establishes the formal contract and commitment documentation.

**Key Fields**:
- **No Fail** - File number (auto-generated)
- **Syarikat** - Company/contractor name (dropdown selection)
- **Bulan** - Month (dropdown selection)
- **No Vot** - Vote/budget number (dropdown selection)
- **Tarikh Lantikan** - Appointment date (date field)
- **Tarikh BPP** - BPP date (auto-populated from Phase 1)
- **Tempoh Kontrak** - Contract duration (auto-populated)
- **Tarikh Mula Kontrak** - Contract start date (date field)
- **Tarikh Tamat Kontrak** - Contract end date (auto-calculated)
- **Tarikh Serah Tapak** - Site handover date (date field)
- **ISO** - ISO compliance checkbox

**Field Types**:
- Manual entry fields
- Dropdown selections
- Date pickers
- Auto-populated fields (from Phase 1 data)
- Auto-calculated fields

**Deliverables**:
- Aku Janji (Personal commitment letter)
- Contract documentation
- Site handover documentation

### Phase 3: BQ Pelarasan (BQ Adjustment/Revision)

This phase handles site inspections, work progress, and cost adjustments.

**Key Fields**:
- **Tarikh Pemeriksaan Tapak** - Site inspection date
- **Tarikh Siap** - Completion date
- **Prestasi** - Performance rating/assessment
- **Tarikh Tuntutan Bayaran** - Payment claim date
- **Kos Sebenar** - Actual cost (final cost calculation)

**Regular Updates**:
- **%Kerja di Tapak** - Percentage of work completed on site (ongoing tracking)

**Components**:
- Site inspection forms
- Progress reports
- Cost calculation adjustments
- Payment claim processing

**Deliverables**:
- Revised BQ (if needed)
- Site inspection reports
- Progress update reports
- Payment claims

### Phase 4: Closing File/Project

Final phase for project completion and financial closure.

**Key Fields**:
- **Tarikh Hantar ke Kewangan** - Date sent to Finance department
- **Tarikh Pemadanan** - Reconciliation/matching date

**Final Status**:
- **%Kerja di Tapak** - Final work completion percentage (should be 100%)

**Deliverables**:
- Project completion certificate
- Final financial reconciliation
- Closed project file
- Archive documentation

## Usage for Government Staff

### Current Usage (Documentation Phase)

1. **Review Workflow**: Study the workflow diagram to understand the complete project lifecycle
2. **Use Templates**: Reference the cover page and Aku Janji templates for project documentation
3. **Follow Phases**: Ensure all projects follow the 4-phase structure
4. **Complete Fields**: Verify all required fields are completed at each phase
5. **Track Progress**: Monitor %Kerja di Tapak throughout Phase 3 and 4

### Field Automation Notes

- **Auto-populated fields**: These pull data from previous phases (e.g., Tarikh BPP from Phase 1)
- **Auto-calculated fields**: These compute values based on other inputs (e.g., Tarikh Tamat Kontrak = Tarikh Mula Kontrak + Tempoh Kontrak)
- **Dropdown fields**: Limited selection from predefined options to ensure data consistency

## Future Development

This repository currently contains reference materials and workflow documentation. Future development plans include:

### Planned Features

1. **Web Application**
   - Digital forms for each phase
   - Automated field population and calculations
   - Workflow state management
   - User authentication and role-based access

2. **Database System**
   - Centralized project storage
   - Historical project tracking
   - Reporting and analytics
   - Document management

3. **Integration Capabilities**
   - Finance department integration
   - ISO compliance tracking
   - Automated notifications
   - Progress monitoring dashboards

4. **Mobile Access**
   - Site inspection mobile forms
   - Photo/documentation upload
   - Real-time progress updates
   - Offline capability

### Technology Considerations

Future implementation may include:
- Modern web framework (React, Vue, or similar)
- Backend API (Node.js, Python/Django, or similar)
- Database system (PostgreSQL, MySQL, or similar)
- Document storage solution
- Authentication system
- Report generation tools

## Language Note

**System Language**: Bahasa Malaysia (Malay)
**Technical Documentation**: English with Malay term references

All forms, field names, and user-facing content in the system are in Bahasa Malaysia to serve the primary users (municipal council staff and contractors). Technical implementation documentation may be bilingual to facilitate developer collaboration.

## License

This project is developed for Majlis Perbandaran Selayang. Usage and distribution rights are subject to municipal council policies.