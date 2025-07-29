import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

// Super simple test - just try to read any data
export const simpleFirestoreTest = async () => {
  try {
    console.log('🧪 Starting simple Firestore test...');
    
    // Test 1: Just try to get any documents from restaurants collection
    console.log('📋 Test 1: Simple collection read');
    const restaurantsRef = collection(db, 'restaurants');
    const snapshot = await getDocs(restaurantsRef);
    
    console.log('✅ Success! Found', snapshot.size, 'documents');
    
    snapshot.forEach((doc) => {
      console.log('📄 Document ID:', doc.id);
      console.log('📄 Document data:', doc.data());
    });
    
    return {
      success: true,
      count: snapshot.size,
      documents: snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
    };
    
  } catch (error) {
    console.error('❌ Simple test failed:', error);
    return {
      success: false,
      error: error
    };
  }
};

// Test if we can even connect to Firestore
export const testFirestoreConnection = async () => {
  try {
    console.log('🔌 Testing Firestore connection...');
    
    // Just try to create a collection reference
    const testRef = collection(db, 'test');
    console.log('✅ Collection reference created successfully');
    
    // Try to get docs (should work even if collection is empty)
    const snapshot = await getDocs(testRef);
    console.log('✅ Successfully queried Firestore');
    console.log('📊 Test collection has', snapshot.size, 'documents');
    
    return {
      success: true,
      message: 'Firestore connection working!'
    };
    
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
    return {
      success: false,
      error: error
    };
  }
}; 