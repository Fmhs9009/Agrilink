# AgroLink - Connecting Farmers and Buyers

AgroLink is a platform that connects farmers directly with buyers, eliminating middlemen and ensuring fair prices for agricultural products.

## Project Structure

The project consists of two main parts:
- **Frontend**: React application in the `agrolink` directory
- **Backend**: Node.js/Express API in the `ServerSide` directory

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Cloudinary account

### Backend Setup
1. Navigate to the ServerSide directory:
   ```
   cd ServerSide
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example` and fill in your credentials:
   ```
   cp .env.example .env
   ```

4. Start the backend server:
   ```
   npm start
   ```

### Frontend Setup
1. Navigate to the agrolink directory:
   ```
   cd agrolink
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example` and fill in your credentials:
   ```
   cp .env.example .env
   ```

4. Start the frontend development server:
   ```
   npm start
   ```

## Product Upload Process

The product upload process in AgroLink follows these steps:

1. **Image Upload**:
   - Images are first uploaded to Cloudinary via the `/api/v1/upload/image` endpoint
   - Each image receives a unique `public_id` and URL from Cloudinary
   - Images are stored in the 'products' folder on Cloudinary

2. **Product Data Submission**:
   - After images are uploaded, the product data (including image URLs and public IDs) is submitted to the `/api/v1/products/new` endpoint
   - The product data includes:
     - Basic information (name, description, category, etc.)
     - Pricing and inventory details
     - Growing information
     - Seasonal availability
     - Farming practices
     - Contract preferences (if applicable)
     - Image URLs and public IDs

3. **Database Storage**:
   - The product data is stored in MongoDB
   - Each product is associated with the farmer who created it
   - The product includes references to the Cloudinary image URLs

4. **Product Management**:
   - Farmers can view, edit, and delete their products
   - Products can be filtered by category, price, and other attributes

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup`: Register a new user
- `POST /api/v1/auth/login`: Login a user
- `POST /api/v1/auth/logout`: Logout a user

### Products
- `GET /api/v1/products`: Get all products
- `GET /api/v1/products/product/:id`: Get a specific product
- `POST /api/v1/products/new`: Create a new product
- `PUT /api/v1/products/product/:id`: Update a product
- `DELETE /api/v1/products/product/:id`: Delete a product
- `GET /api/v1/products/farmer/products`: Get all products for the logged-in farmer

### Image Upload
- `POST /api/v1/upload/image`: Upload an image to Cloudinary

## Technologies Used

### Frontend
- React
- Redux for state management
- React Router for routing
- Tailwind CSS for styling
- Axios for API requests

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Cloudinary for image storage
- Express-fileupload for file uploads 