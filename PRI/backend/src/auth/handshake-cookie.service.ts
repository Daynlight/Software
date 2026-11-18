import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HANDSHAKE_TTL_SECONDS } from './auth.constants';
import { UsosHandshake } from './auth.types';

const ALGORITHM = 'aes-256-gcm';
const ADDITIONAL_DATA = 'pri-usos-handshake';
const IV_LENGTH = 12;
const HANDSHAKE_TTL_MS = HANDSHAKE_TTL_SECONDS * 1000;

interface SealedHandshake extends UsosHandshake {
  exp: number;
}

@Injectable()
export class HandshakeCookieService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    this.key = createHash('sha256')
      .update(config.get('sessionSecret'))
      .digest();
  }

  seal(handshake: UsosHandshake): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    cipher.setAAD(Buffer.from(ADDITIONAL_DATA));

    const payload: SealedHandshake = {
      ...handshake,
      exp: Date.now() + HANDSHAKE_TTL_MS,
    };
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(payload), 'utf8'),
      cipher.final(),
    ]);

    return [iv, cipher.getAuthTag(), ciphertext]
      .map((part) => part.toString('base64url'))
      .join('.');
  }

  open(value?: string): UsosHandshake | null {
    if (!value) {
      return null;
    }

    const [iv, tag, ciphertext] = value.split('.');

    if (!iv || !tag || !ciphertext) {
      return null;
    }

    try {
      const decipher = createDecipheriv(
        ALGORITHM,
        this.key,
        Buffer.from(iv, 'base64url'),
      );
      decipher.setAAD(Buffer.from(ADDITIONAL_DATA));
      decipher.setAuthTag(Buffer.from(tag, 'base64url'));

      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(ciphertext, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
      const payload = JSON.parse(plaintext) as SealedHandshake;

      return payload.exp > Date.now()
        ? { token: payload.token, secret: payload.secret }
        : null;
    } catch {
      return null;
    }
  }
}
