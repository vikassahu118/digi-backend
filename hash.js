const bcrypt = require('bcrypt');

const password = 'Vishal@Singh'; // Change this to your desired password
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('Password Hash:');
  console.log(hash);
});

