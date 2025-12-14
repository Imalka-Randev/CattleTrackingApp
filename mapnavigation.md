I've added detailed comments to MapScreen.js to explain every part of the code.

How the Routing Mechanism Works
User Location:
We use expo-location to track your GPS position in real-time.
This updates the userLocation state whenever you move.
Target Selection:
When you tap the "Direction Mode" button, isDirectionMode becomes true.
Tapping a cattle marker now sets it as the targetCattle instead of opening the details screen.
Fetching the Route (OSRM):
Once we have both a userLocation and a targetCattle, the fetchOSRMRoute function runs.
It sends a request to the OSRM (Open Source Routing Machine) public server: http://router.project-osrm.org/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}
This server calculates the best driving path along roads.
Drawing the Line:
OSRM returns the route geometry as a compressed string (to save data).
The decodePolyline helper function converts this string back into a list of GPS coordinates (latitude/longitude points).
We pass these points to the <Polyline> component from react-native-maps, which draws the blue line on the map.
Displaying Info:
The OSRM response also contains the total distance and estimated duration.
We pass these values to the RouteInfoCard component, which displays them at the bottom of the screen.
This approach is completely free and doesn't require any API keys because it uses OpenStreetMap data via the OSRM project.

