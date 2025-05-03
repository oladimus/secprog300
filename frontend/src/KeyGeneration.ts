import { API_URL } from "./constants";
import { openDB } from 'idb'
import { Message } from "./types";
import { getCsrfToken } from "./utils";

// Derive encryption key from password with PBKDF2
export async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  )
  // https://developer.mozilla.org/en-US/docs/Web/API/Pbkdf2Params
  // https://developer.mozilla.org/en-US/docs/Web/API/AesKeyGenParams
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 600_000,
      hash: 'SHA-256'
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  )
}

// Encrypt a private key (JWK form) before storing it
export async function encryptPrivateKey(privJwk: JsonWebKey, password: string) {
  const enc = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12)) // 96 bit iv
  const salt = crypto.getRandomValues(new Uint8Array(16))

  const key = await deriveKeyFromPassword(password, salt)

  const data = enc.encode(JSON.stringify(privJwk))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data,
  )

  return {
    ciphertext: new Uint8Array(encrypted),
    iv,
    salt
  }
}

// Decrypt a private key with password
export async function decryptPrivateKey(
  ciphertext: Uint8Array, key: CryptoKey,
  iv: Uint8Array): Promise<JsonWebKey> {
  const dec = new TextDecoder()
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  )
  return JSON.parse(dec.decode(decrypted))
}


// Generate initial keypair for the user, only once
export async function InitialUserKeyGeneration(userId: number, username: string, password: string) {
  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/generateKey
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey"]
  );

  // create indexedDB storage
  try {
    const db = await openDB('keys-db', 1, {
      upgrade(db) {
        db.createObjectStore('keys')
      }
    })
    // Get private key in jwk format
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey)

    // Encrypt the private key with user given password
    const encryptedPrivateKeyJwk = await encryptPrivateKey(privateKeyJwk, password)

    // Put the encrypted key in indexedDB
    await db.put('keys', {
      ciphertext: Array.from(encryptedPrivateKeyJwk.ciphertext),
      iv: Array.from(encryptedPrivateKeyJwk.iv),
      salt: Array.from(encryptedPrivateKeyJwk.salt)
    }, `privatekey-${userId}-${username}`)

  } catch (error) {
    console.log(error)
  }

  // Send public key to backend JWK = JSON WEB KEY format
  const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);

  try {
    const res = await fetch(API_URL + "/api/user/update/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfToken(),
      },
      credentials: "include",
      body: JSON.stringify({
        "update_what": "e2ee_public_key",
        "value": publicKeyJwk
      })
    })
    const data = await res.json()
    console.log(data.detail)
  } catch (error) {
    console.log(error)
  }

}
// Convert from Jwk to cryptokey
export async function convertPublicKey(receiverPublicKey: JsonWebKey) {

  if (!receiverPublicKey) {
    console.log("Error: receiverPublicKey is null. Wrong password?")
    return
  }
  const importedReceiverPubKey = await crypto.subtle.importKey(
    'jwk',
    receiverPublicKey,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  )

  return importedReceiverPubKey
}

// Get users private key from IndexedDB
export async function getPrivateKey(userId: number, username: string, encryptionKey: CryptoKey) {
  try {
    const db = await openDB('keys-db', 1)
    const stored = await db.get('keys', `privatekey-${userId}-${username}`)

    const privateKeyJwk = await decryptPrivateKey(
      new Uint8Array(stored.ciphertext),
      encryptionKey,
      new Uint8Array(stored.iv)
    )

    const privateKey = await crypto.subtle.importKey(
      'jwk',
      privateKeyJwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey'])
    return privateKey
  } catch (error) {
    console.log(error)
  }
}

// Generate shared secret key from senders private key and receivers public key
export async function genSharedKey(senderPrivKey: CryptoKey, receiverPubKey: CryptoKey) {
  if (!senderPrivKey || !receiverPubKey) {
    console.log("Error: senderPrivKey or receiverPubKey is null")
    return
  }
  // Derive a shared secret key using ECDH
  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey
  const sharedSecret = await crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: receiverPubKey,
    },
    senderPrivKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  )

  return sharedSecret
}

// Convert encrypted message (arrayBuffer) into base64 string to store the encrypted msg
// in the database
export function arrayBufferToBase64(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}

// Convert from base64 string back to arrayBuffer to decrypt the message later
export function base64ToArrayBuffer(base64: string) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

// Function for decrypting the messages with secret shared key
export async function decryptMessages(messages: Message[], sharedKey: CryptoKey) {
  // For debugging
  // const rawKey = await crypto.subtle.exportKey("raw", sharedKey);
  // console.log(arrayBufferToBase64(rawKey))
  const dec = new TextDecoder()
  const decryptedMessages = await Promise.all(
    messages.map(async (msg) => {
      const encryptedBuffer = base64ToArrayBuffer(msg.content)
      const ivBuffer = base64ToArrayBuffer(msg.iv)
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBuffer
        },
        sharedKey,
        encryptedBuffer
      )
      msg.content = dec.decode(decrypted)
      return msg
    }))

  return decryptedMessages
}