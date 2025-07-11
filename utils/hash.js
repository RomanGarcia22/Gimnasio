const bcrypt = require('bcryptjs');

const generarHash = async (textoPlano) => {
    const hash = await bcrypt.hash(textoPlano, 10);
    return hash;
  };
  
  module.exports = generarHash;