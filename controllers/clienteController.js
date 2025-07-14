const {pool} = require ('../config/db');
const Cliente = require('../models/cliente');

exports.actualizarCliente = async (req, res) => {
  const { correo, telefono, nombre, apellidoPaterno, apellidoMaterno, activo, rolNuevo, fotoPerfil} = req.body;
  const {id, rol} = req.usuario;

  const conn = await pool.getConnection();
  try{
    await conn.beginTransaction();

    await conn.query(
      'UPDATE tbUsuario SET correo = ?, telefono= ? WHERE id_UsuarioPK = ?',
      [correo, telefono, id]
    );

    if (rol == 'miembro'){
      await conn.query(
        'UPDATE tbMiembro SET nombre = ?, apellidoPaterno = ?, apellidoMaterno = ?, fotoPerfil = ? WHERE id_UsuarioFK = ?',
        [nombre, apellidoPaterno, apellidoMaterno, activo, fotoPerfil || null, id ]
      );
    }else{
      return res.status(403).json({message: 'Solo miembros pueden editar sus propios datos'});
    }

    await conn. commit();

    res.json({message:'Datos actualizados correctamente'});
  } catch(error){
    await conn.rollback();
    console.error('Error al editar usuario', error);
    res.status(500).json({message:'Error en el servidor'});
  }finally{
    conn.release();
  }
};
