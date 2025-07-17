const {pool} = require ('../config/db');
const Cliente = require('../models/cliente');
exports.actualizarCliente = async (req, res) => {
  const { correo, telefono, nombre, apellidoPaterno, apellidoMaterno, fotoPerfil, nickname } = req.body;
  const { id, rol } = req.usuario;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Validar si correo o teléfono ya existen en otro usuario
    const [exist] = await conn.query(
      'SELECT * FROM tbUsuario WHERE (correo = ? OR telefono = ?) AND id_UsuarioPK != ?',
      [correo, telefono, id]
    );

    if (exist.length > 0) {
      return res.status(400).json({ message: 'Correo o teléfono ya están en uso' });
    }

    await conn.query(
      'UPDATE tbUsuario SET correo = ?, telefono = ? WHERE id_UsuarioPK = ?',
      [correo, telefono, id]
    );

    // Validar si nickname ya está en uso por otro usuario
    const [existNickname] = await conn.query(
      'SELECT id_MiembroPK FROM tbMiembro WHERE nickname = ? AND id_UsuarioFK != ?',
      [nickname, id]
    );

    if (existNickname.length > 0) {
      return res.status(400).json({ message: 'El nickname ya está en uso' });
    }

    if (rol === 'miembro') {
      await conn.query(
        'UPDATE tbMiembro SET nombre = ?, apellidoPaterno = ?, apellidoMaterno = ?, fotoPerfil = ?, nickname = ? WHERE id_UsuarioFK = ?',
        [nombre, apellidoPaterno, apellidoMaterno, fotoPerfil || null, nickname, id]
      );
    } else {
      return res.status(403).json({ message: 'Solo miembros pueden editar sus propios datos' });
    }

    await conn.commit();

    res.json({ message: 'Datos actualizados correctamente' });
  } catch (error) {
    await conn.rollback();
    console.error('Error al editar usuario', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    conn.release();
  }
};

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

exports.verLogros = async (req, res) => {
  const { id } = req.usuario;

  try {
    const cliente = await Cliente.findOne({ id_Cliente: id }, 'Logros');
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });

    res.json(cliente.Logros);
  } catch (error) {
    console.error('Error al obtener logros:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

exports.verConfiguracion = async (req, res) => {
  const { id } = req.usuario;

  try {
    const cliente = await Cliente.findOne({ id_Cliente: id }, 'Configuracion');
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(cliente.Configuracion);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

exports.actualizarConfiguracion = async (req, res) => {
  const { id } = req.usuario;
  const { Color, Descripcion, Amigos } = req.body;

  try {
    const cliente = await Cliente.findOneAndUpdate(
      { id_Cliente: id },
      {
        'Configuracion.Color': Color,
        'Configuracion.Descripcion': Descripcion,
        'Configuracion.Amigos': Amigos
      },
      { new: true }
    );

    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });

    res.json(cliente.Configuracion);
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

exports.agregarAmigo = async (req, res) => {
  const { id } = req.usuario;
  const { amigoId } = req.body;

  if (!amigoId) {
    return res.status(400).json({ message: 'ID de amigo es requerido' });
  }

  try {
    const cliente = await Cliente.findOneAndUpdate(
      { id_Cliente: id },
      { $addToSet: { 'Configuracion.Amigos': amigoId } },
      { new: true }
    );

    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });

    res.json(cliente.Configuracion.Amigos);
  } catch (error) {
    console.error('Error al agregar amigo:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

exports.eliminarAmigo = async (req, res) => {
  const { id } = req.usuario;
  const { amigoId } = req.body;

  if (!amigoId) {
    return res.status(400).json({ message: 'ID de amigo es requerido' });
  }

  try {
    const cliente = await Cliente.findOneAndUpdate(
      { id_Cliente: id },
      { $pull: { 'Configuracion.Amigos': amigoId } },
      { new: true }
    );

    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });

    res.json(cliente.Configuracion.Amigos);
  } catch (error) {
    console.error('Error al eliminar amigo:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};