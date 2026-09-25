const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function rand(n: number): string {
  let out = '';
  for (let i = 0; i < n; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

export const newOrderId = () => `PO-${rand(6)}`;
export const newTradeId = () => `TR-${rand(6)}`;
