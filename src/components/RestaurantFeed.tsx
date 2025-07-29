import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Pressable } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import BookingModal from './BookingModal'; // Import the modal

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// Sample restaurant data (we'll replace with Firebase later)
const sampleRestaurants = [
  {
    id: '1',
    name: 'Sage Bistro',
    cuisine: 'Modern American',
    location: 'Downtown DC',
    discount: '30% off dinner',
    timeSlot: 'Today 6-8pm',
    video: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
    description: 'Farm-to-table dining with seasonal ingredients'
  },
  {
    id: '2', 
    name: 'Ramen House',
    cuisine: 'Japanese',
    location: 'Georgetown',
    discount: '40% off lunch',
    timeSlot: 'Today 12-2pm',
    video: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
    description: 'Authentic Tokyo-style ramen and small plates'
  }
];

export default function RestaurantFeed() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
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
    alert(`🎉 Table reserved at ${selectedRestaurant?.name}!\nYou saved ${selectedRestaurant?.discount}!`);
  };

  return (
    <>
      <ScrollView
        ref={scrollViewRef}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.container}
      >
        {sampleRestaurants.map((restaurant, index) => (
          <View key={restaurant.id} style={styles.videoContainer}>
            <Video
              source={{ uri: restaurant.video }}
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
                <Text style={styles.description}>{restaurant.description}</Text>
                
                {/* Discount badge */}
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>🔥 {restaurant.discount}</Text>
                  <Text style={styles.timeSlot}>{restaurant.timeSlot}</Text>
                </View>
              </View>
              
              {/* Updated book button */}
              <Pressable 
                style={styles.bookButton}
                onPress={() => handleReservePress(restaurant)}
              >
                <Text style={styles.bookButtonText}>Reserve Now</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add the booking modal */}
      <BookingModal
        visible={showBookingModal}
        restaurant={selectedRestaurant}
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
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 15,
  },
  discountBadge: {
    backgroundColor: 'rgba(255,59,48,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  discountText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
}); 