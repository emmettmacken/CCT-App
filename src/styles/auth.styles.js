import { StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

export const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    flex: 1,
  },
  label: {
    color: 'black',
    fontSize: 15,
    fontWeight: '600',
    alignSelf: 'center',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginTop: 5,
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    placeholderOpacity: 0.2,
  },
  textButton: {
    alignSelf: 'center',
    fontWeight: 'bold',
    color: Colors.light.tint,
    marginVertical: 10,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginBottom: 15,
    placeholderOpacity: 0.2,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  dropdownContainer:{
    borderWidth: 2,
    borderColor: 'grey',
    padding: 3,
    borderRadius: 10,
  },
});