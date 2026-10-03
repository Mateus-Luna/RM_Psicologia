const crypto = require('crypto');
const fs = require('fs');

const privateKey = fs.readFileSync('./electron/license/private.pem');
const publicKey = fs.readFileSync('./electron/license/public.pem');

const data = 'teste-de-assinatura';

const signer = crypto.createSign('RSA-SHA256');
signer.update(data);
signer.end();

const signature = signer.sign(privateKey);

const verifier = crypto.createVerify('RSA-SHA256');
verifier.update(data);
verifier.end();

console.log('Assinatura válida:', verifier.verify(publicKey, signature));
