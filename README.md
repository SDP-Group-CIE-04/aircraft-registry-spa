# Aircraft Registry SPA

A React-based Single Page Application for managing aircraft registry operations, including Remote ID (RID) module registration and activation.

## Features

- Register operators, aircraft, pilots, and contacts
- Activate RID modules via Web Serial API (direct browser-to-device communication)
- Search and view registry entities with public/privileged access
- Dashboard for monitoring RID modules and registry statistics
- Auth0 authentication with JWT tokens
- Internationalization (English and German)

## Prerequisites

- Node.js >= 8.15.1
- npm >= 5
- Chrome 89+ or Edge 89+ (required for Web Serial API)
- Backend API server

## Installation

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd aircraft-registry-spa
   npm install --legacy-peer-deps
   ```
   > Note: `--legacy-peer-deps` is required due to peer dependency conflicts.

2. **Configure environment**
   
   Create a `process.env` file:
   ```env
   clientId=YOUR_AUTH0_CLIENT_ID
   domain=your-domain.eu.auth0.com
   audience=https://your-domain/registration
   ```
   
   Optional: Override API endpoint (defaults to `https://register-ku.duckdns.org/api/v1`):
   ```env
   REACT_APP_REGISTRATION_API_URL=https://your-api-domain.com
   REACT_APP_API_VERSION=v1
   ```
   
   Optional: Enable debug features (console logs, READ EEPROM button):
   ```env
   REACT_APP_DEBUG_MODE=true
   ```
   > Note: Set to `true` or `1` to enable debug features. Leave unset or set to `false` for production.

## Running

- **Development**: `npm start` → `http://localhost:3000`
- **Production Build**: `npm run build`
- **Production Server**: `npm run start:prod`

## RID Module Activation

Uses Web Serial API for direct browser-to-device communication with ESP32 modules.

**Requirements:**
- Chrome/Edge 89+ browser
- HTTPS or `http://localhost`
- ESP32 connected via USB

**Usage:**
1. Navigate to `/load`
2. Click "Request Port" to select USB device
3. Select operator and aircraft
4. Click "Activate This Module"

**Protocol:** 115200 baud, commands: `GET_INFO`, `GET_FIELDS`, `BASIC_SET`

## API Integration

**Base URL**: `https://register-ku.duckdns.org/api/v1` (configurable)

**Key Endpoints:**
- `GET/POST /operators` - List/create operators
- `GET/POST /aircraft` - List/create aircraft
- `GET /operators/{uuid}/aircraft` - Get operator's aircraft
- `POST /rid-modules` - Create RID module record
- `GET /rid-modules/by-esn/{esn}` - Get module by ESN
- `PATCH /rid-modules/{id}` - Update module

**Authentication:** JWT tokens in `localStorage`, sent via `Authorization: Bearer {token}` header

## Development

**Scripts:**
- `npm start` - Development server
- `npm run build` - Production build
- `npm test` - Run tests
- `npm run lint` - Lint code

**Project Structure:**
- `app/components/` - Reusable UI components
- `app/containers/` - Page-level components (Redux)
- `app/services/` - API clients
- `app/utils/serial/` - Web Serial API utilities
- `app/translations/` - i18n files

## Browser Support

- **Chrome 89+ / Edge 89+**: Full support (including Web Serial API)
- **Firefox / Safari**: Limited (no Web Serial API)

## Troubleshooting

**Web Serial API not available:**
- Use Chrome/Edge 89+ with HTTPS or `http://localhost`

**Backend connection issues:**
- Verify `REACT_APP_REGISTRATION_API_URL` is set correctly
- Check network connectivity and backend server status

**Authentication issues:**
- Verify `process.env` has correct Auth0 credentials
- Check browser console for errors

**Module activation fails:**
- Ensure ESP32 is connected via USB
- Re-request port permissions
- Verify firmware supports required commands

## Technology Stack

- React 16.8.6 (React Boilerplate 4.0.0)
- Redux 4.0.1 + Redux Saga 1.0.2
- Material-UI 4.12.4
- Auth0 SPA SDK
- Web Serial API
- Webpack 4.41.2

## License

MIT
