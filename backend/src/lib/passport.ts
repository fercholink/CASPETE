import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from '../config/env.js';
import { loginOrCreateGoogleUser } from '../modules/auth/auth.service.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No se pudo obtener el email de Google'), undefined);
        }
        // Intentar extraer el teléfono si está disponible en _json (requiere scope adicional)
        const phone = (profile as any)._json?.phoneNumbers?.[0]?.value ?? null;
        
        const result = await loginOrCreateGoogleUser({
          google_id: profile.id,
          email,
          full_name: profile.displayName ?? email.split('@')[0],
          avatar_url: profile.photos?.[0]?.value ?? null,
          phone,
        });
        return done(null, result as any);
      } catch (err) {
        return done(err as Error, undefined);
      }
    },
  ),
);

export default passport;
