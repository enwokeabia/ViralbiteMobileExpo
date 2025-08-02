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
          {/* Restaurant details above image */}
          <View style={styles.restaurantDetails}>
            <Text style={styles.restaurantName}>{restaurant?.name}</Text>
            
            {/* Address */}
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{restaurant?.address || restaurant?.location}</Text>
            </View>
            
            {/* Rating, cuisine, and price */}
            <View style={styles.detailsRow}>
              {restaurant?.rating && (
                <Text style={styles.ratingText}>⭐ {restaurant.rating}</Text>
              )}
              <Text style={styles.cuisineText}>{restaurant?.cuisine || 'Restaurant'}</Text>
              <Text style={styles.priceText}>• {restaurant?.priceRange || '$$'}</Text>
            </View>
          </View>

          {/* Restaurant image */}
          <View style={styles.imageSection}>
            {restaurant?.imageUrl ? (
              <Image 
                source={{ uri: restaurant.imageUrl }} 
                style={styles.restaurantImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>🍽️</Text>
              </View>
            )}
          </View>

          {/* Guest count */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Number of Guests</Text>
              <View style={styles.guestSelector}>
                <Pressable
                  style={styles.guestButton}
                  onPress={() => setGuests(Math.max(1, guests - 1))}
                >
                  <Text style={styles.guestButtonText}>−</Text>
                </Pressable>
                <Text style={styles.guestCount}>{guests}</Text>
                <Pressable
                  style={styles.guestButton}
                  onPress={() => setGuests(Math.min(8, guests + 1))}
                >
                  <Text style={styles.guestButtonText}>+</Text>
                </Pressable>
              </View>
            </View>
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
            
            {/* Lunch Section */}
            <View style={styles.timeSection}>
              <Text style={styles.timeSectionTitle}>Lunch</Text>
              <View style={styles.timeGrid}>
                {availableTimeSlots.filter(time => {
                  const hour = parseInt(time.split(':')[0]);
                  return hour >= 11 && hour <= 16;
                }).map(time => (
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

            {/* Dinner Section */}
            <View style={styles.timeSection}>
              <Text style={styles.timeSectionTitle}>Dinner</Text>
              <View style={styles.timeGrid}>
                {availableTimeSlots.filter(time => {
                  const hour = parseInt(time.split(':')[0]);
                  return hour >= 17 || hour <= 10;
                }).map(time => (
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
  restaurantDetails: {
    marginBottom: 20,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#333',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#999',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  cuisineText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    marginRight: 10,
  },
  priceText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  imageSection: {
    height: 200, // Fixed height for the image section
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  guestSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'center',
    width: 120,
  },
  guestButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestButtonSelected: {
    backgroundColor: '#8B5CF6',
  },
  guestButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  guestButtonTextSelected: {
    color: 'white',
  },
  guestCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
  timeSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  timeSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
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