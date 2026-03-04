# Presidency Result Report Generator

## Project info

**Author**: Aadhithyan

## Overview

This application generates result analysis reports for Presidency University. It allows uploading CSV result data, visualizing statistics, and exporting reports to PDF and PowerPoint formats.

## Features

- **CSV Upload**: Parse and validate student result data.
- **Data Visualization**: Interactive charts for CGPA, SGPA, and pass/fail distribution.
- **PDF Export**: Generate comprehensive PDF reports.
- **PPT Export**: Create PowerPoint presentations with analysis slides.
- **Desktop App**: Built with Electron for Windows and macOS.

## Technologies

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Electron

## Development

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Run desktop app in development mode
npm run desktop:dev
```

## Build

```sh
# Build for Windows
npm run desktop:build:win

# Build for macOS
npm run desktop:build:mac
```
