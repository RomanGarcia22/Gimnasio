const express = require('express');
const router = express.Router();
const registroController = require('../controllers/usuarioController');

router.post('/registroMiembro', registroController.registrarCliente);

module.exports = router;