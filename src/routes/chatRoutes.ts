import dotenv from "dotenv";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { HumanMessage } from "@langchain/core/messages";
import fetch from 'node-fetch';
import { OpenAI, toFile } from 'openai';
import twilio from 'twilio';
import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { ElevenLabsClient } from 'elevenlabs';
import path from 'path';
import { fileURLToPath } from 'url';
import { saveChatHistory } from "../utils/saveHistoryDb.js";
import { getAvailableChatOn } from "../utils/getAvailableChatOn.js";
import { getAvailableForAudio } from "../utils/getAvailableForAudio.js";
import { graph } from "../supervisor.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const MessagingResponse = twilio.twiml.MessagingResponse;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const elevenlabsClient = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const storage = getStorage();

const createAudioStreamFromText = async (text: string): Promise<Buffer> => {
    const audioStream = await elevenlabsClient.generate({
      voice: "GO3JA3hIYgix20rA5CvN",
      model_id: "eleven_multilingual_v2",
      text,
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }

    const content = Buffer.concat(chunks);
    return content;
};

let exportedFromNumber: string | undefined;

let globalConfig = {
  configurable: {
    thread_id: '',
    phone_number: '',
  },
};

// Endpoint específico para webhook de WhatsApp con ngrok
router.post("/seguros/whatsapp", async (req, res) => {
  res.setHeader("ngrok-skip-browser-warning", "true");

  console.log("Webhook received at /seguros/whatsapp:", req.body);
  console.log("Headers:", req.headers);

  const twiml = new MessagingResponse();
  const from = req.body.From;
  console.log("from prueba", from)
  console.log("req.body", req.body);
  const to = req.body.To;

  // Parseo de numeros de telefono
  const fromColonIndex = from.indexOf(':');
  const toColonIndex = to.indexOf(':');
  // Numero de telefono que pasa de "whatsapp:+57XXXXXXXXX" a "+57XXXXXXXXX"
  const fromNumber = from.slice(fromColonIndex + 1); // Número del cliente
  const toNumber = to.slice(toColonIndex + 1);
  // fromNumber sin indicativo de país
  const fromNumberWithoutCountryCode = fromNumber.slice(3); // Número del cliente sin indicativo de país

  exportedFromNumber = fromNumber

  globalConfig = {
    configurable: {
      thread_id: fromNumber,
      phone_number: fromNumber,
    },
  };

  try {
    let incomingMessage;
    let incomingImage;
    let firebaseImageUrl = '';

    console.log('Incoming message Type:', req.body.Body);
    console.log('From:', from);
    console.log('To:', to);

    if(req.body.MediaContentType0 && req.body.MediaContentType0.includes('audio')) {
      try {
        const mediaUrl = await req.body.MediaUrl0;

        const response = await fetch(mediaUrl, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`
          }
        });

        if (!response.body) {
          throw new Error('No se pudo obtener el contenido del audio');
        }

        const file = await toFile(response.body, 'recording.wav');

        const transcription = await openai.audio.transcriptions.create({
          file,
          model: 'whisper-1',
          prompt: "Por favor, transcribe el audio y asegúrate de escribir los números exactamente como se pronuncian, sin espacios, comas, ni puntos. Por ejemplo, un número de documento   debe ser transcrito como 123456789."
        });

        const { text } = transcription;
        incomingMessage = text;
      } catch (error) {
        console.error('Error transcribing audio:', error);
        twiml.message("En este momento no puedo transcribir audios, por favor intenta con un mensaje de texto. O prueba grabando el audio nuevamente.");
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
        return;
      }
    } else if(req.body.MessageType === 'image') {
      const mediaUrl = await req.body.MediaUrl0;
      const response = await fetch(mediaUrl, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`
        }
      });

      // Obtener el buffer de la imagen
      const imageBuffer = await response.buffer();

      // Convertir la imagen a base64
      const imageBase64 = imageBuffer.toString('base64');

      // Crear el nombre del archivo en Firebase Storage
      const imageName = `${uuidv4()}.jpg`;
      const storageRef = ref(storage, `images/${imageName}`);
      const metadata = {
        contentType: 'image/jpg',
      };

      // Función para subir la imagen a Firebase Storage
      const uploadImage = () => {
        return new Promise((resolve, reject) => {
          const uploadTask = uploadBytesResumable(storageRef, imageBuffer, metadata);

          uploadTask.on('state_changed',
            (snapshot) => {
              // Progreso de la subida (opcional)
              console.log('Upload is in progress...');
            },
            (error) => {
              reject(`Upload failed: ${error.message}`);
            },
            async () => {
              // Subida completada, obtener la URL de descarga
              const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(imageUrl);
            }
          );
        });
      };

      // Esperar a que la imagen se suba y obtener la URL
      try {
        const uploadedImageUrl = await uploadImage();

        // Guardar la imagen en Firebase Storage
        firebaseImageUrl = uploadedImageUrl as string;
        req.body.Body ? incomingMessage = req.body.Body : incomingMessage = '';

        // Usar la imagen en base64 según lo necesites
        const base64DataUrl = `data:image/jpeg;base64,${imageBase64}`;

        incomingImage = base64DataUrl; // Si quieres trabajar con la imagen en base64
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    } else {
      incomingMessage = req.body.Body;
    }

    // Ejecutar la función si el mensaje es del cliente
    await saveChatHistory(fromNumber, incomingMessage, true, firebaseImageUrl);

    // Validar si en el dashboard se encuentra activado el chat
    const chatOn = await getAvailableChatOn(fromNumber);
    // Si chat_on es false, quiero decir que en el dashboard está desactivado, así que acá se manda mensaje por agentOutput

    if (!chatOn) {
      // configuración para crear hilos de conversación en el agente y manejar memorias independientes.
      const config = {
        configurable: {
          thread_id: fromNumber,
          phone_number: fromNumber,
        },
      };

      // 🎯 NUEVA ARQUITECTURA: Toda comunicación pasa por Lucia primero
      console.log('💬 Iniciando conversación con Lucia (supervisor)');

      // Crear el estado inicial para el supervisor
      const initialState = {
        messages: incomingImage ?
          [new HumanMessage({
            content: [
              {
                type: "image_url",
                image_url: {url: incomingImage},
              },
            ],
          })] :
          [new HumanMessage({ content: incomingMessage })],
        next: "lucia_service" // Lucia siempre es el primer punto de contacto
      };

      // Invocar el supervisor que maneja todo el flujo con Lucia
      const agentOutput = await graph.invoke(initialState, config);

      const lastMessage = agentOutput.messages[agentOutput.messages.length - 1];

      // Respuesta AI
      console.log('Respuesta Completa IA:', agentOutput);

      if (!lastMessage || typeof lastMessage.content !== "string") {
          console.error("Error: El mensaje de la IA es nulo o no es un string.");
          twiml.message("Lo siento, ocurrió un error procesando tu mensaje. Por favor, intenta nuevamente.");
          res.writeHead(200, { 'Content-Type': 'text/xml' });
          res.end(twiml.toString());
          return;
      }

      const responseMessage = lastMessage.content;

      console.log("Respuesta IA:", responseMessage);

      // Ejecutar la función si el mensaje es del agente
      await saveChatHistory(fromNumber, responseMessage, false, '');

      //consultar si esta disponible para audios
      const isAvailableForAudio = await getAvailableForAudio(fromNumber);

      // 🔍 LOGGING DIAGNÓSTICO DETALLADO
      console.log("===== DIAGNÓSTICO AUDIO SYSTEM =====");
      console.log("📞 Número cliente:", fromNumber);
      console.log("📝 Mensaje respuesta:", responseMessage);
      console.log("📏 Longitud mensaje:", responseMessage.length);
      console.log("🔢 Contiene números:", /\d/.test(responseMessage));
      console.log("🔤 Contiene siglas:", !/\b(?:[A-Z]{2,}|\b(?:[A-Z]\.){2,}[A-Z]?)\b/.test(responseMessage));
      console.log('🎵 Palabra "audio" en respuesta:', responseMessage.toLowerCase().includes("audio"));
      console.log("🔗 Contiene URL:", /https?:\/\/[^\s]+|www\.[^\s]+/i.test(responseMessage));
      console.log("📧 Contiene email:", /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(responseMessage));
      console.log("🎙️ Cliente disponible para audio (DB):", isAvailableForAudio);
      console.log(
        "✅ ¿Pasará a audio?:",
        responseMessage.length <= 400 &&
          !/\d/.test(responseMessage) &&
          !/\b(?:[A-Z]{2,}|\b(?:[A-Z]\.){2,}[A-Z]?)\b/.test(responseMessage) &&
          !responseMessage.toLowerCase().includes("audio") &&
          !/https?:\/\/[^\s]+|www\.[^\s]+/i.test(responseMessage) &&
          !/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(
            responseMessage
          ) &&
          isAvailableForAudio
      );
      console.log('=====================================');

      // Si la respuesta es menor a 400 caracteres && no contiene números && no menciona "audio", hacer TTS y enviar el audio
      if (
        responseMessage.length <= 400 && // Menor a 400 caracteres
        !/\d/.test(responseMessage) && // No contiene números
        !/\b(?:[A-Z]{2,}|\b(?:[A-Z]\.){2,}[A-Z]?)\b/.test(responseMessage) && // No contiene siglas
        !responseMessage.toLowerCase().includes("audio") && // 🚫 No menciona "audio"
        !/https?:\/\/[^\s]+|www\.[^\s]+/i.test(responseMessage) && // 🚫 NUEVA CONDICIÓN: No contiene URLs
        !/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(
          responseMessage
        ) && // 🚫 NUEVA CONDICIÓN: No contiene emails
        isAvailableForAudio // El cliente puede recibir audios
      ) {
        console.log("Entró a enviar audio");
        try {
          const audioBuffer = await createAudioStreamFromText(responseMessage);
          const audioName = `${uuidv4()}.wav`;
          // Subir el archivo de audio a Firebase Storage
          const storageRef = ref(storage, `audios/${audioName}`);
          const metadata = {
            contentType: "audio/mpeg",
          };
          const uploadTask = uploadBytesResumable(
            storageRef,
            audioBuffer,
            metadata
          );
          // Esperar a que la subida complete y obtener la URL pública
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              // Progreso de la subida (opcional)
              console.log("Upload is in progress...");
            },
            (error) => {
              throw new Error(`Upload failed: ${error.message}`);
            },
            async () => {
              // Subida completada
              const audioUrl = await getDownloadURL(uploadTask.snapshot.ref);
              // Envía el archivo de audio a través de Twilio
              await client.messages.create({
                //body: "Audio message",
                // from: "whatsapp:+14155238886",
                from: "whatsapp:+5742044840",
                to: `whatsapp:${fromNumber}`,
                mediaUrl: [audioUrl],
              });
              console.log("Audio message sent successfully");
              res.writeHead(200, { "Content-Type": "text/xml" });
              res.end(twiml.toString());
            }
          );
        } catch (error) {
          console.error("Error sending audio message:", error);
          twiml.message(responseMessage);
          res.writeHead(200, { "Content-Type": "text/xml" });
          res.end(twiml.toString());
        }
      } else {
        // Responder con el texto si es mayor de 400 caracteres
        if (responseMessage.length > 1000) {
          console.log("Response is too long, splitting by newline");
          const messageParts = responseMessage.split("\n\n");

          // eslint-disable-next-line prefer-const
          for (let part of messageParts) {
            if (part !== "") {
              await client.messages.create({
                body: part,
                // from: "whatsapp:+14155238886",
                from: "whatsapp:+5742044840",
                to: `whatsapp:${fromNumber}`,
              });
              console.log(part);
              console.log("-------------------");
            }
          }
        } else {
          try {
            const message = await client.messages.create({
              body: responseMessage,
              // from: "whatsapp:+14155238886",
              from: "whatsapp:+5742044840",
              to: `whatsapp:${fromNumber}`,
            });
            console.log("Message sent successfully:", message.sid);
          } catch (error) {
            console.error("Error sending message:", error);
          }
        }

        // Responder con TwiML vacío para confirmar recepción
        res.writeHead(200, { "Content-Type": "text/xml" });
        res.end(twiml.toString());
      }
    } else {
      // Si el chat está activado en el dashboard, solo responder con TwiML vacío
      console.log('Chat activado en dashboard, no enviando respuesta automática');
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(twiml.toString());
    }

  } catch (error) {
    console.error('Error in /api/whatsapp webhook:', error);
    twiml.message("Lo siento, ocurrió un error. Por favor, intenta nuevamente.");
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});

// Ruta Health Check
router.get('/seguros/health', async (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy - Seguros' });
});

export default router;
export {exportedFromNumber};
