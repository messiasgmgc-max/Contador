/**
 * SHA-256 para a senha/PIN de perfil.
 *
 * Implementação própria, sem depender de `crypto.subtle`, porque o mesmo bundle
 * roda em três contextos diferentes (navegador, Electron em file:// e Capacitor
 * em capacitor://) e a Web Crypto não está garantida em todos.
 *
 * LIMITE DESTA PROTEÇÃO — leia antes de confiar nela:
 * isto é uma tranca local, não autenticação. A conferência acontece no
 * dispositivo, não no banco. Serve para o perfil da Cacá não abrir o seu por
 * engano; NÃO impede quem tenha a chave anônima do Supabase de ler os dados
 * direto pela API. Para isso é preciso Supabase Auth — ver
 * supabase_rls_hardening.sql.
 */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

function sha256Bytes(data: Uint8Array): string {
  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);

  const bitLen = data.length * 8;
  // mensagem + 0x80 + zeros até 56 mod 64 + 8 bytes de comprimento
  const padded = new Uint8Array((((data.length + 8) >> 6) + 1) * 64);
  padded.set(data);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, bitLen >>> 0, false);
  view.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000), false);

  const w = new Uint32Array(64);

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = H;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g; g = f; f = e;
      e = (d + temp1) >>> 0;
      d = c; c = b; b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }

  return Array.from(H, (x) => x.toString(16).padStart(8, '0')).join('');
}

export function sha256(text: string): string {
  return sha256Bytes(new TextEncoder().encode(text));
}

/**
 * Hash da senha de um perfil.
 *
 * O SAL É O ID DO PERFIL, não o nome. Antes o sal era o nome, e trocar o nome
 * do perfil invalidava a senha guardada — a pessoa ficava trancada para fora
 * sem ter mudado a senha. O id nunca muda, então renomear é inofensivo.
 */
export function hashPassword(saltKey: string, password: string): string {
  return sha256(`fluxo-financeiro:v1:${saltKey.trim().toLowerCase()}:${password}`);
}

/** Identificação mínima de perfil de que a conferência de senha precisa. */
export interface HashableProfile {
  id: string;
  name: string;
  passwordHash?: string;
}

/** Hash atual (v2, salgado com o id) da senha de um perfil. */
export function profileHash(user: HashableProfile, password: string): string {
  return hashPassword(user.id, password);
}

/**
 * Confere a senha digitada contra o que está guardado.
 *
 * Aceita três formatos, do mais novo para o mais antigo:
 *   v2  — SHA-256 salgado com o id do perfil (o que o app grava hoje)
 *   v1  — SHA-256 salgado com o nome do perfil
 *   v0  — senha em texto puro dentro de avatar_color
 * Assim ninguém fica trancado para fora depois da migração; o app regrava no
 * formato v2 no primeiro login bem-sucedido.
 */
export function verifyPassword(user: HashableProfile, typed: string): boolean {
  const stored = user.passwordHash;
  if (!stored) return true;
  if (stored === hashPassword(user.id, typed)) return true;
  if (stored === hashPassword(user.name, typed)) return true; // sal antigo: o nome
  return stored === typed; // senha legada em texto puro
}

/** true quando o hash guardado não está no formato v2 e precisa ser regravado. */
export function needsRehash(user: HashableProfile, typed: string): boolean {
  return !!user.passwordHash && user.passwordHash !== hashPassword(user.id, typed);
}
