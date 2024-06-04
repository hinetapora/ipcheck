const express = require('express');
const axios = require('axios');
const moment = require('moment');
const ipaddr = require('ipaddr.js');

const app = express();
app.set('trust proxy', 1); // <--- Set trust proxy to true
const allowedIPs = [];

// Fetch allowed IP addresses from API every 30 minutes
setInterval(() => {
  axios.get('https://api.unblockvpn.io/app/v1/relays')
    .then(response => {
      const data = response.data;
      const ipv4_addr_in = data.ipv4_addr_in;
      allowedIPs = ipv4_addr_in.split(',').map(ip => ip.trim());
      console.log(`Updated allowed IPs: ${allowedIPs.join(', ')}`);
    })
    .catch(error => {
      console.error(`Error fetching allowed IPs: ${error}`);
    });
}, 30 * 60 * 1000); // 30 minutes

app.get('/check-ip', (req, res) => {
    const clientIp = req.headers['x-real-ip'] || req.ip;
    const isLocalRequest = clientIp === '127.0.0.1' || clientIp === '::1';
    if (isLocalRequest) {
      console.log('Local request detected. Bypassing IP check.');
      res.send('You are protected');
    } else {
      const parsedIp = ipaddr.parse(clientIp);
      if (parsedIp.version === 4 && allowedIPs.includes(parsedIp.address)) {
        console.log(`IP ${parsedIp.address} is allowed`);
        res.send('You are protected.');
      } else {
        console.log(`IP ${parsedIp.address} is not allowed`);
        console.log(`Allowed IPs: ${allowedIPs.join(', ')}`);
        res.send(`Not protected. Your IP is ${parsedIp.address}.`);
      }
    }
  });

app.listen(3000, () => {
  console.log('Server started on port 3000');
});