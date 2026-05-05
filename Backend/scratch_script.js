const fs = require('fs');
const path = require('path');

const slicesDir = 'c:\\Users\\Sravani\\Desktop\\App\\MyApplication\\src\\store\\slices';

fs.readdirSync(slicesDir).forEach(file => {
  if (file.endsWith('.ts')) {
    const filePath = path.join(slicesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('10.0.2.2')) {
      content = content.replace(/10\.0\.2\.2/g, 'localhost');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
});
console.log('Done fixing URLs');
