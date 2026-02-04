import { customAlphabet } from 'nanoid'

// Crear un nanoid personalizado con caracteres URL-safe
// Longitud de 10 caracteres para URLs cortas pero únicas
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
export const generateEventId = customAlphabet(alphabet, 10)
