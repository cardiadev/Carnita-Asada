# 🥩 Carnita Asada

A modern web application to organize Mexican-style BBQ events ("Carnitas Asadas"). Plan your gathering, manage attendees, track expenses, and split costs fairly among participants.

> **Note:** The application interface is in **Spanish** 🇲🇽, as it's designed primarily for Mexican users organizing traditional BBQ gatherings.

## ✨ Features

### 📅 Event Management
- Create and manage BBQ events with date, time, and location
- Real-time countdown timer to event day
- Share event links with friends and family
- Cancel events with confirmation flow

### 👥 Attendee Management
- Add multiple attendees at once (bulk add)
- Include or exclude participants from expense splits
- Store banking information for easy payments (CLABE, bank name, account holder)

### 🛒 Shopping List
- Collaborative shopping list with categories
- Pre-built templates for quick setup (Basic BBQ, Premium, etc.)
- Quick-add suggestions for common items
- Mark items as purchased with visual feedback
- Categorized view: Meats, Drinks, Sides, Accessories, and more

### 💰 Expense Tracking
- Record all expenses with descriptions and amounts
- Assign expenses to specific attendees
- Upload receipt photos for reference
- Track total event spending in real-time

### 💸 Payment Management
- Automatic fair split calculation
- Suggested transfers between attendees
- Bank info modal with copy-to-clipboard functionality
- WhatsApp integration for payment coordination
- Mark payments as completed with undo option

### 📊 Reports & Analytics
- Visual charts using D3.js
- Expense breakdown by category
- Spending distribution per person
- Payment status overview

### 🍖 Suggestions & Recipes
- Meat calculation recommendations (grams per person by age/gender)
- Cut recommendations with ratings (Arrachera, Rib Eye, Costilla, etc.)
- Recipe collection for salsas, marinades, and sides

### 🎨 Modern UI/UX
- Responsive design (mobile-first)
- Dark mode support
- Hamburger menu for mobile navigation
- Clean, modern interface with shadcn/ui components
- Smooth animations and transitions

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Runtime:** [Bun](https://bun.sh/) / Node.js
- **Language:** TypeScript
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling:** Tailwind CSS 4
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) + Radix UI
- **Forms:** React Hook Form + Zod validation
- **Charts:** D3.js
- **Icons:** Lucide React
- **Notifications:** Sonner (toast)

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- [Supabase](https://supabase.com/) account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/carnita-asada.git
cd carnita-asada
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the development server:
```bash
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
carnita-asada/
├── app/                    # Next.js App Router pages
│   ├── [eventId]/          # Event-specific pages
│   │   ├── attendees/      # Attendee management
│   │   ├── expenses/       # Expense tracking
│   │   ├── recipes/        # Recipe suggestions
│   │   ├── report/         # Analytics & charts
│   │   ├── settings/       # Event settings
│   │   ├── shopping/       # Shopping list
│   │   ├── suggestions/    # Meat & cut recommendations
│   │   └── summary/        # Payment splits
│   └── api/                # API routes
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Layout components
│   └── event/              # Event-specific components
├── lib/                    # Utilities & helpers
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
└── supabase/               # Database migrations
```

## 🗄️ Database Schema

The app uses Supabase with the following main tables:
- `events` - BBQ event details
- `attendees` - Event participants
- `expenses` - Recorded expenses
- `shopping_items` - Shopping list items
- `categories` - Item categories
- `suggested_items` - Pre-defined suggestions
- `bank_info` - Attendee banking details
- `payments` - Payment records

## 📱 Screenshots

*Coming soon*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Lucide](https://lucide.dev/) for the icon library

---

Made with 🔥 and 🥩 for all the parrilleros out there!
