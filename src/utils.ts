import { createHash, randomBytes } from 'node:crypto';

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function hash(input: string, length = 16): string {
  return createHash('sha256').update(input).digest('hex').slice(0, length);
}

export function ulid(seed = `${Date.now()}:${randomBytes(8).toString('hex')}`): string {
  const digest = createHash('sha256').update(seed).digest();
  let out = '';
  for (let i = 0; out.length < 26; i += 1) {
    out += CROCKFORD[digest[i % digest.length]! % CROCKFORD.length];
  }
  return out;
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

export function sameUtcDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

export function deterministicCode(seed: string, length = 8): string {
  const digest = createHash('sha256').update(seed).digest();
  let code = '';
  for (let i = 0; code.length < length; i += 1) {
    code += CROCKFORD[digest[i % digest.length]! % CROCKFORD.length];
  }
  return code;
}

export function hasBlockedText(input: string, blocked: string[]): boolean {
  const normalized = input.toLowerCase();
  return blocked.some((term) => normalized.includes(term.toLowerCase()));
}
