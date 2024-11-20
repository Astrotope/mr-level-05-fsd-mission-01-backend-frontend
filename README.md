# Mission Ready Level 05 - Mission 01 - Express Backend and React Frontend

## Frontend UI (React, Tailwind CSS, Semantic UI, Vite (HMR))

  * Location: /
  * Start Command: npm run dev
  * URL: http://localhost:5173/
  
## Backend API Endpoint Wrapper (Nodej.js, Express.js)

  * Location: /server
  * Start Command: npm start
  * URL: http://localhost:3111

## Machine Learning Model Endpoints

  * Azure Custom Vision
    * https://mrlevel05fsdmission01customvision-prediction.cognitiveservices.azure.com/customvision/v3.0/Prediction/11b2df83-5803-4460-a114-7ab4050aacfb/classify/iterations/MR_VEHICLE_AI_ID_04/image
    * Request format:
      * Headers:
        * Prediction-Key: [Prediction Key]
        * Content-Type: application/octet-stream
      * Body:
        * form-data: {'image': file}
    * Example response:
    
```
{
    "message": "Image and form data received and processed successfully!",
    "prediction": {
        "category": "van",
        "probability": 0.9991376399993896
    },
    "predictions": {
        "cab": 1.1198282969318574e-12,
        "convertible": 1.1907978769709615e-10,
        "coupe": 1.288962968477858e-13,
        "hatchback": 0.000565718044526875,
        "minivan": 4.828480541618774e-06,
        "sedan": 1.170544355888481e-10,
        "suv": 0.00029146479209885,
        "truck": 2.240823304688888e-09,
        "van": 0.9991376399993896,
        "wagon": 3.2504817681910936e-07
    }
}
```

  * Azuer ML Service Custom Endpoint
    * https://ai-vehicle-id-202411181207.australiaeast.inference.ml.azure.com/predict
    * Request format:
      * Headers:
        * Content-Transfer-Encoding: application/json
        * Authorization: Bearer [API Key]
      * Body:
        * form-data: {'image': file}
    * Example response:
    
```
{
    "id": "56071738-5c1c-475d-a9ba-5e8ed24071b7",
    "project": "11b2df83-5803-4460-a114-7ab4050aacfb",
    "iteration": "af81cf37-b99f-436f-bc5f-f266a260da81",
    "created": "2024-11-18T08:20:12.232Z",
    "predictions": [
        {
            "probability": 0.9019991,
            "tagId": "529d484d-a1a0-45b6-9cf3-f4cd8cc6cc16",
            "tagName": "Hatchback"
        },
        {
            "probability": 0.03417771,
            "tagId": "86f23547-c358-40d4-a678-1f3edd5d76af",
            "tagName": "Sedan"
        },
        {
            "probability": 0.029618248,
            "tagId": "55603000-5d4e-47ca-9a9e-629e0998c96a",
            "tagName": "Coupe"
        },
        {
            "probability": 0.02134795,
            "tagId": "d8c7acf0-d7da-48fd-bc0a-e0505f670bb1",
            "tagName": "Convertible"
        },
        {
            "probability": 0.011801845,
            "tagId": "a9d216fd-7f0d-41cb-bcfe-b308941f3793",
            "tagName": "Wagon"
        },
        {
            "probability": 0.0007898296,
            "tagId": "b8cad021-cc22-4c5a-a8e3-f348a7c6783a",
            "tagName": "SUV"
        },
        {
            "probability": 0.000160571,
            "tagId": "8b130c36-5f93-4d01-8321-03d59c31595d",
            "tagName": "Cab"
        },
        {
            "probability": 6.1412924E-05,
            "tagId": "c39ed020-8ced-4318-b863-f070acf27de2",
            "tagName": "Minivan"
        },
        {
            "probability": 4.332852E-05,
            "tagId": "9081ce12-0c24-4233-b5c0-41f3f1bc4b47",
            "tagName": "Van"
        }
    ]
}
```

## Powered by React + Vite

This webapp is based on a  template that provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Coded using  Windsurf (Agentic AI) Editor by Codeium

- [Windsurf by Codeim](https://codeium.com/windsurf)
  - "The first agentic IDE, and then some. The Windsurf Editor is where the work of developers and AI truly flow together, allowing for a coding experience that feels like literal magic."
