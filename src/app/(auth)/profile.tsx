import { View, Text } from 'react-native'
import { Link } from 'expo-router'

export default function Profile() {
  return (
    <View>
      <Text>Profile screen</Text>
      <Link href="../login">Logout</Link>
      <Link href="../home">Return Home</Link>
    </View>
  )
}