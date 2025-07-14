const QRCode = require('qrcode');
const {pool} = require ('../config/db');
const generarHash = require('../utils/hash');
const Cliente = require('../models/cliente');
const { act } = require('react');

exports.registrarCliente = async (req,res) =>{
  const conn = await pool.getConnection();
  
  try
  {
    const {correo, telefono, contrasenia, nombre, apellidoPaterno, apellidoMaterno,fotoPerfil}= req.body;
    
    await conn.beginTransaction();

    const [exists] = await conn.query(
        'SELECT id_UsuarioPK FROM tbUsuario WHERE correo = ? OR telefono = ?',
        [correo,telefono]
    );
    if(exists.length > 0){
        await conn.rollback();
        return res.status(400).json({message: 'El correo o teléfono ya esta registrado'});
    }

    const hashedPassword = await generarHash(contrasenia);
    const [usuarioResult] = await conn.query(
        'INSERT INTO tbUsuario (correo, telefono, contrasenia, rol) VALUES (?,?,?,?)',
        [correo,telefono,hashedPassword,'miembro']
    );
    const idUsuario = usuarioResult.insertId;
    const qrTexto = `MIEMBRO:${idUsuario}`;

    const[miembroResult] = await conn.query(
        'INSERT INTO tbMiembro (nombre, apellidoPaterno, apellidoMaterno, codigoQR, fotoPerfil, puntos, protectores, activo, id_usuarioFK) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [nombre, apellidoPaterno,apellidoMaterno,qrTexto,fotoPerfil||null,0,0,1,idUsuario]
    );

    const idMiembro = miembroResult.insertId;

    await Cliente.create({id_Cliente:idMiembro});

    await conn.commit();

    res.status(201).json({message:'Miembro registrado correctamente', idMiembro, nombre});
  }catch(error){
    await conn.rollback();
    console.error('Error al registrar miembro', error);
    res.status(500).json({message: 'Error en el servidor'});
  }finally{
    conn.release();
  }
};


const quitarAcentos = (texto) => {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toLowerCase();
};


exports.registrarEmpleado = async (req,res) =>{
    const conn = await pool.getConnection();

    try{
        const {nombre, apellidoPaterno, apellidoMaterno, telefono, contrasenia, rol} = req.body();

        if(!nombre || !apellidoPaterno || !apellidoMaterno || !contrasenia || !rol){
            return res.status(400).json({message: 'Faltan datos obligatorios'});
        }

        await conn.beginTransaction();

        const correoBase = `${quitarAcentos(apellidoPaterno)}.${quitarAcentos(apellidoMaterno)}@jeer.com`.toLowerCase();

        const [exists] = await conn.query(
            'SELECT id_UsuarioPK FROM tbUsuario WHERE correo = ? OR telefono = ?',
            [correoBase,telefono]
        );

        if(exists.length >0){
            await conn.rollback();
            return res.status(400).json({message: 'El correo o teléfono ya estan registrados'});
        }

        const hash = await generarHash(contrasenia);

        const [usuarioResult] = await conn.query(
          'INSERT INTO tbUsuario (correo, telefono, contrasenia, rol) VALUES (?,?,?,?)',
          [correoBase,telefono,hash,rol]  
        );

        const idUsuario = usuarioResult.insertId;

        await conn.query(
            'INSERT INTO tbEmpleado (nombre, apellidoPaterno, apellidoMaterno, id_UsuarioFK) VALUES (?,?,?,?)',
            [nombre,apellidoPaterno,apellidoMaterno,idUsuario]
        );

        await conn.commit();
        res.status(201).json({message:'Empelado registrado correctamente',correoBase});
    }catch (error){
        await conn.rollback();
        console.error('Error al registrar empleado:',error);
        res.status(500).json({message:'Error en el servidor'});
    }finally{
        conn.release();
    }
};



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
