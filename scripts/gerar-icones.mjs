// Gera ícones PNG para o PWA usando Canvas API via @napi-rs/canvas
// Roda com: node scripts/gerar-icones.mjs

import { createCanvas } from '@napi-rs/canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const OUT   = join(process.cwd(), 'public', 'icons')
mkdirSync(OUT, { recursive: true })

function gerarIcone(size) {
  const canvas = createCanvas(size, size)
  const ctx    = canvas.getContext('2d')

  // Fundo escuro com gradiente
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, '#1a1a2e')
  grad.addColorStop(1, '#16213e')
  ctx.fillStyle = grad
  // Arredondado
  const r = size * 0.2
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fill()

  // Círculo vermelho centralizado
  const cx = size / 2
  const cy = size / 2
  const cr = size * 0.32
  ctx.beginPath()
  ctx.arc(cx, cy, cr, 0, Math.PI * 2)
  ctx.fillStyle = '#e94560'
  ctx.fill()

  // Emoji ⚔️ centralizado
  const fontSize = size * 0.35
  ctx.font       = `${fontSize}px serif`
  ctx.textAlign  = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('⚔️', cx, cy + fontSize * 0.05)

  return canvas.toBuffer('image/png')
}

for (const size of SIZES) {
  const buf  = gerarIcone(size)
  const path = join(OUT, `icon-${size}x${size}.png`)
  writeFileSync(path, buf)
  console.log(`✓ icon-${size}x${size}.png`)
}

console.log('\n✅ Ícones gerados em public/icons/')
