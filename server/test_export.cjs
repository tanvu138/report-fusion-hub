const puppeteer = require('puppeteer');
const { marked } = require('marked');
const fs = require('fs');

(async () => {
  try {
    // Test the same logic as in exportController
    const markdownContent = '# Test Report\n\nThis is a test section.\n\n## Department A\n\nSample content here.';
    const htmlContent = marked(markdownContent);
    console.log('Markdown processed successfully');
    
    // Read template
    const templatePath = './templates/pdfTemplate.html';
    if (!fs.existsSync(templatePath)) {
      console.error('Template not found at:', templatePath);
      return;
    }
    
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    console.log('Template read successfully');
    
    // Replace variables
    htmlTemplate = htmlTemplate
      .replace(/{{title}}/g, 'Test Report')
      .replace(/{{cycle}}/g, 'Monthly')
      .replace(/{{generatedDate}}/g, new Date().toLocaleDateString())
      .replace(/{{content}}/g, htmlContent);
    
    console.log('Template variables replaced');
    
    // Test PDF generation with this content
    const browser = await puppeteer.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    await page.setContent(htmlTemplate, { waitUntil: 'domcontentloaded' });
    console.log('Content set in browser');
    
    const pdf = await page.pdf({ format: 'A4' });
    console.log('PDF generated, size:', pdf.length, 'bytes');
    
    // Check PDF validity
    const header = String.fromCharCode(...pdf.slice(0, 4));
    console.log('PDF header:', header);
    
    // Write test file
    fs.writeFileSync('/tmp/export_test.pdf', pdf);
    console.log('Export test PDF written to /tmp/export_test.pdf');
    
    await browser.close();
  } catch (error) {
    console.error('Error in export test:', error.message);
    console.error('Stack:', error.stack);
  }
})();