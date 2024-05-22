const axios = require('axios');

async function getGeo(ip) {
  try {
    const response = await axios.get(`http://ipinfo.io/${ip}/json`);
    return response.data.country || 'Unknown';
  } catch (error) {
    console.error(error);
    return 'Unknown';
  }
}

module.exports = {
  getGeo
};
