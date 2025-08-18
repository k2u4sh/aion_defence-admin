import { NextResponse } from 'next/server';
import { connectDB } from "@/utils/db";
import { ApiResponseHandler, ErrorMessages, SuccessMessages } from "@/utils/apiResponse";
import { Validator, ValidationSchemas } from "@/utils/validation";

// Import CMS Models
async function getCMSModels() {
  const models = await import('@/models/cmsModel');
  return models;
}

// Initialize CMS with default data based on your design
export async function POST() {
  try {
    await connectDB();
    const models = await getCMSModels();
    
    // Initialize Hero Section
    const heroData = {
      title: "INDIA'S DEFENCE MARKETPLACE",
      subtitle: "STRATEGIC • SECURE • SEAMLESS",
      description: "We connect OEMs, MSMEs, and component suppliers with verified buyers, enabling seamless sourcing, customized bidding, regulatory support, and enterprise SaaS integration — all under one digital roof.",
      ctaText: "LEARN MORE",
      backgroundImage: "/images/hero-background.jpg",
      heroImage: "/images/fighter-jet.jpg",
      isActive: true
    };
    
    await models.HeroSection.findOneAndUpdate(
      { isActive: true },
      heroData,
      { new: true, upsert: true }
    );
    
    // Initialize Header
    const headerData = {
      logo: "/images/defence-cart-logo.png",
      companyName: "DEFENCE CART",
      navigationItems: [
        { label: "HOME", href: "#home", isActive: true },
        { label: "ABOUT US", href: "#about", isActive: true },
        { label: "PRODUCTS", href: "#products", isActive: true },
        { label: "SERVICES", href: "#services", isActive: true },
        { label: "SUBSCRIPTIONS", href: "#subscriptions", isActive: true }
      ],
      contactInfo: {
        phone: "8888 444 555",
        email: "CONTACT US"
      },
      authButtons: {
        loginText: "LOGIN",
        registerText: "REGISTER NOW"
      },
      searchPlaceholder: "Search",
      bidNowText: "BID NOW",
      isActive: true
    };
    
    await models.Header.findOneAndUpdate(
      { isActive: true },
      headerData,
      { new: true, upsert: true }
    );
    
    // Initialize Features Section
    const featuresData = {
      sectionTitle: "WHY DEFENCE CART?",
      features: [
        {
          icon: "/images/location.svg",
          title: "GLOBAL REACH, LOCAL AGILITY",
          description: "Unlock a worldwide supply chain while enjoying seamless, localized solutions tailored for Indian and international defence manufacturers.",
          isActive: true
        },
        {
          icon: "/images/custom.png",
          title: "CUSTOM BIDDING POWER",
          description: "India's first private bidding platform to help you bid the way your business demands with flexible, fully customized procurement options that adapt to each mission's unique requirements.",
          isActive: true
        },
        {
          icon: "/images/regulatory.png",
          title: "REGULATORY GUIDANCE",
          description: "Navigate the complex world of defence compliance with expert regulatory support— streamlining approvals and minimizing hurdles.",
          isActive: true
        },
        {
          icon: "/images/enterprise.png",
          title: "ENTERPRISE SAAS ADVANTAGE",
          description: "Scale smarter and faster with powerful SaaS licensing built for enterprise growth, security, and collaboration.",
          isActive: true
        }
      ],
      backgroundImage: "/images/why-defence-cart-bg.jpg",
      isActive: true
    };
    
    await models.FeaturesSection.findOneAndUpdate(
      { isActive: true },
      featuresData,
      { new: true, upsert: true }
    );
    
    // Initialize Customize Section
    const customizeData = {
      sectionTitle: "Can't find a product as per requirement?",
      sectionSubtitle: "CUSTOMIZE & ADD YOUR REQUIREMENTS",
      sideText: "CUSTOMIZE",
      description: "At DefenceCart, we understand that no two defence procurements are alike. India's first private bidding portal with a unique Customized Bidding Engine is designed to adapt to the specific needs of both buyers and vendors — enabling project-specific RFQs, technical requirement alignment, and flexible bidding formats. Whether it's a one-off prototype or a volume-based supply chain contract, vendors can submit tailored proposals, while buyers gain access to highly relevant, compliant, and technically qualified offers along with an option to go for the lowest L1 bidder. This feature streamlines decision-making, reduces turnaround time, and ensures procurement processes are both strategic and scalable.",
      videoThumbnail: "/images/video.png",
      playButtonIcon: "/images/play-button.svg",
      isActive: true
    };
    
    await models.CustomizeSection.findOneAndUpdate(
      { isActive: true },
      customizeData,
      { new: true, upsert: true }
    );
    
    // Initialize Who Can Join Section
    const whoCanJoinData = {
      sectionTitle: "WHO CAN JOIN?",
      sectionSubtitle: "MODERNIZE YOUR DEFENCE SUPPLY CHAIN",
      ctaText: "JOIN NOW",
      userTypes: [
        {
          category: "Indian OEMs",
          description: "Optimized supply chain and partner vetting",
          isActive: true
        },
        {
          category: "MSMEs",
          description: "Global exposure and compliance support",
          isActive: true
        },
        {
          category: "International Suppliers",
          description: "Access to Indian defence procurement",
          isActive: true
        },
        {
          category: "Defence Agencies",
          description: "Transparency, insights, and control",
          isActive: true
        }
      ],
      centerImage: "/images/fighter-jet.jpg",
      currentSlide: "Avionics Embedded Systems",
      isActive: true
    };
    
    await models.WhoCanJoin.findOneAndUpdate(
      { isActive: true },
      whoCanJoinData,
      { new: true, upsert: true }
    );
    
    // Initialize Subscription Plans
    const subscriptionData = {
      sectionTitle: "SUBSCRIPTION PLANS",
      plans: [
        {
          name: "FREE",
          color: "#4A5568",
          features: [
            { name: "Listing", included: true },
            { name: "Catalogue", included: false },
            { name: "Payment Option", included: false },
            { name: "Certification", included: false },
            { name: "Preferred Vendor Status", included: false },
            { name: "Premium Customer Support", included: false },
            { name: "Bidding Services", included: false }
          ],
          price: { amount: 0, currency: "INR", period: "month" },
          ctaText: "Get Started",
          isPopular: false,
          isActive: true
        },
        {
          name: "GOLD",
          color: "#DCB13A",
          features: [
            { name: "Listing", included: true },
            { name: "Catalogue", included: true },
            { name: "Payment Option", included: true },
            { name: "Certification", included: true },
            { name: "Preferred Vendor Status", included: false },
            { name: "Premium Customer Support", included: false },
            { name: "Bidding Services", included: false }
          ],
          price: { amount: 999, currency: "INR", period: "month" },
          ctaText: "Get Started",
          isPopular: true,
          isActive: true
        },
        {
          name: "PLATINUM",
          color: "#E5E7EB",
          features: [
            { name: "Listing", included: true },
            { name: "Catalogue", included: true },
            { name: "Payment Option", included: true },
            { name: "Certification", included: true },
            { name: "Preferred Vendor Status", included: true },
            { name: "Premium Customer Support", included: true },
            { name: "Bidding Services", included: true }
          ],
          price: { amount: 2999, currency: "INR", period: "month" },
          ctaText: "Get Started",
          isPopular: false,
          isActive: true
        }
      ],
      isActive: true
    };
    
    await models.SubscriptionPlans.findOneAndUpdate(
      { isActive: true },
      subscriptionData,
      { new: true, upsert: true }
    );
    
    // Initialize Footer
    const footerData = {
      logo: "/images/defence-cart-logo.png",
      companyName: "DEFENCE CART",
      description: "India's first private, mission-ready defence procurement platform designed to simplify, secure, and scale procurement for defence manufacturers.",
      quickLinks: [
        { label: "Home", href: "#home", isActive: true },
        { label: "About Us", href: "#about", isActive: true },
        { label: "Products", href: "#products", isActive: true },
        { label: "Compliance", href: "#compliance", isActive: true },
        { label: "Subscriptions", href: "#subscriptions", isActive: true },
        { label: "Bid Now", href: "#bid", isActive: true }
      ],
      contactInfo: {
        phone: "1234 4567 6789",
        email: "Email@defencecart.com",
        address: "12334 lorem ipsum dolor set ametu, consecuter"
      },
      socialMedia: [
        { platform: "Instagram", url: "#", icon: "/images/insta.svg", isActive: true },
        { platform: "Facebook", url: "#", icon: "/images/facebook.svg", isActive: true },
        { platform: "WhatsApp", url: "#", icon: "/images/whats-app.svg", isActive: true },
        { platform: "Twitter", url: "#", icon: "/images/twitter.svg", isActive: true }
      ],
      copyrightText: "DefenceCart 2025 | All Rights Reserved",
      legalLinks: [
        { label: "Terms & Conditions", href: "/terms" },
        { label: "Privacy Policy", href: "/privacy" }
      ],
      isActive: true
    };
    
    await models.Footer.findOneAndUpdate(
      { isActive: true },
      footerData,
      { new: true, upsert: true }
    );
    
    // Initialize SEO Settings
    const seoData = {
      title: "Defence Cart - India's First Defence Procurement Platform",
      description: "Strategic, secure, and seamless defence procurement platform connecting OEMs, MSMEs, and suppliers with verified buyers.",
      keywords: "defence procurement, military supplies, defence marketplace, strategic procurement, defence bidding, military equipment",
      ogImage: "/images/og-image.jpg",
      favicon: "/favicon.ico",
      isActive: true
    };
    
    await models.SEOSettings.findOneAndUpdate(
      { isActive: true },
      seoData,
      { new: true, upsert: true }
    );
    
    // Initialize General Settings
    const settingsData = {
      siteName: "Defence Cart",
      maintenanceMode: false,
      maintenanceMessage: "We are currently under maintenance. Please check back soon.",
      colors: {
        primary: "#DCB13A",
        secondary: "#95A059",
        accent: "#E2E2E2",
        background: "#000000",
        border: "#313131"
      },
      fonts: {
        primary: "Roboto",
        secondary: "Roboto Condensed"
      },
      isActive: true
    };
    
    await models.GeneralSettings.findOneAndUpdate(
      { isActive: true },
      settingsData,
      { new: true, upsert: true }
    );
    
    return ApiResponseHandler.success(null, "CMS initialized successfully with default data");
    
  } catch (error) {
    console.error("Error initializing CMS:", error);
    return ApiResponseHandler.error("Error initializing CMS", 500);
  }
}
