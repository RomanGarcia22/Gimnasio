const express = require('express');
const router = express.Router();
const Empleado = require('../controllers/clienteController');
const autenticacion = require('../controllers/authController');
const {verificarToken} = require('../utils/verificarToken');

router.post('/registroMiembro', registrarEmpleado.registrarCliente);

router.post('/activarCliente', verificarToken(['admin', 'empleado']), Empleado.ActivarCliente);

router.post('/desactivarCliente', verificarToken(['admin', 'empleado']), Empleado.DesactivarCliente);

router.post('/registrarMaquina', verificarToken(['admin','empleado']), Empleado.registrarMaquina);

module.exports = router;