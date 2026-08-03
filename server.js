const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();

// ==========================================
// 🛡️ MIDDLEWARES & CORS POLICY
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.static(path.join(__dirname)));

// Multer Setup for File Uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB Limit
});

// ==========================================
// 📧 NODEMAILER TRANSPORTER CONFIGURATION
// (Optimized with Port 465 SSL for Render Cloud)
// ==========================================
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL Connection
    auth: {
        user: process.env.EMAIL_USER, // e.g. shreebhargava50@gmail.com
        pass: process.env.EMAIL_PASS  // Gmail App Password (16 characters)
    },
    connectionTimeout: 15000, // 15 seconds
    greetingTimeout: 15000,
    socketTimeout: 15000
});

// Verify connection configuration on start
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Gmail SMTP Transporter Error:", error.message);
    } else {
        console.log("✅ Gmail SMTP Server is Ready to Send Emails!");
    }
});

// ==========================================
// 💼 1. CAREERS / VENDORS / CONTRACTORS ROUTE
// ==========================================
app.post('/careers', upload.single('resume'), async (req, res) => {
    console.log("\n📩 [CAREERS/PORTAL FORM] Request Received!");
    try {
        const { 
            name, email, phone, position, experience, cover, 
            vendorName, contactPerson, category, gst, 
            contractorName, specialization 
        } = req.body;
        
        const resumeFile = req.file;

        let formType = "Job Application";
        let targetEmail = process.env.CAREERS_EMAIL || process.env.EMAIL_USER || "shreebhargava50@gmail.com";
        let applicantName = name || contactPerson || contractorName || vendorName || "Inquirer";

        if (category || vendorName) {
            formType = "Vendor / Supplier Registration";
        } else if (specialization || contractorName) {
            formType = "Contractor Registration";
        }

        let emailContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #ff6600; border-radius: 8px;">
                <h2 style="color: #ff6600;">SBA Infra - New ${formType} Received</h2>
                <hr>
                <p><strong>Name / Firm:</strong> ${applicantName}</p>
                <p><strong>Email:</strong> ${email || 'Not Provided'}</p>
                <p><strong>Phone:</strong> ${phone || 'Not Provided'}</p>
        `;

        if (position) emailContent += `<p><strong>Position Applied:</strong> ${position}</p>`;
        if (experience) emailContent += `<p><strong>Experience:</strong> ${experience}</p>`;
        if (category) emailContent += `<p><strong>Material Category:</strong> ${category}</p>`;
        if (gst) emailContent += `<p><strong>GST Number:</strong> ${gst}</p>`;
        if (specialization) emailContent += `<p><strong>Specialization:</strong> ${specialization}</p>`;
        if (cover) emailContent += `<br><p><strong>Details / Message:</strong></p><blockquote style="background:#f4f4f4; padding:12px; border-left:4px solid #ff6600;">${cover}</blockquote>`;

        emailContent += `</div>`;

        const mailOptions = {
            from: `"SBA Infra Website" <${process.env.EMAIL_USER}>`,
            to: targetEmail,
            replyTo: email || process.env.EMAIL_USER,
            subject: `💼 New ${formType}: ${applicantName}`,
            html: emailContent,
            attachments: resumeFile ? [{
                filename: resumeFile.originalname,
                content: resumeFile.buffer
            }] : []
        };

        console.log("⏳ Sending Email via Gmail SMTP...");
        await transporter.sendMail(mailOptions);
        console.log("✅ Careers Email Sent Successfully!");
        
        return res.status(200).json({ success: true, message: "Application submitted successfully!" });

    } catch (error) {
        console.error("❌ CAREERS EMAIL ERROR:", error.message);
        return res.status(500).json({ success: false, message: "Failed to send email. " + error.message });
    }
});

// ==========================================
// 📩 2. CONTACT FORM ROUTE
// ==========================================
app.post('/contact', async (req, res) => {
    console.log("\n📩 [CONTACT FORM] Request Received!");
    try {
        const { name, email, phone, subject, message } = req.body;

        const mailOptions = {
            from: `"SBA Infra Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER || "shreebhargavainfra@gmail.com",
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

        console.log("⏳ Sending Contact Email via Gmail SMTP...");
        await transporter.sendMail(mailOptions);
        console.log("✅ Contact Email Sent Successfully!");
        
        return res.status(200).json({ success: true, message: "Message sent successfully!" });

    } catch (error) {
        console.error("❌ CONTACT EMAIL ERROR:", error.message);
        return res.status(500).json({ success: false, message: "Failed to send message. " + error.message });
    }
});

// Serve Static Frontend
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 SBA Infra Server running on port ${PORT}`);
});