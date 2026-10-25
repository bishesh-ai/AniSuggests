"use strict";

/*
  ANISUGGEST EMAIL CONFIGURATION

  EmailJS Dashboard:
  https://dashboard.emailjs.com/

  Keep your recipient email fixed to your own inbox.
*/

const CONFIG = {
  publicKey: "S3VgA6SnzWt6i1ddb",
  serviceID: "service_bdokpyo",
  templateID: "template_b8nx683",
  recipientEmail: "heyveyronix@gmail.com"
};

// Get form elements
const form = document.getElementById("suggestionForm");
const fromInput = document.getElementById("from_email");
const animeInput = document.getElementById("anime_title");
const categoryInput = document.getElementById("category");
const messageInput = document.getElementById("message");
const charCount = document.getElementById("charCount");
const statusMessage = document.getElementById("statusMessage");
const sendButton = document.getElementById("sendButton");
const buttonText = document.getElementById("buttonText");
const honeypot = document.getElementById("website");

const MAX_MESSAGE_LENGTH = 2000;

let isSending = false;
let emailJSReady = false;

// Update footer year if the element exists
const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// Validate email format
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Check that configuration values are present and not empty strings
function isConfigured() {
  return (
    typeof CONFIG.publicKey === "string" &&
    CONFIG.publicKey.trim() !== "" &&
    typeof CONFIG.serviceID === "string" &&
    CONFIG.serviceID.trim() !== "" &&
    typeof CONFIG.templateID === "string" &&
    CONFIG.templateID.trim() !== "" &&
    isValidEmail(CONFIG.recipientEmail)
  );
}

// Display status message
function showStatus(message, type) {
  if (!statusMessage) return;

  statusMessage.textContent = message;
  statusMessage.className = `status-message visible ${type}`;
}

// Clear status message
function clearStatus() {
  if (!statusMessage) return;

  statusMessage.textContent = "";
  statusMessage.className = "status-message";
}

// Mark invalid fields
function markInvalid(field, message) {
  field.setAttribute("aria-invalid", "true");
  showStatus(message, "error");
  field.focus();
}

// Clear a field's validation error
function clearFieldError(event) {
  event.target.removeAttribute("aria-invalid");
}

// Update message character count
function updateCharacterCount() {
  if (!messageInput || !charCount) return;

  charCount.textContent =
    `${messageInput.value.length} / ${MAX_MESSAGE_LENGTH}`;
}

// Initialize character count and validation listeners
if (messageInput) {
  messageInput.addEventListener("input", updateCharacterCount);
}

[fromInput, animeInput, categoryInput, messageInput]
  .filter(Boolean)
  .forEach((field) => {
    field.addEventListener("input", clearFieldError);
    field.addEventListener("change", clearFieldError);
  });

// Initialize EmailJS
try {
  if (
    typeof emailjs !== "undefined" &&
    isConfigured()
  ) {
    emailjs.init({
      publicKey: CONFIG.publicKey
    });

    emailJSReady = true;
  } else {
    console.error(
      "EmailJS is unavailable or its configuration is incomplete."
    );
  }
} catch (error) {
    console.error("EmailJS initialization failed:", error);
}

// Validate form fields
function validateForm() {
  clearStatus();

  const senderEmail = fromInput.value.trim();
  const animeTitle = animeInput.value.trim();
  const category = categoryInput.value;
  const message = messageInput.value.trim();

  if (!isValidEmail(senderEmail)) {
    markInvalid(
      fromInput,
      "Please enter a valid email address."
    );
    return false;
  }

  if (animeTitle.length === 0) {
    markInvalid(
      animeInput,
      "Please enter an anime title or idea."
    );
    return false;
  }

  if (animeTitle.length > 120) {
    markInvalid(
      animeInput,
      "Please keep the title within 120 characters."
    );
    return false;
  }

  const allowedCategories = [
    "Anime Recommendation",
    "Website Feature",
    "Correction",
    "Other"
  ];

  if (!allowedCategories.includes(category)) {
    markInvalid(
      categoryInput,
      "Please select a suggestion category."
    );
    return false;
  }

  if (message.length < 10) {
    markInvalid(
      messageInput,
      "Please write at least 10 characters."
    );
    return false;
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    markInvalid(
      messageInput,
      "Your message is too long."
    );
    return false;
  }

  if (!isConfigured()) {
    showStatus(
      "Please check your EmailJS configuration in script.js.",
      "error"
    );
    return false;
  }

  if (!emailJSReady || typeof emailjs === "undefined") {
    showStatus(
      "EmailJS could not initialize. Please reload the page and try again.",
      "error"
    );
    return false;
  }

  return true;
}

// Handle form submission
if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSending) return;

    // Basic bot-trap field
    if (honeypot && honeypot.value.trim() !== "") {
      showStatus(
        "Your submission could not be processed.",
        "error"
      );
      return;
    }

    if (!validateForm()) return;

    isSending = true;

    if (sendButton) {
      sendButton.disabled = true;
    }

    if (buttonText) {
      buttonText.textContent = "Sending...";
    }

    clearStatus();

    // These variable names must match your EmailJS template parameters
    const templateParams = {
      from_email: fromInput.value.trim(),
      to_email: CONFIG.recipientEmail,
      anime_title: animeInput.value.trim(),
      category: categoryInput.value,
      message: messageInput.value.trim()
    };

    try {
      const response = await emailjs.send(
        CONFIG.serviceID,
        CONFIG.templateID,
        templateParams
      );

      if (!response || response.status !== 200) {
        throw new Error(
          "Unexpected response from EmailJS."
        );
      }

      showStatus(
        "Your suggestion has been sent successfully. Thanks for contributing!",
        "success"
      );

      form.reset();
      updateCharacterCount();

      [
        fromInput,
        animeInput,
        categoryInput,
        messageInput
      ].forEach((field) => {
        field.removeAttribute("aria-invalid");
      });

    } catch (error) {
      console.error(
        "AniSuggest email submission failed:",
        error
      );

      const errorText = error?.text || error?.message || "";

      showStatus(
        errorText
          ? `Email could not be sent: ${errorText}`
          : "We couldn't send your suggestion. Check your EmailJS settings and try again.",
        "error"
      );

    } finally {
      isSending = false;

      if (sendButton) {
        sendButton.disabled = false;
      }

      if (buttonText) {
        buttonText.textContent = "Send suggestion";
      }
    }
  });
} else {
  console.error(
    'AniSuggest form not found. Check the ID "suggestionForm" in index.html.'
  );
}

// Set initial character count
updateCharacterCount();
