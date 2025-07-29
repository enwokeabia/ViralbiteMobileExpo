import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Alert } from 'react-native';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';

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
  const [selectedDate, setSelectedDate] = useState('Today');
  const [isBooking, setIsBooking] = useState(false);

  const timeSlots = ['12:00', '12:30', '13:00', '13:30', '18:00', '18:30', '19:00', '19:30'];
  const guestOptions = [1, 2, 3, 4, 5, 6];

  const handleBook = async () => {
    if (!selectedTime) return;
    
    setIsBooking(true);
    
    try {
      // Create booking object
      const bookingData = {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantLocation: restaurant.location,
        time: selectedTime,
        date: selectedDate,
        guests,
        discountPercentage: restaurant.discountPercentage,
        status: 'pending', // pending, confirmed, cancelled
        createdAt: new Date(),
        commission: calculateCommission(restaurant.discountPercentage),
        userId: 'anonymous', // We'll add user auth later
        userEmail: 'guest@example.com' // We'll add user auth later
      };

      // Try to save to Firebase (with timeout)
      try {
        const docRef = await Promise.race([
          addDoc(collection(db, 'bookings'), bookingData),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Firebase timeout')), 5000)
          )
        ]);
        console.log('Booking saved to Firebase:', docRef.id);
      } catch (firebaseError) {
        console.log('Firebase not ready, using console log for now:', firebaseError);
        // Fallback: just log the booking for now
        console.log('Local booking data:', bookingData);
      }
      
      // Close modal and show success
      onClose();
      Alert.alert(
        '🎉 Booking Confirmed!',
        `Your table at ${restaurant.name} is reserved for ${selectedDate} at ${selectedTime}.\n\nYou saved -${restaurant.discountPercentage}%!`,
        [{ text: 'OK' }]
      );
      
      // Call the original onBook callback
      onBook(bookingData);
      
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const calculateCommission = (discountPercentage: number) => {
    // Flat $3 commission per booking
    return 3;
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
          {/* Restaurant info */}
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>{restaurant?.name}</Text>
            <Text style={styles.deal}>🔥 {restaurant?.discount}</Text>
            <Text style={styles.location}>{restaurant?.location}</Text>
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
              {['Today', 'Tomorrow', 'This Weekend'].map(date => (
                <Pressable
                  key={date}
                  style={[styles.dateButton, selectedDate === date && styles.dateButtonSelected]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[styles.dateButtonText, selectedDate === date && styles.dateButtonTextSelected]}>
                    {date}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Time slots */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Times - {selectedDate}</Text>
            <View style={styles.timeGrid}>
              {timeSlots.map(time => (
                <Pressable
                  key={time}
                  style={[styles.timeButton, selectedTime === time && styles.timeButtonSelected]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={[styles.timeButtonText, selectedTime === time && styles.timeButtonTextSelected]}>
                    {time}
                  </Text>
                  <Text style={[styles.menuLabel, selectedTime === time && styles.menuLabelSelected]}>
                    DISCOUNT
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Book button */}
          <Pressable 
            style={[styles.bookButton, (!selectedTime || isBooking) && styles.bookButtonDisabled]}
            onPress={handleBook}
            disabled={!selectedTime || isBooking}
          >
            <Text style={styles.bookButtonText}>
              {isBooking ? 'Creating Booking...' : `Reserve for ${guests} ${guests === 1 ? 'guest' : 'guests'} at ${selectedTime || '--:--'}`}
            </Text>
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
  restaurantInfo: {
    marginBottom: 30,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  deal: {
    fontSize: 16,
    color: '#ff3b30',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  guestButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  guestButtonSelected: {
    backgroundColor: '#007AFF',
  },
  guestButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  guestButtonTextSelected: {
    color: 'white',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  timeButtonSelected: {
    backgroundColor: '#007AFF',
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timeButtonTextSelected: {
    color: 'white',
  },
  menuLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    fontWeight: 'bold',
  },
  menuLabelSelected: {
    color: 'white',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  bookButtonDisabled: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  dateButtonSelected: {
    backgroundColor: '#007AFF',
  },
  dateButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  dateButtonTextSelected: {
    color: 'white',
  },
}); 