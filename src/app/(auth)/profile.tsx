import { View, Text, TouchableOpacity } from 'react-native'
import { Link, router } from 'expo-router'
import Button from '../../components/Button';

export default function Profile() {
  return (
    <View>
      <Text>Profile screen</Text>
      <Link href="../home">Home Screen</Link>
      <Button
        text="Log out"
        onPress={handleLogOut}
        style={{width: '100%'}}
      />
    </View>
  )
}

const handleLogOut= () => {
  router.replace('/(auth)/login');
}