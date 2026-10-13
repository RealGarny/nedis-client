// encrypted record of a refresh token that's being stored in the IndexDB
interface EncryptedRecord {
  iv: Uint8Array<ArrayBuffer>;
  cipherText: ArrayBuffer;
}

export type { EncryptedRecord };
