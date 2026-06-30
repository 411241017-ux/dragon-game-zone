const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
files.forEach(f => {
    const content = fs.readFileSync(f, 'utf-8');
    const matches = content.match(/<div class="item-option">[\s\S]*?<\/div>/g);
    if (matches) {
        console.log('\n--- ' + f + ' ---');
        matches.forEach(m => {
            const nameMatch = m.match(/<span>(.*?)<\/span>/);
            const priceMatch = m.match(/<small>(.*?)<\/small>/);
            if (nameMatch && priceMatch) console.log(nameMatch[1] + ' : ' + priceMatch[1]);
        });
    }
});
