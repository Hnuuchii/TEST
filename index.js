const TopupFreefire = require('./topupFreefire');

const tokenAntirecaptcha = 'tokenAntirecaptcha';
const topup = new TopupFreefire(tokenAntirecaptcha);

const uid = 'UID';
const garenacard = 'number garenacard';
topup.loginFreefire(uid).then(response => {
  console.log('Login Freefire Response:', response);

  const open_id = '9247677ce17cbe2d947b4ffcd9c8e238';


  topup.topupGarenacard(open_id, garenacard).then(response => {
    console.log('Topup Garenacard Response:', response);
  }).catch(error => {
    console.error('Error in topupGarenacard:', error);
  });

}).catch(error => {
  console.error('Error in loginFreefire:', error);
});

