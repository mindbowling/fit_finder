import fs from 'fs'
import path from 'path'

const imageDirectory = path.join(process.cwd(), 'public/productImages')
const imageFilenames = fs.readdirSync(imageDirectory)

const images = imageFilenames.filter(file => {
  return file.match(/\.(jpg|jpeg|png|gif)$/i)
})

export default images