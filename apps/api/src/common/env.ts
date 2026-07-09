/**
 * dotenv turns a blank line (`NAME=`) into "", not undefined, so `??` would let
 * it through: a blank STORAGE_LOCAL_DIR would silently write PDFs to the CWD.
 * Treat empty/whitespace as absent everywhere.
 */
export function readEnv(env: NodeJS.ProcessEnv, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}
