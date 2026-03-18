# Excel Comparison Tool

A modern Excel file comparison tool with **fuzzy matching support**, **Supabase authentication**, and optimized for processing large files.

## 🚀 Key Features

### Authentication & Security
- 🔐 **Supabase Authentication**: Secure login with OAuth providers
  - Google OAuth
  - GitHub OAuth
  - Email/Password authentication
- 👤 **User Isolation**: Each user can only access their own comparisons
- 👑 **Super Admin**: Designated users can view all comparisons across all users
- 🛡️ **Row Level Security (RLS)**: Database-level security policies

### Matching Modes
- ✅ **Exact Match**: Precise matching with case-insensitive comparison
- ✅ **Fuzzy Matching**: Two algorithm options
  - **Jaro-Winkler**: Best for names, short strings, small typos (character-level)
  - **Jaccard**: Best for phrases, sentences, word order variations (word-level)
- ✅ **Configurable Threshold**: 0-100% similarity threshold
- ✅ **Quick Presets**: Strict (95%), High (85%), Medium (75%), Low (50%)

### Performance Optimizations
- **Hash-Based Comparison**: O(n+m) complexity for exact matching
- **Phonetic Indexing**: Uses Metaphone & Soundex for optimized fuzzy matching
- **Batch Processing**: Handles large datasets efficiently

### User Experience
- 🎨 **Modern UI**: Gradient design with dark mode support
- 📱 **Responsive**: Works on desktop and mobile
- 🌙 **Dark Mode**: Full dark mode support
- 📜 **Comparison History**: Persistent storage with view/export/delete
- 🔍 **Search & Filter**: Find specific comparisons easily
- 📤 **Export Results**: Download to Excel with status columns

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript 5
- **Authentication**: Supabase Auth with @supabase/ssr
- **Database**: Supabase PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Excel Processing**: XLSX (SheetJS)
- **Matching Algorithms**: Jaro-Winkler & Jaccard with phonetic indexing

### Project Structure
```
src/
├── app/
│   ├── page.tsx                    # Landing page (authenticated)
│   ├── layout.tsx                  # Root layout with Supabase client
│   ├── login/
│   │   └── page.tsx               # Login page with OAuth options
│   ├── compare/                   # Multi-screen workflow
│   │   ├── new/page.tsx           # Step 1: Upload Excel files
│   │   ├── settings/page.tsx      # Step 2: Configure comparison
│   │   ├── progress/page.tsx      # Step 3: Real-time progress
│   │   └── results/page.tsx       # Step 4: View results
│   ├── history/
│   │   └── page.tsx               # View/manage comparison history
│   └── api/                       # RESTful API endpoints
│       ├── compare/route.ts       # Comparison endpoint
│       ├── history/route.ts       # History CRUD with super admin
│       └── history/[id]/route.ts  # Delete comparison
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── layout-header.tsx          # App header with user menu
│   └── user-menu.tsx              # User dropdown menu
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Supabase client (browser)
│   │   ├── server.ts              # Supabase client (server)
│   │   └── middleware.ts          # Auth middleware
│   ├── db/
│   │   ├── index.ts               # Drizzle client
│   │   └── schema.ts              # Database schema
│   ├── similarity.ts              # Jaro-Winkler & Jaccard algorithms
│   ├── excel-comparison.ts        # Comparison logic
│   └── super-admin.ts             # Super admin helpers
└── middleware.ts                  # Next.js middleware for auth
```

## 🎯 How It Works

### Authentication Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ Unauthenticated│ → │ Login Page   │ → │ Authenticated│
│ User          │    │ (OAuth/Email)│    │ Dashboard   │
└─────────────┘    └──────────────┘    └─────────────┘
```

### Application Workflow (4-Step Process)

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│   Step 1    │ →  │   Step 2     │ →  │   Step 3    │ →  │   Step 4    │
│ Upload File  │    │  Settings    │    │  Progress   │    │   Results   │
└─────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
     ↓                  ↓                  ↓                  ↓
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│ Master &    │    │ Match Method │    │ Real-time   │    │ Statistics │
│ Secondary   │    │ Threshold    │    │ Progress    │    │ Export      │
│ .xlsx/.xls  │    │ Algorithm    │    │ Updates     │    │ History     │
└─────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
```

### Fuzzy Matching Algorithms

#### Jaro-Winkler Algorithm
**Best for**: Names, addresses, codes, short text with small typos

- Compares characters at the character level
- Gives extra weight to matching prefixes
- Works well with spelling variations

Example:
```
"Arifrah" vs "Arifra" → 96% similarity
"Jakarta" vs "Djakarta" → 93% similarity
```

#### Jaccard Algorithm
**Best for**: Product descriptions, titles, sentences with word order variations

- Compares words at the word level
- Uses word tokenization and set operations
- Handles word reordering well

Example:
```
"Blue Shirt Large" vs "Large Blue Shirt" → 100% similarity
"Product Description A" vs "Description Product A" → 100% similarity
```

### Phonetic Indexing

For performance optimization, we use:
- **Metaphone**: Encodes words based on pronunciation
- **Soundex**: Encodes words using phonetic algorithm

This creates a pre-filter to quickly eliminate obvious non-matches before running the full similarity calculation.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account and project
- Git (optional)

### Installation

1. **Clone the repository**:
```bash
git clone <your-repo-url>
cd excel-comparison
```

2. **Install dependencies**:
```bash
npm install
# or with bun
bun install
```

3. **Set up Supabase**:
```bash
# Create a new project at https://supabase.com
# Get your project URL and anon key from Settings → API
```

4. **Configure environment variables**:
```bash
# Create .env.local file
cp .env.example .env.local

# Edit with your Supabase credentials:
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. **Set up database**:
```bash
# Run database migrations
npm run db:push

# Or use Drizzle Studio
npm run db:studio
```

6. **Configure OAuth providers** (in Supabase Dashboard):
- Go to Authentication → Providers
- Enable Google OAuth
- Enable GitHub OAuth
- Add your redirect URLs

7. **Create super admin** (optional):
```sql
-- Insert user ID into super_admins table
INSERT INTO super_admins (user_id)
VALUES ('<user-uuid-from-auth-users-table>');
```

### Development

**Start development server**:
```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000)

**Available Scripts**:
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migration |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |

## 💡 Usage

### First Time Login

1. Navigate to the application
2. You'll be redirected to the login page
3. Choose your login method:
   - **Continue with Google**: Quick OAuth login
   - **Continue with GitHub**: Quick OAuth login
   - **Email**: Sign up with email and password
4. After successful login, you'll see the main dashboard

### Creating a Comparison

**Step 1 - Upload Files**:
- Click "New Comparison" on the home page
- Upload master file (your reference data)
- Upload secondary file (data to compare)
- Supported formats: .xlsx, .xls

**Step 2 - Select Columns**:
- Choose columns from each file for comparison
- At least one column from each file is required

**Step 3 - Configure Settings**:
- **Matching Mode**: Exact Match or Fuzzy Matching
- **If Fuzzy Matching**:
  - Choose Algorithm: Jaro-Winkler or Jaccard
  - Set Similarity Threshold: 0-100%
  - Use Quick Presets: Strict (95%), High (85%), Medium (75%), Low (50%)
- Click "Start Comparison"

**Step 4 - View Results**:
- Overview statistics (total, matched, unmatched)
- Detailed results with similarity scores
- Filter by status (All/Matched/Unmatched)
- Export to Excel

### Managing History

- Click "View History" to see all past comparisons
- View detailed results of any comparison
- Export results to Excel
- Delete old comparisons

**Super Admin Feature**:
- Super admins see all comparisons from all users
- Owner email is displayed for each comparison
- Filter and search across all data

## 🔧 Configuration

### Supabase Setup

1. **Create Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Enable OAuth Providers**:
   - Go to Authentication → Providers
   - Enable Google
   - Enable GitHub
   - Configure redirect URLs

3. **Create Database Tables**:
   - Run migrations with `npm run db:push`
   - Tables: `comparisons`, `super_admins`

4. **Set Up RLS Policies**:
   - Comparisons: Users can only access their own data
   - Super admins: Bypass RLS to access all data

### Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 📊 Database Schema

### Comparisons Table
```sql
comparisons (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,           -- Owner of the comparison
  master_file TEXT NOT NULL,
  secondary_file TEXT NOT NULL,
  total_rows INTEGER NOT NULL,
  matched_rows INTEGER NOT NULL,
  unmatched_rows INTEGER NOT NULL,
  master_data TEXT NOT NULL,        -- JSON string
  secondary_data TEXT NOT NULL,     -- JSON string
  comparison_data TEXT NOT NULL,    -- JSON string
  master_columns TEXT,              -- JSON array
  secondary_columns TEXT,           -- JSON array
  comparison_method TEXT DEFAULT 'exact',
  fuzzy_algorithm TEXT DEFAULT 'jaro-winkler',
  similarity_threshold INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Super Admins Table
```sql
super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,     -- References auth.users(id)
  created_at TIMESTAMP DEFAULT NOW()
)
```

## 🔒 Security

- **Supabase Auth**: Secure authentication with OAuth
- **Row Level Security**: Database-level access control
- **Input Validation**: All inputs are validated
- **SQL Injection Prevention**: Drizzle ORM with parameterized queries
- **Environment Variables**: Sensitive data in env files

## 🔍 Troubleshooting

### OAuth Login Not Working

**Problem**: Google/GitHub login fails
**Solution**:
1. Check Supabase Dashboard → Authentication → Providers
2. Verify the provider is enabled
3. Check redirect URLs in provider settings
4. Ensure your environment variables are correct

### Super Admin Cannot See All Data

**Problem**: Super admin only sees own comparisons
**Solution**:
1. Verify user is in `super_admins` table
2. Check RLS policies on `comparisons` table
3. Ensure `get_comparisons_with_owner_info()` function exists

### Database Connection Issues

**Problem**: Cannot connect to Supabase
**Solution**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
3. Ensure Supabase project is active (not paused)
4. Check browser console for specific errors

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Built with ❤️ using Next.js and Supabase**
