# System Architecture Analysis

## Overview

This document explains how the three main components of the Aircraft Registry system work together:

1. **Aircraft Registry SPA** (Frontend) - React-based web application
2. **RegBackend** - Main registration API backend
3. **discovery_service.py** - USB Serial device discovery service

---

## Component Breakdown

### 1. Aircraft Registry SPA (Frontend)

**Location:** `app/` directory  
**Technology:** React 16.8.6, Redux, Material-UI  
**Purpose:** User interface for aircraft registration and RID module activation

**Key Responsibilities:**
- User authentication (Auth0)
- Entity registration (Operators, Aircraft, Pilots, Contacts)
- RID module activation workflow
- Search and discovery of registered entities
- Display entity details

**API Integration:**
- **RegBackend API:** `https://register-ku.duckdns.org/api/v1/` (or from `REACT_APP_REGISTRATION_API_URL`)
  - Handles all CRUD operations for entities
  - Requires JWT authentication for most operations
  - Endpoints: `/operators`, `/aircraft`, `/pilots`, `/contacts`, `/rid-modules`
  
- **Discovery Service:** `http://localhost:8080` (hardcoded)
  - Used only for RID module activation flow
  - Endpoints: `/devices`, `/activate`, `/device-info`

**Key Files:**
- `app/containers/LoadPage/index.js` - RID module activation UI
- `app/services/apiService.js` - API client for RegBackend
- `app/utils/apiConfig.js` - API configuration

---

### 2. RegBackend (Registration API)

**Location:** External service (not in this repo)  
**Base URL:** `https://register-ku.duckdns.org/api/v1/`  
**Technology:** Unknown (likely Python/Django or FastAPI based on API structure)

**Key Responsibilities:**
- Store and manage registry entities (Operators, Aircraft, Pilots, Contacts)
- Store RID module records
- Provide search and filtering capabilities
- Handle authentication and authorization (JWT)
- Serve public and privileged entity details

**API Endpoints Used by Frontend:**

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/operators` | GET | No | List all operators |
| `/operators` | POST | Yes | Create operator |
| `/operators/{uuid}` | GET | Yes | Get operator details |
| `/operators/{uuid}/aircraft` | GET | No | Get aircraft for operator |
| `/aircraft` | GET | No | List all aircraft |
| `/aircraft` | POST | Yes | Create aircraft |
| `/aircraft/{uuid}` | GET | Yes | Get aircraft details |
| `/aircraft/{uuid}` | PATCH | Yes | Update aircraft |
| `/pilots` | GET | No | List pilots |
| `/pilots` | POST | Yes | Create pilot |
| `/contacts` | GET | No | List contacts |
| `/contacts` | POST | Yes | Create contact |
| `/rid-modules` | POST | Yes | Create RID module record |
| `/rid-modules/by-esn/{esn}` | GET | Yes | Get RID module by ESN |
| `/rid-modules/{id}` | PATCH | Yes | Update RID module |
| `/{type}/{uuid}/privileged` | GET | Yes | Get privileged entity details |

**Data Flow:**
- Frontend sends JWT token in `Authorization: Bearer {token}` header
- Backend validates token and returns entity data
- All entity operations are persisted in backend database

---

### 3. discovery_service.py (USB Serial Discovery Service)

**Location:** `discovery_service.py` (root of repo)  
**Technology:** Python Flask  
**Port:** `localhost:8080` (hardcoded)  
**Purpose:** Bridge between frontend and USB-connected ESP32 modules

**Key Responsibilities:**
- Discover USB serial devices (ESP32 modules)
- Query module information (ESN, status) via `GET_INFO` command
- Query stored configuration via `GET_FIELDS` command
- Activate modules by sending `BASIC_SET` command with aircraft data
- Generate RID IDs (UUID v4) if not provided

**API Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/devices` | GET | List all discovered USB modules |
| `/device-info` | GET | Query stored IDs from a module |
| `/activate` | POST | Send activation command to module |
| `/health` | GET | Service health check |

**Communication Protocol:**
- **Baud Rate:** 115200
- **Commands:**
  - `GET_INFO\n` - Query module ESN and status
  - `GET_FIELDS\n` - Query stored operator_id, aircraft_id, rid_id
  - `BASIC_SET operator_id=X|aircraft_id=Y|rid_id=Z\n` - Configure module
- **Responses:** JSON or text, parsed accordingly

**Device Detection:**
- Scans USB serial ports for devices with vendor IDs: `0x10C4` (Silicon Labs), `0x1A86` (QinHeng), `0x303A` (Espressif)
- For each device, opens serial port and queries `GET_INFO`
- Returns list of modules with port, ESN, manufacturer info

**Current Flow:**
1. Frontend calls `GET /devices` → Discovery service scans USB ports
2. User selects device and aircraft data
3. Frontend calls `POST /activate` with device port and aircraft data
4. Discovery service opens serial port, sends `BASIC_SET` command
5. Discovery service returns success/failure
6. Frontend then syncs RID module record to RegBackend

---

## Current Integration Flow: RID Module Activation

```
┌─────────────────┐
│   Frontend      │
│  (LoadPage)     │
└────────┬────────┘
         │
         │ 1. GET /devices
         ▼
┌─────────────────┐
│ discovery_      │
│ service.py      │
│ (localhost:8080)│
└────────┬────────┘
         │
         │ 2. Scan USB ports
         │    Query GET_INFO
         │
         │ 3. Return device list
         ◄────────┘
         │
         │ 4. POST /activate
         │    {device_port, aircraft_data}
         ▼
┌─────────────────┐
│ discovery_      │
│ service.py      │
└────────┬────────┘
         │
         │ 5. Open serial port
         │    Send BASIC_SET command
         │
         │ 6. Return success/error
         ◄────────┘
         │
         │ 7. POST /rid-modules
         │    (with JWT token)
         ▼
┌─────────────────┐
│   RegBackend    │
│ (register-ku.   │
│  duckdns.org)   │
└─────────────────┘
```

**Detailed Steps:**

1. **Device Discovery:**
   - User navigates to `/load` page
   - Frontend calls `GET http://localhost:8080/devices`
   - Discovery service scans USB ports, queries each device with `GET_INFO`
   - Returns list: `[{port, esn, status, ...}, ...]`

2. **User Selection:**
   - User selects device, operator, and aircraft from dropdowns
   - Frontend generates RID ID (UUID v4) client-side

3. **Check Existing Configuration:**
   - Frontend calls `GET http://localhost:8080/device-info?device_port={port}`
   - Discovery service queries module with `GET_FIELDS`
   - If IDs exist, shows confirmation dialog

4. **Activation:**
   - Frontend calls `POST http://localhost:8080/activate` with:
     ```json
     {
       "device_port": "COM3",
       "aircraft_data": {
         "operator_id": "uuid",
         "aircraft_id": "uuid",
         "rid_id": "uuid",
         "esn": "...",
         ...
       }
     }
     ```
   - Discovery service opens serial port, sends `BASIC_SET` command
   - Module stores configuration in non-volatile memory
   - Returns success with ESP32 response

5. **Backend Sync:**
   - Frontend calls RegBackend `POST /api/v1/rid-modules` (with JWT)
   - Creates/updates RID module record in database
   - Links module to operator and aircraft

---

## Why Replace discovery_service.py?

**Current Limitations:**
1. **Requires separate Python service** - Must run `python discovery_service.py` separately
2. **Localhost only** - Hardcoded to `localhost:8080`, can't work remotely
3. **Platform dependency** - Requires Python, pyserial, Flask installed
4. **No direct browser access** - Browser can't access USB serial ports directly (security restriction)

**Web Serial API Benefits:**
1. **No backend service needed** - Direct browser-to-device communication
2. **Cross-platform** - Works on any OS that supports Web Serial (Chrome/Edge)
3. **Simpler deployment** - No separate service to run
4. **Better UX** - Native browser permission dialogs
5. **Real-time** - Direct connection, no network latency

---

## Replacement Strategy

### What Changes:

1. **Remove dependency on discovery_service.py**
   - No more `http://localhost:8080` calls
   - No need to run Python service

2. **Implement Web Serial API in frontend**
   - Use `navigator.serial` API (or polyfill)
   - Direct serial port communication from browser
   - Same protocol (GET_INFO, GET_FIELDS, BASIC_SET)

3. **Keep RegBackend integration unchanged**
   - Still syncs RID module records after activation
   - Same API endpoints and authentication

### What Stays the Same:

1. **RegBackend API** - No changes needed
2. **ESP32 communication protocol** - Same commands and responses
3. **RID ID generation** - Already done client-side
4. **UI/UX flow** - Same user experience

---

## Migration Plan

### Phase 1: Create Web Serial Service Module
- Create `app/utils/Serial.js` - Serial port wrapper class
- Create `app/utils/LocalStorage.js` - Serial API detection/loading
- Implement command queue system for request/response handling

### Phase 2: Update LoadPage Component
- Replace `fetch('http://localhost:8080/devices')` with Web Serial port discovery
- Replace `fetch('/activate')` with direct serial communication
- Replace `fetch('/device-info')` with direct serial queries

### Phase 3: Testing & Validation
- Test on Chrome/Edge browsers
- Verify ESP32 communication works correctly
- Ensure RegBackend sync still works

### Phase 4: Cleanup
- Remove `discovery_service.py` (or mark as deprecated)
- Update documentation
- Remove hardcoded `localhost:8080` references

---

## Technical Considerations

### Browser Compatibility
- **Chrome/Edge 89+:** Native support
- **Firefox/Safari:** Not supported (as of 2024)
- **Polyfill:** `web-serial-polyfill` for Android Chrome (uses Web USB)

### Security
- Web Serial API requires HTTPS (or localhost for development)
- User must grant permission for each port (user gesture required)
- Port permissions persist per origin

### Error Handling
- Handle port not found errors
- Handle device disconnection
- Handle serial communication timeouts
- Graceful fallback if Web Serial not available

### Protocol Compatibility
- Must maintain exact same command format: `GET_INFO\n`, `BASIC_SET ...\n`
- Must parse responses same way (JSON or text)
- Must handle timeouts and retries appropriately

---

## File Structure After Migration

```
app/
├── utils/
│   ├── Serial.js              # NEW: Web Serial wrapper
│   ├── LocalStorage.js         # NEW: Serial API loader
│   └── QueueProcessor.js       # NEW: Command queue
├── containers/
│   └── LoadPage/
│       └── index.js            # MODIFIED: Use Web Serial instead of fetch
└── services/
    └── apiService.js           # UNCHANGED: RegBackend API
```

---

## Next Steps

1. Review this architecture analysis
2. Create Web Serial implementation based on `WEBSERIAL_IMPLEMENTATION.md`
3. Test with actual ESP32 hardware
4. Update LoadPage to use new Web Serial service
5. Remove discovery_service.py dependency

