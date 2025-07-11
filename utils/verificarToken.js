const {pool} = require('../config/db');
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

const verificarToken = (rolesPermitidos =[]) => {
  return async (req, res, next) =>{
    const autHeader = req.headers.authorization;
    if (authHeader) return req.status(401).json({message:'Token requerido'});
    const token = autHeader.split(' ')[1];
    try{
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.usuario = decoded;

      if(rolesPermitidos.length>0 && !rolesPermitidos.includes(decoded.rol)){
        return res.status(403).json({message: 'No tienes permisos suficientes'});
      }

      next();
    }catch(error){
      return res.status(403).json({message:'Token inválido o expirado'});
    }
  };
};


module.exports = {
    obtenerIdPersonal,
    obtenerIdMiembro,
    verificarToken
};