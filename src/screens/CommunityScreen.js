import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, useColorScheme, Animated, Dimensions, ImageBackground } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const DUMMY_NEWS = [
    {
        id: 'n1',
        title: 'Government Subsidy for Dairy Farmers Announced',
        source: 'Ministry of Agriculture',
        time: '2 hours ago',
        image: 'https://images.unsplash.com/photo-1545468800-85cc9bc6ecf7?q=80&w=1000&auto=format&fit=crop',
    },
    {
        id: 'n2',
        title: 'New Vaccination Protocol for Foot and Mouth Disease',
        source: 'Veterinary Dept',
        time: '5 hours ago',
        image: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=1000&auto=format&fit=crop',
    },
    {
        id: 'n3',
        title: 'Market Prices for Raw Milk Increase by 15%',
        source: 'Dairy Board',
        time: '1 day ago',
        image: 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?q=80&w=1000&auto=format&fit=crop',
    },
    {
        id: 'n4',
        title: 'Sustainable Grazing Workshop Next Week',
        source: 'Farmers Union',
        time: '2 days ago',
        image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=1000&auto=format&fit=crop',
    },
    {
        id: 'n5',
        title: 'Best Practices for Monsoon Cattle Care',
        source: 'Agri Extension',
        time: '3 days ago',
        image: 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?q=80&w=1000&auto=format&fit=crop',
    },
];

const DUMMY_POSTS = [
    {
        id: '1',
        user: 'John Doe',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        time: '2 hours ago',
        content: 'Just finished the new fencing for the north pasture. The cattle seem to love the extra space! 🐄 #FarmLife #CattleFarming',
        image: 'https://images.unsplash.com/photo-1534260164206-2a3a4a72891d?q=80&w=1000&auto=format&fit=crop',
        likes: 24,
        comments: 5,
    },
    {
        id: '2',
        user: 'Sarah Smith',
        avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
        time: '5 hours ago',
        content: 'Looking for recommendations on the best mineral supplements for lactating cows. Any suggestions?',
        image: null,
        likes: 12,
        comments: 8,
    },
    {
        id: '3',
        user: 'Mike Johnson',
        avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
        time: '1 day ago',
        content: 'Beautiful sunset over the ranch today. Reminds me why I do this work. 🌅',
        image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=1000&auto=format&fit=crop',
        likes: 45,
        comments: 2,
    },
    {
        id: '4',
        user: 'Emily Davis',
        avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
        time: '2 days ago',
        content: 'New calf born this morning! Both mother and baby are doing great. Welcome to the herd, little one! 🐮',
        image: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?q=80&w=1000&auto=format&fit=crop',
        likes: 89,
        comments: 15,
    },
];

const NewsItem = ({ item }) => (
    <TouchableOpacity activeOpacity={0.9} style={styles.newsItemContainer}>
        <ImageBackground source={{ uri: item.image }} style={styles.newsImage} imageStyle={{ borderRadius: 12 }}>
            <View style={styles.newsOverlay}>
                <View style={styles.newsBadge}>
                    <Text style={styles.newsSource}>{item.source}</Text>
                </View>
                <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.newsTime}>{item.time}</Text>
            </View>
        </ImageBackground>
    </TouchableOpacity>
);

const PostItem = ({ item, index, colorScheme }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(index * 200),
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);

    return (
        <Animated.View style={[
            styles.postContainer,
            colorScheme === 'dark' && styles.darkPostContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
            <View style={styles.postHeader}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={styles.headerText}>
                    <Text style={[styles.userName, colorScheme === 'dark' && styles.darkText]}>{item.user}</Text>
                    <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <TouchableOpacity>
                    <MaterialCommunityIcons name="dots-horizontal" size={24} color={colorScheme === 'dark' ? '#FFF' : '#333'} />
                </TouchableOpacity>
            </View>

            <Text style={[styles.postContent, colorScheme === 'dark' && styles.darkText]}>{item.content}</Text>

            {item.image && (
                <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="cover" />
            )}

            <View style={styles.postFooter}>
                <TouchableOpacity style={styles.actionButton}>
                    <MaterialCommunityIcons name="heart-outline" size={20} color={colorScheme === 'dark' ? '#AAA' : '#666'} />
                    <Text style={[styles.actionText, colorScheme === 'dark' && styles.darkSubText]}>{item.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <MaterialCommunityIcons name="comment-outline" size={20} color={colorScheme === 'dark' ? '#AAA' : '#666'} />
                    <Text style={[styles.actionText, colorScheme === 'dark' && styles.darkSubText]}>{item.comments}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <MaterialCommunityIcons name="share-outline" size={20} color={colorScheme === 'dark' ? '#AAA' : '#666'} />
                    <Text style={[styles.actionText, colorScheme === 'dark' && styles.darkSubText]}>Share</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const CommunityScreen = () => {
    const colorScheme = useColorScheme();

    const renderHeader = () => (
        <View style={styles.newsSection}>
            <Text style={[styles.sectionTitle, colorScheme === 'dark' && styles.darkText]}>Latest Updates</Text>
            <FlatList
                data={DUMMY_NEWS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <NewsItem item={item} />}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.newsListContent}
                snapToInterval={width * 0.85 + 16} // card width + margin
                decelerationRate="fast"
            />
        </View>
    );

    return (
        <View style={[styles.container, colorScheme === 'dark' && styles.darkContainer]}>
            <FlatList
                data={DUMMY_POSTS}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => <PostItem item={item} index={index} colorScheme={colorScheme} />}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity style={styles.fab}>
                <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F7FA',
    },
    darkContainer: {
        backgroundColor: '#121212',
    },
    listContent: {
        paddingBottom: 80,
    },
    // News Feed Styles
    newsSection: {
        marginBottom: 10,
        paddingTop: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 16,
        marginBottom: 12,
        color: '#333',
    },
    newsListContent: {
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    newsItemContainer: {
        width: width * 0.85,
        height: height * 0.45, // ~45-50% of screen height
        marginRight: 16,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        backgroundColor: '#fff',
    },
    newsImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    newsOverlay: {
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    newsBadge: {
        backgroundColor: '#4F8EF7',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginBottom: 8,
    },
    newsSource: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    newsTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    newsTime: {
        color: '#ddd',
        fontSize: 12,
    },
    // Post Styles
    postContainer: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        marginHorizontal: 16, // Added margin since it's now in a vertical list with header
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    darkPostContainer: {
        backgroundColor: '#1E1E1E',
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    timeText: {
        fontSize: 12,
        color: '#999',
    },
    postContent: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        marginBottom: 12,
    },
    postImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 12,
    },
    postFooter: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
    },
    actionText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#666',
    },
    darkText: {
        color: '#FFF',
    },
    darkSubText: {
        color: '#AAA',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#27AE60',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
});

export default CommunityScreen;
