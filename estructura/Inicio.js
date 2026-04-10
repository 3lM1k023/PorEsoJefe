import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Dimensions, SafeAreaView } from 'react-native';
import { Image } from "react-native";

console.log("Ejecutandose correctamente");
const { width, height } = Dimensions.get("window"); //obtener el ancho del dispositivo

const Inicio = ({ navigation }) => {
    return(
        <SafeAreaView style={styles.contenedor}>
         <View style={styles.conteImagen}>
          <Image source={require('../image/conLetras2.png')} style={styles.imagen} />
         </View>

         <View style={styles.conteBoton}>
          <TouchableOpacity style={styles.boton} onPress={() => navigation.navigate('Chat')}>
            <Text style={styles.textoBoton}>Inicio</Text>
          </TouchableOpacity>
         </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
 contenedor: {
  flex: 1,
  backgroundColor: '#fff',
 },
 conteImagen: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
 },
 imagen: {
  width: width * 0.9,
  height: height * 0.5,
  resizeMode: 'contain',
  marginTop: 450,
 },
 conteBoton: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
 },
 boton: {
  backgroundColor: '#0A1F44',
  borderRadius: 30,
  paddingVertical: 18,
  paddingHorizontal: 50,
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 30,
  position: 'absolute',
 },
 textoBoton: {
  color: '#fff',
  fontSize: 22,
  fontWeight: 'bold',
 }
});
 
export default Inicio;