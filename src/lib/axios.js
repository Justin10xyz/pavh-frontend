import axios from 'axios'

const api = axios.create({
	baseURL: 'http://localhost:8000',
	withCredentials: true,
	withXSRFToken: true, // axios >=1.6 lee la cookie XSRF-TOKEN y la manda como header
})

export default api