import { addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';

// Directly write a test restaurant to Firebase
export const writeTestRestaurant = async () => {
  try {
    console.log('🖊️ Writing test restaurant directly to Firebase...');
    
    const testRestaurant = {
      name: 'Test Restaurant Direct',
      cuisine: 'Test Cuisine',
      location: 'Test Location',
      description: 'This is a test restaurant written directly to Firebase',
      discountPercentage: 25,
      videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
      rating: 4.5,
      priceRange: '$$',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('📝 Restaurant data to write:', testRestaurant);
    
    const docRef = await addDoc(collection(db, 'restaurants'), testRestaurant);
    
    console.log('✅ Successfully wrote restaurant to Firebase!');
    console.log('📄 Document ID:', docRef.id);
    console.log('📄 Document path:', docRef.path);
    
    return {
      success: true,
      documentId: docRef.id,
      documentPath: docRef.path,
      message: 'Test restaurant written successfully!'
    };
    
  } catch (error) {
    console.error('❌ Failed to write restaurant:', error);
    return {
      success: false,
      error: error,
      message: 'Failed to write test restaurant'
    };
  }
};

// Write multiple test restaurants
export const writeMultipleTestRestaurants = async () => {
  try {
    console.log('🖊️ Writing multiple test restaurants...');
    
    const testRestaurants = [
      {
        name: 'Direct Test 1',
        cuisine: 'Modern American',
        location: 'Downtown',
        description: 'First direct test restaurant',
        discountPercentage: 30,
        videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/steak%20video.mp4?alt=media&token=fef9ed98-7e0e-4ce6-8ad9-4ac64c15cd30',
        rating: 4.6,
        priceRange: '$$$',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Direct Test 2',
        cuisine: 'Japanese',
        location: 'Georgetown',
        description: 'Second direct test restaurant',
        discountPercentage: 40,
        videoUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/viralbite-mobile.firebasestorage.app/o/sushi%20vido.mp4?alt=media&token=9793b12c-5896-4ada-8398-3add0e5c6221',
        rating: 4.4,
        priceRange: '$$',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
    
    const results = [];
    
    for (const restaurant of testRestaurants) {
      try {
        const docRef = await addDoc(collection(db, 'restaurants'), restaurant);
        results.push({
          success: true,
          name: restaurant.name,
          id: docRef.id
        });
        console.log('✅ Wrote:', restaurant.name, 'with ID:', docRef.id);
      } catch (error) {
        results.push({
          success: false,
          name: restaurant.name,
          error: error
        });
        console.error('❌ Failed to write:', restaurant.name, error);
      }
    }
    
    console.log('📊 Write results:', results);
    
    return {
      success: true,
      results: results,
      message: `Wrote ${results.filter(r => r.success).length} out of ${testRestaurants.length} restaurants`
    };
    
  } catch (error) {
    console.error('❌ Failed to write multiple restaurants:', error);
    return {
      success: false,
      error: error,
      message: 'Failed to write multiple restaurants'
    };
  }
}; 