/**
 * Server for Car Insurance Quote Application
 * Handles image uploads and vehicle classification using multiple Azure AI endpoints
 * Provides a REST API for the frontend to interact with various AI models
 */

// Required package imports
import dotenv from 'dotenv'        // For loading environment variables
import express from 'express'      // Web server framework
import cors from 'cors'            // Enable Cross-Origin Resource Sharing
import multer from 'multer'        // Handle multipart/form-data for file uploads
import axios from 'axios'          // Make HTTP requests to external APIs
import FormData from 'form-data'   // Create multipart/form-data payloads
import { promises as fs } from 'fs'  // File system operations (Promise-based)
import { fileURLToPath } from 'url'  // Convert file URL to path
import { dirname } from 'path'       // Get directory name from path

// Set up ES modules compatibility for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env file
dotenv.config()

// Initialize Express application and multer for file uploads
const app = express()
const upload = multer({ dest: 'uploads/' })  // Configure upload directory

// Middleware setup
app.use(cors())                    // Allow cross-origin requests
app.use(express.json())            // Parse JSON request bodies

/**
 * Configuration for different AI model endpoints
 * Each endpoint has its own URL and authentication method:
 * - endpoint1: Azure ML endpoint using Bearer token
 * - endpoint2: Azure Custom Vision endpoint using Prediction-Key
 * - endpoint3: Azure Custom Vision endpoint using Prediction-Key
 */
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

/**
 * POST /api/classify - Vehicle Classification Endpoint
 * Uses multer middleware to handle multipart/form-data image uploads:
 * - upload.single('image'): Processes a single file from field named 'image'
 * - Automatically saves file to ./uploads directory
 * - Adds file info to req.file object containing:
 *   - originalname: Original file name from user's system
 *   - path: Temporary path where file is saved
 *   - mimetype: Type of file (e.g., image/jpeg, image/png, image/gif)
 *   The API accepts JPEG, PNG, and GIF image formats
 * 
 * @param {Object} req.file - Contains uploaded file information from multer
 * @param {string} req.query.endpoint - The AI model to use (endpoint1, endpoint2, or endpoint3)
 * @returns {Object} JSON response with classification results
 */
app.post('/api/classify', upload.single('image'), async (req, res) => {
  // Validate image file was provided
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image file provided' })
  }

  // Get selected endpoint from query params or default to endpoint1
  const selectedEndpoint = req.query.endpoint || 'endpoint1'
  const endpoint = endpoints[selectedEndpoint]

  // Validate endpoint selection
  if (!endpoint) {
    return res.status(400).json({ success: false, error: 'Invalid endpoint selected' })
  }

  try {
    let response

    // Ensure uploads directory exists for temporary files
    await fs.mkdir('uploads', { recursive: true })
    
    if (selectedEndpoint === 'endpoint1') {
      // Handle Azure ML endpoint (endpoint1)
      // Requires multipart/form-data format
      const formData = new FormData()
      const fileContent = await fs.readFile(req.file.path)
      formData.append('image', fileContent, req.file.originalname)
      
      response = await axios.post(endpoint.url, formData, {
        headers: {
          ...endpoint.headers,
          ...formData.getHeaders()
        }
      })

      // Clean up temporary file
      await fs.unlink(req.file.path)

      // Validate response format
      if (!response.data || !response.data.predictions) {
        throw new Error('Invalid response format from endpoint1')
      }

      // Format response for frontend
      return res.json({
        success: true,
        prediction: response.data.prediction,
        predictions: Object.entries(response.data.predictions || {}).map(([tagName, probability]) => ({
          tagName,
          probability
        })).sort((a, b) => b.probability - a.probability)
      })
    } else {
      // Handle Azure Custom Vision endpoints (endpoint2 and endpoint3)
      // Requires raw image data
      const imageBuffer = await fs.readFile(req.file.path)
      
      response = await axios.post(endpoint.url, imageBuffer, {
        headers: endpoint.headers
      })

      // Clean up temporary file
      await fs.unlink(req.file.path)

      // Validate response format
      if (!response.data || !response.data.predictions) {
        throw new Error(`Invalid response format from ${selectedEndpoint}`)
      }

      // Sort predictions array by probability (confidence score) in descending order
      // Uses array.sort() with comparison function that subtracts probabilities
      // Example: [{ prob: 0.3 }, { prob: 0.8 }, { prob: 0.5 }] -> [{ prob: 0.8 }, { prob: 0.5 }, { prob: 0.3 }]
      const sortedPredictions = response.data.predictions
        .sort((a, b) => b.probability - a.probability)

      // Format response for frontend consumption:
      // - success: indicates successful API call and valid response
      // - prediction: contains the highest confidence prediction (first item after sorting)
      //   with its category name and probability score
      // - predictions: full array of all predictions, sorted by confidence,
      //   allowing frontend to display complete results if needed
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
    
    // Clean up temporary file in case of error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path)
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError)
      }
    }

    // Return error response to client
    return res.status(500).json({
      success: false,
      error: error.response?.data?.error || error.message
    })
  }
})

// Start server on specified port or default to 3111
const PORT = process.env.PORT || 3111
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
