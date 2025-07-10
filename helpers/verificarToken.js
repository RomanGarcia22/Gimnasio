const pool = require('../config/db');
const jwt = require('jsonwebtoken');

async function obtenerIdPersonal(idUsuario) {
    const [rows] = await pool.query(
        'SELECT * FROM tbPersonal WHERE id_UsuarioFK = ?',
        [idUsuario]
    );

    return rows.length ? rows[0] : null;
}

async function obtenerIdMiembro(idUsuario){
     const [rows] = await pool.query(
        'SELECT * FROM tbMiembro WHERE id_UsuarioFK = ?',
        [idUsuario]
    );

    return rows.length ? rows[0] : null;
}

const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1]; 

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; 
    next(); 
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};


module.exports = {
    obtenerIdPersonal,
    obtenerIdMiembro,
    verificarToken
};