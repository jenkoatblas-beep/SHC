import bcrypt from 'bcryptjs';
bcrypt.hash('demo123', 10).then(hash => {
  console.log('Correct hash:', hash);
});
