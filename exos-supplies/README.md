# Exos Supplies - Modern Equipment Management

A modern, Sprouts-inspired equipment management system for EXO gyms built with Next.js 15, TypeScript, and Firebase.

## 🎯 Features

- **Search-First Experience**: Intuitive search with real-time filtering
- **Category Navigation**: Horizontal scrolling categories for easy browsing  
- **Sprouts-Inspired UX**: Clean product cards with "+" buttons for quick adding
- **Cart System**: Per-gym cart management with quantity tracking
- **Mobile-First Design**: Responsive design optimized for coaches on mobile
- **Real-Time Data**: Firebase Firestore for instant updates across users

## 🚀 Live Environments

- **Staging**: `exos-supplies--staging.web.app` (auto-deploy from main)
- **Production**: `exos-supplies.web.app` (manual deploy)

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Database**: Firebase Firestore
- **Hosting**: Firebase Hosting
- **Icons**: Lucide React

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- Firebase CLI
- Access to `exos-supplies` Firebase project

### Installation

1. **Navigate to the Exos Supplies directory:**
   ```bash
   cd exos-supplies
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   ```
   http://localhost:3000
   ```

## 🔥 Firebase Setup

### Initial Setup
```bash
# Login to Firebase
firebase login

# Set the project
firebase use exos-supplies

# Configure hosting targets
firebase target:apply hosting staging exos-supplies
firebase target:apply hosting production exos-supplies
```

### Deploy to Staging
```bash
npm run build
npm run firebase:deploy:staging
```

### Deploy to Production
```bash
npm run build
npm run firebase:deploy:production
```

## 🏗️ Project Structure

```
exos-supplies/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── firebase.ts       # Firebase config
│   ├── firebaseService.ts # Database operations
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utility functions
├── .github/workflows/    # CI/CD pipelines
├── firebase.json        # Firebase hosting config
├── next.config.js      # Next.js configuration
└── package.json        # Dependencies
```

## 🎨 Design System

- **Primary Color**: Soft Blue (`hsl(207 89% 86%)`)
- **Background**: Clean white with subtle shadows
- **Typography**: Inter font for modern readability
- **Components**: shadcn/ui for consistent design language

## 🔄 Development Workflow

### Feature Development
1. Create feature branch from `main`
2. Develop and test locally
3. Push to GitHub
4. Auto-deploy to staging
5. Test on staging environment
6. Create PR and merge to main
7. Manual deploy to production when ready

### Deployment Process
```bash
# Automatic staging deployment
git push origin main

# Manual production deployment (via GitHub Actions)
# Go to Actions tab > Deploy Exos Supplies > Run workflow
```

## 📊 Data Structure

### Product Schema
```typescript
interface Product {
  id: string;
  "Item Name": string;
  "Brand": string;
  "Category": string;
  "Cost": string;
  "EXOS Part Number": string;
  "URL": string;
  "Preferred": string;
}
```

### Cart Schema
```typescript
interface GymCart {
  gymId: string;
  items: CartItem[];
  lastUpdated: timestamp;
}
```

## 🏆 Performance Features

- **Static Site Generation**: Pre-built pages for fast loading
- **Code Splitting**: Automatic code splitting with Next.js
- **Optimized Images**: Next.js image optimization
- **Lazy Loading**: Components loaded on demand
- **Firebase Caching**: Efficient data caching strategies

## 🔐 Security

- **Firebase Security Rules**: Proper read/write permissions
- **Environment Variables**: Secure config management
- **Type Safety**: Full TypeScript coverage
- **Input Validation**: Client and server-side validation

## 📱 Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)  
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## 🤝 Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test on multiple screen sizes
4. Update documentation as needed

## 📞 Support

For issues or questions:
- Check the Firebase Console for errors
- Review GitHub Actions logs for deployment issues
- Ensure proper Firebase permissions are set 