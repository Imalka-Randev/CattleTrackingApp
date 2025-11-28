Architecture Report: Cattle Tracking App
This report details the architecture and data flow between UserContext, 
MapScreen
, and 
CowDetailsScreen
, focusing on how API data is managed and shared.

1. Overview
The application uses a centralized state management approach via UserContext. This ensures that:

Data Consistency: Both the map and details screens show the same data.
Efficiency: Data fetched by one screen is immediately available to the other.
Persistence: Map state (focus, region) is preserved across tab switches.
2. Component Breakdown
A. UserContext (
src/context/UserContext.js
)
Role: The "Single Source of Truth". It holds the global state for the application.

Key State Variables:

cattleList: Static list of all cattle (names, breeds, IDs). Fetched once on login.
collarData: A dictionary { [collarId]: apiResponse } storing the latest real-time data for each collar.
mapHasFocused: Boolean flag to track if the map has already auto-focused in the current session.
mapRegion: Stores the current map view (latitude, longitude, zoom) to restore it when switching tabs.
Key Functions:

fetchCattle(): GET /api/cattles. Fetches the static list of cattle.
updateCollarData(id, data): Updates the collarData for a single device. Used by 
CowDetailsScreen
.
updateMultipleCollarData(dataMap): Updates collarData for multiple devices at once. Used by 
MapScreen
.
B. MapScreen (
src/screens/MapScreen.js
)
Role: Displays all cattle on a map.

Data Flow:

Initialization:

Reads cattleList from Context to build a lookup map (cattleMap) for efficient access to static data.
Reads collarData from Context to derive the list of markers (items).
Restores initialRegion from mapRegion (Context) to show the user's last view.
Data Fetching (fetchAll):

Polls /api/collar-data/:id for all devices every 30 seconds.
Optimization: Instead of setting local state, it calls updateMultipleCollarData to update the Context. This automatically triggers a re-render of the map with new data.
Map Behavior:

Auto-Focus: Checks mapHasFocused (Context). If false and data is available, it zooms to the cattle and sets mapHasFocused to true.
Persistence: Updates mapRegion (Context) whenever the user moves the map (onRegionChangeComplete).
Filtering: Ignores invalid coordinates (e.g., 
(0,0)
).
C. CowDetailsScreen (
src/screens/CowDetailsScreen.js
)
Role: Displays detailed real-time data for a specific cow.

Data Flow:

Initialization:

Reads collarData from Context for the specific deviceId. This allows it to show data immediately if 
MapScreen
 has already fetched it.
Data Fetching (
fetchCollarData
):

Polls /api/collar-data/:id for this specific device every 1 second (high frequency).
Optimization: Calls updateCollarData to update the Context.
Result: The 
MapScreen
 (if visible/mounted) will also see these 1-second updates in real-time.
3. API Usage Summary
Endpoint	Method	Frequency	Component	Purpose
/api/cattles	GET	Once (Login/App Start)	UserContext	Fetches static cattle details (Name, Breed, IDs).
/api/collar-data/:id	GET	Every 30s	
MapScreen
Bulk update for all cattle locations.
/api/collar-data/:id	GET	Every 1s	
CowDetailsScreen
High-frequency tracking for the selected cow.
4. Data Flow Diagram
⚠️ Failed to render Mermaid diagram: Parse error on line 10
graph TD
    API[API Server]

    subgraph UserContext
        State[collarData State]
        Region[mapRegion State]
    end

    subgraph MapScreen
        MapFetch[fetchAll (30s)]
        MapRender[Render Markers]
    end

    subgraph CowDetailsScreen
        DetailFetch[fetchCollarData (1s)]
        DetailRender[Render Details]
    end

    %% Data Fetching
    MapFetch -->|GET /api/collar-data| API
    DetailFetch -->|GET /api/collar-data| API

    %% Updating Context
    MapFetch -->|updateMultipleCollarData| State
    DetailFetch -->|updateCollarData| State

    %% Consuming Context
    State -->|Updates| MapRender
    State -->|Updates| DetailRender

    %% Persistence
    MapRender -->|onRegionChange| Region
    Region -->|initialRegion| MapRender