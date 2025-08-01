import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Pressable } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import BookingModal from './BookingModal';
import GoogleGIcon from './GoogleGIcon';
import { getRestaurants, getRestaurantsByCuisine, Restaurant, TimeSlot } from '../services/restaurantService';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// Sample restaurant data (we'll replace with Firebase later)
const sampleRestaurants = [
  {
    id: '1',
    name: 'Sage Bistro',
    cuisine: 'Modern American',
    location: 'Downtown DC',
    discount: '-30%',
    timeSlots: ['18:00', '18:30', '19:00', '19:30'],
    video: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    description: 'Farm-to-table dining with seasonal ingredients'
  },
  {
    id: '2', 
    name: 'Ramen House',
    cuisine: 'Japanese',
    location: 'Georgetown',
    discount: '-40%',
    timeSlots: ['12:00', '12:30', '13:00', '13:30'],
    video: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    description: 'Authentic Tokyo-style ramen and small plates'
  },
  {
    id: '3',
    name: 'Pizza Palace',
    cuisine: 'Italian',
    location: 'Capitol Hill',
    discount: '-25%',
    timeSlots: ['17:30', '18:00', '18:30', '19:00', '19:30'],
    video: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    description: 'Authentic Neapolitan pizza and Italian classics'
  },
  {
    id: '4',
    name: 'Taco Fiesta',
    cuisine: 'Mexican',
    location: 'Adams Morgan',
    discount: '-35%',
    timeSlots: ['11:30', '12:00', '12:30', '13:00', '18:00', '18:30'],
    video: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    description: 'Fresh Mexican street food and margaritas'
  },
  {
    id: '5',
    name: 'Thai Spice',
    cuisine: 'Thai',
    location: 'Dupont Circle',
    discount: '-20%',
    timeSlots: ['17:00', '17:30', '18:00', '18:30', '19:00'],
    video: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    description: 'Authentic Thai cuisine with bold flavors'
  }
];

export default function RestaurantFeed() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(contentOffset / screenHeight);
    setCurrentIndex(index);
  };

  const handleReservePress = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setShowBookingModal(true);
  };

  const handleBookingConfirmed = (bookingDetails: any) => {
    console.log('Booking confirmed:', bookingDetails);
    // Here we'll save to Firebase and process commission
    setShowBookingModal(false);
    
    // Show success message (you can customize this)
    alert(`🎉 Table reserved at ${selectedRestaurant?.name}!\nYou saved ${selectedRestaurant?.discountPercentage}%!`);
  };

  const handleTimeSlotPress = (restaurant: Restaurant, timeSlot: any) => {
    setSelectedRestaurant(restaurant);
    setSelectedTimeSlot(timeSlot.time || timeSlot);
    setShowBookingModal(true);
  };

  const cuisineTypes = ['All', 'Modern American', 'Japanese', 'Italian', 'Mexican', 'Thai'];

  // Load restaurants and location on component mount
  useEffect(() => {
    loadRestaurants();
    loadLocation();
  }, []);

  // Load restaurants when cuisine filter changes
  useEffect(() => {
    loadRestaurants();
  }, [selectedCuisine]);

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      let restaurantData: Restaurant[];
      if (selectedCuisine === 'All') {
        restaurantData = await getRestaurants();
      } else {
        restaurantData = await getRestaurantsByCuisine(selectedCuisine);
      }
      setRestaurants(restaurantData);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      // Fallback to sample data if Firebase fails
      const fallbackData: Restaurant[] = sampleRestaurants.map(restaurant => ({
        id: restaurant.id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        location: restaurant.location,
        address: `${restaurant.location}, DC`,
        description: restaurant.description,
        discountPercentage: parseInt(restaurant.discount.replace('-', '').replace('%', '')),
        videoUrl: restaurant.video,
        imageUrl: restaurant.video, // Using video as image for now
        rating: 4.5,
        priceRange: '$$',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      setRestaurants(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const loadLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    } catch (error) {
      console.error('Error loading location:', error);
    }
  };

  // Filter restaurants based on selected cuisine (now handled by Firebase)
  const filteredRestaurants = restaurants;

  return (
    <>
      {/* Full-width Cuisine Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {cuisineTypes.map(cuisine => (
            <Pressable
              key={cuisine}
              style={[styles.filterChip, selectedCuisine === cuisine && styles.filterChipSelected]}
              onPress={() => setSelectedCuisine(cuisine)}
            >
              <Text style={[styles.filterText, selectedCuisine === cuisine && styles.filterTextSelected]}>
                {cuisine}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollViewRef}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.container}
      >
        {filteredRestaurants.map((restaurant, index) => (
          <View key={restaurant.id} style={styles.videoContainer}>
            <Video
              source={{ uri: restaurant.videoUrl }}
              style={styles.video}
              shouldPlay={index === currentIndex}
              isLooping
              isMuted={false}
              resizeMode={ResizeMode.COVER}
            />
            
            {/* Gradient overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.gradient}
            />
            
            {/* Restaurant info */}
            <View style={styles.info}>
              <View style={styles.restaurantDetails}>
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                <Text style={styles.cuisine}>{restaurant.cuisine} • {restaurant.location}</Text>
                <Text style={styles.description} numberOfLines={1} ellipsizeMode="tail">{restaurant.description}</Text>
                <Text style={styles.averagePrice}>Average price ${restaurant.priceRange === '$$' ? '19' : restaurant.priceRange === '$$$' ? '35' : restaurant.priceRange === '$$$$' ? '60' : '12'}</Text>
                
                {/* Rating */}
                <View style={styles.ratingContainer}>
                  <View style={styles.ratingPill}>
                    <GoogleGIcon size={12} />
                    <Text style={styles.ratingText}>{restaurant.rating}</Text>
                    <Text style={styles.starIcon}>⭐</Text>
                  </View>
                </View>
              </View>
              
              {/* Discount badge */}
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>🔥 -{restaurant.discountPercentage}% off food</Text>
              </View>
              
              {/* Time Slot Chips */}
              <View style={styles.timeSlotScroll}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {restaurant.timeSlots && restaurant.timeSlots.length > 0 ? (
                    restaurant.timeSlots.map((timeSlot: any, slotIndex: number) => (
                      <React.Fragment key={slotIndex}>
                        <Pressable
                          style={styles.timeSlotContainer}
                          onPress={() => handleTimeSlotPress(restaurant, timeSlot)}
                        >
                          <Text style={styles.timeSlotText}>{timeSlot.time || timeSlot}</Text>
                          <View style={styles.discountContainer}>
                            <Text style={styles.discountLabel}>-{restaurant.discountPercentage}%</Text>
                          </View>
                        </Pressable>
                        {slotIndex < (restaurant.timeSlots?.length || 0) - 1 && (
                          <View style={styles.timeSlotDivider} />
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    // Default time slots if none are set
                    ['18:00', '18:30', '19:00', '19:30'].map((time, index) => (
                      <React.Fragment key={index}>
                        <Pressable
                          style={styles.timeSlotContainer}
                          onPress={() => handleTimeSlotPress(restaurant, { time })}
                        >
                          <Text style={styles.timeSlotText}>{time}</Text>
                          <View style={styles.discountContainer}>
                            <Text style={styles.discountLabel}>-{restaurant.discountPercentage}%</Text>
                          </View>
                        </Pressable>
                        {index < 3 && (
                          <View style={styles.timeSlotDivider} />
                        )}
                      </React.Fragment>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add the booking modal */}
      <BookingModal
        visible={showBookingModal}
        restaurant={selectedRestaurant}
        selectedTime={selectedTimeSlot}
        onClose={() => setShowBookingModal(false)}
        onBook={handleBookingConfirmed}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  filterContainer: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 70,
  },
  filterChipSelected: {
    backgroundColor: 'white',
    borderColor: 'white',
  },
  filterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  filterTextSelected: {
    color: 'black',
  },

  videoContainer: {
    height: screenHeight,
    width: screenWidth,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  info: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  restaurantDetails: {
    marginBottom: 20,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  cuisine: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  address: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  averagePrice: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 10,
  },
  discountBadge: {
    backgroundColor: 'rgba(255,59,48,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  discountText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  ratingContainer: {
    marginBottom: 0,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  ratingText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  starIcon: {
    fontSize: 10,
  },
  timeSlot: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timeSlotScroll: {
    marginTop: 8,
  },
  timeSlotContainer: {
    marginRight: 12,
    alignItems: 'center',
    minWidth: 60,
  },
  timeSlotDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 6,
  },
  timeSlotText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  discountContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
  },
  discountLabel: {
    color: 'black',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeSlotPlaceholder: {
    marginTop: 15,
    paddingVertical: 12,
    alignItems: 'center',
  },
  timeSlotPlaceholderText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
}); 