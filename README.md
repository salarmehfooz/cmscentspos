# CM Scents POS System

A modern, fast, and user-friendly **Point of Sale (POS) System** built for **CM Scents**. This application streamlines sales, inventory management, customer transactions, and daily business operations with an intuitive interface.

---

# Features

- 🛒 Fast and efficient Point of Sale
- 📦 Inventory management
- 💰 Sales tracking
- 🧾 Receipt generation
- 👥 Customer management
- 📊 Business dashboard and analytics
- 🔍 Product search
- ⚡ Responsive and modern UI
- 🔒 Secure environment configuration

---

# Tech Stack

- **Frontend:** React / Next.js
- **Backend:** Node.js
- **Styling:** Tailwind CSS
- **AI Integration:** Google Gemini API
- **Package Manager:** npm

---

# Prerequisites

Before running the project, ensure you have installed:

- Node.js (v18 or later recommended)
- npm
- A Google Gemini API Key

---

# Installation

Clone the repository:

```bash
git clone <repository-url>
cd cm-scents-pos
```

Install project dependencies:

```bash
npm install
```

---

# Environment Variables

Create a `.env.local` file in the project root (or update the existing one) and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key
```

---

# Running the Development Server

Start the application:

```bash
npm run dev
```

The application will be available at:

```
http://localhost:3000
```

---

# Building for Production

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

---

# Usage

1. Launch the application.
2. Browse or search for products.
3. Add products to the cart.
4. Complete customer checkout.
5. Generate receipts.
6. Monitor sales and inventory from the dashboard.

---

# Available Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm install`   | Install dependencies     |
| `npm run dev`   | Start development server |
| `npm run build` | Create production build  |
| `npm start`     | Run production server    |
| `npm run lint`  | Run linting              |

---

# Security

- Never commit your `.env.local` file.
- Keep your `GEMINI_API_KEY` private.
- Use environment variables for all sensitive credentials.

---

# Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature/your-feature
```

3. Commit your changes.

```bash
git commit -m "Add your feature"
```

4. Push your branch.

```bash
git push origin feature/your-feature
```

5. Open a Pull Request.

---

# License

This project is proprietary software developed for **CM Scents**. All rights reserved unless otherwise specified.

---

## Developed for

**CM Scents POS System**

Designed to simplify retail operations, improve efficiency, and provide a seamless checkout experience for both staff and customers.
