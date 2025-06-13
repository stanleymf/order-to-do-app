import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4321;

// Serve static files from the dist directory
app.use(express.static(join(__dirname, 'dist')));

// Healthcheck endpoint for Railway
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Use a simple middleware to handle all other routes for SPA
app.use((req, res, next) => {
  // Skip if it's the healthcheck or static files
  if (req.path === '/healthz' || req.path.startsWith('/assets/') || req.path === '/') {
    return next();
  }
  
  // For all other routes, serve index.html
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Order To-Do App running on port ${PORT}`);
  console.log(`🌐 Access your app at: http://localhost:${PORT}`);
}); 