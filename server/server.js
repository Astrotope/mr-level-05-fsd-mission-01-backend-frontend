import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import axios from 'axios'
import FormData from 'form-data'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

const app = express()
const upload = multer({ dest: 'uploads/' })

app.use(cors())
app.use(express.json())

const endpoints = {
  endpoint1: {
    url: 'https://ai-vehicle-id-202411181207.australiaeast.inference.ml.azure.com/predict',
    headers: {
      'Authorization': `Bearer ${process.env.ENDPOINT1_KEY}`,
      'Content-Type': 'multipart/form-data'
    }
  },
  endpoint2: {
    url: 'https://mrlevel05fsdmission01customvision-prediction.cognitiveservices.azure.com/customvision/v3.0/Prediction/11b2df83-5803-4460-a114-7ab4050aacfb/classify/iterations/MR_VEHICLE_AI_ID_04/image',
    headers: {
      'Prediction-Key': process.env.ENDPOINT2_KEY,
      'Content-Type': 'application/octet-stream'
    }
  },
  endpoint3: {
    url: 'https://mrlevel05fsdmission01customvision-prediction.cognitiveservices.azure.com/customvision/v3.0/Prediction/396ef7f4-2ec0-4bd5-990d-af98116abfbe/classify/iterations/MR_VEHICLE_AI_ID_01/image',
    headers: {
      'Prediction-Key': process.env.ENDPOINT3_KEY,
      'Content-Type': 'application/octet-stream'
    }
  }
}

app.post('/api/classify', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image file provided' })
  }

  const selectedEndpoint = req.query.endpoint || 'endpoint1'
  const endpoint = endpoints[selectedEndpoint]

  if (!endpoint) {
    return res.status(400).json({ success: false, error: 'Invalid endpoint selected' })
  }

  try {
    let response

    // Ensure uploads directory exists
    await fs.mkdir('uploads', { recursive: true })
    
    if (selectedEndpoint === 'endpoint1') {
      const formData = new FormData()
      const fileContent = await fs.readFile(req.file.path)
      formData.append('image', fileContent, req.file.originalname)
      
      response = await axios.post(endpoint.url, formData, {
        headers: {
          ...endpoint.headers,
          ...formData.getHeaders()
        }
      })

      // Clean up the temporary file
      await fs.unlink(req.file.path)

      if (!response.data || !response.data.predictions) {
        throw new Error('Invalid response format from endpoint1')
      }

      return res.json({
        success: true,
        prediction: response.data.prediction,
        predictions: Object.entries(response.data.predictions || {}).map(([tagName, probability]) => ({
          tagName,
          probability
        })).sort((a, b) => b.probability - a.probability)
      })
    } else {
      // Endpoint 2 and 3 (Azure Custom Vision)
      const imageBuffer = await fs.readFile(req.file.path)
      
      response = await axios.post(endpoint.url, imageBuffer, {
        headers: endpoint.headers
      })

      // Clean up the temporary file
      await fs.unlink(req.file.path)

      if (!response.data || !response.data.predictions) {
        throw new Error(`Invalid response format from ${selectedEndpoint}`)
      }

      const sortedPredictions = response.data.predictions
        .sort((a, b) => b.probability - a.probability)

      return res.json({
        success: true,
        prediction: {
          category: sortedPredictions[0].tagName,
          probability: sortedPredictions[0].probability
        },
        predictions: sortedPredictions
      })
    }
  } catch (error) {
    console.error('API Error:', error)
    
    // Clean up the temporary file in case of error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path)
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError)
      }
    }

    return res.status(500).json({
      success: false,
      error: error.response?.data?.error || error.message
    })
  }
})

const PORT = process.env.PORT || 3111
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
