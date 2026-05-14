import type { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse.js';

/**
 * Sección 4 — ContentComplianceValidator
 * Middleware que bloquea claims publicitarios prohibidos por la Ley 2120 de 2021
 * para productos clasificados como NIVEL 2 (con sellos de advertencia).
 *
 * Art. 18 — Prohíbe publicidad de alimentos con sellos dirigida a menores de 12 años.
 * Art. 19 — Restringe el uso de personajes, celebridades o beneficios no comprobables.
 */

// Frases publicitarias prohibidas para productos con sellos (Art. 18 y 19 Ley 2120)
const PROHIBITED_CLAIMS: RegExp[] = [
  // Beneficios de salud no comprobados
  /natural(mente)?/i,
  /saludable/i,
  /nutritivo/i,
  /vitamina(do)?/i,
  /energizante/i,
  /fortalece/i,
  /refuerza.*inmune/i,
  /alto.*proteína/i,
  // Claims dirigidos a menores
  /niño(s)?.*favorito/i,
  /le.*encantará/i,
  /diversión/i,
  /premio/i,
  /recompensa/i,
  /merienda.*ideal/i,
  /lonchera.*perfecta/i,
  // Claims engañosos de bajo contenido
  /bajo.*azúcar/i,
  /sin.*azúcar.*añadida/i,
  /light/i,
  /\bfit\b/i,
  /sin.*grasa.*trans/i, // solo permitido si efectivamente no tiene
  /cero.*calorías/i,
];

/** Campos de texto que deben auditarse */
const AUDITED_FIELDS = ['name', 'description'];

/**
 * Uso: `router.post('/', contentComplianceCheck, controller.create)`
 *
 * Si el body incluye campos de nivel nutricional (nivel 2), valida que
 * name/description no contengan claims prohibidos.
 */
export function contentComplianceCheck(req: Request, res: Response, next: NextFunction): void {
  const body = req.body as Record<string, unknown>;

  // Determinar si el producto tiene sellos (LEVEL_2)
  // Un producto es LEVEL_2 si:
  //   a) viene explícito nutritional_level = LEVEL_2
  //   b) o algún sello está en true
  const hasSeals =
    body.nutritional_level === 'LEVEL_2' ||
    body.seal_sodium === true ||
    body.seal_sugars === true ||
    body.seal_saturated_fat === true ||
    body.seal_trans_fat === true ||
    body.seal_sweeteners === true ||
    body.has_sweeteners === true;

  // Si no tiene sellos o no hay datos nutricionales → pasa
  if (!hasSeals) { next(); return; }

  // Revisar campos de texto
  const violations: string[] = [];
  for (const field of AUDITED_FIELDS) {
    const val = typeof body[field] === 'string' ? (body[field] as string) : '';
    if (!val) continue;
    for (const pattern of PROHIBITED_CLAIMS) {
      if (pattern.test(val)) {
        violations.push(`Campo "${field}": contiene claim publicitario prohibido ("${pattern.source}")`);
        break; // un error por campo es suficiente
      }
    }
  }

  if (violations.length > 0) {
    sendError(
      res,
      `Ley 2120 — Claims publicitarios no permitidos en productos con sellos de advertencia:\n${violations.join('\n')}`,
      422,
    );
    return;
  }

  next();
}

/**
 * Middleware más liviano: solo bloquea si el body EXPLÍCITAMENTE dice has_sweeteners
 * y el nombre/descripción contiene claims prohibidos. Ideal para PATCH parciales.
 */
export function sweetenerContentCheck(req: Request, res: Response, next: NextFunction): void {
  const body = req.body as Record<string, unknown>;
  if (!body.has_sweeteners) { next(); return; }

  const sweetenerClaims = [/natural(mente)?/i, /saludable/i, /cero.*azúcar/i, /sin.*azúcar/i];
  for (const field of AUDITED_FIELDS) {
    const val = typeof body[field] === 'string' ? (body[field] as string) : '';
    for (const pattern of sweetenerClaims) {
      if (pattern.test(val)) {
        sendError(res, `Ley 2120 — Productos con edulcorantes no pueden usar el claim "${pattern.source}"`, 422);
        return;
      }
    }
  }
  next();
}
