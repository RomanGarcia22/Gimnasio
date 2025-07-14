const express = require('express');
const router = express.Router();
const registroController = require('../controllers/usuarioController');
const { verificarToken } = require('../utils/verificarToken');

router.post('/registroMiembro', registroController.registrarCliente);

router.put('/ActualuzarMiembro',verificarToken(['miembro']), registroController.actualizarCliente);

module.exports = router;