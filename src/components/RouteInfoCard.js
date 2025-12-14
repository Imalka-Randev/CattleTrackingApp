// src/components/RouteInfoCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * RouteInfoCard Component
 * 
 * Displays the distance and estimated duration for the active route.
 * Also provides a close button to exit direction mode.
 * 
 * @param {number} distance - Distance in kilometers
 * @param {number} duration - Duration in minutes
 * @param {function} onClose - Callback function to close the card/exit mode
 */
const RouteInfoCard = ({ distance, duration, onClose }) => {
    return (
        <View style={styles.card}>
            <View style={styles.infoContainer}>
                <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="map-marker-distance" size={20} color="#4F8EF7" />
                    <View>
                        <Text style={styles.value}>{distance ? distance.toFixed(1) : '0'} km</Text>
                        <Text style={styles.label}>Distance</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#4F8EF7" />
                    <View>
                        <Text style={styles.value}>{duration ? Math.round(duration) : '0'} min</Text>
                        <Text style={styles.label}>Est. Time</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <MaterialCommunityIcons name="close" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        position: 'absolute',
        top: 36, // Positioned above the bottom tabs
        width: '90%', // Reduced width to avoid overlap
        alignSelf: 'center', // Center the card
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 8, // Shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        zIndex: 100, // Ensure it sits on top of the map
    },
    infoContainer: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    infoItem: {
        alignItems: 'center',
        flexDirection: 'row', // Align icon and text horizontally for compactness
    },
    value: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    label: {
        fontSize: 12,
        color: '#888',
        marginLeft: 8,
        marginTop: -2,
    },
    divider: {
        width: 1,
        height: '60%',
        backgroundColor: '#E0E0E0',
    },
    closeButton: {
        backgroundColor: '#FF3B30',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
});

export default RouteInfoCard;
