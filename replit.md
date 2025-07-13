# Harley Gaming Café - System Architecture

## Overview

Harley Gaming Café is a web application for a gaming café located in New Minia that provides gaming rooms, racing simulators, billiard tables, and restaurant services. The system handles room bookings, food ordering, real-time availability tracking, and administrative management through a modern web interface with bilingual support (English/Arabic).

## User Preferences

Preferred communication style: Simple, everyday language.
Logo placement: Logo icon beside café name in navigation bar
Admin access: Hidden from regular users, accessible via triple-click on logo

## System Architecture

### Frontend Architecture
- **Technology Stack**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Design Pattern**: Single Page Application (SPA) with client-side routing
- **UI Framework**: Custom CSS with CSS variables for theming
- **Language Support**: Bilingual (English/Arabic) with RTL support
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox

### Backend Architecture
- **Database**: Firebase Firestore (NoSQL document database)
- **Authentication**: Firebase Authentication for admin access
- **Real-time Updates**: Firebase real-time listeners for live data synchronization
- **API Pattern**: Direct Firebase SDK integration (no REST API layer)

### Key Design Decisions
- **Serverless Architecture**: Chosen Firebase for rapid development and real-time capabilities
- **Client-Side Rendering**: All rendering handled in browser for fast interactions
- **Component-Based Structure**: Modular JavaScript files for different functionalities
- **Gaming Theme**: Neon/cyberpunk aesthetic with CSS custom properties

## Key Components

### 1. User Interface Components
- **Navigation System**: Dynamic page switching with translation support
- **Booking System**: Room/device reservation with time slot management
- **Order System**: Food/drink cart with category filtering
- **Availability Display**: Real-time device status monitoring
- **Admin Dashboard**: Multi-tab interface for managing all aspects

### 2. Core JavaScript Modules
- **app.js**: Main application initialization and user-facing functionality
- **admin.js**: Administrative dashboard and management features
- **firebase-config.js**: Firebase initialization and global exports
- **translations.js**: Bilingual content management

### 3. Data Management
- **Collections**: devices, bookings, orders, menu_items
- **Real-time Sync**: Automatic UI updates via Firebase listeners
- **State Management**: Global variables for cart, user session, and current page

## Data Flow

### User Booking Flow
1. User selects room type, date, and time
2. Client validates availability against Firebase
3. Booking data stored in Firestore with timestamp
4. Real-time listeners update availability displays
5. Admin receives booking notification

### Order Management Flow
1. User browses menu items from Firestore
2. Items added to local cart state
3. Order submitted with customer details
4. Order stored in Firestore with status tracking
5. Admin dashboard displays new orders

### Admin Operations Flow
1. Admin authenticates via Firebase Auth
2. Real-time listeners populate dashboard data
3. Admin can update booking/order statuses
4. Changes immediately reflected in user interface
5. Analytics data aggregated from collections

## External Dependencies

### Firebase Services
- **Firestore**: Primary database for all application data
- **Authentication**: Admin login and session management
- **Real-time Database**: Live synchronization of availability and orders

### Frontend Libraries
- **Font Awesome**: Icon library for UI elements
- **Google Fonts**: Orbitron (gaming theme) and Noto Sans Arabic
- **CSS Custom Properties**: For theming and responsive design

### Development Tools
- **ES6 Modules**: Modern JavaScript module system
- **CSS Grid/Flexbox**: Layout and responsive design
- **Web APIs**: Local storage, date/time handling

## Deployment Strategy

### Current Setup
- **Static Hosting**: Client-side only application
- **Firebase Hosting**: Recommended for integration with Firebase services
- **CDN Delivery**: Firebase hosting provides global CDN
- **SSL/HTTPS**: Automatic SSL certificates via Firebase

### Configuration Requirements
- Firebase project setup with Firestore and Authentication enabled
- Environment-specific Firebase config in firebase-config.js
- Admin user creation for dashboard access
- Initial data seeding for devices and menu items

### Scalability Considerations
- **Database Structure**: Optimized for real-time queries
- **Caching Strategy**: Firebase handles caching automatically
- **Performance**: Lazy loading of non-critical components
- **Monitoring**: Firebase Analytics for usage tracking

## Security Architecture

### Authentication
- Firebase Authentication for admin access only
- No user authentication required for bookings/orders
- Session management handled by Firebase SDK

### Data Security
- Firestore security rules for admin-only write access
- Client-side validation with server-side enforcement
- Secure configuration management for API keys

### Privacy
- Minimal data collection (name, phone for bookings)
- No persistent user tracking
- GDPR-compliant data handling practices