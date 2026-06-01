import { cpSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const root = process.cwd()

// Ensure target directories exist
const staticDest = join(root, '.next/standalone/.next/static')
const publicDest = join(root, '.next/standalone/public')

if (!existsSync(staticDest)) {
  mkdirSync(staticDest, { recursive: true })
}

if (!existsSync(publicDest)) {
  mkdirSync(publicDest, { recursive: true })
}

// Copy .next/static → .next/standalone/.next/static
cpSync(
  join(root, '.next/static'),
  staticDest,
  { recursive: true }
)
console.log('✓ Copied .next/static to standalone')

// Copy public → .next/standalone/public
cpSync(
  join(root, 'public'),
  publicDest,
  { recursive: true }
)
console.log('✓ Copied public to standalone')

console.log('✓ Standalone build ready')
