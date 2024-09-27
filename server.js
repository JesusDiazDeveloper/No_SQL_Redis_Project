const express = require('express');
const redis = require('redis');
const { v4: uuidv4 } = require('uuid'); // Importar la función para generar UUIDs

const app = express();
app.use(express.json()); // Para parsear JSON

// Configuración del cliente de Redis
// const client = redis.createClient({
//   url: 'redis://:Pierina1438@redis-11929.c336.samerica-east1-1.gce.redns.redis-cloud.com:11929'
// });

const client = redis.createClient({
    url: 'redis://:h4gStmS12UbDwvJzHHrPPR96s5Vz8J2k@redis-14189.c253.us-central1-1.gce.redns.redis-cloud.com:14189'
});


client.connect().catch(console.error); // Conectar el cliente usando Promesas

client.on('error', (err) => console.error('Redis error:', err));

// Endpoint para agregar usuarios
app.post('/addUser', async (req, res) => {
  try {
    const { userId, username, status } = req.body;
    const reply = await client.hSet(`user:${userId}`, 'username', username, 'status', status);
    res.json({ message: 'User added', reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/createChat', async (req, res) => {
    try {
        const chatId = uuidv4(); // Generar un ID único para el chat
        const { users } = req.body; // Obtener los usuarios del cuerpo de la solicitud

        // Verificar que se proporcionon los datos requeridos
        if (!users) {
            return res.status(400).json({ error: 'Los usuarios son requeridos' });
        }

        // Crear el objeto chatData con los usuarios y un array vacío para los mensajes
        const chatData = {
            users,
            messages: [] // Array vacío para los mensajes
        };

        // Guardar el chat en Redis
        await client.hSet(`chat:${chatId}`, 
            'chatData', JSON.stringify(chatData)); 
        
        // Verificar lo que se ha guardado
        const chatDataStored = await client.hGetAll(`chat:${chatId}`);
        console.log(chatDataStored); // Agrega esta línea para depuración

        res.json({ message: 'Chat created', chatId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Endpoint para enviar un mensaje en un chat
// Endpoint para enviar un mensaje en un chat
app.post('/sendMessage', async (req, res) => {
    try {
        const { chatId, userId, message } = req.body;

        console.log(chatId, userId, message);
  
        // Obtener el chat existente
        const chatKey = `chat:${chatId}`;
        const chatData = await client.hGetAll(chatKey);
  
        if (!chatData || !chatData.chatData) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Parsear el chatData para acceder a los mensajes
        const chatDataParsed = JSON.parse(chatData.chatData);
        const messages = chatDataParsed.messages;

        // Agregar el nuevo mensaje al array de mensajes
        messages.push({ userId, message, timestamp: new Date() });
  
        // Actualizar el chatData en Redis
        await client.hSet(chatKey, 'chatData', JSON.stringify(chatDataParsed));
  
        res.json({ message: 'Message sent', messages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
  

// Recuperar un chat por su ID
app.get('/getChat/:chatId', async (req, res) => {
    try {
        const chatId = req.params.chatId; // Obtener el chatId de los parámetros de la solicitud
        const chatKey = `chat:${chatId}`; // Generar la clave del chat

        // Obtener el chat existente
        const chatData = await client.hGetAll(chatKey);

        if (!chatData || !chatData.chatData) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Parsear el chatData para acceder a la información
        const chatDataParsed = JSON.parse(chatData.chatData);

        res.json({ chatId, chatData: chatDataParsed });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Iniciar el servidor
// nodemon server.js
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
