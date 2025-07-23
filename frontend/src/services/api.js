import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000', // ⚠️ cambiar cuando tengas la URL real de la API
});

// Endpoints
export const getStatus = () => API.get('/plc/status');
export const sendCommand = (data) => API.post('/plc/command', data);
export const getLogs = () => API.get('/plc/logs');