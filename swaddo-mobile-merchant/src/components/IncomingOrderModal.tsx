import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Audio } from 'expo-av';

interface IncomingOrderModalProps {
  visible: boolean;
  order: any;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingOrderModal({ visible, order, onAccept, onReject }: IncomingOrderModalProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    if (visible) {
      playSound();
    } else {
      stopSound();
    }
    return () => {
      stopSound();
    };
  }, [visible]);

  async function playSound() {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        // Typically we would use require('../assets/alarm.mp3') here
        // For now, we will just use a generic config since we don't have the file yet
      );
      setSound(newSound);
      await newSound.setIsLoopingAsync(true);
      await newSound.playAsync();
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  }

  async function stopSound() {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
  }

  if (!visible || !order) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6 shadow-2xl pb-10">
          <View className="items-center mb-6">
            <View className="w-16 h-2 bg-gray-200 rounded-full mb-6" />
            <View className="bg-orange-100 p-4 rounded-full mb-4">
              <Text className="text-4xl">🔔</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">New Order Received!</Text>
            <Text className="text-orange-600 font-bold text-lg">{order.id}</Text>
          </View>

          <View className="bg-gray-50 rounded-xl p-4 mb-6">
            <Text className="text-gray-500 mb-1">Items</Text>
            <Text className="text-gray-900 font-medium mb-3">{order.items}</Text>
            <View className="flex-row justify-between items-center pt-3 border-t border-gray-200">
              <Text className="text-gray-500">Total Amount</Text>
              <Text className="text-xl font-bold text-green-600">{order.total}</Text>
            </View>
          </View>

          <View className="flex-row space-x-4">
            <TouchableOpacity 
              className="flex-1 bg-red-100 py-4 rounded-xl items-center"
              onPress={onReject}
            >
              <Text className="font-bold text-red-600 text-lg">Reject</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-1 bg-green-500 py-4 rounded-xl items-center shadow-sm"
              onPress={onAccept}
            >
              <Text className="font-bold text-white text-lg">Accept Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
