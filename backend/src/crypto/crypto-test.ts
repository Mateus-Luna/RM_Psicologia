import { config } from 'dotenv';
import { CryptoService } from './crypto.service';

config();

const cryptoService = new CryptoService();

const original = 'Informação psicológica confidencial';

console.log('Texto original:');
console.log(original);

const encrypted = cryptoService.encrypt(original);

console.log('\nTexto criptografado:');
console.log(encrypted);

const decrypted = cryptoService.decrypt(encrypted);

console.log('\nTexto descriptografado:');
console.log(decrypted);

console.log('\nResultado do teste:');
console.log(
  original === decrypted
    ? '✅ SUCESSO: o texto original foi recuperado.'
    : '❌ ERRO: o texto descriptografado é diferente.',
);