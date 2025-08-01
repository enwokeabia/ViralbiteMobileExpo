import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export const addTimeSlotsToRestaurant = async (restaurantId: string) => {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    
    const timeSlots = [
      { time: '18:00', isAvailable: true },
      { time: '18:30', isAvailable: true },
      { time: '19:00', isAvailable: true },
      { time: '19:30', isAvailable: true },
      { time: '20:00', isAvailable: true },
    ];
    
    await updateDoc(restaurantRef, {
      timeSlots: timeSlots
    });
    
    console.log('✅ Time slots added to restaurant:', restaurantId);
    return true;
  } catch (error) {
    console.error('❌ Error adding time slots:', error);
    return false;
  }
}; 