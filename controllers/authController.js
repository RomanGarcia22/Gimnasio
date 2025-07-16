const bcrypt = require('bcrypt');
const {pool} = require ('../config/db');
const generarHash = require('../utils/hash');
const Cliente = require('../models/cliente');
const jwt = require('jsonwebtoken');

exports.login = async (req,res) => {
    try{
        const { usuario, contrasenia} = req.body;
        const [result] = await pool.query('SELECT * FROM tbUSuario WHERE correo = ? OR telefono = ?',
        [usuario,usuario]);

        const user = result[0];

        if(!user|| ! (await bcrypt.compare(contrasenia, user.contrasenia))){
            return res.status(401).json({message: 'Credenciales invalidas'});
        }

        const [personalRows] = await pool.query('SELECT rol from tbUsuario WHERE idUsuarioPK = ?'[user.id_UsuarioPK]);
        const rol = personalRows.length > 0 ? personalRows[0].Rol : 'miembro';

        const token = jwt.sign({id: user.id_UsuarioPK, rol: rol}, process.env.JWT_SECRET,
        {expiresIn: '2h'});

        if(rol === 'admin'){
            const [trabajadores] = await pool.query('SELECT * FROM tbEmpleado');
            return res.json(token,rol,trabajadores,{message: 'Bienvenido admin'});
        }
        if(rol === 'empleado'){
            return res.json({token, rol, message: 'Bienvenido empleado'});
        }
        if(rol === 'entrenador'){
            return res.json({token, rol, message: 'Bienvenido entrenador'});
        }
        if(rol === 'miembro'){
            const [miembro] = await pool.query('SELECT * FROM tbMiembro WHERE id_UsuarioFK = ?', [user.id_UsuarioPK])
            return res.json({
                token,
                rol
            });
        }

        return res.status(400).json({message: 'Rol no reconocido'});
    }
    catch(error){
        console.error('Error en el login', error);
        res.status(500).json({message: 'Error en el servidor'})
    }
}

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
        const {nombre, apellidoPaterno, apellidoMaterno, telefono, contrasenia, rol} = req.body;

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

exports.ModificarContrasena = async (req, res) => {
  const {contrasenaActual, nuevaContrasena} = req.body;
  const {id} = req.usuario;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [usuario] = await conn.query(
      'SELECT contrasenia FROM tbUsuario WHERE id_UsuarioPK = ?',
      [id]
    );

    if (usuario.length === 0) {
      return res.status(404).json({message: 'Usuario no encontrado'});
    }

    // Comparar hash de la contraseña actual
    const esValida = await bcrypt.compare(contrasenaActual, usuario[0].contrasenia);
    if (!esValida) {
      return res.status(400).json({message: 'La contraseña actual es incorrecta'});
    }

    const nuevaHash = await generarHash(nuevaContrasena);

    await conn.query(
      'UPDATE tbUsuario SET contrasenia = ? WHERE id_UsuarioPK = ?',
      [nuevaHash, id]
    );

    await conn.commit();
    res.json({message: 'Contraseña actualizada correctamente'});
  } catch (error) {
    await conn.rollback();
    console.error('Error al modificar contraseña', error);
    res.status(500).json({message: 'Error en el servidor'});
  } finally {
    conn.release();
  }
};
