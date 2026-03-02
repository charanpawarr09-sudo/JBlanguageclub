<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

[![CodeRabbit](https://img.shields.io/badge/CodeRabbit-AI%20Reviews-blue?logo=github)](https://coderabbit.ai)
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/88b3c2c2-20c1-49d3-9bbc-150e8d05bbe8

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Registration Flow

The registration process uses a **2-step flow** (no payment processing):

### Step 1 — Details Form (`/register?event=<event-id>`)
- Collects: Full Name, Email, Phone (+91), College, Department, Year, Roll Number, Event, Team Members
- Submits to `POST /api/registrations/pre-register`
- Server validates with Zod, calculates fee, generates a `VX-2026-XXXXXX` reference code, saves to DB, and sends a confirmation email via Resend

### Step 2 — Google Form
- After Step 1 succeeds, an embedded Google Form iframe is shown for the selected event
- Events without a Google Form URL show a fallback message: "Registration form will be available soon"
- Users click "I've submitted the form" to proceed to the success page

### Success Page (`/register/success?code=VX-2026-XXXXXX`)
- Fetches registration by code from `GET /api/registrations/:code`
- Shows confetti, VX code with copy button, event details, Google Calendar link, WhatsApp share

### Google Form URLs
| Event | URL |
|-------|-----|
| Debate Competition | https://forms.gle/Tu7nF2xuPe6bGG1aA |
| Poetry Reciting | https://forms.gle/gRye4xaCtEpuXWLc7 |
| Pitch Perfect | https://forms.gle/B5xCvuGFv33ZDaS8A |
| Open Mic | https://forms.gle/eKtGg9opFuhR4sm2A |
| Treasure Hunt | _Not yet available_ |
| Film Screening | _Not yet available_ |

> **Note:** Razorpay has been fully removed from this project. There is no payment gateway integration. Fee collection happens offline after the organizer reviews Google Form submissions.

