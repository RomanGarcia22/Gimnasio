const express = require('express');
const router = express.Router();
const autenticacion = require('../controllers/authController');
const cliente = require ('../controllers/clienteController');
const { verificarToken } = require('../utils/verificarToken');


router.put('/ActualuzarMiembro',verificarToken(['miembro']), cliente.actualizarCliente);



module.exports = router;