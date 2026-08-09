const express = require('express');
const { Resend } = require('resend');
const multer = require('multer');
const path = require('path');

const app = express();

// Initialize Resend with Environment Variable
const resend = new Resend(process.env.RESEND_API_KEY);

// Configure multer to handle file uploads in memory
const upload = multer();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// 1. Contact Form Route
app.post('/contact', upload.none(), async (req, res) => {
    try {
        const { name, email, phone, subject_text, message } = req.body;
        const targetEmail = process.env.CONTACT_EMAIL || 'shreebhargava50@gmail.com';

        const data = await resend.emails.send({
            from: 'Shree Bhargava Website <onboarding@resend.dev>',
            to: [targetEmail],
            subject: `New Contact Message: ${subject_text || 'General'}`,
            html: `
                <h3>New Contact Inquiry</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Subject:</strong> ${subject_text}</p>
                <p><strong>Message:</strong> ${message}</p>
            `
        });

        console.log('Contact Email Sent:', data);
        res.status(200).json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Contact Email Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Careers / Vendors / Contractors Form Route (Supports Resume File Upload)
app.post('/careers', upload.single('resume'), async (req, res) => {
    try {
        const { name, email, phone, position, experience, cover } = req.body;
        const targetEmail = process.env.CAREERS_EMAIL || 'shreebhargava50@gmail.com';

        let attachments = [];
        if (req.file) {
            attachments.push({
                filename: req.file.originalname,
                content: req.file.buffer
            });
        }

        const data = await resend.emails.send({
            from: 'Shree Bhargava Careers <onboarding@resend.dev>',
            to: [targetEmail],
            subject: `New Application / Submission: ${position || 'Applicant'}`,
            html: `
                <h3>New Submission from Careers Portal</h3>
                <p><strong>Name/Firm:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Position/Category:</strong> ${position}</p>
                <p><strong>Experience / Details:</strong> ${experience || 'N/A'}</p>
                <p><strong>Cover Message:</strong> ${cover || 'N/A'}</p>
            `,
            attachments: attachments
        });

        console.log('Career Email Sent:', data);
        res.status(200).json({ success: true, message: 'Application submitted successfully!' });
    } catch (error) {
        console.error('Career Email Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});