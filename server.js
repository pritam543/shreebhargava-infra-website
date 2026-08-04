const express = require('express');
const { Resend } = require('resend');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Resend with the API key from environment variables
const resend = new Resend(process.env.EMAIL_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(__dirname));

// Multer setup for handling resume/file uploads in memory
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // Limit: 5MB max file size
});

// 1. Contact Form Route -> Sends to shreebhargavainfra@gmail.com
app.post('/contact', async (req, res) => {
    try {
        const { name, email, phone, subject_text, message } = req.body;

        const emailText = `
            New Contact Form Submission:
            
            Name: ${name}
            Email: ${email}
            Phone: ${phone}
            Subject: ${subject_text || 'Website Contact Message'}
            Message: ${message}
        `;

        const response = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: ['shreebhargavainfra@gmail.com'],
            subject: `New Inquiry from ${name}`,
            text: emailText
        });

        console.log('Contact Email Sent:', response);
        res.status(200).json({ success: true, message: 'Email sent successfully!' });
    } catch (error) {
        console.error('Contact Form Error:', error);
        res.status(500).json({ success: false, message: 'Failed to send email. Server Error.' });
    }
});

// 2. Careers Form Route (with Resume/File Attachment) -> Sends to shreebhargava50@gmail.com
app.post('/careers', upload.single('file_upload'), async (req, res) => {
    try {
        const { name, email, phone, position, experience, cover } = req.body;
        const resumeFile = req.file;

        let attachments = [];
        if (resumeFile) {
            attachments.push({
                filename: resumeFile.originalname,
                content: resumeFile.buffer
            });
        }

        const emailText = `
            New Career / Vendor / Contractor Submission:
            
            Name: ${name}
            Email: ${email}
            Phone: ${phone}
            Position / Category: ${position || 'N/A'}
            Experience / Details: ${experience || 'N/A'}
            Message: ${cover || 'N/A'}
        `;

        const emailPayload = {
            from: 'onboarding@resend.dev',
            to: ['shreebhargava50@gmail.com'],
            subject: `New Application/Partnership from ${name}`,
            text: emailText
        };

        // Attach file if uploaded
        if (attachments.length > 0) {
            emailPayload.attachments = attachments;
        }

        const response = await resend.emails.send(emailPayload);

        console.log('Careers Email Sent:', response);
        res.status(200).json({ success: true, message: 'Application submitted successfully!' });
    } catch (error) {
        console.error('Careers Form Error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit application. Server Error.' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});