const express = require('express');
const router = express.Router();
const Empleado = require('../controllers/clienteController');
const autenticacion = require('../controllers/authController');
const {verificarToken} = require('../utils/verificarToken');
const { route } = require('./clienteRoutes');

router.post('/login',autenticacion.login);

router.post('/registrarEmpleado',verificarToken(['admin']), autenticacion.registrarEmpleado);

router.post('/registroMiembro', autenticacion.registrarCliente);


module.exports = router;