import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';

interface BookingModalProps {
  visible: boolean;
  restaurant: any;
  onClose: () => void;
  onBook: (details: any) => void;
}

export default function BookingModal({ visible, restaurant, onClose, onBook }: BookingModalProps) {
  const [selectedTime, setSelectedTime] = useState('');
  const [guests, setGuests] = useState(2);

  const timeSlots = ['12:00', '12:30', '13:00', '13:30', '18:00', '18:30', '19:00', '19:30'];
  const guestOptions = [1, 2, 3, 4, 5, 6];

  const handleBook = () => {
    if (selectedTime) {
      onBook({
        restaurantId: restaurant.id,
        time: selectedTime,
        guests,
        date: 'Today' // We'll make this dynamic later
      });
    }
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

          {/* Time slots */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Times - Today</Text>
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
            style={[styles.bookButton, !selectedTime && styles.bookButtonDisabled]}
            onPress={handleBook}
            disabled={!selectedTime}
          >
            <Text style={styles.bookButtonText}>
              Reserve for {guests} {guests === 1 ? 'guest' : 'guests'} at {selectedTime || '--:--'}
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
}); 