const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
  id_Cliente: { type: Number, required: true, unique: true },
  Racha: {
    Dias: { type: Number, default: 0 },
    Rango: { type: String, default: 'Bronce' },
    HorasAn: { type: String, default: '0h 0m' },
    HorasMen: { type: String, default: '0h 0m' },
    HorasSem: { type: String, default: '0h 0m' }, 
    PersonDias: { type: String, required: true },
    Entradas: {
      type: [
        {
          Fecha: { type: String, required: true },
          Entrada: { type: String, required: true },
          Salida: { type: String, default: null },
          Tiempo: { type: String, default: null },
          Status: { type: String, default: '0' }
        }
      ],
      default: []
    }
  },
  Membrersias: {
    type: [
      {
        Tipo: { type: String, required: true },
        Tiempo: { type: String, required: true },
        Metodo: { type: String, required: true },
        FechaInicio: { type: String, required: true },
        FechaFin: { type: String, required: true },
        Precio: { type: Number, required: true },
        Codigo: { type: String, required: true }
      }
    ],
    default: []
  },
  Logros: {
    type: [Number],
    default: []
  },
  Configuracion: {
    Color: { type: String, default: "Blanco" },
    Descripcion:{type: String, default:""},
    Amigos: {
      type: [Number], 
      default: []
    }
  }
});

module.exports = mongoose.model('Cliente', ClienteSchema, 'Cliente');