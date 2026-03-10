import Report      from "../models/Report.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError     from "../utils/AppError.js";
import { transporter } from "../utils/OtpUtils.js"; // ← reuse existing transporter

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/report
   Anyone can submit — auth optional
───────────────────────────────────────────────────────────────────────────── */
export const submitReport = asyncHandler(async (req, res) => {
  const { category, subject, description, email } = req.body;

  if (!category)                      throw new AppError("Category is required", 400);
  if (!subject?.trim())               throw new AppError("Subject is required", 400);
  if (!description?.trim() || description.trim().length < 30)
    throw new AppError("Please provide more detail (at least 30 characters)", 400);
  if (!email?.trim() || !email.includes("@"))
    throw new AppError("A valid email address is required", 400);

  const report = await Report.create({
    category,
    subject:     subject.trim(),
    description: description.trim(),
    email:       email.trim().toLowerCase(),
    submittedBy: req.user?.id || null, // null if not logged in
    status:      "open",
  });

  // ── Send email notification to admin ──────────────────────────────────────
  try {
    await transporter.sendMail({
      from:    `"MeZzDiNe Reports" <${process.env.GMAIL_USER}>`,
      to:      process.env.GMAIL_USER,  // send to yourself
      replyTo: email,                  // reply goes to the reporter
      subject: `[Report] ${category.toUpperCase()} — ${subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#c2692a">New Report Submitted</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px;font-weight:bold;color:#555;width:130px">Category</td><td style="padding:8px">${category}</td></tr>
            <tr style="background:#f9f9f7"><td style="padding:8px;font-weight:bold;color:#555">Subject</td><td style="padding:8px">${subject}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;color:#555">Reporter Email</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
            <tr style="background:#f9f9f7"><td style="padding:8px;font-weight:bold;color:#555">Report ID</td><td style="padding:8px">${report._id}</td></tr>
          </table>
          <h3 style="color:#333;margin-top:20px">Description</h3>
          <p style="background:#f5f5f3;padding:16px;border-radius:8px;line-height:1.6">${description}</p>
          <p style="color:#aaa;font-size:12px;margin-top:24px">Submitted via MeZzDiNe Report Form</p>
        </div>
      `,
    });
  } catch (mailErr) {
    // Don't fail the request if email fails — report is already saved in DB
    console.error("[Report] Email send failed:", mailErr.message);
  }

  res.status(201).json({
    success: true,
    message: "Report submitted. We will review it within 48 hours.",
    data:    { reportId: report._id },
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/report  (admin only — view all reports)
───────────────────────────────────────────────────────────────────────────── */
export const getReports = asyncHandler(async (req, res) => {
  if (req.user?.role !== "admin") throw new AppError("Not authorized", 403);

  const reports = await Report.find()
    .sort({ createdAt: -1 })
    .populate("submittedBy", "name email");

  res.json({ success: true, data: reports });
});

/* ─────────────────────────────────────────────────────────────────────────────
   PATCH /api/report/:reportId  (admin only — update status)
───────────────────────────────────────────────────────────────────────────── */
export const updateReportStatus = asyncHandler(async (req, res) => {
  if (req.user?.role !== "admin") throw new AppError("Not authorized", 403);

  const { status, adminNote } = req.body;
  const report = await Report.findById(req.params.reportId);
  if (!report) throw new AppError("Report not found", 404);

  if (status)    report.status    = status;
  if (adminNote) report.adminNote = adminNote;
  await report.save();

  res.json({ success: true, data: report });
});