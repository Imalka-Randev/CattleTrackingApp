import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, Dimensions, Animated } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const SummaryScreen = () => {
    const colorScheme = useColorScheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 6,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const chartConfig = {
        backgroundGradientFrom: colorScheme === 'dark' ? '#1E1E1E' : '#FFF',
        backgroundGradientTo: colorScheme === 'dark' ? '#1E1E1E' : '#FFF',
        color: (opacity = 1) => `rgba(39, 174, 96, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        labelColor: (opacity = 1) => colorScheme === 'dark' ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    };

    const data = {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
            {
                data: [20, 45, 28, 80, 99, 43],
                color: (opacity = 1) => `rgba(39, 174, 96, ${opacity})`,
                strokeWidth: 2
            }
        ],
        legend: ["Milk Production (L)"]
    };

    const StatCard = ({ title, value, icon, color, delay }) => {
        const cardFade = useRef(new Animated.Value(0)).current;
        const cardSlide = useRef(new Animated.Value(20)).current;

        useEffect(() => {
            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(cardFade, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.spring(cardSlide, { toValue: 0, friction: 8, useNativeDriver: true })
                ])
            ]).start();
        }, []);

        return (
            <Animated.View style={[
                styles.statCard,
                colorScheme === 'dark' && styles.darkCard,
                { opacity: cardFade, transform: [{ translateY: cardSlide }] }
            ]}>
                <View style={[styles.iconContainer, { backgroundColor: color }]}>
                    <MaterialCommunityIcons name={icon} size={24} color="#FFF" />
                </View>
                <View>
                    <Text style={[styles.statValue, colorScheme === 'dark' && styles.darkText]}>{value}</Text>
                    <Text style={[styles.statTitle, colorScheme === 'dark' && styles.darkSubText]}>{title}</Text>
                </View>
            </Animated.View>
        );
    };

    return (
        <ScrollView style={[styles.container, colorScheme === 'dark' && styles.darkContainer]}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <Text style={[styles.headerTitle, colorScheme === 'dark' && styles.darkText]}>Farm Overview</Text>

                <View style={styles.chartContainer}>
                    <Text style={[styles.chartTitle, colorScheme === 'dark' && styles.darkText]}>Monthly Production</Text>
                    <LineChart
                        data={data}
                        width={screenWidth - 32}
                        height={220}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chart}
                    />
                </View>

                <View style={styles.statsGrid}>
                    <StatCard title="Total Cattle" value="12" icon="cow" color="#FF6B6B" delay={200} />
                    <StatCard title="Healthy" value="10" icon="heart-pulse" color="#4ECDC4" delay={300} />
                    <StatCard title="Sick" value="2" icon="alert-circle" color="#FFD93D" delay={400} />
                    <StatCard title="Pregnant" value="3" icon="baby-carriage" color="#6C5CE7" delay={500} />
                </View>

                <View style={[styles.infoCard, colorScheme === 'dark' && styles.darkCard]}>
                    <Text style={[styles.infoTitle, colorScheme === 'dark' && styles.darkText]}>Recent Activity</Text>
                    <View style={styles.activityItem}>
                        <MaterialCommunityIcons name="needle" size={20} color="#4ECDC4" />
                        <Text style={[styles.activityText, colorScheme === 'dark' && styles.darkSubText]}>Vaccination completed for Bella</Text>
                    </View>
                    <View style={styles.activityItem}>
                        <MaterialCommunityIcons name="food-apple" size={20} color="#FF6B6B" />
                        <Text style={[styles.activityText, colorScheme === 'dark' && styles.darkSubText]}>Feed stock updated</Text>
                    </View>
                </View>
            </Animated.View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F7FA',
        padding: 16,
    },
    darkContainer: {
        backgroundColor: '#121212',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    chartContainer: {
        marginBottom: 24,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
        alignSelf: 'flex-start',
    },
    chart: {
        borderRadius: 16,
        paddingRight: 30, // Adjust for labels
        paddingLeft: 30,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statCard: {
        width: (Dimensions.get('window').width - 48) / 2,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    darkCard: {
        backgroundColor: '#1E1E1E',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    statTitle: {
        fontSize: 12,
        color: '#666',
    },
    darkText: {
        color: '#FFF',
    },
    darkSubText: {
        color: '#AAA',
    },
    infoCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    activityText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#555',
    },
});

export default SummaryScreen;
