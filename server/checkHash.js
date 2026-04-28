import bcrypt from 'bcryptjs';
const hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHuu';
bcrypt.compare('demo123', hash).then(console.log);
