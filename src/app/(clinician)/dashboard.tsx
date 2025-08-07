import { View, Text } from 'react-native'
import Button from '../../components/Button';
import { supabase } from '../../../backend/supabaseClient'
import { router } from 'expo-router'

const handleLogOut= () => {
  supabase.auth.signOut();
  router.replace('/(auth)/login');
}

export default function Profile() {
  return (
    <View>
      <Text>Clinician view</Text>
      <Button
        text="Log out"
        onPress={handleLogOut}
        style={{width: '100%'}}
      />
    </View>
  )
}