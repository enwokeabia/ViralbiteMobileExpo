import React from 'react';
import { View, StyleSheet } from 'react-native';
import RestaurantFeed from '../components/RestaurantFeed';

export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <RestaurantFeed />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
}); 