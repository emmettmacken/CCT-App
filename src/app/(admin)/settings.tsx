import { View, Text } from 'react-native'
import { supabase } from "../../../backend/supabaseClient";
import { Link, router } from 'expo-router';
import Button from '../../components/Button';

export default function Profile() {
  const handleLogOut = () => {
    supabase.auth.signOut();
    router.replace("/(auth)/login");
  };

  return (
    <View>
      <Text>Settings screen</Text>
      <Button text="Log out" onPress={handleLogOut} style={{ width: "100%" }} />
    </View>
  );
}