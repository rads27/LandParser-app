# LandParser App 🏞️

A comprehensive web application for reporting and managing land encroachment issues with real-time updates, admin management capabilities, and persistent database storage.

## 🚀 Features

### User Features
- **User Authentication** - Secure login/register system with JWT tokens
- **Encroachment Reporting** - Submit land encroachment reports with images
- **Image Preview** - Confirm image uploads before submission
- **Detailed Forms** - Include area name, plot name, comments, and coordinates
- **Real-time Updates** - Automatic polling for submission status updates
- **User Dashboard** - Track all submitted reports and their statuses
- **Submission Stats** - View pending, approved, and rejected submission counts
- **Admin Feedback** - View admin comments on rejected submissions

### Admin Features
- **Admin Dashboard** - View all pending, approved, and rejected submissions
- **Full Details View** - See complete submission information including images
- **Approval Workflow** - Approve or reject submissions with confirmation dialogs
- **Admin Feedback** - Add comments when rejecting submissions
- **Real-time Notifications** - Automatic updates when new submissions arrive
- **Submission Statistics** - Overview of all submission statuses

### UI/UX Features
- **Dark Mode** - Toggle between light and dark themes
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Material-UI Components** - Modern and polished user interface
- **Sidebar Navigation** - Easy access to all app sections
- **Notification System** - Real-time alerts for important events

## �️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **Database**: Supabase (PostgreSQL) with automatic fallback storage
- **Authentication**: JWT-based auth system
- **State Management**: React Context API
- **Styling**: Emotion CSS-in-JS

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Bswebapp4
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**

   Create a `.env.local` file in the root directory:

   ```bash
   # JWT Secret
   JWT_SECRET=your-secret-key-here

   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Set Up Supabase Database**

   1. Create a Supabase project at [supabase.com](https://supabase.com)
   2. Go to SQL Editor in your Supabase dashboard
   3. Copy the contents of `database/supabase-schema.sql`
   4. Paste and run the SQL in the editor

   For detailed instructions, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## � Default Users

The app includes default login credentials for testing:

- **Admin Account**
  - Email: `admin@landparser.com`
  - Password: `password123`

- **Test User Account**
  - Email: `user@landparser.com`
  - Password: `password123`

## 📁 Project Structure

```
Bswebapp4/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API routes
│   │   ├── admin/        # Admin pages
│   │   ├── login/        # Authentication pages
│   │   └── user/         # User pages
│   ├── components/       # React components
│   │   ├── auth/         # Authentication components
│   │   ├── layout/       # Layout components
│   │   └── user/         # User dashboard components
│   ├── contexts/         # React contexts
│   ├── lib/              # Utilities and configurations
│   │   ├── supabase.ts           # Supabase client
│   │   ├── supabaseStore.ts      # Supabase data store
│   │   ├── fallbackStorage.ts    # In-memory fallback
│   │   └── theme.ts              # MUI theme configuration
│   └── styles/           # Global styles
├── database/             # Database schemas
│   └── supabase-schema.sql
├── public/              # Static assets
└── package.json         # Dependencies
```

## � API Routes

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Encroachment Management
- `POST /api/encroachment` - Submit new encroachment report
- `GET /api/encroachment?userEmail=<email>` - Get user's submissions

### Admin Operations
- `GET /api/admin/requests` - Get all encroachment requests
- `PUT /api/admin/requests` - Update request status (approve/reject)
- `GET /api/admin/notifications` - Get admin notifications

### User Stats
- `GET /api/user/stats?userEmail=<email>` - Get user submission statistics

## 🔧 Configuration

### Database

The app uses Supabase for data persistence with an automatic fallback to in-memory storage when Supabase is not configured. This ensures the app works immediately after installation.

### Authentication

JWT-based authentication with secure token storage in httpOnly cookies.

### Real-time Updates

- User dashboard polls every 10 seconds for status updates
- Admin dashboard polls every 5 seconds for new submissions
- Automatic notification system for important events

## 🎨 Customization

### Theme

Edit `src/lib/theme.ts` to customize colors, typography, and component styles.

### Features

The app is modular and easy to extend. Key components:
- `EncroachmentDetection.tsx` - User submission form
- `AdminDashboard.tsx` - Admin management interface
- `UserDashboardNew.tsx` - User dashboard with stats

## 🐛 Troubleshooting

### Database Connection Issues

If you see database connection errors:
1. Verify your Supabase credentials in `.env.local`
2. Check that you've run the database schema
3. The app will work with fallback storage even without Supabase

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- Digital Ocean

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 📧 Contact

For questions or support, please open an issue in the repository.

---

**Built with ❤️ using Next.js and Supabase**
- Email notifications for status updates
- Bulk upload capabilities
- Advanced analytics and reporting
- Mobile app development
- Multi-language support

---

**Built with ❤️ using Next.js, React 22, and Material-UI**