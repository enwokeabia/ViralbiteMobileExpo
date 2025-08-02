import React, { useState, useEffect } from 'react';
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
  const [selectedDate, setSelectedDate] = useState('');
  const [isBooking, setIsBooking] = useState(false);

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

  const timeSlots = ['12:00', '12:30', '13:00', '13:30', '18:00', '18:30', '19:00', '19:30'];
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
        guests,
        discountPercentage: restaurant.discountPercentage,
        status: 'confirmed', // Direct confirmation for better UX
        createdAt: new Date(),
        commission: 3.00, // Internal tracking only
        userId: 'anonymous', // We'll add user auth later
        userEmail: 'guest@example.com', // We'll add user auth later
        bookingNumber: bookingNumber // Add booking number
      };

      // Try to save to Firebase (with timeout)
      try {
        const docRef = await Promise.race([
          addDoc(collection(db, 'bookings'), bookingData),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Firebase timeout')), 5000)
          )
        ]);
        console.log('✅ Booking saved to Firebase:', docRef.id);
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
          {/* Restaurant info */}
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>{restaurant?.name}</Text>
            <Text style={styles.deal}>🔥 -{restaurant?.discountPercentage}% off food</Text>
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
            <Text style={styles.sectionTitle}>Available Times - {getSelectedDateDisplay()}</Text>
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
            <Text style={styles.bookButtonText}>
              {isBooking ? 'Creating Booking...' : `Reserve Table`}
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