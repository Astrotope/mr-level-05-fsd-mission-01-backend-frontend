// Import required React components and libraries
import React, { useState } from 'react'
// Semantic UI React components used:
// - Container: Responsive wrapper that centers content
// - Header: Styled heading component with size variants
// - Form: Groups form elements with consistent styling
// - Button: Styled button with various states and colors
// - Image: Responsive image component with built-in sizing
// - Segment: Groups related content in a box with padding
// - Loader: Loading spinner animation
// - Message: Styled message box for feedback and errors
// - Dropdown: Select input component with customizable options
// - Progress: Progress bar component for visualizing data
import { Container, Header, Form, Button, Image, Segment, Loader, Message, Dropdown, Progress } from 'semantic-ui-react'
import axios from 'axios'

// Predefined list of vehicle classes with their display names and values
const vehicleClasses = [
  { key: 'sedan', text: 'Sedan', value: 'sedan' },
  { key: 'suv', text: 'SUV', value: 'suv' },
  { key: 'truck', text: 'Truck', value: 'truck' },
  { key: 'van', text: 'Van', value: 'van' },
  { key: 'wagon', text: 'Wagon', value: 'wagon' },
  { key: 'coupe', text: 'Coupe', value: 'coupe' },
  { key: 'convertible', text: 'Convertible', value: 'convertible' },
  { key: 'hatchback', text: 'Hatchback', value: 'hatchback' },
  { key: 'minivan', text: 'Minivan', value: 'minivan' },
  { key: 'cab', text: 'Ute (Utility)', value: 'cab' },
  { key: 'Negative', text: '(No vehicle identified)', value: 'negative' }
]

// Configuration for the four AI models available for vehicle classification
const endpoints = [
  { key: 'endpoint1', text: 'Model 1 (AZML1)', value: 'endpoint1' },
  { key: 'endpoint2', text: 'Model 2 (AZML2)', value: 'endpoint2' },
  { key: 'endpoint3', text: 'Model 3 (AZCV1)', value: 'endpoint3' },
  { key: 'endpoint4', text: 'Model 4 (AZCV2)', value: 'endpoint4' }
]

// Main application component that handles the car insurance quote process
function App() {
  // File handling states
  const [selectedFile, setSelectedFile] = useState(null)        // Stores the uploaded image file
  const [imagePreview, setImagePreview] = useState(null)        // Stores the data URL for image preview

  // AI prediction states
  const [prediction, setPrediction] = useState(null)            // Stores the primary prediction from the AI model
  const [allPredictions, setAllPredictions] = useState([])      // Stores all predictions with confidence scores
  const [selectedEndpoint, setSelectedEndpoint] = useState('endpoint1')  // Currently selected AI model endpoint

  // UI state management
  const [loading, setLoading] = useState(false)                 // Controls loading state during API calls
  const [error, setError] = useState(null)                      // Stores error messages from API or validation
  const [selectedClass, setSelectedClass] = useState('')        // User-selected or AI-predicted vehicle class
  const [isVehicleConfirmed, setIsVehicleConfirmed] = useState(false)  // Tracks if user confirmed vehicle class

  // Quote request states
  const [email, setEmail] = useState('')                        // Stores user's email for quote
  const [isQuoteSent, setIsQuoteSent] = useState(false)        // Tracks if quote request was sent

  /**
   * Capitalizes the first letter of a string and converts the rest to lowercase
   * @param {string} string - The input string to transform
   * @returns {string} The transformed string or empty string if input is falsy
   */
  const capitalizeFirstLetter = (string) => {
    return string ? string.charAt(0).toUpperCase() + string.slice(1).toLowerCase() : '';
  }

  /**
   * Converts internal vehicle class tags to user-friendly display names
   * Searches the vehicleClasses array for a matching tag and returns its display name
   * Falls back to capitalized tag name if no match is found
   * @param {string} tagName - The vehicle class tag from the AI model
   * @returns {string} User-friendly display name for the vehicle class
   */
  const getVehicleDisplayName = (tagName) => {
    const vehicleClass = vehicleClasses.find(vc => vc.value === tagName.toLowerCase());
    return vehicleClass ? vehicleClass.text : capitalizeFirstLetter(tagName);
  }

  /**
   * Handles file upload and preview generation
   * Resets all prediction and confirmation states when a new file is selected
   * Creates a preview URL for the selected image using FileReader
   * @param {Event} event - The file input change event
   */
  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPrediction(null)
      setAllPredictions([])
      setError(null)
      setSelectedClass('')
      setIsVehicleConfirmed(false)
      setIsQuoteSent(false)
      // Don't clear email when selecting a new file
      // setEmail('')

      // Create image preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  /**
   * Handles switching between different AI models
   * Resets all prediction and confirmation states when changing models
   * Maintains the selected file and preview
   * @param {string} endpoint - The selected endpoint identifier
   */
  const handleEndpointChange = (endpoint) => {
    setSelectedEndpoint(endpoint)
    setPrediction(null)
    setAllPredictions([])
    setError(null)
    setSelectedClass('')
    setIsVehicleConfirmed(false)
    setIsQuoteSent(false)
  }

  /**
   * Processes image classification using the selected AI model
   * Validates file selection, manages loading state, and handles errors
   * Makes API call to backend for classification
   * Updates prediction states with API response
   */
  const handleSubmit = async () => {
    // Validate that an image file has been selected
    if (!selectedFile) {
      setError('Please select an image file')
      return
    }

    // Set loading state and clear any previous errors
    setLoading(true)
    setError(null)

    try {
      // Prepare form data for API request
      const formData = new FormData()
      formData.append('image', selectedFile)

      // Make POST request to classification API with selected model endpoint
      const response = await axios.post(
        `http://localhost:3111/api/classify?endpoint=${selectedEndpoint}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      // Handle successful API response
      if (response.data.success) {
        // Update states with primary prediction and all predictions
        setPrediction(response.data.prediction)
        setAllPredictions(response.data.predictions)
        // Set the selected class to the predicted category
        setSelectedClass(response.data.prediction.category.toLowerCase())
      } else {
        // If API returns success: false, throw error
        throw new Error(response.data.error)
      }
    } catch (err) {
      // Log error for debugging and set user-friendly error message
      console.error('API Error:', err)
      setError('Error classifying image: ' + (err.response?.data?.error || err.message))
    } finally {
      // Reset loading state regardless of success or failure
      setLoading(false)
    }
  }

  /**
   * Processes user confirmation of vehicle class
   * Logs the confirmed class and updates confirmation state
   * Enables the quote request form after confirmation
   */
  const handleConfirmClass = () => {
    const confirmedClass = selectedClass
    console.log('Confirmed vehicle class:', confirmedClass)
    setIsVehicleConfirmed(true)
  }

  /**
   * Handles the quote request submission
   * Logs the email and updates quote sent state
   * TODO: Implement actual quote submission logic
   */
  const handleSendQuote = () => {
    console.log('Sending quote to:', email)
    setIsQuoteSent(true)
    // Add logic here to send the quote
  }

  return (
    // Main container for the car insurance quote application
    // Uses flex layout and top padding for proper spacing
    // Container component centers content and provides responsive padding
    <Container className="flex flex-col pt-8">
      {/* Header component with large size variant for main title */}
      {/* Header with bottom margin */}
      <Header as='h1' textAlign='center' size='huge' className="mb-8">
        Car Insurance Quote
      </Header>
      {/* Main content area with raised appearance and padding */}
      {/* Segment groups the main content in a box with padding and border */}
      <Segment raised padded>
        {/* Content container with vertical spacing between children */}
        <div className="space-y-6">
          {/* Model selection section - Allows users to choose between different AI models
              Displays models in a button group with 'OR' separators between options */}
          <div>
            <Header as='h2' size='medium'>Select AI Model</Header>
            {/* Button.Group component groups buttons with 'OR' separators */}
            <Button.Group>
              {endpoints.map((endpoint, index) => (
                <React.Fragment key={endpoint.key}>
                  {index > 0 && <Button.Or />}
                  {/* Button component with primary color and onClick event */}
                  <Button 
                    primary={selectedEndpoint === endpoint.value}
                    onClick={() => handleEndpointChange(endpoint.value)}
                  >
                    {endpoint.text}
                  </Button>
                </React.Fragment>
              ))}
            </Button.Group>
          </div>

          {/* Image upload and classification form section
              Includes:
              - File input with custom styling
              - Image preview with size constraints and shadow
              - Classification button that's disabled until an image is selected */}
          <Form>
            <Form.Field>
              <label>Upload Vehicle Image</label>
              {/* Tailwind classes for custom file input styling:
                  - block w-full: Makes input take full width
                  - text-sm text-gray-500: Small, gray text for the file name
                  - file:* classes style the "Choose File" button:
                    - mr-4: Right margin
                    - py-2 px-4: Padding vertical/horizontal
                    - rounded-full: Fully rounded corners
                    - border-0: No border
                    - text-sm font-semibold: Small, bold text
                    - bg-blue-500 text-white: Blue background, white text
                    - hover:bg-blue-600: Darker blue on hover
              */}
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-500 file:text-white
                  hover:file:bg-blue-600"
              />
            </Form.Field>

            {/* Image component displays the uploaded image responsively */}
            {imagePreview && (
              <div className="mt-4 mb-4">
                <Image 
                  src={imagePreview} 
                  alt="Vehicle preview" 
                  style={{ maxHeight: '300px', width: 'auto', margin: '0 auto' }}
                  className="rounded-lg shadow-md"
                />
              </div>
            )}

            {/* Button component with primary color, loading state, and disabled state */}
            <Button 
              primary 
              loading={loading}
              onClick={handleSubmit}
              disabled={!selectedFile}
              className="mt-4"
            >
              Identify My Vehicle Class
            </Button>
          </Form>

          {/* Error message section - Displays any API or validation errors
              Shows a negative message with header and error details */}
          {error && (
            <Message negative>
              <Message.Header>Error</Message.Header>
              <p>{error}</p>
            </Message>
          )}

          {/* Vehicle classification results and confirmation section - Only visible after successful classification
              Includes:
              - Primary prediction with confidence score
              - All predictions list with progress bars
              - Vehicle class confirmation/correction dropdown
              - Confirmation button */}
          {prediction && (
            <div className="mt-6 space-y-4">
              {/* Message component displays positive (green) message for successful classification */}
              <Message positive>
                <Message.Header>Vehicle Classification Result</Message.Header>
                <p>Your vehicle appears to be a {getVehicleDisplayName(prediction.category)} ({(prediction.probability * 100).toFixed(2)}% confidence)</p>
              </Message>

              {/* Section for displaying all predictions in a sorted list */}
              {allPredictions.length > 0 && (
                <Segment>
                  <Header as='h3' size='small'>All Predictions</Header>
                  <div className="space-y-3">
                    {allPredictions.map((pred, index) => (
                      <div key={pred.tagName}>
                        {/* Flex container for prediction label and percentage, with space between */}
                        <div className="flex justify-between text-sm mb-1">
                          <span>{getVehicleDisplayName(pred.tagName)}</span>
                          <span>{(pred.probability * 100).toFixed(2)}%</span>
                        </div>
                        <Progress 
                          percent={(pred.probability * 100).toFixed(1)} 
                          size='tiny'
                          color={index === 0 ? 'blue' : 'grey'}
                        />
                      </div>
                    ))}
                  </div>
                </Segment>
              )}

              {/* Vehicle class confirmation section */}
              <div>
                {/* Gray text with bottom margin */}
                <p className="text-gray-600 mb-2">
                  If this is not correct, please select your vehicle class from the dropdown below:
                </p>
                <Dropdown
                  placeholder='Select Vehicle Class'
                  fluid
                  selection
                  options={vehicleClasses}
                  value={selectedClass}
                  onChange={(_, { value }) => setSelectedClass(value)}
                  className="mb-4"
                />
                <Button
                  primary
                  fluid
                  size="large"
                  onClick={handleConfirmClass}
                  disabled={!prediction && !selectedClass}
                >
                  Yes, My Vehicle is a {getVehicleDisplayName(prediction ? prediction.category : selectedClass)}
                </Button>
              </div>
            </div>
          )}

          {/* Quote request section - Only visible after vehicle class confirmation
              Includes:
              - Success message with confirmed vehicle class
              - Email input form
              - Quote request button
              - Success message after quote is sent */}
          {isVehicleConfirmed && (
            <div className="mt-6 space-y-4">
              {/* Message component displays positive (green) message for confirmed vehicle class */}
              <Message positive>
                <p>
                  Thanks for confirming your Vehicle is a {capitalizeFirstLetter(selectedClass)}, 
                  please enter your email in the box below and click the button to get a free automatic quote.
                </p>
              </Message>
              <Form>
                <Form.Field>
                  <label>Email Address</label>
                  {/* Input component with custom styling for email input */}
                  {/* Email input with full width, rounded corners, and gray border */}
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                  />
                </Form.Field>
                {/* Button component with primary color, onClick event, and disabled state */}
                <Button
                  primary
                  fluid
                  size="large"
                  onClick={handleSendQuote}
                  disabled={!email}
                >
                  Send Me a Quote
                </Button>
              </Form>
              {/* Message component displays positive (green) message after quote is sent */}
              {isQuoteSent && (
                <Message positive>
                  <Message.Header>Success!</Message.Header>
                  <p>Your free insurance quote is on the way.</p>
                </Message>
              )}
            </div>
          )}
        </div>
      </Segment>
    </Container>
  )
}

export default App