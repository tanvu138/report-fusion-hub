const puppeteer = require('puppeteer');
const { marked } = require('marked');
const fs = require('fs');
const path = require('path');

function transformContentForExport(content, reportId) {
  if (!content) return content;

  return content.replace(
    /@resource:report-image:([^:]+):([^)\s]+)/g,
    (match, rId, filename) => {
      try {
        if (rId === reportId) {
          // Get the encrypted file path to verify existence
          const encryptedPath = path.join(__dirname, '..', 'secure_uploads', 'report_images', reportId, filename);
          
          if (fs.existsSync(encryptedPath)) {
            // Instead of embedding, create a text placeholder
            return `[📷 Image: ${filename}]`;
          } else {
            console.warn(`Image file not found for export: ${encryptedPath}`);
            return `[Image not found: ${filename}]`;
          }
        }
        // Cross-report references are not supported in export
        return '[Cross-report image reference not supported in export]';
      } catch (error) {
        console.warn(`Failed to resolve resource for export: ${match}`, error);
        return '[Resource not found]';
      }
    }
  );
}

(async () => {
  let browser = null;
  
  try {
    // Simulate report data with potential problematic content
    const reportData = {
      id: 'test-report-123',
      title: 'Test Report with Special Characters & <HTML> "Quotes"',
      cycle: 'MONTHLY',
      sections: [
        {
          contentMarkdown: '# Test Section\n\nThis contains @resource:report-image:test-report-123:image.png and some **bold text**.\n\n- List item 1\n- List item 2\n\n> Blockquote here',
          department: { name: 'IT Department' }
        },
        {
          contentMarkdown: '## Another Section\n\nMore content here with `code` and [links](http://example.com)',
          department: { name: 'Finance Department' }
        }
      ]
    };

    console.log('Starting debug export test...');
    
    // Prepare Markdown content
    let markdownContent = `# ${reportData.title}\n\n`;
    markdownContent += `Report cycle: ${reportData.cycle.charAt(0) + reportData.cycle.slice(1).toLowerCase()}\n\n`;
    markdownContent += '---\n\n';

    // Group sections by department (simplified)
    const sectionsByDept = reportData.sections.reduce((acc, section) => {
      const deptName = section.department.name;
      if (!acc[deptName]) {
        acc[deptName] = [];
      }
      acc[deptName].push(section);
      return acc;
    }, {});

    // Generate Markdown for each department and its sections
    Object.entries(sectionsByDept).forEach(([deptName, sections]) => {
      markdownContent += `## ${deptName}\n\n`;
      sections.forEach(section => {
        if (section.contentMarkdown) {
          // Transform resource identifiers
          const exportContent = transformContentForExport(section.contentMarkdown, reportData.id);
          markdownContent += `${exportContent}\n\n`;
          markdownContent += '---\n\n';
        }
      });
    });

    console.log('Generated markdown content (first 200 chars):');
    console.log(markdownContent.substring(0, 200) + '...');

    // Convert Markdown to HTML
    console.log('Converting markdown to HTML...');
    const htmlContent = marked(markdownContent);
    console.log('HTML conversion successful');
    
    // Read HTML template
    const templatePath = './templates/pdfTemplate.html';
    if (!fs.existsSync(templatePath)) {
      console.error('Template not found at:', templatePath);
      return;
    }
    
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    console.log('Template loaded successfully');
    
    // Replace template variables with proper escaping (exact same logic as controller)
    htmlTemplate = htmlTemplate
      .replace(/{{title}}/g, reportData.title.replace(/[<>&"']/g, (char) => {
        const escapeMap = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
        return escapeMap[char];
      }))
      .replace(/{{cycle}}/g, reportData.cycle.charAt(0) + reportData.cycle.slice(1).toLowerCase())
      .replace(/{{generatedDate}}/g, new Date().toLocaleDateString())
      .replace(/{{content}}/g, htmlContent);

    console.log('Template variables replaced successfully');
    console.log('Final HTML size:', htmlTemplate.length, 'characters');

    // Launch Puppeteer with exact same settings as controller
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-client-side-phishing-detection',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--disable-translate',
        '--metrics-recording-only',
        '--no-default-browser-check',
        '--no-pings',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-component-extensions-with-background-pages',
        '--disable-blink-features=AutomationControlled',
        '--memory-pressure-off'
      ],
      timeout: 30000
    });

    console.log('Browser launched successfully');

    const page = await browser.newPage();
    
    // Set viewport and optimize for PDF
    await page.setViewport({ width: 794, height: 1123 }); // A4 size in pixels
    
    // Set content with memory-efficient loading
    await page.setContent(htmlTemplate, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('Content set in page successfully');

    // Generate PDF with exact same settings as controller
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in'
      },
      printBackground: false,
      displayHeaderFooter: false,
      preferCSSPageSize: false,
      timeout: 30000,
      omitBackground: true,
      tagged: false,
      outline: false
    });

    // Close browser
    await browser.close();
    browser = null;

    // Validate PDF buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF generation failed: empty buffer');
    }

    const pdfSizeKB = pdfBuffer.length / 1024;
    console.log(`PDF generated successfully: ${pdfSizeKB.toFixed(1)}KB`);

    // Check PDF validity
    const header = String.fromCharCode(...pdfBuffer.slice(0, 4));
    console.log('PDF header:', header);
    
    if (header !== '%PDF') {
      console.error('INVALID PDF HEADER!');
      console.log('First 20 bytes:', Array.from(pdfBuffer.slice(0, 20)));
    } else {
      console.log('✓ PDF header is valid');
    }

    // Write to file for testing
    fs.writeFileSync('/tmp/debug_export.pdf', pdfBuffer);
    console.log('Debug PDF written to /tmp/debug_export.pdf');

    // Test if file can be opened
    console.log('Testing file validity...');
    const testBuffer = fs.readFileSync('/tmp/debug_export.pdf');
    const testHeader = String.fromCharCode(...testBuffer.slice(0, 4));
    console.log('File read back header:', testHeader);
    
  } catch (error) {
    console.error('Error in debug export:', error.message);
    console.error('Stack:', error.stack);
    
    // Clean up browser if it exists
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Failed to close browser:', closeError);
      }
    }
  }
})();