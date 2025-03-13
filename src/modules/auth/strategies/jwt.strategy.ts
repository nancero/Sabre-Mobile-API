import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService, configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('auth.jwtSecret'),
      ignoreExpiration: true,
    });
  }

  async validate(payload: JwtPayload) {
    // This is called to validate the user in the token exists
    const user = await this.authService.validateJwtPayload(payload);

    if (user) return user;

    throw new Error('Could not log-in with the provided credentials');
  }
}
