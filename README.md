# LandParser App

A comprehensive land management and analysis application built with Next.js, React 22, TypeScript, and Material-UI with PostgreSQL backend.

## 🌟 Features

### 🔐 Authentication System
- Role-based authentication (User/Admin)
- Secure login with JWT tokens
- Protected routes based on user roles

### 🗺️ User Dashboard
1. **Automated Boundary Segmentation**
   - Input land details (State, City, Taluka, Plot No.)
   - Generate boundary maps with highlighted plots
   - Display land information (Price, Owner, Type, Soil, Area)

2. **Land Price & Ownership Information**
   - Predicted land prices
   - Owner details
   - Land and soil type classification
   - Area calculations

3. **Encroachment Detection**
   - Image upload for land analysis
   - Submission tracking system
   - Status monitoring (Pending/Approved/Rejected)

### 👨‍💼 Admin Dashboard
- Manage encroachment requests
- Approve/Reject submissions
- View uploaded images
- User management interface

### 🎨 UI/UX Features
- Light/Dark theme toggle
- Responsive design
- Professional Material-UI components
- Attractive gradients and animations
- Custom styling and branding

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 22, TypeScript
- **UI Library**: Material-UI (MUI) v5
- **Styling**: Tailwind CSS + Custom CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **Authentication**: JWT + bcrypt
- **State Management**: React Context API

## 📦 Installation

### Quick Setup (Automated)

#### 🐧 Linux/Mac:
```bash
chmod +x setup-database.sh
./setup-database.sh
```

#### 🪟 Windows:
**Option 1 - PowerShell (Recommended):**
```powershell
.\setup-database.ps1
```

**Option 2 - Command Prompt:**
```cmd
setup-database.bat
```

**Option 3 - Manual Setup:**
See detailed guide: **[WINDOWS_SETUP.md](WINDOWS_SETUP.md)**

---

### Manual Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LandParser-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**
   - Create a database named `landparser_db`
   - Run the SQL schema from `database/schema.sql`

4. **Configure environment variables**
   - Copy `.env.example` to `.env.local`
   - Update database credentials and JWT_SECRET

5. **Build and run the development server**
   ```bash
   npm run build
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 Demo Accounts

### User Account
- **Email**: `user@example.com`
- **Password**: Any password (demo mode)
- **Access**: User dashboard with boundary segmentation and encroachment detection

### Admin Account
- **Email**: `admin@example.com`
- **Password**: Any password (demo mode)
- **Access**: Admin dashboard for managing requests

## 📁 Project Structure

```
src/
├── api/                    # Mock API functions
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── dashboard/         # User dashboard pages
│   └── layout.tsx         # Root layout
├── components/
│   ├── auth/              # Authentication components
│   ├── admin/             # Admin-specific components
│   ├── common/            # Shared components (Navbar, etc.)
│   └── dashboard/         # User dashboard components
├── contexts/              # React contexts
│   ├── AuthContext.tsx    # Authentication state
│   └── ThemeContext.tsx   # Theme management
├── lib/                   # Utility libraries
├── types/                 # TypeScript type definitions
└── styles/               # Global styles
```

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### User Features
- `POST /api/segmentation` - Generate boundary data
- `POST /api/encroachment` - Submit encroachment request
- `GET /api/encroachment` - Get user submissions

### Admin Features  
- `GET /api/admin/requests` - Get pending requests
- `POST /api/admin/requests` - Approve/reject requests

## 🔧 Configuration

### Database Setup
1. Install PostgreSQL
2. Create database: `CREATE DATABASE landparser_db;`
3. Run schema from `database/schema.sql`

### Environment Variables
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=landparser_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-jwt-secret
```

## 🎯 Key Features Implemented

✅ Complete Next.js 15 setup with TypeScript  
✅ Material-UI theming with light/dark mode  
✅ PostgreSQL database schema  
✅ Authentication system with JWT  
✅ Role-based routing and protection  
✅ User dashboard with 3 main features  
✅ Admin dashboard for request management  
✅ Responsive design and professional UI  
✅ Mock API functions for demo purposes  
✅ Image upload and file handling  
✅ Real-time status updates  

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker (Optional)
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the demo accounts and features

## 🔮 Future Enhancements

- Real map integration (Google Maps/OpenStreetMap)
- Advanced image processing for encroachment detection
- Email notifications for status updates
- Bulk upload capabilities
- Advanced analytics and reporting
- Mobile app development
- Multi-language support

---

**Built with ❤️ using Next.js, React 22, and Material-UI**