import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { Image } from "react-native";

import { API_BASE_URL } from "../config/api";

console.log("Ejecutandose correctamente");
const { width, height } = Dimensions.get("window");

const Chat = () => {
  const [mensaje, setMensaje] = useState("");
  const [mensajes, setMensajes] = useState([
    {
      id: "1",
      texto: "Hola mi nombre es TunBot. ¿En que puedo ayudarte el día de hoy?",
      emisor: "bot",
    },
  ]);

  const listRef = useRef(null);

  const enviarMensaje = async () => {
    if (mensaje.trim() === "") return;

    const textoUsuario = mensaje;

    const nuevoMensaje = {
      id: Date.now().toString(),
      texto: textoUsuario,
      emisor: "usuario",
    };

    setMensajes((prev) => [...prev, nuevoMensaje]);
    setMensaje("");

    try {
      //Llamada REAL al backend
      const resp = await fetch(`${API_BASE_URL}/nlp/analizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: textoUsuario }),
      });

      const data = await resp.json();

      //Construye respuesta usando SOLO datos del artículo devuelto
      let respuestaBot = "Gracias por tu mensaje. En qué más puedo ayudarte?";

      if (data?.articulo) {
        const a = data.articulo;

        //Puede venir como "articuloView" (tu backend nuevo) o como articulo plano
        const titulo = a.titulo || a?.articulo?.titulo;
        const explicacion = a.explicacion_clara || a?.articulo?.explicacion_clara;
        const descripcion = a.descripcion || a?.articulo?.descripcion;

        respuestaBot =
          `Artículo ${a.articulo || a?.articulo?.articulo || ""}: ${titulo || ""}\n\n` +
          `${explicacion || descripcion || "Encontré un artículo relacionado."}`;
      } else if (data?.razonamiento) {
        respuestaBot = data.razonamiento;
      }

      setMensajes((prev) => [
        ...prev,
        { id: Date.now().toString(), texto: respuestaBot, emisor: "bot" },
      ]);
    } catch (e) {
      setMensajes((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          texto:
            "No pude conectarme al servidor. Verifica que tu PC y tu teléfono estén en la misma red Wi-Fi y que el backend esté corriendo en el puerto 3000.",
          emisor: "bot",
        },
      ]);
    }
  };

  const renderItem = ({ item }) => (
    <View>
      {item.emisor === "bot" ? (
        <View style={styles.mensajeBot}>
          <View style={styles.burbujaBot}>
            <Text style={styles.textoBurbuja}>{item.texto}</Text>
          </View>
          <Image source={require("../image/logoPe.png")} style={styles.iconoBot} />
        </View>
      ) : (
        <View style={[styles.burbuja, styles.usuario]}>
          <Text style={styles.textoBurbuja}>{item.texto}</Text>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "android" ? -68 : 40}
    >
      <View style={{ flex: 1, paddingBottom: 62 }}>
        <SafeAreaView style={styles.contenedor}>
          <View style={styles.conteIntro}>
            <Image source={require("../image/logoPe.png")} style={styles.logoImage} />

            <Text style={styles.textoIntro}>
              “PorEsoJefe” es una aplicación con fines informativos y educativos. No ofrece asesoría
              legal ni sustituye la orientación de un abogado. Su contenido busca comunicar de forma
              accesible las normas de tránsito vigentes en México para fomentar la cultura y
              educación vial. La información presentada se basa en fuentes oficiales. Proyecto sin
              fines de lucro.
            </Text>
          </View>

          <FlatList
            ref={listRef}
            style={{ flex: 1 }}
            data={mensajes}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.lista}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScrollBeginDrag={() => Keyboard.dismiss()}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          />

          <View style={styles.contenedorInput}>
            <TextInput
              style={styles.input}
              placeholder="Escribe tu mensaje..."
              value={mensaje}
              onChangeText={setMensaje}
            />
            <TouchableOpacity style={styles.botonEnviar} onPress={enviarMensaje}>
              <Text style={{ color: "white", fontSize: 18 }}>➤</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  conteIntro: {
    backgroundColor: "#fff",
    paddingVertical: 50,
    paddingHorizontal: 50,
    alignItems: "center",
  },
  textoIntro: {
    marginTop: 15,
    color: "#0A1F44",
    textAlign: "center",
    fontWeight: "bold",
  },
  lista: {
    padding: 10,
    flexGrow: 1,
  },
  burbuja: {
    maxWidth: "80%",
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  mensajeBot: {
    alignItems: "flex-start",
    marginVertical: 6,
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  burbujaBot: {
    backgroundColor: "#0A1F44",
    borderRadius: 15,
    padding: 12,
    maxWidth: "80%",
    marginTop: 6,
    borderTopLeftRadius: 0,
  },
  iconoBot: {
    width: 65,
    height: 65,
    resizeMode: "contain",
    marginTop: 6,
    marginLeft: 6,
  },
  usuario: {
    backgroundColor: "#0066CC",
    alignSelf: "flex-end",
    borderRadius: 15,
    padding: 12,
    marginVertical: 6,
    maxWidth: "80%",
    borderTopRightRadius: 0,
  },
  textoBurbuja: {
    fontSize: 15,
    color: "white",
  },
  contenedorInput: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    fontSize: 16,
  },
  botonEnviar: {
    marginLeft: 10,
    backgroundColor: "#0A1F44",
    borderRadius: 10,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Chat;
