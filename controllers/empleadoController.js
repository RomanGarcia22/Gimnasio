const {pool} = require ('../config/db');

exports.DesactivarCliente = async (req, res) => {
  const {nombre, apellidoPaterno, apellidoMaterno} = req.params;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'UPDATE tbMiembro SET activo = ? WHERE nombre = ? AND apellidoPaterno = ? AND apellidoMaterno = ?',
      [0, nombre, apellidoPaterno, apellidoMaterno]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({message: 'Usuario no encontrado'});
    }

    await conn.commit();
    res.json({message: 'Usuario desactivado correctamente'});
  } catch (error) {
    await conn.rollback();
    console.error('Error al desactivar usuario', error);
    res.status(500).json({message: 'Error en el servidor'});
  } finally {
    conn.release();
  }
}

exports.ActivarCliente = async (req, res) => {
  const {nombre, apellidoPaterno, apellidoMaterno} = req.params;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'UPDATE tbMiembro SET activo = ? WHERE nombre = ? AND apellidoPaterno = ? AND apellidoMaterno = ?',
      [1, nombre, apellidoPaterno, apellidoMaterno]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({message: 'Usuario no encontrado'});
    }

    await conn.commit();
    res.json({message: 'Usuario activado correctamente'});
  } catch (error) {
    await conn.rollback();
    console.error('Error al activar usuario', error);
    res.status(500).json({message: 'Error en el servidor'});
  } finally {
    conn.release();
  }
}

exports.registrarMaquina = async (req, res) => {
  const {nombre, musculo, llegada, imagen} = req.body;
  const {id} = req.usuario;

  if (!nombre || !descripcion || !tipo || !estado) {
    return res.status(400).json({message: 'Todos los campos son obligatorios'});
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO tbMaquina (nombre, musculo, llegada , imagen) VALUES (?, ?, ?, ?)',
      [nombre, musculo, llegada, imagen || null]
    );

    await conn.commit();
    res.status(201).json({message: 'Máquina registrada correctamente', maquinaId: result.insertId});
  } catch (error) {
    await conn.rollback();
    console.error('Error al registrar máquina', error);
    res.status(500).json({message: 'Error en el servidor'});
  } finally {
    conn.release();
  }
}