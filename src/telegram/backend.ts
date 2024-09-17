import { Transaction, VersionedTransaction } from '@solana/web3.js';

export async function verifyAndGetPublicKey(endpoint: string, initDataRaw: string): Promise<string | null> {
  const response = await fetch(endpoint + '/getPublicKey', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ verification: `tma ${initDataRaw}` }), // Pass the user data to backend
  });
  // Check if the response is ok
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  if (data?.publicKey) {
    return (data.publicKey || null) as string | null; // Return the public key
  }
  return null;
}

export async function createPublicKey(endpoint: string, initDataRaw: string): Promise<string | null> {
  const response = await fetch(endpoint + '/createPublicKey', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ verification: `tma ${initDataRaw}` }), // Pass the user data to backend
  });
  // Check if the response is ok
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  if (data?.publicKey) {
    return data.publicKey || (null as string | null); // Return the public key
  }
  return null;
}

// Custom signing logic, you can implement this as an API call to your backend that handles signing
export async function signTransactionOnBackend<T extends Transaction | VersionedTransaction>(
  endpoint: string,
  transaction: T[],
  initDataRaw: string,
): Promise<T[]> {
  // Implement signing logic, for instance by sending the transaction to the backend and getting it signed
  const response = await fetch(endpoint + '/signTransaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      verification: `tma ${initDataRaw}`,
      txs: transaction.map((x) => Buffer.from(x.serialize()).toString('base64')),
    }), // Pass the user data to backend
  });
  // Check if the response is ok
  if (!response.ok) {
    throw new Error(`Backend response error: ${response.statusText}`);
  }
  const data = (await response.json()) as string[];
  return data.map((x) => VersionedTransaction.deserialize(Buffer.from(x, 'base64'))) as T[];
}

export async function signMessageOnBackend(
  endpoint: string,
  message: Uint8Array,
  initDataRaw: string,
): Promise<Uint8Array> {
  // Implement message signing logic, for example by interacting with a backend service
  const response = await fetch(endpoint + '/signMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      verification: `tma ${initDataRaw}`,
      msg: Buffer.from(message).toString('base64'),
    }), // Pass the user data to backend
  });
  // Check if the response is ok
  if (!response.ok) {
    throw new Error(`Backend response error: ${response.statusText}`);
  }
  const data = (await response.json()) as string;
  return Uint8Array.from(Buffer.from(data, 'base64'));
}
