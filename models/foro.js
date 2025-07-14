const mongoose = require('mongoose');

const MensajeForoSchema = new mongoose.Schema({
  tema: { type: String, required: true },
  autor: { type: String, required: true },
  rol: { type: String, required: true },
  mensaje: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  respuestas: [
    {
      autor: { type: String, required: true },
      rol: { type: String, required: true },
      mensaje: { type: String, required: true },
      fecha: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('MensajeForo', MensajeForoSchema);

