# API Usage Report

## Overview
The application uses a mix of a centralized `axios` client and direct `fetch` calls. There are significant inconsistencies in base URLs and implementation styles.

## Centralized API Client
**File:** `src/api/apiClient.js`
- **Library:** `axios`
- **Base URL:** Imported from `../constants/Config` (Likely `http://213.199.51.193:8000` based on comments).
- **Authentication:** Automatically adds `Authorization: Bearer <token>` header if a token exists in `AsyncStorage`.

## API Endpoints

### Authentication & User
| Method | Endpoint | Location | Client | Notes |
|--------|----------|----------|--------|-------|
| `POST` | `/api/users/login` | `src/api/authService.js` | `apiClient` | Standard login flow. |
| `POST` | `/api/user/create` | `src/screens/RegisterScreen.js` | `fetch` | **WARNING:** Uses hardcoded IP `http://100.79.26.84:8000`. Inconsistent with `apiClient`. |

### Cattle Management
| Method | Endpoint | Location | Client | Notes |
|--------|----------|----------|--------|-------|
| `GET` | `/api/cattles` | `src/context/UserContext.js` | `apiClient` | Fetches all cattle. Stores in `AsyncStorage`. |
| `POST` | `/api/cattle/add` | `src/screens/AddCollarScreen.js` | `fetch` | **WARNING:** Uses hardcoded IP `http://100.79.26.84:8000`. |

### Device Data (Collar)
| Method | Endpoint | Location | Client | Notes |
|--------|----------|----------|--------|-------|
| `GET` | `/api/collar-data/:id` | `src/screens/CowDetailsScreen.js` | `apiClient` | Polled every 1 second. |
| `GET` | `/api/collar-data/:id` | `src/screens/MapScreen.js` | `apiClient` | Polled every 30 seconds for all cattle. |

## Issues & Inconsistencies

### 1. Hardcoded IP Addresses
Two screens (`RegisterScreen.js` and `AddCollarScreen.js`) use `fetch` with a hardcoded IP address (`http://100.79.26.84:8000`).
- **Risk:** If the backend IP changes, these features will break while the rest of the app (using `apiClient`) might work (if Config is updated).
- **Recommendation:** Refactor these calls to use `apiClient` to ensure consistent base URL usage and error handling.

### 2. Mixed HTTP Clients
The app uses both `axios` (wrapped in `apiClient`) and native `fetch`.
- **Recommendation:** Standardize on `apiClient` for all network requests to benefit from interceptors (auth headers, error handling) and consistent configuration.

### 3. Endpoint Naming Conventions
- Login uses `/api/users/login` (plural `users`).
- Registration uses `/api/user/create` (singular `user`).
- Cattle fetch uses `/api/cattles` (plural).
- Cattle add uses `/api/cattle/add` (singular).
- **Observation:** The backend API seems to have mixed naming conventions (singular vs plural).

## Recommendations for Refactoring
1.  **Move all API calls to `src/api/`**: Create new service files (e.g., `cattleService.js`, `userService.js`) to house the logic currently inside screens.
2.  **Replace `fetch` with `apiClient`**: Update `RegisterScreen` and `AddCollarScreen` to use the centralized client.
3.  **Centralize Configuration**: Ensure `src/constants/Config.js` is the single source of truth for the API Base URL.
