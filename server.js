const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// تحديد اسم السيرفر (Render أو Railway) بناءً على المتغيرات البيئية
const SERVER_NAME = process.env.SERVER_NAME || (process.env.RAILWAY_STATIC_URL ? 'Railway' : 'Render');

// دالة لبث عدد المتصلين الحاليين للوحة التحكم عبر Socket
function broadcastStats() {
  const activeConnections = io.engine.clientsCount; // جلب عدد المتصلين الفعلي
  io.emit('stats-update', {
    server: SERVER_NAME,
    activeConnections: activeConnections,
    timestamp: new Date().toISOString()
  });
}

// المسار الرئيسي
app.get('/', (req, res) => {
  res.send(`Mova Socket Server is Running on ${SERVER_NAME}!`);
});

// ⚡ مسار Ping (معدّل ليرجع عدد المتصلين واسم السيرفر)
app.get('/ping', (req, res) => {
  res.status(200).json({
    status: 'Awake',
    server: SERVER_NAME,
    activeConnections: io.engine.clientsCount
  });
});

// 📊 مسار مخصص للوحة التحكم لجلب الإحصائيات بطلب HTTP
app.get('/stats', (req, res) => {
  res.json({
    server: SERVER_NAME,
    activeConnections: io.engine.clientsCount,
    uptime: Math.floor(process.uptime()) // زمن تشغيل السيرفر بالثواني
  });
});

// الأحداث الحية عبر Socket.io
io.on('connection', (socket) => {
  console.log(`[${SERVER_NAME}] مستخدم جديد اتصل:`, socket.id);

  // تحديث لوحة التحكم فور دخول مستخدم جديد
  broadcastStats();

  socket.on('update-location', (data) => {
    io.emit(`location-${data.rideId}`, data);
  });

  socket.on('disconnect', () => {
    console.log(`[${SERVER_NAME}] انقطع الاتصال:`, socket.id);
    // تحديث لوحة التحكم فور خروج أو انقطاع مستخدم
    broadcastStats();
  });
});

// المنفذ الخاص بالسيرفر
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server (${SERVER_NAME}) is running on port ${PORT}`);
});
