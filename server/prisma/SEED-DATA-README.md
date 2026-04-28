# Database Seed Data System

This directory contains scripts and data files for seeding the PostgreSQL database with both default and extracted data.

## Files Overview

### Core Scripts
- **`seed.js`** - Main seeding script (intelligent - uses extracted data if available, falls back to defaults)
- **`seed-original.js`** - Backup of original seed script
- **`extract-seed-data.js`** - Extracts current database data to JSON files
- **`seed-from-data.js`** - Seeds database from extracted data files
- **`seed-comprehensive.js`** - Comprehensive seeding with both approaches

### Data Files
- **`seed-data/`** - Directory containing extracted database data
  - `combined-seed-data.json` - All extracted data in one file
  - `departments.json` - Department records
  - `users.json` - User records (without passwords)
  - `reportTemplates.json` - Report template records
  - `reportTemplateSections.json` - Template section records
  - `reports.json` - Report records
  - `reportSections.json` - Report section records
  - `templatePacks.json` - Template pack records
  - `templatePackItems.json` - Template pack item records
  - `sharedReportLinks.json` - Shared report link records
  - `globalSettings.json` - Global settings records
  - `extraction-summary.json` - Summary of extraction process

## Usage

### Standard Seeding
```bash
# Run the main seed script (recommended)
cd server && npm run seed

# Or run directly
node prisma/seed.js
```

### Extract Current Data
```bash
# Extract current database data to JSON files
node server/prisma/extract-seed-data.js
```

### Seed from Extracted Data
```bash
# Seed database using extracted data files
node server/prisma/seed-from-data.js
```

## How It Works

### Intelligent Seeding
The main `seed.js` script automatically:
1. Checks if extracted data exists in `seed-data/combined-seed-data.json`
2. If found, uses extracted data to recreate the exact database state
3. If not found, uses default hardcoded data

### Password Management
Since passwords are not stored in extracted data for security, the system uses predefined passwords based on usernames:
- `admin`: admin123
- `lead`: 123123
- `finance`: 123123
- `hr`: 123123
- `ops`: 123123
- `department`: dept123

### Data Extraction Process
1. Connects to current database
2. Extracts all records from each table
3. Removes sensitive data (password hashes)
4. Saves to individual JSON files
5. Creates combined file for easy loading
6. Generates summary report

## Database Schema Coverage

The system handles all database tables:
- ✅ Departments
- ✅ Users (with password regeneration)
- ✅ Report Templates
- ✅ Report Template Sections
- ✅ Reports
- ✅ Report Sections
- ✅ Template Packs
- ✅ Template Pack Items
- ✅ Shared Report Links
- ✅ Global Settings

## Benefits

1. **State Preservation**: Capture exact database state for reproduction
2. **Development Consistency**: All developers can work with same data
3. **Testing**: Reliable test data for automated testing
4. **Backup**: JSON files serve as data backup
5. **Migration**: Easy data migration between environments

## Security Considerations

- ⚠️ Password hashes are NOT included in extracted data
- ⚠️ Sensitive data should be reviewed before sharing seed files
- ⚠️ Consider .gitignore for production data extracts
- ✅ Default passwords are used for recreated users

## Development Workflow

1. **Initial Setup**: Run `npm run seed` to create initial data
2. **Development**: Add/modify data through the application
3. **Data Capture**: Run `extract-seed-data.js` to capture current state
4. **Team Sync**: Share extracted data with team
5. **Reproduction**: Team members run `npm run seed` to get exact data

## Files to Commit

- ✅ `seed.js` (main script)
- ✅ `extract-seed-data.js` (extraction script)
- ✅ This README
- ⚠️ `seed-data/` directory (depends on whether you want to share extracted data)

## Example: Capturing Development Data

```bash
# After making changes to database through UI
node server/prisma/extract-seed-data.js

# The extracted data will be used automatically next time seed.js runs
cd server && npm run seed
```

This system ensures your development database state can be reliably reproduced and shared across your team.