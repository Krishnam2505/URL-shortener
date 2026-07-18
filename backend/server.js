
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from './config.js';
import shortenRoutes from './routes/shorten_routes.js';
import redirectRoutes from './routes/redirect_routes.js';
import statsRoutes from './routes/stats_routes.js';

const app = express();

// --- Middleware ---

// Enable CORS (Cross-Origin Resource Sharing).
// This tells the browser that it is safe for our frontend (CLIENT_URL) to make requests to this backend.
app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true
}));

// Request Logger.
// Every time a request hits our server, morgan will print a summary to the console (e.g., "GET / 200 4.102 ms").
app.use(morgan('dev'));

// JSON Parser.
// Automatically takes incoming HTTP requests with a JSON body and converts them into a usable JavaScript object (req.body).
app.use(express.json());

// --- Routes ---

app.use('/api', shortenRoutes);
app.use('/api', statsRoutes);

// Mount the redirect routes at the root level, so URLs look like localhost:8000/aB3x
app.use('/', redirectRoutes);

// Health check route. This is just to confirm the server is awake and accepting traffic.
app.get('/', (req, res) => {
  res.json({ message: "ShortLink API is running" });
});

// --- Server Startup ---

app.listen(config.PORT, () => {
  console.log(`ShortLink API running on port ${config.PORT}`);
});
