# Dodo Payments Overlay Checkout Beta Integration Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Features](#features)
3. [Installation](#installation)
4. [Implementation Steps](#implementation-steps)
5. [Components Overview](#components-overview)
6. [Webhook Integration](#webhook-integration)
7. [Subscription Plan Management](#subscription-plan-management)
8. [Migrating from Previous Checkout](#migrating-from-previous-checkout)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

## Introduction

This document outlines the integration of Dodo Payments' new Overlay Checkout Beta in our application. The Overlay Checkout Beta is a modern TypeScript library that provides a seamless embedded payment experience with real-time event handling and customizable themes.
​
Overview
The Dodo Payments Checkout SDK provides a seamless way to integrate our payment overlay into your web application. Built with TypeScript and modern web standards, it offers a robust solution for handling payments with real-time event handling and customizable themes.

Overlay Checkout Cover Image
Live Demo: https://atlas.dodopayments.com
Github code for demo: https://github.com/dodopayments/dodo-checkout-demo
​
Installation

Copy
# Using npm
npm install dodopayments-checkout

# Using yarn
yarn add dodopayments-checkout

# Using pnpm
pnpm add dodopayments-checkout
​
Quick Start

Copy
import { DodoPayments } from "dodopayments-checkout";

// Initialize the SDK
DodoPayments.Initialize({
  mode: "test", // 'test' or 'live'
  onEvent: (event) => {
    console.log("Checkout event:", event);
  },
  theme: "light", // 'light' or 'dark'
  linkType: "static", // 'static' or 'dynamic'
  displayType: "overlay"
});

// Open checkout
DodoPayments.Checkout.open({
  products: [
    {
      productId: "pdt_your_product_id",
      quantity: 1,
    },
  ],
  redirectUrl: "https://your-website.com/success",
});
​
Configuration
​
Initialize Options

Copy
interface InitializeOptions {
  mode: "test" | "live";
  onEvent: (event: CheckoutEvent) => void;
  theme?: "light" | "dark";
  linkType?: "static" | "dynamic";
  displayType: "overlay";
}
Option	Type	Required	Description
mode	string	Yes	Environment mode: ‘test’ or ‘live’
onEvent	function	Yes	Callback function for handling checkout events
theme	string	No	UI theme: ‘light’ or ‘dark’
linkType	string	No	Payment link type: ‘static’ or ‘dynamic’
displayType	string	Yes	Display type, must be ‘overlay’
​
Checkout Options

Copy
interface CheckoutOptions {
  products?: {
    productId: string;
    quantity: number;
  }[];
  paymentLink?: string;
  redirectUrl?: string;
  queryParams?: Record<string, string>;
}
Option	Type	Required	Description
products	array	Yes*	Array of products to purchase
paymentLink	string	Yes*	payment link for dynamic payment link
redirectUrl	string	No	URL to redirect after payment
queryParams	object	No	Additional query parameters
*Either products or paymentLink must be provided

​
Event Handling
The SDK provides real-time events that you can listen to:


Copy
DodoPayments.Initialize({
  onEvent: (event: CheckoutEvent) => {
    switch (event.event_type) {
      case "checkout.opened":
        // Checkout overlay has been opened
        break;
      case "checkout.closed":
        // Checkout has been closed
        break;
      case "checkout.redirect":
        // Checkout will perform a redirect
        break;
      case "checkout.payment_created":
        // Payment has been created
        break;
      case "checkout.payment_succeeded":
        // Payment was successful
        break;
      case "checkout.payment_failed":
        // Payment failed
        break;
      case "error":
        // An error occurred
        break;
    }
  }
});
​
Methods
​
Open Checkout

Copy
DodoPayments.Checkout.open({
  products: [
    {
      productId: "pdt_your_product_id",
      quantity: 1,
    },
  ],
  redirectUrl: "https://your-website.com/success",
  queryParams: {
    email: "customer@example.com",
    disableEmail: "true"
  }
});
​
Close Checkout

Copy
DodoPayments.Checkout.close();
​
Check Status

Copy
const isOpen = DodoPayments.Checkout.isOpen();
​
Browser Support
Chrome (latest)
Firefox (latest)
Safari (latest)
Edge (latest)
IE11+
Note: Apple Pay is not currently supported in the overlay checkout experience. We plan to add support for Apple Pay in a future release.

​
TypeScript Support
The SDK is written in TypeScript and includes comprehensive type definitions. All public APIs are fully typed for better developer experience.

​
Error Handling
The SDK provides detailed error information through the event system. Always implement proper error handling in your onEvent callback:


Copy
DodoPayments.Initialize({
  onEvent: (event: CheckoutEvent) => {
    if (event.event_type === "error") {
      console.error("Checkout error:", event.data?.message);
      // Handle error appropriately
    }
  }
});
​
Best Practices
Always initialize the SDK before attempting to open the checkout
Implement proper error handling in your event callback
Use the test mode during development
Handle all relevant events for a complete user experience
Provide a redirect URL for better user flow
Use TypeScript for better type safety and developer experience
​
Step-by-Step Guide
​
1. Project Setup
First, ensure you have a modern JavaScript/TypeScript project. We recommend using Next.js, React, or Vue.js.

​
2. Install the SDK
Install the Dodo Payments Checkout SDK using your preferred package manager:


Copy
# Using npm
npm install dodopayments-checkout

# Using yarn
yarn add dodopayments-checkout

# Using pnpm
pnpm add dodopayments-checkout
​
3. Basic Implementation
Create a new component for your checkout button:


Copy
// components/CheckoutButton.tsx
"use client";

import { Button } from "@/components/ui/button";
import { DodoPayments } from "dodopayments-checkout";
import { useEffect, useState } from "react";

export function CheckoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize the SDK
    DodoPayments.Initialize({
      mode: "test", // Change to 'live' for production
      displayType: "overlay",
      theme: "light",
      onEvent: (event) => {
        console.log("Checkout event:", event);
        
        // Handle different events
        switch (event.event_type) {
          case "checkout.opened":
            setIsLoading(false);
            break;
          case "checkout.payment_succeeded":
            // Handle successful payment
            break;
          case "checkout.payment_failed":
            // Handle failed payment
            break;
        }
      },
    });
  }, []);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      await DodoPayments.Checkout.open({
        products: [
          {
            productId: "pdt_your_product_id",
            quantity: 1,
          },
        ],
        redirectUrl: `${window.location.origin}/success`,
        queryParams: {
          email: "customer@example.com",
          disableEmail: "true",
        },
      });
    } catch (error) {
      console.error("Failed to open checkout:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleCheckout}
      disabled={isLoading}
    >
      {isLoading ? "Loading..." : "Checkout Now"}
    </Button>
  );
}
​
4. Add to Your Page
Use the checkout button in your page:


Copy
// app/page.tsx
import { CheckoutButton } from "@/components/CheckoutButton";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1>Welcome to Our Store</h1>
      <CheckoutButton />
    </main>
  );
}
​
5. Handle Success and Failure
Create success and failure pages:


Copy
// app/success/page.tsx
export default function SuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1>Payment Successful!</h1>
      <p>Thank you for your purchase.</p>
    </div>
  );
}

// app/failure/page.tsx
export default function FailurePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1>Payment Failed</h1>
      <p>Please try again or contact support.</p>
    </div>
  );
}
​
6. Testing Your Integration
Start your development server:

Copy
npm run dev
Test the checkout flow:
Click the checkout button
Verify the overlay appears
Test the payment flow using test credentials
Confirm redirects work correctly
​
7. Going Live
When you’re ready to go live:

Change the mode to ‘live’:

Copy
DodoPayments.Initialize({
  mode: "live",
  // ... other options
});
Update your product IDs to use live products
Test the complete flow in production
Monitor events and errors
​
Common Issues and Solutions
Checkout not opening

Verify SDK initialization
Check for console errors
Ensure product IDs are correct
Events not firing

Confirm event handler is properly set up
Check for JavaScript errors
Verify network connectivity
Styling issues

Ensure no CSS conflicts
Check theme settings
Verify responsive design
For more help, visit our Discord or contact our developer support team.