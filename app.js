const express = require('express');
const multer = require('multer');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({
  dest: 'uploads/', 
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

app.use(express.static('public'));

// API endpoint to update the phone number in the uploaded image
app.post('/update-contact-number', upload.single('image'), async (req, res) => {
    const { newNumber, textColor, backgroundColor, startX, startY, endX, endY } = req.body;
    console.log(req.body);
    

  if (!newNumber || !textColor || !backgroundColor || !startX || !startY || !endX || !endY) {
    return res.status(400).send('Missing required fields');
  }

  const imagePath = req.file ? req.file.path : path.join(__dirname, 'images', 'original_image.jpg');
  const outputPath = path.join(__dirname, 'output', 'updated_image.jpg');
  console.log(__dirname);
  
  try {
    await updateContactNumber(imagePath, newNumber, textColor, backgroundColor, 
      parseInt(startX), parseInt(startY), parseInt(endX), parseInt(endY), outputPath);
    res.download(outputPath, 'updated_image.jpg', () => {
      // Clean up the output image after download
      fs.unlinkSync(outputPath);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating image');
  } finally {
    if (req.file) fs.unlinkSync(req.file.path); // Clean up uploaded file
  }
});

async function updateContactNumber(imagePath, newNumber, textColor, backgroundColor, 
  startX, startY, endX, endY, outputPath) {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');

  // Draw the original image
  ctx.drawImage(image, 0, 0);

  // Define the rectangle dimensions
  const rectWidth = endX - startX;
  const rectHeight = endY - startY;

  // Set the background color and draw the rectangle
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(startX, startY, rectWidth, rectHeight);

  // Set the text color and draw the text
  ctx.fillStyle = textColor;
  ctx.font = '600 60px Oswald' // Adjust as needed
  ctx.fillText(newNumber, startX + 10, startY + rectHeight / 2 + 15); // Adjust text position as needed

  // Save the updated image
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync(outputPath, buffer);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
