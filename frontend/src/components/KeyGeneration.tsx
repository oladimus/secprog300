import { API_URL } from "../constants";
import { openDB } from 'idb'
import { Message } from "../types";
import { getCsrfToken } from "../utils";


// Generate initial keypair for the user, only once
export async function InitialUserKeyGeneration(userId: number, username: string) {
  // +
  // https://developer.mozilla.org/en-US/docs/Web/API/EcKeyGenParams
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey"]
  );

  // Store private key in IndexedDB
  // TODO: encrypt the key

  try {
    const db = await openDB('keys-db', 1, {
      upgrade(db) {
        db.createObjectStore('keys')
      }
    })

    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey)

    await db.put('keys', privateKeyJwk, `privatekey-${userId}-${username}`)

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
    console.log("Error: receiverPublicKey is null")
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
export async function getPrivateKey(userId: number, username: string) {
  try {
    const db = await openDB('keys-db', 1)
    const storedKey = await db.get('keys', `privatekey-${userId}-${username}`)

    const privateKey = await crypto.subtle.importKey(
      'jwk',
      storedKey,
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