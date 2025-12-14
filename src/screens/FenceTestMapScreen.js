import React, { useEffect, useState, useRef, useContext, useCallback, useMemo } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    ActivityIndicator,
    useColorScheme,
    Alert,
    Animated,
    PanResponder,
    Dimensions,
    useWindowDimensions,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
    ScrollView,
} from 'react-native';
import MapView, { Marker, Polygon, Polyline, Circle } from 'react-native-maps';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../context/UserContext';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import RouteInfoCard from '../components/RouteInfoCard';

const POLLING_INTERVAL = 15000; // 15s
const DEFAULT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

const isValidCoordinate = (lat, lon) => {
    if (lat == null || lon == null) return false;
    const nlat = Number(lat);
    const nlon = Number(lon);
    if (Math.abs(nlat) < 0.0001 && Math.abs(nlon) < 0.0001) return false;
    return !Number.isNaN(nlat) && nlat >= -90 && nlat <= 90 && nlon >= -180 && nlon <= 180;
};

// Ray-casting algorithm to check if a point is inside a polygon
const isPointInPolygon = (point, polygon) => {
    let x = point.latitude, y = point.longitude;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i].latitude, yi = polygon[i].longitude;
        let xj = polygon[j].latitude, yj = polygon[j].longitude;
        let intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

const decodePolyline = (t, e) => {
    for (var n, o, u = 0, l = 0, r = 0, d = [], h = 0, i = 0, a = null, c = Math.pow(10, e || 5); u < t.length;) {
        a = null, h = 0, i = 0;
        do {
            a = t.charCodeAt(u++) - 63, i |= (31 & a) << h, h += 5;
        } while (a >= 32);
        n = (1 & i) ? ~(i >> 1) : i >> 1, l += n;
        h = 0, i = 0;
        do {
            a = t.charCodeAt(u++) - 63, i |= (31 & a) << h, h += 5;
        } while (a >= 32);
        o = (1 & i) ? ~(i >> 1) : i >> 1, r += o;
        d.push({ latitude: l / c, longitude: r / c });
    }
    return d;
};

export default function FenceTestMapScreen() {
    const { cattleList = [], fetchCattle, collarData, mapRegion, setMapRegion, fetchCollarData, geofences, addGeofence, removeGeofence, updateGeofence } = useContext(UserContext);
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const insets = useSafeAreaInsets(); // Hook for safe area
    // Responsive Hook
    const { width: winW, height: winH } = useWindowDimensions();

    const mapRef = useRef(null);
    const markerColorsRef = useRef({});

    // Geofence State
    const [isDrawing, setIsDrawing] = useState(false);
    const [polygonCoords, setPolygonCoords] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [fenceName, setFenceName] = useState('');
    const [fenceColor, setFenceColor] = useState('#FFA500'); // Default Orange
    const [tempCoords, setTempCoords] = useState([]); // Temporary coords during draw

    // Selection & Assignment State
    const [selectedFenceId, setSelectedFenceId] = useState(null);
    const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
    const [tempAssignedCattle, setTempAssignedCattle] = useState([]);

    // Navigation/Tracking State
    const [userLocation, setUserLocation] = useState(null);
    const [isDirectionMode, setIsDirectionMode] = useState(false);
    const [targetCattle, setTargetCattle] = useState(null);
    const [routeDetails, setRouteDetails] = useState({ distance: 0, duration: 0 });
    const [routeCoordinates, setRouteCoordinates] = useState([]);

    const cattleMap = useMemo(() => {
        const newMap = {};
        (cattleList || []).forEach(cattle => {
            const collarIdKey = String(cattle.collarId || cattle.id).trim();
            const storageKey = String(cattle.id || cattle.cattleId || cattle.collarId);
            if (collarIdKey && collarIdKey !== 'undefined') {
                newMap[collarIdKey] = {
                    ...cattle,
                    name: cattle.cattle_name || cattle.name || `Cattle ${collarIdKey}`,
                    collarId: collarIdKey,
                    storageKey: storageKey,
                };
            }
        });
        return newMap;
    }, [cattleList]);

    const items = useMemo(() => {
        const deviceIds = Object.keys(cattleMap);
        return deviceIds.map(collarId => {
            const cattleDetails = cattleMap[collarId] || {};
            const data = collarData[collarId];
            const lastLocation = data?.lastLocation ?? null;
            const apiLastSeen = data?.lastSeen ?? data?.lastLocation?.timestamp ?? data?.updatedAt ?? null;

            const latest_record = lastLocation && isValidCoordinate(lastLocation.lat, lastLocation.lon)
                ? {
                    latitude: lastLocation.lat,
                    longitude: lastLocation.lon,
                    created_at: lastLocation.timestamp ?? apiLastSeen,
                } : null;

            return {
                id: cattleDetails.id ?? collarId,
                collar_id: collarId,
                cattle_name: cattleDetails.name ?? `Cattle ${collarId}`,
                latest_record,
                markerColor: markerColorsRef.current[collarId] ?? '#FF6B6B',
                isAlert: cattleDetails?.healthNotes?.toLowerCase()?.includes('alert'),
            };
        });
    }, [collarData, cattleMap]);

    const [loading, setLoading] = useState(true);
    const [mapType, setMapType] = useState('hybrid');

    // --- DRAG & SNAP STATE ---
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
    const [isHorizontal, setIsHorizontal] = useState(false);

    // Initial Position: Bottom-Right side
    const BUTTON_SIZE = 44 + 12; // 56px roughly including margins
    const PANEL_WIDTH_VERT = 56 + 12; // approx 68
    const PANEL_HEIGHT_VERT = (56 * 4) + 12; // approx 236

    // Initialize to Bottom-Right roughly: Right-20, Bottom-120
    const initialX = SCREEN_WIDTH - PANEL_WIDTH_VERT - 20;
    const initialY = SCREEN_HEIGHT - PANEL_HEIGHT_VERT - 100;

    const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;

    // Store dimensions ref to access in PanResponder without stale closure
    const dimensionsRef = useRef({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });

    // Simplified Strict Positioning Logic
    useEffect(() => {
        const SAFE_MARGIN = 20 + (insets.bottom || 0);
        const TOP_OFFSET = 80;

        // Update Ref with latest dimensions
        dimensionsRef.current = { width: SCREEN_WIDTH, height: SCREEN_HEIGHT };

        const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;
        const myWidth = PANEL_WIDTH_VERT;
        const myHeight = PANEL_HEIGHT_VERT;

        let targetX, targetY;

        if (isLandscape) {
            // Landscape -> Force RIGHT Side & Vertical Center
            // DISABLES DRAGGING (handled in PanResponder)
            targetX = SCREEN_WIDTH - myWidth - SAFE_MARGIN;

            // Center Vertically
            targetY = (SCREEN_HEIGHT - myHeight) / 2;
            if (targetY < TOP_OFFSET) targetY = TOP_OFFSET;

            // Ensure vertical layout
            setIsHorizontal(false);
        } else {
            // Portrait -> Default to Right Side
            targetX = SCREEN_WIDTH - myWidth - SAFE_MARGIN;
            targetY = SCREEN_HEIGHT - myHeight - 100;
            setIsHorizontal(false);
        }

        // Animate to strict position
        Animated.spring(pan, {
            toValue: { x: targetX, y: targetY },
            useNativeDriver: false,
            friction: 7,
            tension: 40
        }).start();
    }, [SCREEN_WIDTH, SCREEN_HEIGHT, insets.bottom]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gesture) => {
                const { width, height } = dimensionsRef.current;
                const isLandscape = width > height;

                // DISABLE DRAG IN LANDSCAPE
                if (isLandscape) return false;

                return Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5;
            },
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: pan.x._value,
                    y: pan.y._value,
                });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gesture) => {
                pan.flattenOffset();

                // Get FRESH dimensions from Ref
                const { width: currW, height: currH } = dimensionsRef.current;

                // Only PORTRAIT logic remains here because Landscape drag is disabled
                const currentX = gesture.moveX;
                const currentY = gesture.moveY;

                const SAFE_MARGIN = 20;
                const TOP_BAR_OFFSET = 80;
                const BOTTOM_OFFSET = 50;

                const isBottomZone = currentY > currH - 150;

                if (isBottomZone) {
                    setIsHorizontal(true);
                    const targetW = PANEL_HEIGHT_VERT;
                    const targetH = PANEL_WIDTH_VERT;
                    const targetX = (currW / 2) - (targetW / 2);
                    const targetY = currH - targetH - SAFE_MARGIN;

                    Animated.spring(pan, {
                        toValue: { x: targetX, y: targetY },
                        useNativeDriver: false,
                        friction: 6,
                    }).start();
                } else {
                    setIsHorizontal(false);
                    const isLeftZone = currentX < currW / 2;

                    // Default Vertical Snap
                    let targetX = isLeftZone ? SAFE_MARGIN : (currW - PANEL_WIDTH_VERT - SAFE_MARGIN);
                    let targetY = currentY - (PANEL_HEIGHT_VERT / 2);

                    // Clamp Y
                    const maxY = currH - PANEL_HEIGHT_VERT - BOTTOM_OFFSET;
                    if (targetY < TOP_BAR_OFFSET) targetY = TOP_BAR_OFFSET;
                    if (targetY > maxY) targetY = maxY;

                    Animated.spring(pan, {
                        toValue: { x: targetX, y: targetY },
                        useNativeDriver: false,
                        friction: 6,
                    }).start();
                }
            }
        })
    ).current;

    // --- TOOL MENU DRAG STATE ---
    // Start at 0,0 and let useEffect handle positioning
    const toolPan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

    // Inverse Docking Logic
    useEffect(() => {
        if (!showFenceTools) return;

        // VISIBILITY FIX: Use reactive hook values
        const width = winW;
        const height = winH;
        const isLandscape = width > height;
        const SAFE_MARGIN = 20;

        // Use timeout to ensure component is mounted and layout is ready
        // This fixes the "Invisible on First Try" issue
        const timer = setTimeout(() => {
            let targetX, targetY;

            if (isLandscape) {
                // Landscape Screen -> Main Menu is Vertical (Right).
                // Tool Menu -> EXACTLY CENTER of Screen (User Request).
                const menuWidth = 300;
                const menuHeight = 60;

                targetX = (width - menuWidth) / 2;
                targetY = (height - menuHeight) / 2;
            } else {
                // Portrait Screen:
                if (isHorizontal) { // Main Menu is Bottom
                    // Tool Menu -> Right Side
                    targetX = width - 56 - 12;
                    targetY = height / 2 - 100;
                } else { // Main Menu is Right
                    // Tool Menu -> Bottom Center
                    const menuWidth = 240;
                    targetX = (width - menuWidth) / 2;
                    targetY = height - 80 - SAFE_MARGIN;
                }
            }

            // Force position immediately
            toolPan.stopAnimation();
            toolPan.setOffset({ x: 0, y: 0 });
            toolPan.setValue({ x: targetX, y: targetY });
        }, 100); // 100ms delay for safety

        return () => clearTimeout(timer);

    }, [isHorizontal, showFenceTools, winW, winH, insets.bottom]);

    const toolPanResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                toolPan.setOffset({
                    x: toolPan.x._value,
                    y: toolPan.y._value,
                });
                toolPan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: toolPan.x, dy: toolPan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gesture) => {
                toolPan.flattenOffset();
                const currentX = gesture.moveX;
                const currentY = gesture.moveY;
                const { width, height } = dimensionsRef.current;

                const isBottom = currentY > height - 150;

                if (isBottom) {
                    // Snap Bottom Center
                    const menuWidth = 240;
                    Animated.spring(toolPan, {
                        toValue: { x: (width - menuWidth) / 2, y: height - 80 - 20 },
                        useNativeDriver: false,
                    }).start();
                } else {
                    // Snap Side (Left or Right)
                    const isLeft = currentX < width / 2;
                    Animated.spring(toolPan, {
                        toValue: {
                            x: isLeft ? 20 : width - 56 - 12,
                            y: currentY
                        },
                        useNativeDriver: false,
                    }).start();
                }
            }
        })
    ).current;

    const assignColors = (ids, customColorMap = {}) => {
        const out = { ...markerColorsRef.current };
        let idx = 0;
        const idsToAssignDefault = ids.filter(id => {
            const storageKey = cattleMap[id]?.storageKey;
            return !out[id] && !(storageKey && customColorMap[storageKey]);
        });
        idsToAssignDefault.forEach((id) => {
            out[id] = DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
            idx++;
        });
        ids.forEach((id) => {
            const storageKey = cattleMap[id]?.storageKey;
            if (storageKey && customColorMap[storageKey]) {
                out[id] = customColorMap[storageKey];
            }
        });
        markerColorsRef.current = out;
        return out;
    };

    const loadColors = useCallback(async () => {
        try {
            const deviceIds = Object.keys(cattleMap);
            if (deviceIds.length === 0) return;
            const stored = await AsyncStorage.getItem('cattleColors');
            const customColorMap = stored ? JSON.parse(stored) : {};
            assignColors(deviceIds, customColorMap);
            setLoading(prev => prev);
        } catch (e) {
            console.error('Failed to load custom colors:', e);
        }
    }, [cattleMap]);

    useFocusEffect(
        useCallback(() => {
            if (cattleList.length === 0 && fetchCattle) fetchCattle();
            loadColors();
            if (fetchCollarData) {
                setLoading(true);
                fetchCollarData().finally(() => setLoading(false));
            }
            const interval = setInterval(() => {
                if (fetchCollarData) fetchCollarData();
            }, POLLING_INTERVAL);
            return () => clearInterval(interval);
        }, [cattleList, fetchCattle, fetchCollarData, loadColors])
    );

    // Location Tracking
    useEffect(() => {
        let subscription;
        const startTracking = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            subscription = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, distanceInterval: 10 },
                (location) => setUserLocation(location.coords)
            );
        };
        startTracking();
        return () => subscription?.remove();
    }, []);

    // OSRM Routing
    useEffect(() => {
        if (isDirectionMode && userLocation && targetCattle) {
            fetchOSRMRoute(userLocation, targetCattle);
        }
    }, [userLocation, targetCattle, isDirectionMode]);

    const fetchOSRMRoute = async (start, end) => {
        try {
            const url = `http://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=polyline`;
            const response = await fetch(url);
            const json = await response.json();

            if (json.code === 'Ok' && json.routes.length > 0) {
                const route = json.routes[0];
                const points = decodePolyline(route.geometry);
                setRouteCoordinates(points);
                setRouteDetails({
                    distance: route.distance / 1000,
                    duration: route.duration / 60,
                });
                if (mapRef.current) {
                    mapRef.current.fitToCoordinates(points, {
                        edgePadding: { top: 50, right: 50, bottom: 150, left: 50 },
                        animated: true,
                    });
                }
            }
        } catch (error) {
            console.error('OSRM Fetch Error:', error);
        }
    };

    const toggleMapType = () => {
        setMapType(prev => {
            if (prev === 'satellite') return 'standard';
            if (prev === 'standard') return 'hybrid';
            return 'satellite';
        });
    };

    const renderIcon = (type, color, size) => {
        const mapTypeIcons = {
            standard: { icon: 'map', library: 'MaterialCommunityIcons' },
            satellite: { icon: 'satellite', library: 'FontAwesome5' },
            hybrid: { icon: 'map-legend', library: 'MaterialCommunityIcons' },
        };
        const def = mapTypeIcons[type] || mapTypeIcons.standard;
        if (def.library === 'MaterialCommunityIcons') return <MaterialCommunityIcons name={def.icon} size={size} color={color} />;
        return <FontAwesome5 name={def.icon} size={size} color={color} />;
    };

    // --- Geofence Logic ---
    const [showFenceTools, setShowFenceTools] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isAddingCattle, setIsAddingCattle] = useState(false);



    const toggleDrawing = () => {
        if (isDrawing) {
            // If already drawing, tapping again might mean "Stop/Cancel" without saving? 
            // Or maybe user wants to save? Let's assume Cancel/Stop for now to keep logic simple, 
            // but we need a "Save" action. 
            // Current flow: Click Draw -> Modal -> Start Drawing -> Click "Check/Save" (needs to be added).
            // Tapping the pencil again usually cancels.
            setIsDrawing(false);
            setPolygonCoords([]);
            Toast.show({ type: 'info', text1: 'Drawing Canceled' });
        } else {
            // Start Drawing Flow
            setFenceName('');
            setFenceColor('#FFA500');
            setModalVisible(true);
        }
    };

    const startDrawingSession = () => {
        if (!fenceName.trim()) {
            Alert.alert('Error', 'Please enter a fence name.');
            return;
        }
        setModalVisible(false);
        setIsDrawing(true);
        setPolygonCoords([]);
        // Turn off others
        setIsEditing(false);
        setIsAddingCattle(false);
        Toast.show({ type: 'info', text1: 'Drawing Mode On', text2: 'Tap on map to add points.' });
    };

    const saveFence = () => {
        if (polygonCoords.length < 3) {
            Alert.alert('Invalid Fence', 'A fence must have at least 3 points.');
            return;
        }
        const newFence = {
            id: Date.now().toString(),
            name: fenceName,
            color: fenceColor,
            coordinates: polygonCoords,
        };
        addGeofence(newFence);
        setIsDrawing(false);
        setPolygonCoords([]);
        Toast.show({ type: 'success', text1: 'Fence Saved', text2: `${fenceName} has been saved.` });
    };

    const toggleEditing = () => {
        setIsEditing(!isEditing);
        setIsDrawing(false);
        setIsAddingCattle(false);
    };

    const toggleAddingCattle = () => {
        setIsAddingCattle(!isAddingCattle);
        setIsDrawing(false);
        setIsEditing(false);
    };

    const confirmClearPolygon = () => {
        Alert.alert(
            "Delete Fence",
            "Are you sure you want to delete the current fence boundary?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: clearPolygon }
            ]
        );
    };

    const clearPolygon = () => {
        setPolygonCoords([]);
        setIsDrawing(false);
        setIsEditing(false);
        setIsAddingCattle(false);
        Toast.show({ type: 'success', text1: 'Fence Deleted', text2: 'Boundary cleared.' });
    };

    const onMapPress = (e) => {
        if (isDrawing) {
            setPolygonCoords([...polygonCoords, e.nativeEvent.coordinate]);
        }
    };

    const checkCattleInside = () => {
        if (!geofences || geofences.length === 0) return;

        let alerts = [];

        geofences.forEach(fence => {
            const assignedIds = fence.assignedCattleIds || [];
            if (assignedIds.length === 0) return;

            assignedIds.forEach(id => {
                const cow = items.find(i => i.id === id || i.collar_id === id);
                if (cow && cow.latest_record) {
                    const point = {
                        latitude: Number(cow.latest_record.latitude),
                        longitude: Number(cow.latest_record.longitude)
                    };
                    if (!isPointInPolygon(point, fence.coordinates)) {
                        alerts.push(`${cow.cattle_name} is outside ${fence.name}`);
                    }
                }
            });
        });

        if (alerts.length > 0) {
            Alert.alert('Geofence Alert', alerts.join('\n'), [{ text: 'OK' }]);
            // Optionally Play Sound or Vibrate
        }
    };

    // Check bounds every time locations update
    useEffect(() => {
        const interval = setInterval(checkCattleInside, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, [items, geofences]);

    // --- Direction / Focus Logic ---

    const toggleDirectionMode = () => {
        setIsDirectionMode(!isDirectionMode);
        if (!isDirectionMode) {
            // Toast removed
        } else {
            setTargetCattle(null);
            setRouteDetails({ distance: 0, duration: 0 });
            setRouteCoordinates([]);
        }
    };

    const focusOnCattle = () => {
        const coords = items.map(i => i.latest_record ? {
            latitude: Number(i.latest_record.latitude),
            longitude: Number(i.latest_record.longitude)
        } : null).filter(Boolean);

        if (coords.length > 0 && mapRef.current?.fitToCoordinates) {
            mapRef.current.fitToCoordinates(coords, { edgePadding: { top: 60, bottom: 60, left: 40, right: 40 }, animated: true });
        }
    };

    const handleMarkerLongPress = (coordinate) => {
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                ...coordinate,
                latitudeDelta: 0.002,
                longitudeDelta: 0.002,
            }, 1000);
        }
    };

    const handleMarkerPress = (mapItem) => {
        if (isDirectionMode) {
            if (mapItem.latest_record) {
                setTargetCattle({
                    latitude: Number(mapItem.latest_record.latitude),
                    longitude: Number(mapItem.latest_record.longitude),
                    name: mapItem.cattle_name
                });
                Toast.show({
                    type: 'success',
                    text1: 'Target Selected',
                    text2: `Routing to ${mapItem.cattle_name}...`,
                });
            } else {
                Alert.alert('No Location', 'This cattle does not have a valid location.');
            }
            return;
        }
        // Normal mode navigation
        const fullCowData = cattleMap[mapItem.collar_id];
        if (fullCowData) {
            navigation.navigate('CowDetails', { cow: { ...fullCowData, latest_record: mapItem.latest_record || fullCowData.latest_record } });
        }
    };

    const renderToolBtn = (icon, isActive, onPress, isDestructive = false) => {
        // "Flip" colors:
        // Active: Bg Orange, Icon White
        // Inactive: Bg White, Icon Orange
        // Destructive (Bin): Bg White, Icon Red (Always inactive style visually until pressed? Or just red icon)

        let bgColor = '#fff';
        let iconColor = '#FFA500';

        if (isDestructive) {
            iconColor = '#FF3B30'; // Always Red
            // No active state for delete button usually, it's an action.
        } else if (isActive) {
            bgColor = '#FFA500';
            iconColor = '#fff';
        }

        return (
            <TouchableOpacity
                style={[styles.rectButton, { margin: 4, backgroundColor: bgColor }]}
                onPress={onPress}
            >
                <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
            </TouchableOpacity>
        );
    };





    const handleSelectFence = (fence) => {
        setSelectedFenceId(fence.id);
        setShowFenceTools(true);
        // Toast.show({ type: 'info', text1: 'Fence Selected', text2: fence.name });
    };

    const handleDeleteAction = () => {
        if (isDrawing || polygonCoords.length > 0) {
            confirmClearPolygon();
        } else if (selectedFenceId) {
            handleDeleteFence(selectedFenceId);
        } else {
            Toast.show({ type: 'info', text1: 'Nothing to delete', text2: 'Select a fence first.' });
        }
    };

    const handleDeleteFence = (id) => {
        Alert.alert(
            "Delete Fence",
            "Are you sure you want to delete this fence?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        removeGeofence(id);
                        setSelectedFenceId(null); // Deselect
                        Toast.show({ type: 'success', text1: 'Deleted', text2: 'Fence removed.' });
                    }
                }
            ]
        );
    };

    // Assignment Logic
    const openAssignmentModal = () => {
        if (!selectedFenceId) {
            Alert.alert('Select Fence', 'Please select a fence on the map first.');
            return;
        }
        const fence = geofences.find(f => f.id === selectedFenceId);
        if (fence) {
            setTempAssignedCattle(fence.assignedCattleIds || []);
            setAssignmentModalVisible(true);
        }
    };

    const toggleCattleAssignment = (id) => {
        setTempAssignedCattle(prev => {
            if (prev.includes(id)) {
                return prev.filter(cid => cid !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const saveAssignments = () => {
        const fence = geofences.find(f => f.id === selectedFenceId);
        if (fence) {
            const updatedFence = { ...fence, assignedCattleIds: tempAssignedCattle };
            updateGeofence(updatedFence);
            setAssignmentModalVisible(false);
            Toast.show({ type: 'success', text1: 'Updated', text2: `Assigned ${tempAssignedCattle.length} cattle to ${fence.name}` });
        }
    };

    return (
        <View style={[styles.fullScreen, colorScheme === 'dark' && styles.darkBackground]}>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.modalOverlay}>
                        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContent}>
                            <Text style={styles.modalTitle}>New Fence Details</Text>

                            <Text style={styles.label}>Fence Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter fence name (e.g., North Pasture)"
                                value={fenceName}
                                onChangeText={setFenceName}
                            />

                            <Text style={styles.label}>Fence Color</Text>
                            <View style={styles.colorRow}>
                                {['#FFA500', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#800080'].map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[
                                            styles.colorCircle,
                                            { backgroundColor: c },
                                            fenceColor === c && styles.selectedColor
                                        ]}
                                        onPress={() => setFenceColor(c)}
                                    />
                                ))}
                            </View>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.btnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.startBtn} onPress={startDrawingSession}>
                                    <Text style={styles.startBtnText}>Start Drawing</Text>
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* --- ASSIGNMENT MODAL --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={assignmentModalVisible}
                onRequestClose={() => setAssignmentModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Assign Cattle to Fence</Text>
                        <Text style={[styles.label, { marginBottom: 15 }]}>
                            Select cattle to monitor within this fence.
                        </Text>

                        <View style={{ maxHeight: 300 }}>
                            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                                {items.map((cow) => {
                                    const isSelected = tempAssignedCattle.includes(cow.id);
                                    return (
                                        <TouchableOpacity
                                            key={cow.id}
                                            style={styles.assignmentItem}
                                            onPress={() => toggleCattleAssignment(cow.id)}
                                        >
                                            <Text style={styles.assignmentText}>{cow.cattle_name}</Text>
                                            <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                                                {isSelected && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                                {items.length === 0 && (
                                    <Text style={{ textAlign: 'center', color: '#888' }}>No cattle found.</Text>
                                )}
                            </ScrollView>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAssignmentModalVisible(false)}>
                                <Text style={styles.btnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.startBtn} onPress={saveAssignments}>
                                <Text style={styles.startBtnText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={{ flex: 1 }}>
                <TouchableOpacity
                    style={[
                        styles.backButton,
                        {
                            top: Math.max(insets.top, 20),
                            left: Math.max(insets.left, 20)
                        }
                    ]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>

                <MapView
                    ref={mapRef}
                    style={{ flex: 1 }}
                    mapType={mapType}
                    showsUserLocation
                    showsMyLocationButton
                    initialRegion={
                        mapRegion || {
                            latitude: 7.8731,
                            longitude: 80.7718,
                            latitudeDelta: 2,
                            longitudeDelta: 2,
                        }
                    }
                    onRegionChangeComplete={(region) => setMapRegion(region)}
                    onPress={onMapPress}
                >
                    {items.map((item, idx) => {
                        if (!item.latest_record) return null;
                        const lat = Number(item.latest_record.latitude);
                        const lon = Number(item.latest_record.longitude);
                        if (!isValidCoordinate(lat, lon)) return null;

                        return (
                            <Marker
                                key={item.collar_id ?? item.id ?? idx}
                                coordinate={{ latitude: lat, longitude: lon }}
                                title={item.cattle_name}
                                description={isDirectionMode ? "Tap to track" : "Tap here for full details"}
                                onCalloutPress={() => handleMarkerPress(item)}
                                onLongPress={() => handleMarkerLongPress({ latitude: lat, longitude: lon })}
                            >
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => { /* default behavior */ }}
                                    onLongPress={() => handleMarkerLongPress({ latitude: lat, longitude: lon })}
                                >
                                    <View style={[
                                        styles.markerIconWrapper,
                                        { backgroundColor: item.markerColor, borderColor: item.isAlert ? '#FF3B30' : '#fff' }
                                    ]}>
                                        <MaterialCommunityIcons name="cow" size={20} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                            </Marker>
                        );
                    })}

                    {/* Saved Geofences */}
                    {geofences && geofences.map((fence) => (
                        <Polygon
                            key={fence.id}
                            coordinates={fence.coordinates}
                            strokeColor={selectedFenceId === fence.id ? '#000' : fence.color} // Highlight selected
                            fillColor={fence.color + "40"}
                            strokeWidth={selectedFenceId === fence.id ? 4 : 2}
                            tappable={true}
                            onPress={() => handleSelectFence(fence)}
                        />
                    ))}

                    {/* Current Drawing */}
                    {polygonCoords.length > 0 && (
                        <>
                            <Polygon
                                coordinates={polygonCoords}
                                strokeColor={fenceColor}
                                fillColor={fenceColor + "4D"}
                                strokeWidth={2}
                                lineDashPattern={[10, 10]}
                            />
                            {/* Orange Dots for Vertices */}
                            {polygonCoords.map((coord, index) => (
                                <Circle
                                    key={`vertex-${index}`}
                                    center={coord}
                                    radius={2} // Small dot, radius in meters? MapView Circle radius is meters.
                                    // If radius is too small it might disappear on zoom out.
                                    // Alternatively use Marker with custom view.
                                    // User asked for "orange dot". Marker is safer for visibility across zooms.
                                    // But Circle is requested in "orange dot (each coordinats)".
                                    // Let's try Marker with a simple view first as it's more reliable visually.
                                    strokeColor="#FFA500"
                                    fillColor="#FFA500"
                                />
                            ))}
                            {/* Wait, Circle radius is meters. 2 meters might be invisible at city scale. 
                                Let's use Marker for the dots to be consistent size on screen. 
                            */}
                            {polygonCoords.map((coord, index) => (
                                <Marker
                                    key={`dot-${index}`}
                                    coordinate={coord}
                                    anchor={{ x: 0.5, y: 0.5 }}
                                >
                                    <View style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 6,
                                        backgroundColor: '#FFA500',
                                        borderWidth: 1,
                                        borderColor: '#fff'
                                    }} />
                                </Marker>
                            ))}
                        </>
                    )}

                    {isDirectionMode && routeCoordinates.length > 0 && (
                        <Polyline
                            coordinates={routeCoordinates}
                            strokeWidth={4}
                            strokeColor="#4F8EF7"
                        />
                    )}
                </MapView>

                {isDirectionMode && targetCattle && (
                    <RouteInfoCard
                        distance={routeDetails.distance}
                        duration={routeDetails.duration}
                        onClose={toggleDirectionMode}
                    />
                )}

                {/* Controls Container with Liquid Glass & Drag */}
                <Animated.View
                    style={[
                        styles.draggableContainer,
                        { transform: pan.getTranslateTransform() },
                    ]}
                    {...panResponder.panHandlers}
                >
                    <View style={{
                        flexDirection: isHorizontal ? 'column-reverse' : 'row-reverse',
                        alignItems: 'center',
                    }}>

                        {/* Main Tools Panel */}
                        <BlurView
                            intensity={80}
                            tint="light"
                            style={[
                                styles.liquidGlassPanel,
                                { flexDirection: isHorizontal ? 'row' : 'column' }
                            ]}
                        >
                            {/* Main Fence Menu Toggle */}
                            <TouchableOpacity
                                style={[
                                    styles.controlButton,
                                    {
                                        margin: 6,
                                        backgroundColor: showFenceTools ? '#4F8EF7' : '#fff'
                                    }
                                ]}
                                onPress={() => setShowFenceTools(!showFenceTools)}
                            >
                                <MaterialCommunityIcons
                                    name="fence"
                                    size={24}
                                    color={showFenceTools ? '#fff' : '#4F8EF7'}
                                />
                            </TouchableOpacity>

                            {/* Direction Toggle */}
                            <TouchableOpacity
                                style={[
                                    styles.controlButton,
                                    { backgroundColor: isDirectionMode ? '#34C759' : '#fff', margin: 6 }
                                ]}
                                onPress={toggleDirectionMode}
                            >
                                <MaterialCommunityIcons name="directions" size={24} color={isDirectionMode ? '#fff' : "#4F8EF7"} />
                            </TouchableOpacity>

                            {/* Map Type */}
                            <TouchableOpacity
                                style={[styles.controlButton, { margin: 6 }]}
                                onPress={toggleMapType}
                            >
                                {renderIcon(mapType, '#4F8EF7', 24)}
                            </TouchableOpacity>



                            {/* Focus Button */}
                            <TouchableOpacity
                                style={[styles.controlButton, { margin: 6 }]}
                                onPress={focusOnCattle}
                            >
                                <MaterialCommunityIcons name="target" size={24} color="#4F8EF7" />
                            </TouchableOpacity>
                        </BlurView>
                    </View>
                </Animated.View>

                {/* DETACHED FENCE TOOL MENU */}
                {showFenceTools && (
                    <Animated.View
                        key={winW > winH ? 'L' : 'P'} // Force Remount on Rotation
                        style={[
                            styles.draggableContainer,
                            { transform: toolPan.getTranslateTransform(), zIndex: 25 } // Higher Z-Index
                        ]}
                        {...toolPanResponder.panHandlers}
                    >
                        <BlurView
                            intensity={80}
                            tint="light"
                            style={[
                                styles.liquidGlassPanel,
                                {
                                    // Dynamic Layout:
                                    // If Main is Horiz (Bottom) -> Tools Vert (Side).
                                    // Else (Portrait/Main Side OR Landscape/TopRight) -> Tools Horiz (Row).
                                    flexDirection: isHorizontal ? 'column' : 'row',
                                    borderRadius: 20,
                                    padding: 8,
                                }
                            ]}
                        >
                            {/* Tools: Rectangular Rounded Buttons with Active States */}
                            {/* Tools: Rectangular Rounded Buttons with Active States */}
                            {/* 1. Draw/Save Button */}
                            {isDrawing ?
                                renderToolBtn("check", true, saveFence) :
                                renderToolBtn("pencil", false, toggleDrawing)
                            }

                            {/* 2. Edit (Placeholder for now) */}
                            {renderToolBtn("square-edit-outline", isEditing, toggleEditing)}

                            {/* 3. Assign Cattle (+) */}
                            {renderToolBtn("plus", false, openAssignmentModal)}

                            {/* 4. Delete (Trash) */}
                            {renderToolBtn("delete", false, handleDeleteAction, true)}
                        </BlurView>
                    </Animated.View>
                )}

                {/* Instruction Overlay */}
                {isDrawing && (
                    <View style={styles.instructionOverlay}>
                        <Text style={styles.instructionText}>Tap map to draw points. Tap Fence icon to finish.</Text>
                    </View>
                )}

                {loading && (
                    <View style={styles.loaderOverlay}>
                        <ActivityIndicator size="large" color="#4F8EF7" />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        backgroundColor: '#F2F7FA'
    },
    darkBackground: { backgroundColor: '#121212' },
    draggableContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 20,
    },
    liquidGlassPanel: {
        borderRadius: 30, // Fully corner rounded
        padding: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.4)', // Semi-transparent white
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    controlButton: {
        backgroundColor: '#fff',
        borderRadius: 22,
        width: 44,  // Slightly smaller inside the panel
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    rectButton: {
        backgroundColor: '#fff',
        borderRadius: 12, // Rounded Rectangle
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    activeButton: {
        backgroundColor: '#4F8EF7',
    },
    backButton: {
        position: 'absolute',
        // Dynamic Safe Area Positioning
        // Styles will be overridden inline in component but we keep defaults here
        zIndex: 20,
        backgroundColor: '#fff',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center' },
    markerIconWrapper: {
        padding: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    instructionOverlay: {
        position: 'absolute',
        top: 100,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 10,
        borderRadius: 20,
    },
    instructionText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    // --- Modal Styles ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        color: '#333',
    },
    colorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    colorCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 2,
    },
    selectedColor: {
        borderWidth: 3,
        borderColor: '#333',
        transform: [{ scale: 1.1 }],
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cancelBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        marginRight: 10,
        alignItems: 'center',
    },
    startBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#4F8EF7',
        marginLeft: 10,
        alignItems: 'center',
    },
    btnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    startBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    // --- Assignment Styles ---
    assignmentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    assignmentText: {
        fontSize: 16,
        color: '#333',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#4F8EF7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkedBox: {
        backgroundColor: '#4F8EF7',
    },
});
