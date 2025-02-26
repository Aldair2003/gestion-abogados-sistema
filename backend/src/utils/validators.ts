export const validateCedula = (cedula: string): boolean => {
  // Validación básica: 10 dígitos
  if (!/^\d{10}$/.test(cedula)) return false;

  // Algoritmo de validación de cédula ecuatoriana
  const provincia = parseInt(cedula.substring(0, 2));
  if (provincia < 1 || provincia > 24) return false;

  const tercerDigito = parseInt(cedula.charAt(2));
  if (tercerDigito < 0 || tercerDigito > 6) return false;

  // Validación con algoritmo módulo 10
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.charAt(i)) * coeficientes[i];
    suma += valor > 9 ? valor - 9 : valor;
  }

  const digitoVerificador = suma % 10 ? 10 - (suma % 10) : 0;
  return digitoVerificador === parseInt(cedula.charAt(9));
};

export const validatePhone = (phone: string): boolean => {
  // Validar formato de teléfono
  return /^09\d{8}$/.test(phone);
}; 