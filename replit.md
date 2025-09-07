# Label Designer Application

## Overview

This is a full-stack label design and data merging application built with React and Express. The application allows users to create custom label templates with various elements (text, barcodes, images) and merge them with data from uploaded CSV/Excel files to generate print-ready labels. It features a drag-and-drop interface for designing labels and supports data mapping between file columns and label elements.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and bundling
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **File Processing**: XLSX library for Excel files, PapaParse for CSV files

The frontend follows a component-based architecture with separate concerns for:
- Design canvas for visual label editing
- Element properties panel for configuring selected elements
- File upload and data preview
- Export controls for generating final labels

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **File Upload**: Multer for handling multipart form data
- **Development**: Hot reload with Vite integration in development mode
- **Build**: ESBuild for production bundling

The backend implements a RESTful API structure with:
- Project management endpoints (CRUD operations)
- File upload and processing endpoints
- In-memory storage implementation with interface for easy database migration

### Data Storage Solutions
- **Development**: In-memory storage using Maps for rapid prototyping
- **Production Ready**: PostgreSQL schema defined with Drizzle ORM
- **Database Provider**: Configured for Neon Database (@neondatabase/serverless)
- **Migration System**: Drizzle Kit for schema migrations

The schema includes:
- Users table for authentication
- Label projects table storing design templates and configurations
- Data files table for uploaded CSV/Excel data with JSON storage

### Authentication and Authorization
The application includes a basic user authentication system with:
- User registration and login capabilities
- Password-based authentication
- Project ownership and access control
- Session management infrastructure in place

### Design System
- **Component Library**: Shadcn/ui providing consistent, accessible components
- **Theme System**: CSS variables for easy customization
- **Typography**: Multiple font families (Inter, Fira Code, Georgia)
- **Responsive Design**: Mobile-first approach with breakpoint utilities

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL for production data storage
- **Connection**: Environment-based DATABASE_URL configuration

### File Processing Libraries
- **XLSX**: Excel file reading and parsing (.xlsx, .xls formats)
- **PapaParse**: CSV file parsing with header detection and error handling
- **Multer**: File upload middleware for handling multipart forms

### UI and Styling Dependencies
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe variant styling

### Development Tools
- **Replit Integration**: Custom plugins for development environment
- **TypeScript**: Full type safety across frontend and backend
- **ESLint/Prettier**: Code formatting and linting (configured via package.json)

### Third-party Integrations
- **React Query**: Server state management and caching
- **React Hook Form**: Form validation and handling
- **Zod**: Runtime type validation and schema definition
- **Date-fns**: Date manipulation and formatting utilities

The application is designed to be easily deployable on various platforms with environment-based configuration for database connections and external services.