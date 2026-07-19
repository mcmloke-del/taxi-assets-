const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// المسار الرئيسي للسيرفر
app.get('/', (req, res) => {
  res.send('Mova Socket Server is Running on Render!');
});

// ⚡ المسار الجديد المخصص لإبقاء السيرفر مستيقظاً (Ping)
app.get('/ping', (req, res) => {
  res.status(200).send('Awake');
});

io.on('connection', (socket) => {
  console.log('مستخدم جديد اتصل:', socket.id);

  socket.on('update-location', (data) => {
    io.emit(`location-${data.rideId}`, data);
  });

  socket.on('disconnect', () => {
    console.log('انقطع الاتصال:', socket.id);
  });
});

// منصة Render تستخدم منافذ متغيرة، لذلك هذا السطر مهم جداً
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
