const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');
require('dotenv').config();


// Load environment variables
dotenv.config();

const app = express();
const PORT = 8080;

// Passport config
require('./middlewares/passportConfig');

// Connect to MongoDB (only once)
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vogueDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://cdnjs.cloudflare.com"
      ],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: [
        "'self'",
        "data:",
        "https://github.com/",
        "https://raw.githubusercontent.com/",
        "https://*.depositphotos.com/",
        "https://images.pexels.com",
        "https://assets.armani.com",
        "https://assets.burberry.com",
        "https://www.chanel.com",
        "https://assets.christiandior.com",
        "https://media.gucci.com",
        "https://in.louisvuitton.com",
        "https://www.prada.com",
        "https://saint-laurent.dam.kering.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com/",
        "https://cdnjs.cloudflare.com/"
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com/", "https://cdnjs.cloudflare.com/"],
    },
  },
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session & Passport
app.use(session({
  secret: 'your_super_secret_key', // Use a stronger secret in production
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  headers: true,
});
app.use('/api', limiter);

// Logger middleware
app.use(logger);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const authRoutes = require('./api/apiRoutes');       // ✅ Correct path based on your structure
const paymentRoutes = require('./api/paymentRoutes'); // ✅ if this file exists

app.use('/', authRoutes);        // Handles login/register/auth
app.use('/api', paymentRoutes);  // Handles payments


// Views
app.set('view engine', 'ejs');

// Public Pages
app.get('/', (req, res) => res.render(path.join(__dirname, 'views', 'new.ejs')));
app.get('/login', (req, res) => res.render(path.join(__dirname, 'views', 'login.ejs')));
app.get('/register', (req, res) => res.render(path.join(__dirname, 'views', 'register.ejs')));
app.get('/api/register', (req, res) => res.render(path.join(__dirname, 'views', 'register.ejs')));
app.get('/contact', (req, res) => res.render(path.join(__dirname, 'views', 'contact.ejs'), { username: req.session.username }));

// Protected Pages
app.get('/api/order', (req, res) => res.render(path.join(__dirname, 'views', 'order.ejs'), { username: req.session.username }));
app.get('/loui', (req, res) => res.render(path.join(__dirname, 'views', 'loui.ejs'), { username: req.session.username }));
app.get('/armani', (req, res) => res.render(path.join(__dirname, 'views', 'armani.ejs'), { username: req.session.username }));
app.get('/Burburry', (req, res) => res.render(path.join(__dirname, 'views', 'Burburry.ejs'), { username: req.session.username }));
app.get('/Chanel', (req, res) => res.render(path.join(__dirname, 'views', 'Chanel.ejs'), { username: req.session.username }));
app.get('/Dior', (req, res) => res.render(path.join(__dirname, 'views', 'Dior.ejs'), { username: req.session.username }));
app.get('/gucci', (req, res) => res.render(path.join(__dirname, 'views', 'gucci.ejs'), { username: req.session.username }));
app.get('/Prada', (req, res) => res.render(path.join(__dirname, 'views', 'Prada.ejs'), { username: req.session.username }));
app.get('/Ysl', (req, res) => res.render(path.join(__dirname, 'views', 'Ysl.ejs'), { username: req.session.username }));

// Error Handling
app.get('/error', (req, res) => {
  errorHandler(new Error("An error occurred"), req, res);
});
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
