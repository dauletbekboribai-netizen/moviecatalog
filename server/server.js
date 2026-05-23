const jsonServer = require('json-server');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const port = 3001;

server.use(middlewares);
server.use(jsonServer.bodyParser);

const SECRET_KEY = 'movie-secret-key-2024';

server.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  const db = router.db;
  const users = db.get('users').value();
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User exists' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now(),
    email,
    password: hashedPassword,
    name,
    role: 'user'
  };
  
  db.get('users').push(newUser).write();
  
  const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, SECRET_KEY);
  res.json({ token, user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role } });
});

server.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const db = router.db;
  const user = db.get('users').value().find(u => u.email === email);
  
  if (!user) return res.status(401).json({ error: 'Invalid' });
  
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid' });
  
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

server.use(router);
server.listen(port, () => console.log(`Server running on port ${port}`));