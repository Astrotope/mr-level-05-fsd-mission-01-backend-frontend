import { useState } from 'react'
import { Button, Dropdown, Container, Header, Message, Segment, Form, Progress, Image } from 'semantic-ui-react'
import axios from 'axios'

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

const endpoints = [
  { key: 'endpoint1', text: 'Model 1 (AZML1)', value: 'endpoint1' },
  { key: 'endpoint2', text: 'Model 2 (AZCV1)', value: 'endpoint2' },
  { key: 'endpoint3', text: 'Model 3 (AZCV2)', value: 'endpoint3' }
]

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [allPredictions, setAllPredictions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedEndpoint, setSelectedEndpoint] = useState('endpoint1')
  const [selectedClass, setSelectedClass] = useState('')
  const [isVehicleConfirmed, setIsVehicleConfirmed] = useState(false)
  const [email, setEmail] = useState('')
  const [isQuoteSent, setIsQuoteSent] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)

  const capitalizeFirstLetter = (string) => {
    return string ? string.charAt(0).toUpperCase() + string.slice(1).toLowerCase() : '';
  }

  const getVehicleDisplayName = (tagName) => {
    const vehicleClass = vehicleClasses.find(vc => vc.value === tagName.toLowerCase());
    return vehicleClass ? vehicleClass.text : capitalizeFirstLetter(tagName);
  }

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

  const handleEndpointChange = (endpoint) => {
    setSelectedEndpoint(endpoint)
    setPrediction(null)
    setAllPredictions([])
    setError(null)
    setSelectedClass('')
    setIsVehicleConfirmed(false)
    setIsQuoteSent(false)
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select an image file')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      const response = await axios.post(
        `http://localhost:3111/api/classify?endpoint=${selectedEndpoint}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      if (response.data.success) {
        setPrediction(response.data.prediction)
        setAllPredictions(response.data.predictions)
        setSelectedClass(response.data.prediction.category.toLowerCase())
      } else {
        throw new Error(response.data.error)
      }
    } catch (err) {
      console.error('API Error:', err)
      setError('Error classifying image: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmClass = () => {
    const confirmedClass = selectedClass
    console.log('Confirmed vehicle class:', confirmedClass)
    setIsVehicleConfirmed(true)
  }

  const handleSendQuote = () => {
    console.log('Sending quote to:', email)
    setIsQuoteSent(true)
    // Add logic here to send the quote
  }

  return (
    <Container className="flex flex-col pt-8">
      <Header as='h1' textAlign='center' size='huge' className="mb-8">
        Car Insurance Quote
      </Header>

      <Segment raised padded>
        <div className="space-y-6">
          <div>
            <Header as='h2' size='medium'>Select AI Model</Header>
            <Button.Group>
              {endpoints.map(endpoint => (
                <Button 
                  key={endpoint.key}
                  primary={selectedEndpoint === endpoint.value}
                  onClick={() => handleEndpointChange(endpoint.value)}
                >
                  {endpoint.text}
                </Button>
              ))}
            </Button.Group>
          </div>

          <Form>
            <Form.Field>
              <label>Upload Vehicle Image</label>
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

          {error && (
            <Message negative>
              <Message.Header>Error</Message.Header>
              <p>{error}</p>
            </Message>
          )}

          {prediction && (
            <div className="mt-6 space-y-4">
              <Message positive>
                <Message.Header>Vehicle Classification Result</Message.Header>
                <p>Your vehicle appears to be a {getVehicleDisplayName(prediction.category)} ({(prediction.probability * 100).toFixed(2)}% confidence)</p>
              </Message>

              {allPredictions.length > 0 && (
                <Segment>
                  <Header as='h3' size='small'>All Predictions</Header>
                  <div className="space-y-3">
                    {allPredictions.map((pred, index) => (
                      <div key={pred.tagName}>
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

              <div>
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

          {isVehicleConfirmed && (
            <div className="mt-6 space-y-4">
              <Message positive>
                <p>
                  Thanks for confirming your Vehicle is a {capitalizeFirstLetter(selectedClass)}, 
                  please enter your email in the box below and click the button to get a free automatic quote.
                </p>
              </Message>
              <Form>
                <Form.Field>
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                  />
                </Form.Field>
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