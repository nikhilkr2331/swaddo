import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import IncomingOrderModal from '../components/IncomingOrderModal';
import { connectSocket, disconnectSocket } from '../lib/socket';

// Mock data for initial UI
const MOCK_ORDERS = [
  { id: 'ORD-001', items: '2x Biryani, 1x Coke', total: '₹450', time: 'Just now', status: 'pending' },
  { id: 'ORD-002', items: '1x Paneer Butter Masala', total: '₹220', time: '5 mins ago', status: 'accepted' },
];

export default function DashboardScreen() {
  const [isOnline, setIsOnline] = useState(true);
  const [incomingOrder, setIncomingOrder] = useState<any>(null);

  useEffect(() => {
    const socket = connectSocket();
    
    // Replace 'stall_1' with the actual stall ID from login session later
    const stallChannel = 'stall:stall_1:orders';
    
    socket.on(stallChannel, (update: any) => {
      // Trigger the loud alarm and show modal
      setIncomingOrder(update);
    });

    return () => {
      socket.off(stallChannel);
      // Optional: disconnectSocket() if leaving the dashboard entirely
    };
  }, []);

  const simulateIncomingOrder = () => {
    setIncomingOrder({ id: 'ORD-' + Math.floor(Math.random() * 1000), items: '1x Veg Burger, 1x Fries', total: '₹180' });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white shadow-sm">
        <View>
          <Text className="text-xl font-bold text-gray-900">Swaddo Merchant</Text>
          <Text className="text-sm text-gray-500">Dashboard</Text>
        </View>
        <View className="flex-row items-center space-x-2">
          <Text className={`font-semibold ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: '#d1d5db', true: '#86efac' }}
            thumbColor={isOnline ? '#16a34a' : '#f3f4f6'}
          />
        </View>
      </View>

      {/* Simulation Button (Temporary) */}
      <TouchableOpacity 
        className="mx-4 mt-2 p-4 bg-orange-100 border border-orange-200 rounded-xl items-center"
        onPress={simulateIncomingOrder}
      >
        <Text className="font-bold text-orange-700">Simulate Incoming Order Alert</Text>
      </TouchableOpacity>

      {/* Orders List */}
      <ScrollView className="flex-1 px-4 py-4">
        <Text className="mb-4 text-lg font-bold text-gray-800">Active Orders</Text>
        
        {MOCK_ORDERS.map((order) => (
          <View key={order.id} className="p-4 mb-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-start mb-2">
              <Text className="font-bold text-lg text-orange-600">{order.id}</Text>
              <Text className="text-sm text-gray-500">{order.time}</Text>
            </View>
            <Text className="text-gray-700 mb-2">{order.items}</Text>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-lg font-bold">{order.total}</Text>
              
              {order.status === 'pending' ? (
                <View className="flex-row space-x-2">
                  <TouchableOpacity className="px-4 py-2 bg-red-100 rounded-lg">
                    <Text className="font-bold text-red-600">Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="px-4 py-2 bg-green-500 rounded-lg">
                    <Text className="font-bold text-white">Accept</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="px-3 py-1 bg-blue-100 rounded-full">
                  <Text className="text-blue-700 font-semibold text-xs">Preparing</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Incoming Order Modal */}
      <IncomingOrderModal 
        visible={!!incomingOrder} 
        order={incomingOrder} 
        onAccept={() => setIncomingOrder(null)} 
        onReject={() => setIncomingOrder(null)} 
      />
    </SafeAreaView>
  );
}
