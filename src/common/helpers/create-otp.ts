import { randomBytes } from 'crypto';

export default function createOTP(): Promise<string> {
  return new Promise((resolve, reject) => {
    randomBytes(4, (er, buf) => {
      if (er) {
        reject(er);
        return;
      }
      const hex = buf.toString('hex');
      const otp = parseInt(hex, 16);
      resolve(otp.toString().substr(0, 6));
    });
  });
}
