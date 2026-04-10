# PorEsoJefe 🚦

> 🚀 AI-powered chatbot for understanding traffic laws in Mexico using NLP and machine learning.

PorEsoJefe is a mobile application in development designed to provide informative and educational support regarding traffic laws in Mexico.

The system allows users to ask questions in natural language and receive responses based on legal traffic regulations, helping people better understand their rights and obligations while driving.

---

## 🎯 Objective

To assist individuals who are not familiar with traffic laws by providing an intelligent chatbot capable of interpreting natural language queries and responding with relevant legal information.

---

## ⚙️ Current Scope

- Functional mobile application (React Native / Expo)
- Backend developed with Node.js
- NLP module implemented in Python for intent classification
- Knowledge base built from traffic law articles
- Responses based on structured legal information
- Current dataset focused on Jojutla, Morelos

---

## 🧠 System Architecture

The system integrates multiple components:

- **Mobile App:** User interaction and chat interface  
- **Backend (Node.js):** Handles requests and article retrieval  
- **NLP Module (Python):** Classifies user intent  
- **Knowledge Base:** JSON-based legal articles  

---

## ⚙️ How It Works

1. The user sends a traffic-law-related question through the mobile application.
2. The request is processed by the Node.js backend.
3. The text is analyzed by the NLP module implemented in Python.
4. A trained intent classification model predicts the most likely user intent.
5. Based on the predicted intent, the system retrieves the corresponding legal article.
6. The response is returned to the user in a clear and accessible format.

---

## 🧠 Machine Learning

The NLP component is based on a supervised learning pipeline for intent classification.

Current implementation:
- **Text vectorization:** TF-IDF
- **Feature extraction:** unigrams and bigrams
- **Classifier:** Linear Support Vector Classifier (`LinearSVC`)
- **Training split:** stratified train/test split
- **Model persistence:** `joblib`

The model is trained using a custom JSONL dataset containing labeled traffic-law-related queries.

---

## 🤖 Intent Prediction

The prediction module loads the trained model and classifies user queries into the most likely intent category.

Current behavior:
- If the model supports probability estimation, the system returns top predicted intents with confidence scores.
- In the current implementation, the classifier is based on `LinearSVC`, so the prediction returns the predicted intent along with an approximate confidence value.

This module is designed for:
- Command-line testing
- Backend integration
- Real-time user interaction

---

## 📚 Knowledge Base

The chatbot uses a structured dataset composed of **more than 130 traffic law articles** based on official regulations from Jojutla, Morelos.

These articles are categorized and processed to allow efficient retrieval and interpretation.

---

## 📱 Application Preview

<p align="center">
  <img src="https://github.com/user-attachments/assets/459e0a44-e800-4299-9b84-696c0750abbe" width="250"/>
  <img src="https://github.com/user-attachments/assets/4b603c50-da02-4c3e-8b11-ce1ecca66318" width="250"/>
  <img src="https://github.com/user-attachments/assets/ecd1edd1-3170-4657-a611-154aa15871f5" width="250"/>
  <img src="https://github.com/user-attachments/assets/740f7997-cf76-4848-8451-ee3846a0ba2d" width="250"/>
</p>

---

## 🚧 Project Status

This project is currently under development.

The current version demonstrates:

- Core system architecture  
- Mobile interface  
- NLP integration  
- Legal data processing  

---

## 📈 Scalability

The system was designed with scalability in mind.

Future implementations aim to:

- Extend coverage to multiple municipalities and states in Mexico  
- Dynamically adapt responses based on user location  
- Expand the legal knowledge base  

---

## 🔮 Future Work

- Integration with geolocation APIs (e.g., location-based law detection)  
- Improved NLP model performance (precision, recall, F1-score)  
- Expansion of dataset and legal coverage  
- Deployment of backend services  
- Real-time interaction improvements  

---

## 🛠️ Technologies Used

- JavaScript (Node.js)  
- Python (scikit-learn)  
- React Native / Expo  
- JSON (data storage)  

---

## 👨‍💻 Author

**Miguel Ángel Barrera Campos**  
Computer Systems Engineering Student  
Specialized in Data Science  
