# Exos Supplies - Equipment Management System

A modern Next.js application for managing gym equipment inventory across multiple locations. Built with **Next.js 15**, **React 18**, and **Firebase** for real-time data synchronization and deployment.

## 🚀 Current Features

### **Equipment Catalog**
- **Browse & Search**: Advanced filtering by category, brand, and preference status
- **Multi-Gym Support**: Manage equipment for multiple gym locations (MP2, MAT3, MP5, HMBLT, CRSM, TM3, MPD237)
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Real-time Updates**: Instant synchronization across all users via Firebase

### **Shopping Cart System**
- **Add to Cart**: Add equipment items with quantity and status selection
- **Cart Management**: Save carts, submit for approval, or clear items
- **Status Tracking**: Manage items with statuses (Hold, Waitlist, Pending Approval, Approved, Rejected)
- **Multi-gym Support**: Separate carts for each gym location

### **Approval Workflow**
- **Approval Center**: Dedicated page for managing cart submissions
- **Saved Carts**: View and manage saved cart items
- **Submitted Items**: Track approval status and manage requests
- **Bulk Operations**: Approve or reject multiple items at once
- **Notes & Justification**: Add detailed notes for approval decisions

### **User Interface**
- **Modern Design**: Clean, professional UI with Tailwind CSS
- **Responsive Layout**: Optimized for all screen sizes
- **Loading States**: Smooth loading indicators and transitions
- **Error Handling**: Comprehensive error states and user feedback

## 🏗️ Technology Stack

### **Frontend**
- **Framework**: Next.js 15.4.4 with App Router
- **Language**: TypeScript
- **UI Library**: React 18 with hooks
- **Styling**: Tailwind CSS + shadcn/ui components
- **Icons**: Lucide React
- **State Management**: React hooks and context

### **Backend & Database**
- **Database**: Firebase Firestore (real-time)
- **Authentication**: Firebase Auth (ready for future use)
- **Hosting**: Firebase Hosting
- **Real-time Sync**: Firebase real-time listeners

### **Development & Deployment**
- **Build Tool**: Webpack with optimizations
- **Package Manager**: npm
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint, TypeScript
- **Performance**: SWC minification, code splitting, caching

## 📱 Application Structure

### **Pages**
```
exos-supplies/
├── app/
│   ├── page.tsx              # Main catalog page
│   ├── approvals/
│   │   └── page.tsx          # Approval center
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── CartModal.tsx         # Shopping cart modal
│   ├── ApprovalSubmissionModal.tsx
│   ├── ItemDetailsModal.tsx
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── firebaseService.ts    # Firebase operations
│   ├── types.ts              # TypeScript definitions
│   └── utils.ts              # Utility functions
└── next.config.js            # Next.js configuration
```

### **Key Components**

#### **Catalog Page (`/`)**
- **Header**: Gym selector, title, navigation buttons
- **Product Grid**: Responsive product cards with controls
- **Filters**: Category, brand, and preference filtering
- **Search**: Real-time search functionality

#### **Approval Center (`/approvals`)**
- **Header**: Back navigation, title, settings icon
- **Stats**: Centered tab buttons with counts
- **Tabs**: Saved Carts and Submitted Items
- **Item Management**: Approve, reject, or edit items

#### **Cart Modal**
- **Header**: Title, gym selector, close button
- **Items**: Grouped by status with individual controls
- **Footer**: Item count, total price, action buttons

## ⚡ Performance Optimizations

### **Build Optimizations**
- ✅ **SWC Minification**: Faster than Terser
- ✅ **Code Splitting**: Automatic vendor chunking
- ✅ **CSS Optimization**: Reduced bundle sizes
- ✅ **Package Optimization**: Tree-shaking unused code
- ✅ **Static Export**: Optimized for Firebase hosting

### **Deployment Optimizations**
- ✅ **npm Caching**: Faster dependency installation
- ✅ **Next.js Build Cache**: Cached build artifacts
- ✅ **GitHub Actions**: Optimized CI/CD pipeline
- ✅ **Firebase Hosting**: Global CDN distribution

### **Runtime Optimizations**
- ✅ **Real-time Listeners**: Efficient Firebase subscriptions
- ✅ **Local State Management**: Reduced API calls
- ✅ **Responsive Images**: Optimized image loading
- ✅ **Lazy Loading**: On-demand component loading

## 🚀 Deployment

### **Current Setup**
- **Platform**: Firebase Hosting
- **Project**: `exos-supplies`
- **Environment**: Staging channel
- **CI/CD**: GitHub Actions
- **Build**: Static export for optimal performance

### **Deployment Process**
1. **Code Push**: Triggers GitHub Actions workflow
2. **Build**: Next.js static export with optimizations
3. **Cache**: npm and build artifacts cached
4. **Deploy**: Firebase Hosting deployment to staging
5. **CDN**: Global distribution via Firebase CDN

## 📊 Data Architecture

### **Firebase Collections**
```
firestore/
├── catalog/           # Equipment catalog data
├── carts/            # User shopping carts
├── gymItems/         # Submitted approval items
└── savedCarts/       # Saved cart data
```

### **Real-time Features**
- **Live Updates**: Changes reflect instantly across users
- **Offline Support**: Works without internet connection
- **Conflict Resolution**: Automatic data synchronization
- **Performance**: Optimized queries and caching

## 🛠️ Development Setup

### **Prerequisites**
- Node.js 20+
- npm or yarn
- Firebase project setup

### **Installation**
```bash
# Clone repository
git clone <repository-url>
cd exos-catalog

# Navigate to Next.js app
cd exos-supplies

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Firebase configuration

# Start development server
npm run dev
```

### **Environment Variables**
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🎯 Recent Improvements

### **UI/UX Enhancements**
- ✅ **Responsive Design**: Optimized for all devices
- ✅ **Modern Components**: shadcn/ui integration
- ✅ **Better Spacing**: Improved layout and alignment
- ✅ **Loading States**: Smooth user experience
- ✅ **Error Handling**: Comprehensive error states

### **Performance Improvements**
- ✅ **Build Speed**: 40-60% faster deployments
- ✅ **Bundle Size**: Optimized JavaScript and CSS
- ✅ **Caching**: Intelligent caching strategies
- ✅ **Code Splitting**: Efficient resource loading

### **Workflow Optimizations**
- ✅ **Cart Management**: Streamlined approval process
- ✅ **Multi-gym Support**: Better gym switching
- ✅ **Status Management**: Improved status tracking
- ✅ **Real-time Sync**: Instant data synchronization

## 🔧 Configuration

### **Next.js Configuration**
```javascript
// next.config.js
const nextConfig = {
  output: 'export',           // Static export for Firebase
  trailingSlash: true,        // Firebase hosting compatibility
  swcMinify: true,           // Fast minification
  experimental: {
    optimizeCss: true,       // CSS optimization
    optimizePackageImports: ['lucide-react']
  }
};
```

### **Firebase Configuration**
```typescript
// lib/firebase.ts
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... other config
};
```

## 🚀 Future Enhancements

### **Planned Features**
- **User Authentication**: Role-based access control
- **Email Notifications**: Approval status notifications
- **Advanced Analytics**: Usage tracking and reporting
- **Mobile App**: React Native companion app
- **API Integration**: Third-party equipment suppliers

### **Performance Goals**
- **Lighthouse Score**: 95+ across all metrics
- **Load Time**: <2 seconds on 3G
- **Bundle Size**: <500KB initial load
- **Caching**: 95% cache hit rate

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### **Development Guidelines**
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Implement responsive design
- Add proper error handling
- Write comprehensive tests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [Issues](https://github.com/jrdxnra/exos-catalog/issues) page
- Review the Firebase Console for deployment status
- Monitor GitHub Actions for build status

---

**Built with ❤️ using Next.js, React, and Firebase**