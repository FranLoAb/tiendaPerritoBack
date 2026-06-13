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

// ==========================================
// RUTAS CRUD PARA LOS PRODUCTOS
// ==========================================

// 1. GET: Listar todos los productos
app.get('/api/productos', (req, res) => {
  db.query('SELECT * FROM productos', (err, results) => {
    if (err) return res.status(500).json({ message: 'Error al obtener productos', error: err });
    res.json(results);
  });
});

// 2. GET: Obtener un solo producto por su ID (Para poder editarlo)
app.get('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM productos WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error al obtener el producto', error: err });
    if (results.length === 0) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(results[0]);
  });
});

// 3. POST: Crear un nuevo producto
app.post('/api/productos', (req, res) => {
  const { nombre, descripcion, precio, stock } = req.body;
  const sql = 'INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?)';
  
  db.query(sql, [nombre, descripcion, precio, stock], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error al crear producto', error: err });
    res.status(201).json({ id: result.insertId, nombre, descripcion, precio, stock });
  });
});

// 4. PUT: Actualizar un producto existente
app.put('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock } = req.body;
  const sql = 'UPDATE productos SET nombre=?, descripcion=?, precio=?, stock=? WHERE id=?';
  
  db.query(sql, [nombre, descripcion, precio, stock, id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error al actualizar producto', error: err });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Producto no encontrado para actualizar' });
    res.json({ message: 'Producto actualizado correctamente' });
  });
});

// 5. DELETE: Eliminar un producto
app.delete('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  
  db.query('DELETE FROM productos WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error al eliminar producto', error: err });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Producto no encontrado para eliminar' });
    res.json({ message: 'Producto eliminado correctamente' });
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor Backend corriendo en el puerto ${port}`);
});
