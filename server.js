const express = require('express');
const { Resend } = require('resend');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

// Contact Form
app.post('/contact', async (req, res) => {
    try {
        const { name, email, phone, subject_text, message } = req.body;
        await resend.emails.send({
            from: 'Shree Bhargava <onboarding@resend.dev>',
            to: process.env.CONTACT_EMAIL,
            subject: `Contact: ${subject_text}`,
            html: `<p><b>Name:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Phone:</b> ${phone}</p><p><b>Message:</b> ${message}</p>`
        });
        res.send("<script>alert('Message Sent!'); window.location.href='/index.html';</script>");
    } catch (e) { res.status(500).send("Error: " + e.message); }
});

// Careers Form
app.post('/careers', upload.any(), async (req, res) => {
    try {
        const { name, email, phone, position, experience, cover } = req.body;
        const file = req.files && req.files[0];
        
        await resend.emails.send({
            from: 'Shree Bhargava HR <onboarding@resend.dev>',
            to: process.env.CAREERS_EMAIL,
            subject: `New Application: ${position}`,
            html: `<p><b>Name:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Phone:</b> ${phone}</p><p><b>Position:</b> ${position}</p><p><b>Msg:</b> ${cover}</p>`,
            attachments: file ? [{ filename: file.originalname, content: file.buffer }] : []
        });
        res.send("<script>alert('Application Submitted!'); window.location.href='/careers.html';</script>");
    } catch (e) { res.status(500).send("Error: " + e.message); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));