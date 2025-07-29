import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

// Test Firebase connection
export const testFirebaseConnection = async () => {
  try {
    console.log('🔍 Testing Firebase connection...');
    
    // Test 1: Check if we can read from Firestore
    const testQuery = await getDocs(collection(db, 'restaurants'));
    console.log('✅ Read test passed - Found', testQuery.size, 'restaurants');
    
    // Test 2: Check if we can write to Firestore
    const testDoc = await addDoc(collection(db, 'test'), {
      message: 'Connection test',
      timestamp: new Date(),
    });
    console.log('✅ Write test passed - Created test document:', testDoc.id);
    
    return {
      success: true,
      message: 'Firebase connection working!',
      restaurantCount: testQuery.size,
      testDocId: testDoc.id
    };
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return {
      success: false,
      message: 'Firebase connection failed',
      error: error
    };
  }
};

// Test adding a single restaurant
export const testAddRestaurant = async () => {
  try {
    console.log('🍽️ Testing restaurant addition...');
    
    const testRestaurant = {
      name: 'Test Restaurant',
      cuisine: 'Test Cuisine',
      location: 'Test Location',
      description: 'This is a test restaurant',
      discountPercentage: 25,
      videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
      rating: 4.5,
      priceRange: '$$',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const docRef = await addDoc(collection(db, 'restaurants'), testRestaurant);
    console.log('✅ Restaurant added successfully:', docRef.id);
    
    return {
      success: true,
      message: 'Test restaurant added!',
      restaurantId: docRef.id
    };
    
  } catch (error) {
    console.error('❌ Restaurant addition test failed:', error);
    return {
      success: false,
      message: 'Failed to add test restaurant',
      error: error
    };
  }
}; 