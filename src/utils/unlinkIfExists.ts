import { resolve } from 'node:path'
import { readdirSync, unlinkSync } from 'node:fs'

export function unlinkIfExists(path: string, file: string) {
  if (!readdirSync(path).includes(file)) return
  // limpa o arquivo de teste antes de começar
  // isso garante que sempre vamos ter um único registro
  unlinkSync(resolve(path, file))
}
