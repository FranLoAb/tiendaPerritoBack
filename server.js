const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
// Kubernetes espera que el servidor corra en el puerto 3001
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Configuración de la conexión a MySQL usando las variables de entorno de Kubernetes
const db = mysql.createPool({
  host: process.env.DB_HOST || 'tienda-db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'tienda_perritos',
  port: process.env.DB_PORT || 3306
});

// Prueba de conexión a la base de datos (Opcional, pero útil para los logs)
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
  } else {
    console.log('Conexión exitosa a la base de datos MySQL');
    connection.release();
  }
});

// ¡MUY IMPORTANTE! Esta es la ruta que Kubernetes revisa (readinessProbe y livenessProbe)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend funcionando correctamente' });
});

// Aquí puedes agregar el resto de tus rutas de la tienda...
// app.get('/api/productos', ...)

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor Backend corriendo en el puerto ${port}`);
});
