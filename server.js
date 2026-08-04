const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory (so index.html and other website files load properly)
app.use(express.static(__dirname));

// Multer setup for handling resume/file uploads in memory
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // Limit: 5MB max file size
});

// Nodemailer Transporter Configuration with Timeout Fix
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for port 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000,
    socketTimeout: 30000
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('SMTP Connection Error:', error);
    } else {
        console.log('Server is ready to take our messages');
    }
});

// 1. Contact Form Route
app.post('/contact', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
            subject: `New Contact Form Submission from ${name}`,
            text: `
                Name: ${name}
                Email: ${email}
                Phone: ${phone}
                Message: ${message}
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Email sent successfully!' });
    } catch (error) {
        console.error('Contact Form Error:', error);
        res.status(500).json({ success: false, message: 'Failed to send email. Connection Timeout or Server Error.' });
    }
});

// 2. Careers Form Route (with Resume/File Attachment)
app.post('/careers', upload.single('resume'), async (req, res) => {
    try {
        const { name, email, phone, position } = req.body;
        const resumeFile = req.file;

        let attachments = [];
        if (resumeFile) {
            attachments.push({
                filename: resumeFile.originalname,
                content: resumeFile.buffer
            });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
            subject: `New Job Application for ${position || 'Open Position'}`,
            text: `
                New Career Application Details:
                
                Name: ${name}
                Email: ${email}
                Phone: ${phone}
                Position Applied For: ${position}
            `,
            attachments: attachments
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Application submitted successfully!' });
    } catch (error) {
        console.error('Careers Form Error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit application. Connection Timeout or Server Error.' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});