const mongoose = require('mongoose');

const NotaSchema = new mongoose.Schema({
  id_Miembro: { type: Number, required: true },
  notas: [
    {
      dia: { type: Date, required: true },
      texto: { type: String, required: true }
    }
  ]
});

module.exports = mongoose.model('Nota', NotaSchema, 'Notas');
