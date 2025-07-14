const express = require('express');
const router = express.Router();
const registrarEmpleado = require('../controllers/usuarioController');
const {verificarToken} = require('../utils/verificarToken');


router.post('/registroMiembro', registrarEmpleado.registrarCliente);

module.exports = router;