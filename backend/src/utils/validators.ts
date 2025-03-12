/**
 * Validador de cédula ecuatoriana
 * @param cedula Número de cédula a validar
 * @returns { isValid: boolean, message?: string } Resultado de la validación con mensaje opcional de error
 */
export const validateCedula = (cedula: string): { isValid: boolean; message?: string } => {
  // Verificar longitud
  if (cedula.length !== 10) {
    return { isValid: false, message: 'La cédula debe tener 10 dígitos' };
  }

  // Verificar que sean solo números
  if (!/^\d+$/.test(cedula)) {
    return { isValid: false, message: 'La cédula debe contener solo números' };
  }

  // Verificar código de provincia (01-24, 30)
  const provincia = parseInt(cedula.substring(0, 2));
  const provinciasValidas = new Set([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 30
  ]);

  if (!provinciasValidas.has(provincia)) {
    return { 
      isValid: false, 
      message: 'Código de provincia inválido. Debe ser entre 01-24 o 30 para ecuatorianos en el exterior' 
    };
  }

  // Algoritmo de validación
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const verificador = parseInt(cedula.charAt(9));
  
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.charAt(i)) * coeficientes[i];
    if (valor > 9) {
      valor -= 9;
    }
    suma += valor;
  }

  const digitoVerificador = (suma % 10 === 0) ? 0 : 10 - (suma % 10);
  
  if (verificador !== digitoVerificador) {
    return { 
      isValid: false, 
      message: 'Dígito verificador inválido. La cédula no cumple con el algoritmo de validación' 
    };
  }

  return { isValid: true };
};

/**
 * Validador de teléfono ecuatoriano (fijo o móvil)
 * @param telefono Número de teléfono a validar
 * @returns boolean
 */
export const validateTelefono = (telefono: string): boolean => {
  // Eliminar espacios, guiones y paréntesis
  const numeroLimpio = telefono.replace(/[\s\-\(\)]/g, '');

  // Verificar longitud (10 dígitos incluyendo código de área)
  if (numeroLimpio.length !== 10) {
    return false;
  }

  // Verificar que sean solo números
  if (!/^\d+$/.test(numeroLimpio)) {
    return false;
  }

  // Validar teléfono fijo
  const codigosArea = ['02', '03', '04', '05', '06', '07'];
  const codigoFijo = numeroLimpio.substring(0, 2);
  
  // Validar celular
  const codigosCelular = ['91', '92', '93', '94', '95', '96', '97', '98', '99'];
  const codigoCelular = numeroLimpio.substring(1, 3);

  // Debe ser un número fijo válido o un celular válido
  return (
    (codigosArea.includes(codigoFijo) && numeroLimpio[0] === '0') || // Fijo
    (numeroLimpio[0] === '0' && numeroLimpio[1] === '9' && codigosCelular.includes(codigoCelular)) // Celular
  );
};

/**
 * Validador de matrícula de vehículo ecuatoriano
 * @param matricula Número de matrícula a validar
 * @returns boolean
 */
export const validateMatricula = (matricula: string): boolean => {
  // Formato esperado: ABC-1234
  const formatoMatricula = /^[A-Z]{3}-\d{3,4}$/;
  if (!formatoMatricula.test(matricula)) {
    return false;
  }

  // Validar primera letra (provincia)
  const provincias: { [key: string]: string } = {
    'A': 'Azuay',
    'B': 'Bolívar',
    'U': 'Cañar',
    'C': 'Carchi',
    'X': 'Cotopaxi',
    'H': 'Chimborazo',
    'O': 'El Oro',
    'E': 'Esmeraldas',
    'W': 'Galápagos',
    'G': 'Guayas',
    'I': 'Imbabura',
    'L': 'Loja',
    'R': 'Los Ríos',
    'M': 'Manabí',
    'V': 'Morona Santiago',
    'N': 'Napo',
    'S': 'Pastaza',
    'P': 'Pichincha',
    'K': 'Sucumbíos',
    'Q': 'Orellana',
    'T': 'Tungurahua',
    'Z': 'Zamora Chinchipe',
    'Y': 'Santa Elena'
  };

  const provincia = matricula.charAt(0);
  if (!provincias[provincia]) {
    return false;
  }

  // Validar segunda letra (tipo de vehículo)
  const tiposVehiculo: { [key: string]: string } = {
    'A': 'Comercial',
    'E': 'Gubernamental',
    'X': 'Uso Oficial',
    'M': 'Municipal',
    'Z': 'Internacional',
    'S': 'Gobierno Provincial'
  };

  // Si es comercial o gubernamental, validar la segunda letra
  if (['A', 'E', 'X', 'M', 'Z', 'S'].includes(matricula.charAt(1))) {
    const tipoVehiculo = matricula.charAt(1);
    if (!tiposVehiculo[tipoVehiculo]) {
      return false;
    }
  }

  return true;
};

/**
 * Validar múltiples matrículas
 * @param matriculas Array de matrículas a validar
 * @returns boolean
 */
export const validateMatriculas = (matriculas: string[]): boolean => {
  return matriculas.every(matricula => validateMatricula(matricula));
}; 