# RID Registration Frontend — Application Dossier

**Generated:** 2024  
**Application Name:** Airegister (Aircraft Registry SPA)  
**Analysis Scope:** Frontend application code, configuration, and build artifacts

---

## 1) Executive Summary

Airegister is a React-based Single Page Application (SPA) for managing aircraft registry operations, including Remote ID (RID) module registration and activation. The application enables operators to register aircraft, pilots, contacts, and operators, and provides a dashboard for monitoring RID modules and registry entities. Built on React Boilerplate v4.0.0, it uses Auth0 for authentication, Material-UI for the design system, and Redux with Redux Saga for state management.

**Key Points:**
- **Framework & Version:** React 16.8.6, React Boilerplate 4.0.0, Webpack 4.41.2
- **Major Flows:** Registration (Operator/Aircraft/Pilot/Contact), RID Module Activation, Search & Discovery, Entity Details Viewing
- **Auth Method:** Auth0 SPA SDK (OIDC/OAuth2) with JWT tokens stored in localStorage
- **Data Types Handled:** Operators, Aircraft, Pilots, Contacts, RID Modules (with UUID-based RID IDs), Addresses, Type Certificates
- **Key Integrations:** Registration Backend API (REST), Discovery Service (localhost:8080) for RID module detection
- **Compliance Touchpoints:** i18n support (English, German), basic accessibility via Material-UI components, HTTPS enforcement via server configs
- **Performance Posture:** Code splitting via Webpack, lazy loading for routes, offline-first via Service Worker, compression enabled
- **Deployment Target:** SPA with Express dev server, production build optimized for static hosting (Apache/Nginx)

---

## 2) Product Scope & Domain Model (RID)

### What "RID" Means

**RID (Remote ID)** in this application refers to a unique identifier assigned to aircraft for remote identification purposes. RID IDs are UUID v4 format (e.g., `e0c8a7f2-d6f0-4f33-a101-7b5b93da565f`) and are associated with physical RID modules (ESP32-S3 devices) that broadcast identification information.

### Core Entities

1. **Operator** — Company or organization operating aircraft
   - Fields: `company_name`, `website`, `email`, `phone_number`, `operator_type` (LUC/Non-LUC/AUTH/DEC), `vat_number`, `insurance_number`, `company_number`, `country`, `address`
   - Unique identifier: UUID (`id`)

2. **Aircraft** — Registered aircraft with physical characteristics
   - Fields: `operator` (FK), `mass` (grams/kg), `manufacturer`, `model`, `esn` (Electronic Serial Number), `maci_number`, `status` (Inactive/Active/Maintenance/Grounded), `registration_mark`, `sub_category` (Fixed-wing/Rotorcraft/etc.), `type_certificate`, `master_series`, `series`, `popular_name`, `icao_aircraft_type_designator`, `max_certified_takeoff_weight`
   - Unique identifier: UUID (`id`)

3. **Pilot** — Registered pilot associated with an operator
   - Fields: `operator` (FK), `is_active`, `person` (first_name, middle_name, last_name, email, phone_number, date_of_birth), `address`, `tests`
   - Unique identifier: UUID (`id`)

4. **Contact** — Contact person for an operator
   - Fields: `operator` (FK), `person` (same structure as Pilot), `role_type` (Primary/Technical/Business/Emergency), `address`
   - Unique identifier: UUID (`id`)

5. **RID Module** — Physical ESP32-S3 device that broadcasts RID
   - Fields: `rid_id` (UUID v4), `operator` (FK), `aircraft` (FK, optional), `module_esn` (unique), `module_port` (USB port), `module_type`, `status`, `activation_status` (temporary/permanent)
   - Unique identifier: UUID (`id`), `module_esn` (unique constraint)

### Data Model & Types

**Location:** TypeScript interfaces not present; data structures inferred from form state and API service calls.

**Key Data Structures:**
- **Address:** `{ address_line_1, address_line_2, address_line_3, city, postcode, country }`
- **Person:** `{ first_name, middle_name, last_name, email, phone_number, date_of_birth }`
- **Type Certificate:** `{ type_certificate_id, type_certificate_issuing_country, type_certificate_holder, type_certificate_holder_country }`

**Defined in:**
- `app/containers/RegistrationPage/index.js` — Form state structures
- `app/containers/RegistrationPage/constants.js` — Enums (OPERATOR_TYPES, COUNTRIES, AIRCRAFT_STATUS, SUB_CATEGORIES, CONTACT_ROLE_TYPES)
- `app/services/apiService.js` — API request/response handling

### Invariants & Constraints

1. **RID ID Format:** Must be UUID v4 (validated via regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`)
2. **Module ESN:** Must be unique across all RID modules
3. **Operator Type:** Must be one of: 0 (NA), 1 (LUC), 2 (Non-LUC), 3 (AUTH), 4 (DEC)
4. **Aircraft Status:** Must be one of: 0 (Inactive), 1 (Active), 2 (Maintenance), 3 (Grounded)
5. **Required Fields:** Varies by entity type (see Section 14.2)
6. **Country Codes:** ISO 3166-1 alpha-2 (e.g., 'AE' for UAE)

---

## 3) User Journeys & Screens

### Primary Flows

#### Flow 1: Registration Flow
1. **Landing Page** (`/`) — User sees welcome screen or dashboard (if authenticated)
2. **Login** (`/login`) — Auth0 redirect or popup authentication
3. **Registration Page** (`/register`) — Select entity type (Operator/Aircraft/Pilot/Contact)
4. **Form Completion** — Fill required fields based on entity type
5. **Submit** — POST to API endpoint (`/api/v1/operators`, `/api/v1/aircraft`, etc.)
6. **Success Notification** — Snackbar confirmation, form reset
7. **Redirect** — Option to return to landing page or register another entity

#### Flow 2: RID Module Activation Flow
1. **Load Page** (`/load`) — Scan for USB-connected ESP32 modules via Discovery Service
2. **Device Selection** — Select module from discovered devices
3. **Operator Selection** — Choose operator from dropdown (persisted in localStorage)
4. **Aircraft Selection** — Choose aircraft for selected operator
5. **RID ID Generation** — Generate UUID v4 RID ID (client-side)
6. **Activation** — POST to Discovery Service `/activate` endpoint with aircraft data and RID ID
7. **Backend Sync** — Create/update RID module record in backend API
8. **Confirmation** — Display RID ID in console output, show success notification

#### Flow 3: Search & Discovery Flow
1. **Landing Page** (`/`) — Toggle search interface
2. **Collection Type Selection** — Choose Operators/Pilots/Aircraft/Contacts
3. **Search Input** — Enter search string
4. **API Query** — GET `/api/v1/{collectionType}?search={query}`
5. **Results Display** — Grid of result cards with Details/Privileged view links
6. **Details View** — Navigate to `/{collectionType}/{uuid}` or `/{collectionType}/{uuid}/privileged`

#### Flow 4: Entity Details Flow
1. **Details Page** (`/{type}/{uuid}` or `/{type}/{uuid}/privileged`) — Fetch entity details
2. **API Request** — GET `/api/v1/{type}/{uuid}` or `/api/v1/{type}/{uuid}/privileged`
3. **Details Card Rendering** — Display entity information
4. **Navigation** — Breadcrumbs back to search page

### Screen Map & Routes

| Route | Component | Auth Required | Description |
|-------|-----------|---------------|-------------|
| `/` | `LandingPage` | No (enhanced if authenticated) | Welcome/Dashboard/Search |
| `/login` | `LoginPage` | No | Auth0 login |
| `/register` | `RegistrationPage` | Yes (soft check) | Entity registration forms |
| `/load` | `LoadPage` | No | RID module activation |
| `/operators/:uuid` | `DetailsPage` | No | Operator public details |
| `/operators/:uuid/privileged` | `DetailsPage` | Yes | Operator privileged details |
| `/aircrafts/:uuid` | `DetailsPage` | No | Aircraft public details |
| `/aircrafts/:uuid/privileged` | `DetailsPage` | Yes | Aircraft privileged details |
| `/contacts/:uuid` | `DetailsPage` | No | Contact public details |
| `/contacts/:uuid/privileged` | `DetailsPage` | Yes | Contact privileged details |
| `/pilots/:uuid` | `DetailsPage` | No | Pilot public details |
| `/pilots/:uuid/privileged` | `DetailsPage` | Yes | Pilot privileged details |
| `*` | `NotFoundPage` | No | 404 handler |

**Route Guards:**
- No explicit route guards in React Router configuration
- Authentication checked per-component via `useAuth0()` hook
- Soft authentication check in RegistrationPage (redirects to `/login` if not authenticated)
- Privileged routes require valid JWT token in Authorization header

### Edge Paths

- **Amendments:** Not detected — likely handled via PATCH endpoints (not implemented in UI)
- **Re-submission:** Form reset after successful submission; no explicit re-submission flow
- **Admin Review:** Not detected — likely handled in backend/admin interface
- **Appeals:** Not detected — likely handled externally

---

## 4) Forms, Validation & Error Handling

### Form Libraries

**No dedicated form library detected.** Forms use React state (`useState`) with Material-UI `TextField` components.

**Location:** `app/containers/RegistrationPage/index.js`

### Schema Validators

**No schema validation library detected** (no Zod, Yup, Joi, etc.). Validation appears to be:
- **Client-side:** HTML5 form validation (`required`, `type="email"`, `type="number"`, `type="date"`)
- **Server-side:** Backend API validation (errors returned in API responses)

### Custom Validators

**RID Format Validation:**
- Location: `app/services/apiService.js` — `generateRidId()` function
- Regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`
- Validates UUID v4 format after generation

**Email Validation:**
- HTML5 `type="email"` on TextField components
- No custom regex validation detected

**Phone Number Validation:**
- Placeholder: `+123456789` (suggests international format expected)
- No explicit validation regex detected

### Client vs. Server Validation Split

- **Client-side:** Required field checks, HTML5 input types, basic format hints (placeholders)
- **Server-side:** All business logic validation (assumed — not visible in frontend code)

### Error Surface Patterns

1. **Snackbar Notifications** (Material-UI `Snackbar`)
   - Location: `app/containers/RegistrationPage/index.js`, `app/containers/LoadPage/index.js`
   - Auto-hide duration: 6000ms
   - Severity levels: `success`, `error`, `warning`

2. **Inline Error Messages**
   - Material-UI TextField `error` prop (not explicitly used in RegistrationPage)
   - Error state displayed in notification system

3. **Error Banners**
   - Location: `app/containers/LandingPage/index.js` — `errorPaper` style for API fetch failures
   - Displayed when collection fetch fails

4. **Console Logging**
   - Development: `console.log`, `console.error`, `console.warn`
   - Production: Likely suppressed (NODE_ENV check)

### Accessibility of Forms

**Strengths:**
- Material-UI components provide basic ARIA attributes
- Labels associated with inputs via `label` prop
- Keyboard navigation supported (Material-UI default)

**Gaps:**
- No explicit `aria-describedby` for error messages
- No error summary at top of form
- No explicit focus management on error
- No keyboard trap detection in modals/dialogs
- Date picker accessibility not verified

**Location:** `app/containers/RegistrationPage/index.js` — Form rendering functions

---

## 5) Authentication, Authorization & Session

### Auth Style

**Auth0 SPA SDK** (`@auth0/auth0-spa-js` v1.1.1)
- **Protocol:** OIDC/OAuth2 Authorization Code Flow with PKCE
- **Location:** `app/containers/Auth/index.js`

**Configuration:**
- Domain: `process.env.domain` (from `process.env` file)
- Client ID: `process.env.clientId`
- Audience: `process.env.audience`
- Redirect URI: `window.location.origin`
- Scopes: Multiple registry read scopes (see `app/auth_config.js`)

### Token Storage

**JWT Token Storage:**
- **Primary:** `localStorage.getItem('jwt_token')`
- **Fallback keys:** `auth_token`, `token` (checked in `getJwtToken()`)
- **Location:** `app/utils/apiConfig.js`

**Auth0 Token:**
- Stored by Auth0 SDK (internal storage mechanism)
- Retrieved via `getTokenSilently()` for API calls

**Security Concerns:**
- Tokens stored in localStorage (vulnerable to XSS)
- No explicit token encryption
- No token rotation detected

### Refresh/Rotation

- **Token Refresh:** Handled by Auth0 SDK (`getTokenSilently()`)
- **Token Rotation:** Not explicitly implemented
- **Expiration Handling:** 401 responses trigger token removal and redirect to login

### PKCE

- **Enabled:** Yes (default in Auth0 SPA SDK v1.1.1)

### Route Guards

**No explicit route guards.** Authentication checked per-component:
- `useAuth0()` hook provides `isAuthenticated` boolean
- Components conditionally render based on auth state
- RegistrationPage checks `isAuthenticated()` helper before submission

### Role/Permission Checks

**Scopes Defined:**
- `registry.read.operator`
- `registry.read.operator_detail`
- `registry.read.operator_detail.privileged`
- `registry.read.contact_detail`
- `registry.read.contact_detail.privileged`
- `registry.read.pilot`
- `registry.read.pilot_detail`
- `registry.read.pilot_detail.privileged`
- `registry.read.aircraft`
- `registry.read.aircraft_detail`
- `registry.read.aircraft_detail.privileged`

**Implementation:**
- Scopes requested during Auth0 login
- Privileged routes append `/privileged` to API endpoints
- No explicit role-based UI rendering detected

### Session Timeout

- **Not detected** — likely handled by Auth0 token expiration
- **Idle Detection:** Not implemented
- **Re-auth Prompts:** Not implemented (401 errors trigger redirect)

### CSRF Protection

- **Not detected** — CSRF protection likely handled by backend
- **Token in Header:** JWT sent in `Authorization: Bearer {token}` header (not cookies)

---

## 6) API Contracts & Integration

### API Client

**Custom fetch-based client** (not generated from OpenAPI)
- **Location:** `app/services/apiService.js`
- **Base URL:** `process.env.REACT_APP_REGISTRATION_API_URL || 'https://register-ku.duckdns.org'`
- **API Version:** `process.env.REACT_APP_API_VERSION || 'v1'`
- **Full URL:** `${API_BASE_URL}/api/${API_VERSION}`

### Endpoints Called by Flow

| Flow | Endpoint | Method | Auth Required |
|------|----------|--------|---------------|
| Register Operator | `/api/v1/operators` | POST | Yes (JWT) |
| Register Aircraft | `/api/v1/aircraft` | POST | Yes (JWT) |
| Register Pilot | `/api/v1/pilots` | POST | Yes (JWT) |
| Register Contact | `/api/v1/contacts` | POST | Yes (JWT) |
| Get Operators | `/api/v1/operators` | GET | No |
| Get Aircraft | `/api/v1/aircraft` | GET | No |
| Get Aircraft by Operator | `/api/v1/operators/{uuid}/aircraft` | GET | No |
| Get Operator Details | `/api/v1/operators/{uuid}` | GET | Yes (JWT) |
| Get Aircraft Details | `/api/v1/aircraft/{uuid}` | GET | Yes (JWT) |
| Get Details (Privileged) | `/api/v1/{type}/{uuid}/privileged` | GET | Yes (JWT) |
| Search Collection | `/api/v1/{type}?search={query}` | GET | No |
| Create RID Module | `/api/v1/rid-modules` | POST | Yes (JWT) |
| Get RID Module by ESN | `/api/v1/rid-modules/by-esn/{esn}` | GET | Yes (JWT) |
| Update RID Module | `/api/v1/rid-modules/{id}` | PATCH | Yes (JWT) |
| Update Aircraft | `/api/v1/aircraft/{id}` | PATCH | Yes (JWT) |

### Request/Response Schemas

**Request Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {jwt_token}' // if authenticated
}
```

**Error Response Format:**
```javascript
{
  detail: string,  // Primary error message
  message: string, // Alternative error message
  error: string    // Alternative error message
}
```

**Success Response:** JSON object matching entity structure (varies by endpoint)

### Retry/Backoff

- **Not implemented** — Single fetch attempt, no retry logic
- **Cancellation:** Not implemented (no AbortController usage)
- **Timeouts:** Browser default fetch timeout (no explicit timeout)

### File Uploads

- **Not detected** — No file upload endpoints or UI components

### Webhooks/WebSockets

- **Not detected** — No WebSocket connections or webhook handlers

### Discovery Service Integration

**Separate Service:** `http://localhost:8080` (hardcoded)
- **Endpoints:**
  - `GET /devices` — List discovered USB modules
  - `GET /device-info?device_port={port}` — Get module configuration
  - `POST /activate` — Activate module with aircraft data
- **Not part of main API** — Separate Python service

---

## 7) State Management & Data Fetching

### Global Store

**Redux** (v4.0.1) with **Redux Saga** (v1.0.2)
- **Location:** `app/configureStore.js`, `app/reducers.js`
- **DevTools:** Enabled in development (Redux DevTools Extension)

**Store Structure:**
```javascript
{
  global: globalReducer,      // App state (user, auth, collection)
  language: languageProviderReducer, // i18n locale
  router: connectRouter(history),    // React Router state
  details: detailsReducer,     // Injected (DetailsPage)
  landing: landingReducer     // Injected (LandingPage)
}
```

**Dynamic Injection:**
- Reducers and sagas injected via `injectReducer` and `injectSaga` utilities
- Location: `app/utils/injectReducer.js`, `app/utils/injectSaga.js`

### Query Libraries

**No dedicated query library** (no React Query, SWR, Apollo, etc.)
- Data fetching via Redux Saga (`takeLatest`, `call`, `put`)
- Direct `fetch()` calls in components (RegistrationPage, LoadPage)

### Cache Keys

- **Not applicable** — No query library with cache keys
- **Redux State:** Cached in Redux store (no explicit invalidation strategy)

### Invalidation Rules

- **Not detected** — No cache invalidation logic
- **Manual Refresh:** User-triggered (refresh buttons, re-scan)

### Derived State

- **Reselect** (v4.0.0) used for memoized selectors
- **Location:** `app/containers/*/selectors.js`
- Examples: `makeSelectUser()`, `makeSelectCollection()`, `makeSelectDetails()`

### Optimistic Updates

- **Not implemented** — No optimistic UI updates

### Pagination

- **Handled:** API responses may be paginated (`results` array vs. direct array)
- **Location:** `app/services/apiService.js` — `getOperators()`, `getAircraft()` handle both formats
- **UI:** No pagination controls detected (displays all results)

### Infinite Queries

- **Not implemented**

### Cross-Tab Sync

- **Not implemented** — No BroadcastChannel or localStorage events

### Persistence

**localStorage Usage:**
- `jwt_token` — JWT authentication token
- `operator_id` — Selected operator for RID module activation (LoadPage)
- **No IndexedDB usage detected**

**Persistence Duration:**
- Until explicit removal (logout, token expiration handling)
- No TTL or expiration logic in frontend

---

## 8) UI System, Components & Accessibility

### Design System

**Material-UI (MUI)** v4.12.4
- **Location:** `@material-ui/core`, `@material-ui/icons`
- **Theme:** Custom theme with primary (blue) and secondary (orange) colors
- **Location:** `app/app.js` — `createMuiTheme()`

### Theming

**Theme Configuration:**
```javascript
{
  palette: {
    primary: blue,
    secondary: orange
  }
}
```
- **Custom Styles:** `styled-components` (v4.2.0) for component-level styling
- **Location:** `app/containers/*/index.js` — `makeStyles()` hooks

### Typography & Color Usage

- **Font:** Open Sans (loaded via Google Fonts)
- **Font Loading:** `FontFaceObserver` for font load detection
- **Colors:** Material-UI default palette with custom primary/secondary

### Reusable Components

**Custom Components:**
- `DetailsCard` — `app/components/DetailsCard/index.js` — Displays entity details
- `LoadingIndicator` — `app/components/LoadingIndicator/index.js` — Loading spinner
- `IssueIcon` — `app/components/IssueIcon/index.js` — Error/warning icon
- `Toggle` — `app/components/Toggle/index.js` — Toggle switch component

**Material-UI Components Used:**
- `TextField`, `Button`, `Card`, `Paper`, `Grid`, `Typography`, `Snackbar`, `Dialog`, `Menu`, `Avatar`, `Chip`, `Table`, etc.

### A11y Checks

**WCAG 2.1 AA Compliance:**
- **Partially compliant** — Material-UI provides basic ARIA attributes
- **Gaps:**
  - No explicit `aria-label` on icon-only buttons
  - No error message associations (`aria-describedby`)
  - No skip navigation links
  - No focus trap in modals (Material-UI Dialog may handle this)
  - No screen reader announcements for dynamic content

**Keyboard Navigation:**
- Material-UI components support keyboard navigation
- No explicit keyboard trap management detected

### RTL Support

- **Not detected** — No RTL-specific styles or `dir` attribute handling

### Localization/i18n

**Library:** `react-intl` v2.8.0
- **Location:** `app/i18n.js`, `app/containers/LanguageProvider/`
- **Locales:** `en` (default), `de`
- **Message Catalogs:** `app/translations/en.json`, `app/translations/de.json`
- **Fallbacks:** Default to English if translation missing
- **Locale Detection:** Not detected (likely manual selection via `LocaleToggle` component)
- **Date/Number Formatting:** `react-intl` FormattedDate, FormattedNumber (not explicitly used in visible code)

**Translation Coverage:**
- Limited — Most UI text is hardcoded English
- Translation keys exist for boilerplate components only

---

## 9) Configuration & Feature Flags

### Environment Variables

**Public Variables (from code analysis):**
- `REACT_APP_REGISTRATION_API_URL` — Backend API base URL
- `REACT_APP_API_VERSION` — API version (default: 'v1')
- `NODE_ENV` — Environment (development/production/test)

**Auth0 Variables (from `process.env` file, not committed):**
- `domain` — Auth0 domain
- `clientId` — Auth0 client ID
- `audience` — Auth0 audience

**Location:** `app/utils/apiConfig.js`, `app/auth_config.js`

### Config Files

- `babel.config.js` — Babel transpilation config
- `jest.config.js` — Jest test configuration
- `internals/webpack/webpack.*.babel.js` — Webpack build configs
- `process.env` — Runtime environment variables (not in repo)

### Runtime vs. Build-Time Toggles

- **Build-time:** `NODE_ENV` checks for dev tools, logging
- **Runtime:** API URL and version from environment variables (can be overridden at runtime)

### Feature Flags

- **Not detected** — No feature flag framework (LaunchDarkly, etc.)
- **No kill-switches detected**

---

## 10) Security Controls (Frontend)

### CSP (Content Security Policy)

- **Not detected in frontend code** — Likely configured on server (Apache/Nginx)
- **Location:** Server config files (`.htaccess`, `.nginx.conf`) — not analyzed

### Referrer-Policy

- **Not detected** — Likely configured on server

### X-Frame-Options / Frame-Ancestors

- **Not detected** — Likely configured on server

### Strict-Transport-Security

- **Detected in `.nginx.conf`:** `add_header Strict-Transport-Security max-age=15768000;`
- **Location:** `app/.nginx.conf` (server config, not frontend code)

### Input Sanitization/Escaping

- **React default:** React escapes content by default (XSS protection)
- **No explicit sanitization library** (no DOMPurify, etc.)
- **User Input:** TextField values passed to API (backend should sanitize)

### Dependency Security Posture

- **No audit tools detected** — No `npm audit` integration in CI
- **Dependencies:** Some outdated (React 16.8.6, Material-UI v4, etc.)
- **Vulnerability Scanning:** Not automated

### PII Handling

**PII Collected:**
- Names (first, middle, last)
- Email addresses
- Phone numbers
- Date of birth
- Addresses
- Company registration numbers
- VAT numbers

**Masking/Redaction:**
- **Not implemented** — PII displayed in plain text
- **Download/Print Controls:** Not implemented
- **Clipboard Restrictions:** Not implemented

### Cookie Settings

- **Not applicable** — No cookies set by frontend (Auth0 may set cookies)

### Anti-Automation

- **CAPTCHA:** Not detected
- **Bot Mitigation:** Not detected
- **Rate-Limit UX:** Not implemented (backend may rate-limit)
- **Lockouts:** Not implemented
- **Error Messaging Policy:** Generic error messages (no information leakage detected)

---

## 11) Performance & Quality

### Bundle Breakdown

**Build Tool:** Webpack 4.41.2
- **Location:** `internals/webpack/webpack.prod.babel.js`
- **Code Splitting:** Enabled via `splitChunks` configuration
- **Chunk Strategy:**
  - Vendor chunks per npm package (`npm.{packageName}`)
  - Runtime chunk: `single`
  - Max initial requests: 10
  - Min chunk size: 0

### Lazy Routes

- **Loadable Components:** `app/utils/loadable.js` — React lazy loading wrapper
- **Usage:** `LandingPage`, `DetailsPage`, `RegistrationPage`, `LoginPage`, `NotFoundPage`, `LoadPage`
- **Location:** `app/containers/*/Loadable.js`

### Prefetching

- **Not implemented** — No route prefetching or resource hints

### Core Web Vitals

- **Not measured** — No Web Vitals reporting detected
- **Targets:** Not defined

### Image Strategy

- **Static Images:** `app/images/` — `blurBg.jpg`, `favicon.ico`, `icon-512x512.png`
- **Optimization:** `image-webpack-loader` in Webpack config
- **Lazy Loading:** Not detected (no `loading="lazy"` attributes)

### Caching Headers

- **Service Worker:** Offline-plugin caches assets
- **HTTP Headers:** Not configured in frontend (server responsibility)

### Profiling Hooks

- **Not detected** — No performance profiling hooks

### Logging

**Levels:**
- Development: `console.log`, `console.warn`, `console.error`
- Production: Likely suppressed (NODE_ENV checks)

**PII Scrubbing:**
- **Not implemented** — Logs may contain PII

### Analytics Events

- **Not detected** — No analytics integration (Google Analytics, etc.)

---

## 12) Testing, QA & CI/CD

### Unit/E2E Tools

**Unit Testing:**
- **Jest** v24.7.1
- **React Testing Library** v6.1.2
- **Location:** `jest.config.js`, `app/**/tests/*.test.js`

**E2E Testing:**
- **Not detected** — No Playwright, Cypress, or Selenium setup

### Coverage Thresholds

**Jest Coverage:**
```javascript
{
  statements: 98,
  branches: 91,
  functions: 98,
  lines: 98
}
```
- **Location:** `jest.config.js`
- **Coverage Collection:** `collectCoverageFrom` includes `app/**/*.{js,jsx}` (excludes tests, Loadable, app.js, global-styles)

### Fixtures/Fakes

- **Not detected** — No dedicated fixture files for RID data
- **Mocks:** `internals/mocks/` — CSS modules, images

### Smoke Tests

- **Not detected** — No explicit smoke test suite
- **Test Files Found:**
  - `app/tests/i18n.test.js`
  - `app/tests/store.test.js`
  - `app/components/*/tests/*.test.js`
  - `app/containers/*/tests/*.test.js`

### CI Steps

**Detected Scripts:**
- `pretest` — Clean coverage, run lint
- `test` — Run Jest with coverage
- `lint` — ESLint + Stylelint
- `build` — Production build

**CI Configuration:**
- `appveyor.yml` — AppVoyor CI config (not analyzed in detail)

**Gates:**
- Pre-commit: `lint-staged` (ESLint fix, Prettier)
- Pre-test: Lint must pass

### Preview Environments

- **Not detected** — No preview environment configuration

---

## 13) Deployment & Runtime Assumptions

### Expected Hosting

**SPA Mode:**
- Single Page Application (no SSR)
- Static asset hosting (Apache/Nginx)
- Express dev server for development

**CDN:**
- Not explicitly configured (can be added)

**Asset Paths:**
- Root-relative paths (`/`)
- No base path configuration detected

### Browser Support

**Browserslist:**
```json
[
  "last 2 versions",
  "> 1%",
  "IE 10"
]
```
- **Location:** `package.json`
- **Polyfills:** `@babel/polyfill`, `react-app-polyfill/ie11`, `intl` (for older browsers)

### Observability Hooks

**Error Reporting:**
- **Not detected** — No Sentry, LogRocket, or error tracking

**Logging:**
- Console logging only (development)

**Release Versioning:**
- **Not detected** — No version display in UI or build artifacts

---

## 14) Summary Tables

### 14.1 Key Application Properties

| Property | Value | Why It Matters |
|----------|-------|----------------|
| Framework / Version | React 16.8.6, React Boilerplate 4.0.0 | Compatibility & ecosystem |
| State / Data Fetching | Redux + Redux Saga, Reselect | Correctness & caching |
| Auth Method | Auth0 SPA SDK (OIDC/OAuth2) | Security & UX |
| Major Flows | Registration, RID Activation, Search, Details | Coverage & risk |
| API Surface | REST API (custom fetch client) | Stability & contracts |
| Validation Stack | HTML5 + Backend (no client schema) | Data integrity |
| A11y & i18n | Material-UI (partial), react-intl (en/de) | Compliance & reach |
| Performance Tactics | Webpack code splitting, lazy routes, Service Worker | Web Vitals & speed |
| Security Headers/Controls | Server-configured (HSTS in nginx.conf) | Risk reduction |
| Testing & CI | Jest (98% coverage target), AppVoyor | Change safety |

### 14.2 RID-Specific Inputs & Validations

#### Operator Registration Form

| Field | Type | Rules | Required? | Max Length | Example | Error Messages |
|-------|------|-------|-----------|------------|---------|----------------|
| `company_name` | text | - | Yes | - | "Electric Inspection" | - |
| `website` | url | - | No | - | "https://example.com" | - |
| `email` | email | HTML5 email | Yes | - | "contact@example.com" | - |
| `phone_number` | text | - | Yes | - | "+123456789" | - |
| `operator_type` | select | 0-4 (enum) | Yes | - | 2 (Non-LUC) | - |
| `vat_number` | text | - | No | - | "VAT123456" | - |
| `insurance_number` | text | - | Yes | - | "INS789" | - |
| `company_number` | text | - | Yes | - | "COMP001" | - |
| `country` | select | ISO 3166-1 alpha-2 | Yes | 2 | "AE" | - |
| `address.address_line_1` | text | - | Yes | - | "123 Main St" | - |
| `address.address_line_2` | text | - | No | - | "Suite 100" | - |
| `address.address_line_3` | text | - | No | - | "Building A" | - |
| `address.city` | text | - | Yes | - | "Dubai" | - |
| `address.postcode` | text | - | Yes | - | "12345" | - |
| `address.country` | select | ISO 3166-1 alpha-2 | Yes | 2 | "AE" | - |

#### Aircraft Registration Form

| Field | Type | Rules | Required? | Max Length | Example | Error Messages |
|-------|------|-------|-----------|------------|---------|----------------|
| `operator` | select | UUID | Yes | - | "566d63bb-cb1c-42dc-9a51-baef0d0a8d04" | - |
| `manufacturer` | select | UUID | Yes | - | "6f9cd973-15b9-4066-b4d0-1e8bbd0f279d" | - |
| `model` | text | - | Yes | - | "Mavic Pro" | - |
| `mass` | number | > 0 | Yes | - | 1000 (grams) | - |
| `status` | select | 0-3 (enum) | Yes | - | 1 (Active) | - |
| `esn` | text | - | Yes | - | "ESN123456" | - |
| `maci_number` | text | - | Yes | - | "MACI789" | - |
| `registration_mark` | text | - | No | - | "A-ABCD" | - |
| `sub_category` | select | 1-7 (enum) | Yes | - | 7 (Other) | - |
| `popular_name` | text | - | No | - | "Drone X" | - |
| `icao_aircraft_type_designator` | text | - | No | - | "UAV" | - |
| `master_series` | text | - | No | - | "Series A" | - |
| `series` | text | - | No | - | "1.0" | - |
| `max_certified_takeoff_weight` | number | >= 0 | No | - | 2.5 (kg) | - |
| `type_certificate.type_certificate_id` | text | - | No | - | "TC-001" | - |
| `type_certificate.type_certificate_issuing_country` | text | - | No | - | "US" | - |
| `type_certificate.type_certificate_holder` | text | - | No | - | "Holder Name" | - |
| `type_certificate.type_certificate_holder_country` | text | - | No | - | "US" | - |

#### Pilot Registration Form

| Field | Type | Rules | Required? | Max Length | Example | Error Messages |
|-------|------|-------|-----------|------------|---------|----------------|
| `operator` | select | UUID | Yes | - | "566d63bb-cb1c-42dc-9a51-baef0d0a8d04" | - |
| `is_active` | checkbox | boolean | No | - | true | - |
| `person.first_name` | text | - | Yes | - | "John" | - |
| `person.middle_name` | text | - | No | - | "M" | - |
| `person.last_name` | text | - | Yes | - | "Doe" | - |
| `person.email` | email | HTML5 email | Yes | - | "john@example.com" | - |
| `person.phone_number` | text | - | Yes | - | "+123456789" | - |
| `person.date_of_birth` | date | HTML5 date | No | - | "1990-01-01" | - |
| `address.*` | (same as Operator) | - | Yes (line_1, city, postcode, country) | - | - | - |

#### Contact Registration Form

| Field | Type | Rules | Required? | Max Length | Example | Error Messages |
|-------|------|-------|-----------|------------|---------|----------------|
| `operator` | select | UUID | Yes | - | "566d63bb-cb1c-42dc-9a51-baef0d0a8d04" | - |
| `role_type` | select | 0-3 (enum) | Yes | - | 1 (Technical Contact) | - |
| `person.*` | (same as Pilot) | - | Yes (first_name, last_name, email, phone_number) | - | - | - |
| `address.*` | (same as Operator) | - | Yes (line_1, city, postcode, country) | - | - | - |

#### RID Module Activation

| Field | Type | Rules | Required? | Max Length | Example | Error Messages |
|-------|------|-------|-----------|------------|---------|----------------|
| `device_port` | text | USB port identifier | Yes | - | "COM3" | - |
| `operator_id` | select | UUID | Yes | - | "566d63bb-cb1c-42dc-9a51-baef0d0a8d04" | - |
| `aircraft_id` | select | UUID | Yes | - | "41174c3f-e86c-4e5a-a629-32d4d9da6011" | - |
| `rid_id` | uuid | UUID v4 format | Auto-generated | 36 | "e0c8a7f2-d6f0-4f33-a101-7b5b93da565f" | - |
| `module_esn` | text | Unique | Yes | - | "RSAS-Module-12345" | - |

---

## 15) Known Gaps & Recommendations

### Missing Artifacts

1. **Schema Validation Library**
   - **Gap:** No client-side schema validation (Zod/Yup)
   - **Recommendation:** Add Zod or Yup for form validation with TypeScript types

2. **TypeScript Migration**
   - **Gap:** No TypeScript (JavaScript only)
   - **Recommendation:** Migrate to TypeScript for type safety and better IDE support

3. **CSRF Protection Documentation**
   - **Gap:** No CSRF token handling in frontend
   - **Recommendation:** Document CSRF strategy (likely handled by backend)

4. **Error Boundary**
   - **Gap:** No React Error Boundary component
   - **Recommendation:** Add Error Boundary to catch and display React errors gracefully

5. **Form Validation Feedback**
   - **Gap:** No inline error messages, no error summary
   - **Recommendation:** Add `aria-describedby` for errors, error summary at top of form

6. **Accessibility Improvements**
   - **Gap:** Missing ARIA labels, skip navigation, focus management
   - **Recommendation:** Add comprehensive ARIA attributes, keyboard navigation testing

7. **Token Security**
   - **Gap:** JWT stored in localStorage (XSS vulnerable)
   - **Recommendation:** Consider httpOnly cookies (requires backend changes) or token encryption

8. **Retry Logic**
   - **Gap:** No API retry/backoff on failures
   - **Recommendation:** Add exponential backoff retry for transient failures

9. **Analytics/Error Tracking**
   - **Gap:** No error tracking (Sentry) or analytics
   - **Recommendation:** Integrate Sentry for error tracking, consider analytics for user behavior

10. **E2E Testing**
    - **Gap:** No end-to-end tests
    - **Recommendation:** Add Playwright or Cypress tests for critical flows

11. **Feature Flags**
    - **Gap:** No feature flag system
    - **Recommendation:** Consider LaunchDarkly or similar for gradual rollouts

12. **PII Masking**
    - **Gap:** PII displayed in plain text
    - **Recommendation:** Add masking for sensitive fields (email, phone) in non-privileged views

13. **RID ID Format Validation**
    - **Gap:** Validation only after generation, not on input
    - **Recommendation:** Add input validation if RID ID is manually entered

14. **Session Timeout**
    - **Gap:** No idle detection or session timeout UI
    - **Recommendation:** Add session timeout warning and auto-logout

15. **API Versioning Strategy**
    - **Gap:** API version hardcoded to 'v1'
    - **Recommendation:** Make API version configurable, plan for version migration

---

## 16) Appendix A — File & Symbol Index

| File | Module/Component/Hook | Purpose |
|------|----------------------|---------|
| `app/app.js` | Root entry point | App initialization, Auth0 provider setup, theme configuration |
| `app/containers/App/index.js` | App container | Route definitions, global layout |
| `app/containers/Auth/index.js` | Auth0Provider | Auth0 authentication wrapper, token management |
| `app/containers/RegistrationPage/index.js` | RegistrationPage | Multi-entity registration forms (Operator/Aircraft/Pilot/Contact) |
| `app/containers/LandingPage/index.js` | LandingPage | Dashboard, search interface, module status board |
| `app/containers/DetailsPage/index.js` | DetailsPage | Entity details display (public/privileged) |
| `app/containers/LoadPage/index.js` | LoadPage | RID module activation interface |
| `app/services/apiService.js` | API client | All API request functions, RID ID generation |
| `app/utils/apiConfig.js` | API config | Base URL, version, JWT token helpers |
| `app/utils/loginHelper.js` | Login helpers | JWT login, authentication checks |
| `app/auth_config.js` | Auth config | Auth0 configuration (domain, clientId, scopes) |
| `app/configureStore.js` | Store setup | Redux store configuration, saga middleware |
| `app/reducers.js` | Root reducer | Combined reducers |
| `app/i18n.js` | i18n setup | Internationalization configuration |
| `app/components/DetailsCard/index.js` | DetailsCard | Reusable entity details display component |
| `app/components/LoadingIndicator/index.js` | LoadingIndicator | Loading spinner component |
| `internals/webpack/webpack.prod.babel.js` | Webpack prod | Production build configuration |
| `jest.config.js` | Jest config | Test configuration, coverage thresholds |

---

## 17) Appendix B — JSON Snapshot

```json
{
  "app": {
    "name": "Airegister",
    "framework": "React",
    "version": "16.8.6",
    "boilerplate": "react-boilerplate 4.0.0"
  },
  "domain": {
    "entities": [
      "Operator",
      "Aircraft",
      "Pilot",
      "Contact",
      "RID Module"
    ],
    "constraints": [
      "RID ID must be UUID v4",
      "Module ESN must be unique",
      "Operator type must be 0-4",
      "Aircraft status must be 0-3"
    ]
  },
  "flows": [
    {
      "name": "Registration",
      "steps": ["Landing", "Login", "Registration Form", "Submit", "Success"],
      "routes": ["/", "/login", "/register"]
    },
    {
      "name": "RID Module Activation",
      "steps": ["Load Page", "Device Selection", "Operator Selection", "Aircraft Selection", "Activation", "Backend Sync"],
      "routes": ["/load"]
    },
    {
      "name": "Search & Discovery",
      "steps": ["Landing", "Collection Type Selection", "Search Input", "API Query", "Results Display"],
      "routes": ["/"]
    },
    {
      "name": "Entity Details",
      "steps": ["Details Page", "API Request", "Details Card Rendering"],
      "routes": ["/{type}/{uuid}", "/{type}/{uuid}/privileged"]
    }
  ],
  "forms": {
    "libraries": [],
    "schemas": [],
    "fields": [
      {
        "form": "Operator",
        "fields": ["company_name", "website", "email", "phone_number", "operator_type", "vat_number", "insurance_number", "company_number", "country", "address"]
      },
      {
        "form": "Aircraft",
        "fields": ["operator", "manufacturer", "model", "mass", "status", "esn", "maci_number", "registration_mark", "sub_category", "type_certificate"]
      },
      {
        "form": "Pilot",
        "fields": ["operator", "is_active", "person", "address"]
      },
      {
        "form": "Contact",
        "fields": ["operator", "role_type", "person", "address"]
      }
    ]
  },
  "auth": {
    "method": "Auth0 SPA SDK (OIDC/OAuth2)",
    "storage": "localStorage (jwt_token)",
    "roles": [],
    "scopes": [
      "registry.read.operator",
      "registry.read.operator_detail",
      "registry.read.operator_detail.privileged",
      "registry.read.contact_detail",
      "registry.read.contact_detail.privileged",
      "registry.read.pilot",
      "registry.read.pilot_detail",
      "registry.read.pilot_detail.privileged",
      "registry.read.aircraft",
      "registry.read.aircraft_detail",
      "registry.read.aircraft_detail.privileged"
    ],
    "timeouts": "Not detected"
  },
  "api": {
    "baseUrls": [
      "https://register-ku.duckdns.org",
      "http://localhost:8080"
    ],
    "endpoints": [
      "/api/v1/operators",
      "/api/v1/aircraft",
      "/api/v1/pilots",
      "/api/v1/contacts",
      "/api/v1/rid-modules",
      "/api/v1/operators/{uuid}/aircraft",
      "/api/v1/{type}/{uuid}",
      "/api/v1/{type}/{uuid}/privileged"
    ],
    "errors": [
      "401 Unauthorized",
      "404 Not Found",
      "500 Server Error"
    ],
    "timeouts": "Browser default"
  },
  "state": {
    "store": "Redux",
    "queryLib": "None (Redux Saga)",
    "caches": ["Redux store", "localStorage (jwt_token, operator_id)"]
  },
  "ui": {
    "designSystem": "Material-UI v4.12.4",
    "components": [
      "DetailsCard",
      "LoadingIndicator",
      "IssueIcon",
      "Toggle"
    ],
    "a11y": ["Partial (Material-UI defaults)"],
    "i18n": {
      "locales": ["en", "de"],
      "default": "en",
      "library": "react-intl v2.8.0"
    }
  },
  "config": {
    "envVarsPublic": [
      "REACT_APP_REGISTRATION_API_URL",
      "REACT_APP_API_VERSION",
      "NODE_ENV"
    ],
    "featureFlags": []
  },
  "security": {
    "headers": ["Strict-Transport-Security (nginx.conf)"],
    "sanitization": "React default escaping",
    "piiControls": []
  },
  "performance": {
    "bundles": ["Webpack code splitting"],
    "splitPoints": ["Vendor chunks per package", "Runtime chunk"],
    "metrics": {}
  },
  "testing": {
    "unit": ["Jest", "React Testing Library"],
    "e2e": [],
    "coverage": {
      "statements": 98,
      "branches": 91,
      "functions": 98,
      "lines": 98
    }
  },
  "deployment": {
    "mode": "SPA",
    "cdn": false,
    "browsers": ["last 2 versions", "> 1%", "IE 10"]
  },
  "observability": {
    "logging": "Console (development only)",
    "analytics": [],
    "errorReporting": ""
  },
  "recommendations": [
    "Add schema validation library (Zod/Yup)",
    "Migrate to TypeScript",
    "Add Error Boundary",
    "Improve form validation feedback",
    "Enhance accessibility (ARIA, keyboard navigation)",
    "Implement token security improvements",
    "Add API retry logic",
    "Integrate error tracking (Sentry)",
    "Add E2E tests",
    "Implement feature flags",
    "Add PII masking",
    "Add session timeout",
    "Make API version configurable"
  ]
}
```

---

**End of Dossier**

