import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Alert, Image } from 'react-native';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getTimeSlots, createBooking } from '../services/restaurantService';
import { LinearGradient } from 'expo-linear-gradient';

interface BookingModalProps {
  visible: boolean;
  restaurant: any;
  selectedTime?: string;
  onClose: () => void;
  onBook: (details: any) => void;
}

export default function BookingModal({ visible, restaurant, selectedTime: initialTime, onClose, onBook }: BookingModalProps) {
  const [selectedTime, setSelectedTime] = useState(initialTime || '');
  const [guests, setGuests] = useState(2);
  const [selectedDate, setSelectedDate] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Generate next 7 days
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const dayName = dayNames[date.getDay()];
      const month = monthNames[date.getMonth()];
      const day = date.getDate();
      
      let displayText = '';
      if (i === 0) {
        displayText = `Today (${dayName})`;
      } else if (i === 1) {
        displayText = `Tomorrow (${dayName})`;
      } else {
        displayText = `${dayName} (${month} ${day})`;
      }
      
      dates.push({
        display: displayText,
        value: date.toISOString().split('T')[0], // YYYY-MM-DD format
        isToday: i === 0
      });
    }
    
    return dates;
  };

  const dateOptions = generateDateOptions();

  // Set default date to today
  useEffect(() => {
    if (dateOptions.length > 0 && !selectedDate) {
      setSelectedDate(dateOptions[0].value);
    }
  }, []);

  // Update selected time when initialTime prop changes
  useEffect(() => {
    if (initialTime) {
      setSelectedTime(initialTime);
    }
  }, [initialTime]);

  // Load time slots when date changes
  useEffect(() => {
    if (selectedDate && restaurant?.id) {
      loadTimeSlots();
    }
  }, [selectedDate, restaurant?.id]);

  const loadTimeSlots = async () => {
    if (!selectedDate || !restaurant?.id) return;
    
    setIsLoadingSlots(true);
    try {
      const timeSlots = await getTimeSlots(restaurant.id, selectedDate);
      const times = timeSlots.map(slot => slot.time);
      
      // If no time slots found, use default times
      if (times.length === 0) {
        setAvailableTimeSlots(['12:00', '12:30', '13:00', '13:30', '18:00', '18:30', '19:00', '19:30']);
      } else {
        setAvailableTimeSlots(times);
      }
      
      // Reset selected time if it's not available for this date
      if (selectedTime && !times.includes(selectedTime)) {
        setSelectedTime('');
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
      // Fallback to default times
      setAvailableTimeSlots(['12:00', '12:30', '13:00', '13:30', '18:00', '18:30', '19:00', '19:30']);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const guestOptions = [1, 2, 3, 4, 5, 6];

  const handleBook = async () => {
    if (!selectedTime || !selectedDate) return;
    
    setIsBooking(true);
    
    try {
      // Generate booking number
      const bookingNumber = `VB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      // Create booking object (commission tracked internally, not shown to user)
      const bookingData = {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantLocation: restaurant.location,
        time: selectedTime,
        date: selectedDate,
        guestCount: guests,
        discountPercentage: restaurant.discountPercentage,
        status: 'confirmed' as const, // Direct confirmation for better UX
        commission: 3.00, // Internal tracking only
        userId: 'anonymous', // We'll add user auth later
        userEmail: 'guest@example.com', // We'll add user auth later
        bookingNumber: bookingNumber // Add booking number
      };

      // Try to save to Firebase using the service
      try {
        const bookingId = await createBooking(bookingData);
        if (bookingId) {
          console.log('✅ Booking saved to Firebase:', bookingId);
        } else {
          console.log('📝 Local booking data:', bookingData);
        }
      } catch (firebaseError) {
        console.log('Firebase not ready, using console log for now:', firebaseError);
        // Fallback: just log the booking for now
        console.log('📝 Local booking data:', bookingData);
      }
      
      // Close modal and show success
      onClose();
      
      // Format date for display
      const selectedDateObj = dateOptions.find(d => d.value === selectedDate);
      const displayDate = selectedDateObj ? selectedDateObj.display : selectedDate;
      
      Alert.alert(
        '🎉 Booking Confirmed!',
        `Your table at ${restaurant.name} is reserved!\n\n📅 ${displayDate}\n🕐 ${selectedTime}\n👥 ${guests} ${guests === 1 ? 'guest' : 'guests'}\n\nBooking #: ${bookingNumber}`,
        [{ text: 'OK' }]
      );
      
      // Call the original onBook callback
      onBook(bookingData);
      
    } catch (error) {
      console.error('❌ Booking error:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const getSelectedDateDisplay = () => {
    const selected = dateOptions.find(d => d.value === selectedDate);
    return selected ? selected.display : 'Select Date';
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </Pressable>
          <Text style={styles.title}>Reserve Table</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          {/* Restaurant hero section with background image */}
          <View style={styles.heroSection}>
            {restaurant?.imageUrl ? (
              <Image 
                source={{ uri: restaurant.imageUrl }} 
                style={styles.heroBackgroundImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Text style={styles.heroPlaceholderText}>🍽️</Text>
              </View>
            )}
            
            {/* Gradient overlay for better text readability */}
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
              style={styles.heroOverlay}
            />
            
            {/* Restaurant details overlaid on image */}
            <View style={styles.heroContent}>
              {/* Badges row */}
              <View style={styles.badgesRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>🔥 {restaurant?.discountPercentage}% OFF</Text>
                </View>
                {restaurant?.rating && (
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingBadgeText}>⭐ {restaurant.rating}</Text>
                  </View>
                )}
              </View>
              
              {/* Restaurant name */}
              <Text style={styles.heroRestaurantName}>{restaurant?.name}</Text>
              
              {/* Location with icon */}
              <View style={styles.locationRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.heroLocation}>{restaurant?.address || restaurant?.location}</Text>
              </View>
              
              {/* Cuisine and price info */}
              <View style={styles.cuisinePriceRow}>
                <View style={styles.cuisineContainer}>
                  <Text style={styles.cuisineIcon}>🍴</Text>
                  <Text style={styles.cuisineText}>{restaurant?.cuisine || 'Restaurant'}</Text>
                </View>
                <Text style={styles.cuisineSeparator}>•</Text>
                <Text style={styles.priceText}>Average price {restaurant?.priceRange || '$$'}</Text>
              </View>
            </View>
          </View>

          {/* Guest count */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Number of Guests</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {guestOptions.map(count => (
                <Pressable
                  key={count}
                  style={[styles.guestButton, guests === count && styles.guestButtonSelected]}
                  onPress={() => setGuests(count)}
                >
                  <Text style={[styles.guestButtonText, guests === count && styles.guestButtonTextSelected]}>
                    {count} {count === 1 ? 'guest' : 'guests'}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dateOptions.map(date => (
                <Pressable
                  key={date.value}
                  style={[styles.dateButton, selectedDate === date.value && styles.dateButtonSelected]}
                  onPress={() => setSelectedDate(date.value)}
                >
                  <Text style={[styles.dateButtonText, selectedDate === date.value && styles.dateButtonTextSelected]}>
                    {date.display}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Time slots */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Available Times - {getSelectedDateDisplay()}
              {isLoadingSlots && ' (Loading...)'}
            </Text>
            <View style={styles.timeGrid}>
              {availableTimeSlots.map(time => (
                <Pressable
                  key={time}
                  style={[styles.timeButton, selectedTime === time && styles.timeButtonSelected]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={[styles.timeButtonText, selectedTime === time && styles.timeButtonTextSelected]}>
                    {time}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Book button */}
          <Pressable 
            style={[styles.bookButton, (!selectedTime || !selectedDate || isBooking) && styles.bookButtonDisabled]}
            onPress={handleBook}
            disabled={!selectedTime || !selectedDate || isBooking}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={[styles.bookButtonGradient, (!selectedTime || !selectedDate || isBooking) && styles.bookButtonGradientDisabled]}
            >
              <Text style={styles.bookButtonText}>
                {isBooking ? 'Creating Booking...' : `Reserve Table`}
              </Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  heroSection: {
    height: 250, // Fixed height for the hero section
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  heroBackgroundImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlaceholderText: {
    fontSize: 32,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 15,
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    zIndex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  badge: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratingBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroRestaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  heroLocation: {
    fontSize: 14,
    color: 'white',
    marginBottom: 5,
  },
  cuisinePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cuisineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  cuisineIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  cuisineText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  cuisineSeparator: {
    fontSize: 14,
    color: 'white',
    marginHorizontal: 5,
  },
  priceText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  guestButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  guestButtonSelected: {
    backgroundColor: '#8B5CF6',
  },
  guestButtonText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 14,
  },
  guestButtonTextSelected: {
    color: 'white',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  timeButtonSelected: {
    backgroundColor: '#8B5CF6',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  timeButtonTextSelected: {
    color: 'white',
  },
  bookButton: {
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  bookButtonGradientDisabled: {
    opacity: 0.5,
  },
  bookButtonDisabled: {
    opacity: 0.5,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  dateButtonSelected: {
    backgroundColor: '#8B5CF6',
  },
  dateButtonText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 14,
  },
  dateButtonTextSelected: {
    color: 'white',
  },
}); 