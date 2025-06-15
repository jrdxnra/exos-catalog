# Product Catalog

A modern, responsive product catalog application built with React. This application allows users to browse and filter products, with a focus on preferred items and easy navigation.

## Features

- Responsive design that works on all devices
- Sidebar navigation with categories and brands
- Search functionality
- Preferred items highlighting
- Copy product information with one click
- Direct links to product websites
- Clean, modern UI inspired by major e-commerce sites

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Google Sheet with product data (see Setup section)

## Setup

1. Clone the repository:
```bash
git clone [your-repository-url]
cd product-catalog
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a Google Sheet with the following columns:
   - item name
   - brand
   - category
   - cost
   - exos part number
   - url
   - preferred (yes/no)

4. Set up Google Apps Script:
   - Create a new Google Apps Script project
   - Copy the following code:

```javascript
function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const products = data.slice(1).map(row => {
    const product = {};
    headers.forEach((header, index) => {
      product[header] = row[index];
    });
    return product;
  });
  return ContentService.createTextOutput(JSON.stringify(products))
    .setMimeType(ContentService.MimeType.JSON);
}
```

5. Deploy the Google Apps Script as a web app:
   - Set "Execute as" to "Me"
   - Set "Who has access" to "Anyone"
   - Copy the deployment URL

6. Update the fetch URL in `src/App.js` with your Google Apps Script deployment URL.

## Development

To start the development server:

```bash
npm start
# or
yarn start
```

The application will be available at `http://localhost:3000`.

## Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

This will create a `build` folder with optimized production files.

## Deployment

### Option 1: GitHub Pages

1. Add `homepage` field to `package.json`:
```json
{
  "homepage": "https://[your-username].github.io/product-catalog"
}
```

2. Install gh-pages:
```bash
npm install --save-dev gh-pages
# or
yarn add --dev gh-pages
```

3. Add deployment scripts to `package.json`:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

4. Deploy:
```bash
npm run deploy
# or
yarn deploy
```

### Option 2: Netlify

1. Create a `netlify.toml` file in the root:
```toml
[build]
  command = "npm run build"
  publish = "build"
```

2. Connect your repository to Netlify
3. Deploy through Netlify's dashboard

### Option 3: Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

## Environment Variables

Create a `.env` file in the root directory:

```
REACT_APP_API_URL=your_google_script_url
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- React.js
- Google Apps Script
- Modern CSS features
- Best Buy's UI inspiration