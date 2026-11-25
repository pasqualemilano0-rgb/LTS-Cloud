// Synthetic backup lab; no remote access or production data.
import {createCipheriv, createDecipheriv, randomBytes} from 'node:crypto';
const MAGIC=Buffer.from('LTSB1');
const MAX=1024*1024;
const HEADER=MAGIC.length+12+16;
function checkKey(key){if(!Buffer.isBuffer(key)||key.length!==32)throw Error('Invalid key')}
export function encryptBackup(data,key){
  checkKey(key);
  if(!Buffer.isBuffer(data)||data.length===0||data.length>MAX)throw Error('Invalid backup size');
  const iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',key,iv,{authTagLength:16});
  cipher.setAAD(MAGIC);
  const ciphertext=Buffer.concat([cipher.update(data),cipher.final()]);
  return Buffer.concat([MAGIC,iv,cipher.getAuthTag(),ciphertext]);
}
export function restoreBackup(blob,key){
  checkKey(key);
  if(!Buffer.isBuffer(blob)||blob.length<=HEADER||blob.length>HEADER+MAX||!blob.subarray(0,MAGIC.length).equals(MAGIC))throw Error('Invalid backup format');
  const iv=blob.subarray(MAGIC.length,MAGIC.length+12);
  const tag=blob.subarray(MAGIC.length+12,HEADER);
  const decipher=createDecipheriv('aes-256-gcm',key,iv,{authTagLength:16});
  decipher.setAAD(MAGIC);decipher.setAuthTag(tag);
  // Never expose partial plaintext before authentication succeeds.
  try{return Buffer.concat([decipher.update(blob.subarray(HEADER)),decipher.final()])}
  catch{throw Error('Backup authentication failed')}
}
