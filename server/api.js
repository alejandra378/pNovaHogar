const express = require('express');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
  next();
});

function normalizarTipo(tipoDb) {
  const mapa = { casa: 'Casa', departamento: 'Departamento', terreno: 'Terreno', local: 'Local' };
  return mapa[String(tipoDb).toLowerCase()] || tipoDb;
}

function normalizarServicio(estadoVenta) {
  return String(estadoVenta).toLowerCase() === 'renta' ? 'En renta' : 'En venta';
}

function mapearPropiedad(p, imagenes) {
  const listaImagenes = imagenes && imagenes.length ? imagenes : [p.imagen_principal].filter(Boolean);

  return {
    id: p.id,
    titulo: p.titulo,
    tipo: normalizarTipo(p.tipo),
    servicio: normalizarServicio(p.estado_venta),
    precio: Number(p.precio),
    ubicacion: p.direccion_completa || p.ubicacion,
    descripcion: p.descripcion,
    habitaciones: p.habitaciones,
    banos: Number(p.banos),
    estacionamientos: p.estacionamientos,
    m2: Number(p.area_construccion) || Number(p.area_terreno) || 0,
    imagenes: listaImagenes,
    lat: Number(p.lat),
    lng: Number(p.lng),
  };
}

app.get('/api/propiedades', async (req, res) => {
  try {
    const { tipo } = req.query;

    let sql = `SELECT * FROM propiedades WHERE estado_publicacion = 'activa'`;
    const params = [];

    if (tipo && tipo !== 'Todos') {
      sql += ' AND tipo = ?';
      params.push(tipo.toLowerCase());
    }
    sql += ' ORDER BY creado_en DESC';

    const [propiedades] = await pool.query(sql, params);
    if (propiedades.length === 0) return res.json([]);

    const ids = propiedades.map((p) => p.id);
    const [imagenes] = await pool.query(
      `SELECT propiedad_id, url FROM propiedad_imagenes WHERE propiedad_id IN (?) ORDER BY propiedad_id, orden ASC`,
      [ids]
    );

    const imagenesPorPropiedad = {};
    imagenes.forEach((img) => {
      if (!imagenesPorPropiedad[img.propiedad_id]) imagenesPorPropiedad[img.propiedad_id] = [];
      imagenesPorPropiedad[img.propiedad_id].push(img.url);
    });

    const resultado = propiedades.map((p) => mapearPropiedad(p, imagenesPorPropiedad[p.id]));
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al consultar propiedades' });
  }
});

app.get('/api/propiedades/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query(`SELECT * FROM propiedades WHERE id = ?`, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Propiedad no encontrada' });
    }

    const [imagenes] = await pool.query(
      `SELECT url FROM propiedad_imagenes WHERE propiedad_id = ? ORDER BY orden ASC`,
      [id]
    );
    const [caracteristicas] = await pool.query(
      `SELECT caracteristica FROM propiedad_caracteristicas WHERE propiedad_id = ?`,
      [id]
    );

    const propiedad = mapearPropiedad(rows[0], imagenes.map((i) => i.url));
    propiedad.caracteristicas = caracteristicas.map((c) => c.caracteristica);

    res.json(propiedad);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al consultar la propiedad' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API de NovaHogar escuchando en el puerto ${PORT}`);
});