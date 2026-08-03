const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ==========================================
// 🔍 DEBUG LOGS (Ye check karne ke liye ki .env sahi read ho raha hai ya nahi)
// ==========================================
console.log("\n-----------------------------------------");
console.log("🔍 CHECKING LOADED ENV VARIABLES:");
console.log("--> EMAIL_USER:", process.env.EMAIL_USER ? process.env.EMAIL_USER : "❌ MISSING");
console.log("--> EMAIL_PASS Length:", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim().length : 0, "(16 hona chahiye)");
console.log("--> CAREERS_EMAIL:", process.env.CAREERS_EMAIL ? process.env.CAREERS_EMAIL : "❌ MISSING");
console.log("--> CONTACT_EMAIL:", process.env.CONTACT_EMAIL ? process.env.CONTACT_EMAIL : "❌ MISSING");
console.log("-----------------------------------------\n");

// Multer Setup (Resume File Memory Buffer)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB Limit
});

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '',
        pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : ''
    }
});

// Verify Nodemailer Transporter Connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Gmail Transporter Connection Error:", error.message);
    } else {
        console.log("✅ Gmail SMTP Server Ready to Send Emails!");
    }
});

// ==========================================
// 1. CAREERS FORM ROUTE (Resume -> Email 1)
// ==========================================
app.post('/careers', upload.single('resume'), async (req, res) => {
    console.log("\n📩 [CAREERS FORM] New Request Received!");
    console.log("--> Form Data:", req.body);
    console.log("--> Uploaded File:", req.file ? req.file.originalname : "NO FILE ATTACHED");

    try {
        const { name, email, phone, position, experience, cover } = req.body;
        const resumeFile = req.file;

        if (!resumeFile) {
            console.log("⚠️ Validation Failed: Resume file missing!");
            return res.status(400).json({ message: "Resume upload is required!" });
        }

        const mailOptions = {
            from: `"SBA Careers Portal" <${process.env.EMAIL_USER}>`,
            to: process.env.CAREERS_EMAIL,
            replyTo: email,
            subject: `💼 New Job Application: ${position || 'Applicant'} - ${name || 'Candidate'}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #ff6600; border-radius: 8px;">
                    <h2 style="color: #ff6600; margin-bottom: 10px;">SBA Infra - New Job Application Received</h2>
                    <hr>
                    <p><strong>Applicant Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone}</p>
                    <p><strong>Position Applied:</strong> ${position}</p>
                    <p><strong>Experience:</strong> ${experience}</p>
                    <br>
                    <p><strong>Cover Letter / Notes:</strong></p>
                    <blockquote style="background: #f4f4f4; padding: 12px; border-left: 4px solid #ff6600;">
                        ${cover || 'No additional details provided.'}
                    </blockquote>
                    <hr>
                    <p style="font-size: 0.8rem; color: #666;">Candidate resume is attached with this email.</p>
                </div>
            `,
            attachments: [
                {
                    filename: resumeFile.originalname,
                    content: resumeFile.buffer
                }
            ]
        };

        console.log("⏳ Sending Careers Email via Nodemailer...");
        await transporter.sendMail(mailOptions);
        console.log("✅ Careers Email Sent Successfully!");
        res.status(200).json({ message: "Application submitted successfully!" });

    } catch (error) {
        console.error("❌ CAREERS EMAIL DETAILED ERROR:", error);
        res.status(500).json({ message: "Failed to send application." });
    }
});

// ==========================================
// 2. CONTACT FORM ROUTE (Message -> Email 2)
// ==========================================
app.post('/contact', async (req, res) => {
    console.log("\n📩 [CONTACT FORM] New Request Received!");
    console.log("--> Data:", req.body);

    try {
        const { name, email, phone, subject, message } = req.body;

        const mailOptions = {
            from: `"SBA Website Inquiry" <${process.env.EMAIL_USER}>`,
            to: process.env.CONTACT_EMAIL,
            replyTo: email,
            subject: `📩 New Client Inquiry: ${subject || 'General Inquiry'} - ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #11161e; border-radius: 8px;">
                    <h2 style="color: #ff6600; margin-bottom: 10px;">SBA Infra - New Contact Message</h2>
                    <hr>
                    <p><strong>Client Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <br>
                    <p><strong>Message / Requirement:</strong></p>
                    <blockquote style="background: #f4f4f4; padding: 12px; border-left: 4px solid #11161e;">
                        ${message}
                    </blockquote>
                </div>
            `
        };

        console.log("⏳ Sending Contact Email via Nodemailer...");
        await transporter.sendMail(mailOptions);
        console.log("✅ Contact Email Sent Successfully!");
        res.status(200).json({ message: "Message sent successfully!" });

    } catch (error) {
        console.error("❌ CONTACT EMAIL DETAILED ERROR:", error);
        res.status(500).json({ message: "Failed to send message." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 SBA Infra Server running on http://localhost:${PORT}`);
});