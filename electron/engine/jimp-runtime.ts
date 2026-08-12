import * as JimpNamespace from "jimp";

type JimpStatic = typeof JimpNamespace;

/**
 * `import * as Jimp from "jimp"` compila, mas no runtime ESM do processo main o namespace
 * só carrega `default` — os estáticos (`read`, `MIME_PNG`) ficam pendurados nele.
 * Sem este alias, `Jimp.read(...)` e `Jimp.MIME_PNG` chegam `undefined` em produção
 * mesmo com build e type-check limpos.
 */
export const jimp: JimpStatic = (JimpNamespace as unknown as { default?: JimpStatic }).default ?? JimpNamespace;

/** Literais em vez de `Jimp.MIME_*` pelo mesmo motivo acima. */
export const MIME_PNG = "image/png";
export const MIME_JPEG = "image/jpeg";
/** `Jimp.AUTO` — mantém a proporção no resize. */
export const JIMP_AUTO = -1;
