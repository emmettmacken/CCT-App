import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
        <View>
          <Text>Home Screen</Text>
          <Link href="/(auth)/login">
          <Text>Go to Sign In</Text> 
          </Link>
       </View>
  );
}