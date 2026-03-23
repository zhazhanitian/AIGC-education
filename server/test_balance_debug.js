import axios from 'axios';

const API_CONFIG = {
  host: 'https://api.grsai.ai',
  key: 'sk-4e5fa91a66d54303ba527d2b4b8e5e09',
};

const getBalance = async () => {
  try {
    const timestamp = Date.now();
    console.log('Requesting balance...');
    const response = await axios.post(
      `${API_CONFIG.host}/client/openapi/getAPIKeyCredits?_t=${timestamp}`,
      { apikey: API_CONFIG.key },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  }
};

getBalance();
