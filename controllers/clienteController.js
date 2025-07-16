const {pool} = require ('../config/db');
const Cliente = require('../models/cliente');

exports.actualizarCliente = async (req, res) => {
  const { correo, telefono, nombre, apellidoPaterno, apellidoMaterno, activo, fotoPerfil} = req.body;
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

exports.verPerfil = async (req, res) => {
  const {id} = req.usuario;

  const conn = await pool.getConnection();
  try{
    const [usuario] = await conn.query(
      'SELECT * FROM tbUsuario WHERE id_UsuarioPK = ?',
      [id]
    );

    if(usuario.length === 0){
      return res.status(404).json({message: 'Usuario no encontrado'});
    }

    const [miembro] = await conn.query(
      'SELECT * FROM tbMiembro WHERE id_UsuarioFK = ?',
      [id]
    );

    res.json({
      usuario: usuario[0],
      miembro: miembro[0] || null
    });
  } catch(error){
    console.error('Error al obtener perfil', error);
    res.status(500).json({message: 'Error en el servidor'});
  } finally {
    conn.release();
  }
}

exports.verAsistencias = async (req, res) => {
  const { id } = req.usuario;

  try {
    const cliente = await Cliente.findOne({ id_Cliente: id }, 'Racha.Entradas');
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });

    const asistencias = cliente.Racha.Entradas.map(e => ({
      fecha: e.Fecha,
      entrada: e.Entrada,
      salida: e.Salida,
      tiempo: e.Tiempo,
      status: e.Status
    }));

    res.json(asistencias);
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

exports.verRacha = async (req, res) => {
  const { id } = req.usuario;

  try {
    const cliente = await Cliente.findOne({ id_Cliente: id }, 'Racha');
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });

    res.json(cliente.Racha);
  } catch (error) {
    console.error('Error al obtener racha:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

exports.verMembresias = async (req, res) => {
  const { id } = req.usuario;

  try {
    const cliente = await Cliente.findOne({ id_Cliente: id }, 'Membrersias');
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });

    res.json(cliente.Membrersias);
  } catch (error) {
    console.error('Error al obtener membresías:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

exports.verListaAmigos = async (req, res) => {
  const { id } = req.usuario;
  const conn = await pool.getConnection();

  try {

    const cliente = await Cliente.findOne({ id_Cliente: id }, 'Configuracion.Amigos');
    if (!cliente || !cliente.Configuracion || cliente.Configuracion.Amigos.length === 0) {
      return res.json([]); // No hay amigos aún
    }

    const idsAmigos = cliente.Configuracion.Amigos;

    const [amigos] = await conn.query(
      'SELECT id_MiembroPK, nombre, fotoPerfil FROM tbMiembro WHERE id_MiembroPK IN (?)',
      [idsAmigos]
    );

    const lista = amigos.map(amigo => ({
      id: amigo.id_MiembroPK,
      nombre: `${amigo.nombre}`,
      fotoPerfil: amigo.fotoPerfil
    }));

    res.json(lista);
  } catch (error) {
    console.error('Error al obtener amigos:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    conn.release();
  }
};
