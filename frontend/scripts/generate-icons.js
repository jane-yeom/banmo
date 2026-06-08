const sharp = require('sharp')
const path = require('path')

async function generateIcons() {
  const input = path.join(__dirname, '../public/banmo-logo.png')

  await sharp(input)
    .resize(192, 192, { fit: 'contain', background: { r: 247, g: 244, b: 237, alpha: 1 } })
    .png()
    .toFile(path.join(__dirname, '../public/icon-192.png'))
  console.log('✅ icon-192.png 생성 완료')

  await sharp(input)
    .resize(512, 512, { fit: 'contain', background: { r: 247, g: 244, b: 237, alpha: 1 } })
    .png()
    .toFile(path.join(__dirname, '../public/icon-512.png'))
  console.log('✅ icon-512.png 생성 완료')

  await sharp(input)
    .resize(180, 180, { fit: 'contain', background: { r: 247, g: 244, b: 237, alpha: 1 } })
    .png()
    .toFile(path.join(__dirname, '../public/apple-touch-icon.png'))
  console.log('✅ apple-touch-icon.png 생성 완료')

  await sharp(input)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '../public/favicon-32.png'))
  console.log('✅ favicon-32.png 생성 완료')
}

generateIcons().catch(console.error)
