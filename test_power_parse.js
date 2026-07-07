import * as cheerio from 'cheerio';
import fs from 'fs';

try {
  const html = fs.readFileSync('xspower.html', 'utf-8');
  const $ = cheerio.load(html);

  const boxes = $('div.box-ketqua');
  console.log('Total box-ketqua found in xspower.html:', boxes.length);

  boxes.each((i, el) => {
    const titleText = $(el).find('h2').text().trim();
    const drawNumText = $(el).find('td.kmt').text().trim();
    const drawNumMatch = drawNumText.match(/#(\d+)/);
    const drawNum = drawNumMatch ? drawNumMatch[1] : '';

    // Get date from KMT link href
    const kmtLink = $(el).find('td.kmt a').attr('href') || '';
    const dateMatch = kmtLink.match(/ngay-([\d-]+)/);
    let dateStr = '';
    if (dateMatch) {
      const dParts = dateMatch[1].split('-');
      if (dParts.length === 3) {
        dateStr = `${dParts[2]}-${dParts[1].padStart(2, '0')}-${dParts[0].padStart(2, '0')}`;
      }
    }

    const numbersText = $(el).find('td.megaresult em').text().trim();
    const numbers = numbersText.split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0);

    // Get JP2 for Power 6/55
    const jp2Text = $(el).find('tr.jp2 td.megaresult').text().trim();
    const jp2Num = parseInt(jp2Text, 10);

    console.log(`Box ${i} - Draw #${drawNum}: Date: ${dateStr}, Numbers: ${JSON.stringify(numbers)}, JP2: ${jp2Num || 'none'}`);
  });

} catch (e) {
  console.error(e);
}
