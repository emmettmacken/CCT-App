import { Link, router } from "expo-router";
import { Text, View } from "react-native";
import { supabase } from "../../../backend/supabaseClient";
import Button from "../../components/Button";

export default function Profile() {
  const handleLogOut = () => {
    supabase.auth.signOut();
    router.replace("/(auth)/login");
  };

  return (
    <View>
      <Text>Profile screen</Text>
      <Link href="../home">Home Screen</Link>
      <Button text="Log out" onPress={handleLogOut} style={{ width: "100%" }} />
    </View>
  );
}
