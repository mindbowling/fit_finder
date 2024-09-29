const fs = require('fs');
const path = require('path');

const imageDirectory = path.join(process.cwd(), 'public', 'productImages');
const outputFile = path.join(process.cwd(), 'src', 'utils', 'imageList.json');

const imageFilenames = fs.readdirSync(imageDirectory);

const images = imageFilenames.filter(file => {
  return file.match(/\.(jpg|jpeg|png|gif)$/i);
});

fs.writeFileSync(outputFile, JSON.stringify(images, null, 2));

console.log(`Image list generated with ${images.length} images.`);